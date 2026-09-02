
/* ============================================================
   FOMO INK — app.js
   File 6/11 · Dashboard Quest (app.html)
   ------------------------------------------------------------
   TUGAS FILE INI
   1. Mock state dashboard (wallet, level, XP, quest, treasury)
      — struktur sederhana, siap disambung ke on-chain nanti.
   2. Render dinamis: passport panel, milestone dots, quest list
      (matriks pill status), claim strip treasury.
   3. Interaksi: Connect toggle, Start quest (simulasi progres),
      Claim (chip +🪙 terbang ke counter → auto LEVEL UP).
   4. Animasi entrance stagger + progress bar on-viewport (IO).
   5. Sinkron bahasa: mendengar perubahan <html lang>, lalu
      merender ulang semua teks yang dimiliki JS.

   URUTAN <script> DI app.html (WAJIB):
     i18n.js → lang-en.js → lang-id.js → lang-ptbr.js
     → lang-zh.js → lang-ko.js → app.js   (app.js paling akhir)

   KONTRAK ID (app.js ⇄ app.html) — jika salah satu hilang,
   app.js membangunnya otomatis (self-healing):
     #btn-connect      #points-counter    #points-value
     #passport-panel   #wallet-pill       #level-num
     #tier-name        #xp-fill           #xp-text
     #level-hint       #milestone-dots    #dots-readout
     #quests-panel     #quest-list        #claim-strip
     #treasury-claim   #pool-fill         #pool-text

   KONTRAK i18n (kunci untuk lang-*.js):
     app.*      : connect, disconnect, dashboard.title, points.label
     passport.* : wallet.connected, wallet.not_connected,
                  wallet.first, rank, level.hint, level.max,
                  levelup.toast, upload, upload.note
     badge.*    : soon
     quest.*    : status.available|progress|complete|claimed,
                  cta.start, cta.claim, hold.progress,
                  swap|stake|bridge .title/.desc/.hold,
                  fee.note, claimed.note, complete.toast
     treasury.* : title, supplies, left, claim_locked,
                  claim_ready, locked_toast, claim_toast, micro
   → Setiap t() punya fallback EN inline, jadi dashboard tetap
     tampil normal MESKIPUN lang-*.js belum dibuat.

   API DEBUG (DevTools → Console):
     FOMO_INK.state           lihat state live
     FOMO_INK.addPoints(300)  uji level-up
     FOMO_INK.setLevel(10)    paksa LV.10 → buka Treasury Vault
     FOMO_INK.reset()         hapus localStorage + muat ulang
   ============================================================ */

'use strict';

/* ============================================================
   1. KONFIGURASI & MOCK DATA (sumber data tunggal)
   ============================================================ */

const CONFIG = {
  START_CONNECTED: true,          // mulai dalam keadaan terhubung (biar demo claim langsung jalan)
  AVG_REWARD: 90,                 // rata-rata hadiah quest → untuk hitung hint "X quests to Lv.Y"
  STORAGE_KEY: 'fomoink_app_v1',  // persistensi mock state (lapor bug?hapus di console: FOMO_INK.reset())
};

// Tabel XP kumulatif untuk MENCAPAI level tsb (points === XP).
// Lv.7 =1200 → 8 =1500: dengan poin 1.240 sisa 260 → hint "3 quests" ✓ blueprint.
const XP_TABLE = { 1: 0, 2: 150, 3: 350, 4: 600, 5: 900, 6: 1050, 7: 1200, 8: 1500, 9: 2000, 10: 2600 };

// Nama tier = proper noun (tidak diterjemahkan, konsisten EN/ID).
const TIERS = [
  { lv: 1,  name: 'Ink Sprout' },
  { lv: 2,  name: 'Tentacle Rookie' },
  { lv: 3,  name: 'Reef Drifter' },
  { lv: 4,  name: 'Bubble Broker' },
  { lv: 5,  name: 'Tide Runner' },
  { lv: 6,  name: 'Abyss Navigator' },
  { lv: 7,  name: 'Tentacle Tycoon' },   // tier default blueprint
  { lv: 8,  name: 'Kraken Captain' },
  { lv: 9,  name: 'Deep Sea Legend' },
  { lv: 10, name: 'FOMO Sovereign' },    // tier max → buka Treasury Vault
];

// Copy fallback EN + ikon per quest (ikon = emoji sementara,
// nanti diganti file PNG ke slot [IMG: quest-*]).
const QUEST_DEFS = {
  swap:   { icon: '🔁', reward: 50,  title: 'First Splash',     desc: 'Your ink joins the ocean. One swap, one legend.' },
  stake:  { icon: '⚓', reward: 120, title: 'Anchor Lock',       desc: 'Lock your anchor. The tide rewards the patient.' },
  bridge: { icon: '🌉', reward: 100, title: 'Ride the Current',  desc: 'Cross the current. No FOMO tickets needed.' },
};

const HOLD_FB = {
  swap:   'Swapping momentum…',
  stake:  'Hold the Anchor ⚓',
  bridge: 'Crossing the current…',
};

// Matriks pill status (lihat blueprint #4 bagian C).
const STATUS = {
  available: { cls: 'status-pill--available', key: 'quest.status.available', fb: 'Available' },
  progress:  { cls: 'status-pill--progress',  key: 'quest.status.progress',  fb: 'In Progress' },
  complete:  { cls: 'status-pill--complete',  key: 'quest.status.complete',  fb: 'Complete' },
  claimed:   { cls: 'status-pill--claimed',   key: 'quest.status.claimed',   fb: 'Claimed' },
};

function requiredFor(level) { // total XP yang dibutuhkan untuk naik DARI `level`
  return level >= 10 ? XP_TABLE[10] : (XP_TABLE[level + 1] || XP_TABLE[10]);
}

/* ============================================================
   2. STATE — default, validasi, persistensi localStorage
   ============================================================ */

function defaultState() {
  return {
    connected: CONFIG.START_CONNECTED,
    points: 1240,                 // poin === XP (sesuai blueprint "1,240 / 1,500 🪙")
    level: 7,
    xpRequired: XP_TABLE[8],      // 1500
    quests: [
      { id: 'swap',   status: 'complete',  progress: 100 },  // biar claim bisa langsung didemokan
      { id: 'stake',  status: 'progress',  progress: 60  },
      { id: 'bridge', status: 'available', progress: 0   },
    ],
    poolLeft: 62,                 // Treasury supplies: 62% left
  };
}

const QUEST_STATUSES = ['available', 'progress', 'complete', 'claimed'];

function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);

    if (typeof saved.connected === 'boolean') base.connected = saved.connected;
    if (Number.isFinite(saved.points))  base.points = Math.max(0, Math.min(XP_TABLE[10], Math.round(saved.points)));
    if (Number.isFinite(saved.level))   base.level  = Math.max(1, Math.min(10, Math.round(saved.level)));
    base.xpRequired = requiredFor(base.level);

    if (Array.isArray(saved.quests)) {
      base.quests = base.quests.map((def) => {
        const s = saved.quests.find((q) => q && q.id === def.id);
        if (!s) return def;
        return {
          id: def.id,
          status: QUEST_STATUSES.includes(s.status) ? s.status : def.status,
          progress: Number.isFinite(s.progress) ? Math.max(0, Math.min(100, Math.round(s.progress))) : def.progress,
        };
      });
    }
    if (Number.isFinite(saved.poolLeft)) base.poolLeft = Math.max(0, Math.min(100, Math.round(saved.poolLeft)));
  } catch (err) {
    console.warn('[FOMO INK] Gagal memuat state tersimpan — memakai default.', err);
  }
  return base;
}

function saveState() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
  } catch (err) { /* mode privat / storage penuh — abaikan, demo tetap jalan */ }
}

const state = loadState();

/* ============================================================
   3. UTILITAS DOM, i18n & LAINNYA
   ============================================================ */

const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

const debounce = (fn, ms) => {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
};

const fmt = (n) => Number(n || 0).toLocaleString('en-US'); // format 1.240 → "1,240"

const warned = new Set();
function warnOnce(sel) {
  if (warned.has(sel)) return;
  warned.add(sel);
  console.warn(`[FOMO INK] Elemen "${sel}" tidak ditemukan — perilaku terkait dilewati.`);
}

// Jembatan ke i18n.js — SELALU ada fallback EN, tak pernah undefined.
function t(key, fallback) {
  try {
    if (window.I18N && typeof window.I18N.t === 'function') {
      const v = window.I18N.t(key);
      if (typeof v === 'string' && v && v !== key) return v;
    }
  } catch (err) { /* diamkan → pakai fallback */ }
  return fallback != null ? fallback : key;
}

// t() + pengganti placeholder {n}, {lv}, {tier}, {title}…
function tf(key, fallback, params) {
  let s = t(key, fallback);
  Object.keys(params || {}).forEach((k) => {
    s = s.split('{' + k + '}').join(String(params[k]));
  });
  return s;
}

/* ============================================================
   4. STYLE MINI (injeksi sekali — efek khusus app.js saja)
   ============================================================ */

function injectStyles() {
  if (document.getElementById('fomo-app-styles')) return;
  const s = document.createElement('style');
  s.id = 'fomo-app-styles';
  s.textContent = `
    /* Chip hadiah terbang dari tombol claim ke counter poin */
    .fly-chip {
      position: fixed; z-index: 9999; pointer-events: none;
      padding: 6px 12px; border-radius: 999px;
      background: var(--gold, #ffeb5b); color: var(--ink, #241a33);
      font-family: var(--font-mono, "Roboto Mono", monospace);
      font-weight: 700; font-size: .8rem;
      box-shadow: 0 8px 24px -8px rgba(91, 33, 182, .35);
      transition: transform .55s cubic-bezier(.22,1,.36,1), opacity .55s cubic-bezier(.22,1,.36,1);
    }
    /* Toast feddback (level-up, treasury, dsb.) */
    .fomo-toast {
      position: fixed; left: 50%; bottom: 28px; z-index: 9999;
      transform: translate(-50%, 20px); opacity: 0;
      background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff;
      padding: 12px 22px; border-radius: 999px; max-width: 90vw; text-align: center;
      font-family: var(--font-head, Inter, sans-serif); font-weight: 700; font-size: .95rem;
      box-shadow: 0 16px 40px -12px rgba(91, 33, 182, .5);
      transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .3s cubic-bezier(.22,1,.36,1);
      pointer-events: none;
    }
    .fomo-toast.is-shown { transform: translate(-50%, 0); opacity: 1; }
    /* Getar saat klik pill Treasury yang masih terkunci */
    .shake { animation: fomo-shake .4s cubic-bezier(.36,.07,.19,.97); }
    @keyframes fomo-shake {
      10%, 90% { transform: translateX(-2px); }
      20%, 80% { transform: translateX(4px); }
      30%, 50%, 70% { transform: translateX(-6px); }
      40%, 60% { transform: translateX(6px); }
    }
    /* Kilatan emas saat naik level */
    .level-flash { animation: fomo-levelflash .9s cubic-bezier(.22,1,.36,1); }
    @keyframes fomo-levelflash {
      0%   { box-shadow: 0 0 0 0 rgba(255, 235, 91, .75); }
      100% { box-shadow: 0 0 0 24px rgba(255, 235, 91, 0); }
    }
  `;
  document.head.appendChild(s);
}

/* ============================================================
   5. FEEDBACK VISUAL — toast, chip terbang, kilat level
   ============================================================ */

let toastEl = null;
let toastTimer = null;

function toast(msg) {
  if (!toastEl) {
    toastEl = el('<div class="fomo-toast" role="status" aria-live="polite"></div>');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl && toastEl.classList.remove('is-shown'), 2600);
}

function bumpPoints() {
  if (!UI.pointsCounter) return;
  UI.pointsCounter.classList.remove('is-bump');
  void UI.pointsCounter.offsetWidth; // reflow → restart animasi
  UI.pointsCounter.classList.add('is-bump');
}

// Chip "+50 🪙" terbang dari tombol claim ke counter (300-600ms, easing terkunci).
function flyChip(fromRect, text, onArrive) {
  if (!fromRect) { onArrive && onArrive(); return; }
  const chip = el(`<span class="fly-chip"></span>`);
  chip.textContent = text;

  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top;
  chip.style.left = startX + 'px';
  chip.style.top = startY + 'px';
  chip.style.transform = 'translate(-50%, 0)';
  document.body.appendChild(chip);

  const target = UI.pointsCounter && UI.pointsCounter.getBoundingClientRect();
  requestAnimationFrame(() => {
    if (target) {
      const dx = (target.left + target.width / 2) - startX;
      const dy = (target.top + target.height / 2) - startY;
      chip.style.transform = `translate(calc(-50% + ${dx}px), ${dy}px) scale(.45)`;
      chip.style.opacity = '.15';
    } else {
      chip.style.opacity = '0';
    }
  });

  setTimeout(() => { chip.remove(); onArrive && onArrive(); }, 560);
}

function flashLevel() {
  const target = UI.levelBlock || UI.passportPanel;
  if (!target) return;
  target.classList.remove('level-flash');
  void target.offsetWidth;
  target.classList.add('level-flash');
}

/* ============================================================
   6. SELF-HEALING SKELETON — bangun bagian besar jika hilang
   ============================================================ */

const TITLE_HTML = `
  <div class="dashboard-title">
    <h1 data-i18n="app.dashboard.title">Quest Dashboard</h1>
    <div class="points-counter" id="points-counter">
      <span data-i18n="app.points.label">Total Points</span>
      <span class="points-counter__value" id="points-value">0 🪙</span>
    </div>
  </div>`;

const PASSPORT_HTML = `
  <aside class="panel" id="passport-panel">
    <div class="wallet-card">
      <div class="wallet-card__avatar">🐙</div>
      <span class="wallet-card__addr">0xAb3…7F2</span>
      <span class="status-pill status-pill--disconnected" id="wallet-pill">Not Connected</span>
    </div>
    <div class="img-slot img-slot--square" data-imgslot="passport-lv7" aria-hidden="true">
      <span class="img-slot__emoji">🐙</span>
      <span class="img-slot__label">IMG: passport-lv7</span>
    </div>
    <div class="identity">
      <h3>KRAKEN #0421</h3>
      <span class="rank-pill" data-i18n="passport.rank">TOP 8% OCEAN</span>
    </div>
    <div class="level-block">
      <div class="level-block__top">
        <span class="level-num">LV.<span id="level-num">7</span></span>
        <span class="tier-name" id="tier-name">—</span>
      </div>
      <div class="progress"><div class="progress__fill" id="xp-fill" data-w="0"></div></div>
      <span class="card-passport__xp" id="xp-text">—</span>
      <span class="level-hint" id="level-hint">—</span>
    </div>
    <div class="milestone-dots" id="milestone-dots"></div>
    <span class="mono" id="dots-readout" aria-live="polite">—</span>
    <div class="upload-block">
      <button type="button" class="btn btn--ghost btn--sm" data-i18n="passport.upload">Upload Your Kraken</button>
      <span class="badge badge--soon" data-i18n="badge.soon">SOON</span>
    </div>
    <div class="img-slot img-slot--wide" data-imgslot="avatar-upload" aria-hidden="true">
      <span class="img-slot__emoji">🖼️</span>
      <span class="img-slot__label">IMG: avatar-upload</span>
    </div>
    <p class="upload-block__note" data-i18n="passport.upload.note">Your Kraken becomes an NFT on IPFS — soon.</p>
  </aside>`;

const CLAIM_HTML = `
  <div class="claim-strip" id="claim-strip">
    <div class="claim-strip__info">
      <h3 data-i18n="treasury.title">Treasury Vault</h3>
      <div class="claim-strip__pool">
        <span class="mono" data-i18n="treasury.supplies">Supplies</span>
        <div class="progress"><div class="progress__fill progress__fill--gold" id="pool-fill" data-w="62"></div></div>
        <span class="mono" id="pool-text">—</span>
      </div>
    </div>
    <button type="button" class="claim-pill is-locked" id="treasury-claim" aria-disabled="true">Claim at Lv.10</button>
    <p class="claim-strip__micro" data-i18n="treasury.micro">The deeper your level — the bigger your slice of the ocean's gold.</p>
  </div>`;

function getGrid() {
  let grid = $('.app-grid');
  if (!grid) {
    const host = $('main .container') || $('main') || document.body;
    grid = el('<div class="app-grid"></div>');
    host.appendChild(grid);
  }
  return grid;
}

function ensureDashboard() {
  // 1) Title strip + counter poin
  if (!$('.dashboard-title') && !$('#points-counter')) {
    getGrid().insertAdjacentElement('beforebegin', el(TITLE_HTML));
  }
  // 2) Panel passport (kiri)
  if (!$('#passport-panel')) {
    getGrid().insertAdjacentElement('afterbegin', el(PASSPORT_HTML));
  }
  // 3) Wadah quest list
  if (!$('#quest-list')) {
    const qp = $('#quests-panel');
    if (qp && !qp.querySelector('#quest-list')) {
      qp.appendChild(el('<div class="quest-list" id="quest-list"></div>'));
    } else if (!qp) {
      getGrid().appendChild(el(
        '<section class="panel" id="quests-panel"><div class="quest-list" id="quest-list"></div></section>'
      ));
    }
  }
  // 4) Claim strip treasury (bawah, full width)
  if (!$('#claim-strip')) {
    getGrid().appendChild(el(CLAIM_HTML));
  }
}

/* ============================================================
   7. CACHE REFERENSI ELEMEN (sekali di init)
   ============================================================ */

const UI = {};

function cacheEls() {
  UI.grid          = $('.app-grid');
  UI.pointsCounter = $('#points-counter') || $('.points-counter');
  UI.pointsValue   = $('#points-value');
  UI.passportPanel = $('#passport-panel');
  UI.levelBlock    = $('.level-block', UI.passportPanel);
  UI.btnConnect    = $('#btn-connect');
  UI.walletPill    = $('#wallet-pill');
  UI.levelNum      = $('#level-num');
  UI.tierName      = $('#tier-name');
  UI.xpFill        = $('#xp-fill');
  UI.xpText        = $('#xp-text');
  UI.levelHint     = $('#level-hint');
  UI.dots          = $('#milestone-dots');
  UI.dotsReadout   = $('#dots-readout');
  UI.questHost     = $('#quest-list');
  UI.claimStrip    = $('#claim-strip');
  UI.treasuryClaim = $('#treasury-claim');
  UI.poolFill      = $('#pool-fill');
  UI.poolText      = $('#pool-text');

  // Kunci wajib — kalau hilang meski sudah self-healing, beri tahu pengguna
  [['#quest-list', UI.questHost], ['#btn-connect', UI.btnConnect]].forEach(([sel, node]) => {
    if (!node) warnOnce(sel);
  });
}

/* ============================================================
   8. PROGRESS BAR — animasi isian saat terlihat di viewport
   ============================================================ */

let entranceDone = false;

const io = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const fill = en.target;
        fill.style.width = (fill.dataset.w || 0) + '%';
        io.unobserve(fill);
      });
    }, { threshold: 0.2 })
  : null;

// Isi width progress fill — setelah entrance selesai langsung set (mulus untuk claim).
function setFill(fill, pct) {
  if (!fill) return;
  pct = Math.max(0, Math.min(100, pct));
  fill.dataset.w = String(Math.round(pct));
  if (entranceDone || !io) {
    io && io.unobserve(fill);
    fill.style.width = pct + '%';
  } else {
    fill.style.width = '0%';
    io.observe(fill);
  }
}

// Update bar quest saat simul progres jalan (tanpa merender ulang kartu).
function setBarWidth(qid, pct) {
  const fill = UI.questHost && UI.questHost.querySelector(`[data-quest="${qid}"] .progress__fill`);
  if (!fill) return;
  io && io.unobserve(fill);
  fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
}

/* ============================================================
   9. RENDER
   ============================================================ */

function questCardHTML(q) {
  const def = QUEST_DEFS[q.id] || { icon: '🧩', reward: 0, title: q.id, desc: '' };
  const st  = STATUS[q.status] || STATUS.available;
  const claimedCls = q.status === 'claimed' ? ' quest-card--claimed' : '';
  const dimCls     = state.connected ? '' : ' quest-card--dim';

  // Bagian bawah kartu — sesuai matriks status blueprint #4
  let foot;
  if (q.status === 'available') {
    foot = `
      <button type="button" class="btn btn--primary btn--sm" data-action="start">${t('quest.cta.start', 'Start Quest')}</button>
      <span class="fee-note">${t('quest.fee.note', 'Quest Energy ~$0.02 — shown before signing')}</span>`;
  } else if (q.status === 'progress') {
    foot = `
      <button type="button" class="btn btn--ghost btn--sm" disabled aria-disabled="true">⏳ ${holdLabel(q.id)}</button>`;
  } else if (q.status === 'complete') {
    foot = `
      <button type="button" class="btn btn--primary btn--sm btn--pulse" data-action="claim">${t('quest.cta.claim', 'Claim')} +${q.reward} 🪙</button>
      <span class="fee-note">${t('quest.fee.note', 'Quest Energy ~$0.02 — shown before signing')}</span>`;
  } else {
    foot = `<span class="quest-card__claimed-note">${t('quest.claimed.note', 'Claimed ✓')}</span>`;
  }

  const rewardStyle = q.status === 'claimed' ? ' style="text-decoration:line-through"' : '';

  return `
  <article class="quest-card${claimedCls}${dimCls}" data-quest="${q.id}">
    <div class="img-slot img-slot--icon" data-imgslot="quest-${q.id}" aria-hidden="true">
      <span class="img-slot__emoji">${def.icon}</span>
    </div>
    <div class="quest-card__body">
      <div class="quest-card__head">
        <h3 class="quest-card__title">${t(`quest.${q.id}.title`, def.title)}</h3>
        <span class="status-pill ${st.cls}">${t(st.key, st.fb)}</span>
      </div>
      <p class="quest-card__desc">${t(`quest.${q.id}.desc`, def.desc)}</p>
      <div class="quest-card__meta">
        <div class="progress quest-card__progress">
          <div class="progress__fill" data-w="${q.progress}"></div>
        </div>
        <span class="quest-card__reward"${rewardStyle}>+${q.reward} 🪙</span>
      </div>
      <div class="quest-card__foot">${foot}</div>
    </div>
  </article>`;
}

function holdLabel(id) {
  return t(`quest.${id}.hold`, HOLD_FB[id] || t('quest.hold.progress', 'Quest running…'));
}

const getQuest = (qid) => state.quests.find((q) => q.id === qid);

function renderQuests() {
  if (!UI.questHost) return;
  UI.questHost.innerHTML = state.quests.map(questCardHTML).join('');
  // Arm semua fill untuk animasi on-viewport
  $$('.progress__fill', UI.questHost).forEach((f) => setFill(f, Number(f.dataset.w || 0)));
}

function renderQuestCard(qid) {
  const q = getQuest(qid);
  if (!UI.questHost || !q) return;
  const old = UI.questHost.querySelector(`[data-quest="${qid}"]`);
  const fresh = el(questCardHTML(q));
  if (old) old.replaceWith(fresh); else UI.questHost.appendChild(fresh);
  setFill($('.progress__fill', fresh), q.progress);
}

function renderHeader() {
  if (UI.btnConnect) {
    UI.btnConnect.textContent = state.connected
      ? t('app.disconnect', 'Disconnect')
      : t('app.connect', 'Connect');
  }
  if (UI.walletPill) {
    UI.walletPill.textContent = state.connected
      ? t('passport.wallet.connected', 'Connected ✓')
      : t('passport.wallet.not_connected', 'Not Connected');
    UI.walletPill.className = 'status-pill ' + (state.connected
      ? 'status-pill--connected'
      : 'status-pill--disconnected');
  }
}

function questsToNext() {
  if (state.level >= 10) return 0;
  const remaining = state.xpRequired - state.points;
  return Math.max(1, Math.ceil(remaining / CONFIG.AVG_REWARD));
}

function renderDots() {
  if (!UI.dots) { warnOnce('#milestone-dots'); return; }
  UI.dots.innerHTML = TIERS.map((tr) => {
    let cls = '';
    if (tr.lv < state.level) cls = 'mdot--done';       // cyan solid
    else if (tr.lv === state.level) cls = 'mdot--active'; // emas (level saat ini)
    return `<button type="button" class="mdot ${cls}" data-lv="${tr.lv}"
      aria-label="LV.${tr.lv} — ${tr.name}" title="LV.${tr.lv} — ${tr.name}"></button>`;
  }).join('');
  if (UI.dotsReadout) {
    UI.dotsReadout.textContent = `LV.${state.level} · ${TIERS[state.level - 1].name}`;
  }
}

function renderPassport() {
  if (UI.levelNum)  UI.levelNum.textContent  = String(state.level);
  if (UI.tierName)  UI.tierName.textContent  = TIERS[state.level - 1].name;
  if (UI.xpText)    UI.xpText.textContent    = `${fmt(state.points)} / ${fmt(state.xpRequired)} 🪙`;
  setFill(UI.xpFill, (state.points / state.xpRequired) * 100);
  if (UI.levelHint) {
    UI.levelHint.textContent = state.level >= 10
      ? t('passport.level.max', 'Maximum tier — the whole ocean is yours')
      : tf('passport.level.hint', '{n} more quests to Lv.{lv}', { n: questsToNext(), lv: state.level + 1 });
  }
  renderDots();
}

function renderTreasury() {
  if (UI.poolFill) setFill(UI.poolFill, state.poolLeft);
  if (UI.poolText) UI.poolText.textContent = tf('treasury.left', '{n}% left', { n: state.poolLeft });
  if (UI.treasuryClaim) {
    const unlocked = state.level >= 10;
    UI.treasuryClaim.classList.toggle('is-locked', !unlocked);
    UI.treasuryClaim.setAttribute('aria-disabled', String(!unlocked));
    UI.treasuryClaim.textContent = unlocked
      ? t('treasury.claim_ready', 'Claim Vault Share')
      : tf('treasury.claim_locked', 'Claim at Lv.{lv}', { lv: 10 });
  }
}

function renderPoints(bump) {
  if (UI.pointsValue) UI.pointsValue.textContent = fmt(state.points) + ' 🪙';
  else warnOnce('#points-value');
  if (bump) bumpPoints();
}

function renderAll() {
  renderHeader();
  renderPoints(false);
  renderPassport();
  renderQuests();
  renderTreasury();
}

/* ============================================================
   10. AKSI — connect, start quest, claim, level-up, treasury
   ============================================================ */

function applyDim() {
  $$('.quest-card', UI.questHost).forEach((card) => {
    card.classList.toggle('quest-card--dim', !state.connected);
  });
}

function toggleConnect() {
  state.connected = !state.connected;
  saveState();
  renderHeader();
  applyDim();
  if (state.connected) toast(t('passport.wallet.connected', 'Connected ✓'));
  else toast(tf('quest.cta.start', 'Disconnected', {}) && t('passport.wallet.not_connected', 'Not Connected'));
}

const tickTimers = {};

// "Start Quest" → simulasi progres 0→100 lalu status jadi Complete.
// Saat disambung on-chain nanti: ganti isi fungsi ini dengan transaksi.
function startQuest(qid) {
  const q = getQuest(qid);
  if (!q || q.status !== 'available') return;
  if (!state.connected) return toast(t('passport.wallet.first', 'Connect your wallet first'));

  q.status = 'progress';
  q.progress = 0;
  saveState();
  renderQuestCard(qid);

  if (tickTimers[qid]) clearInterval(tickTimers[qid]);
  tickTimers[qid] = setInterval(() => {
    q.progress = Math.min(100, q.progress + 5); // 20 langkah × 200ms ≈ 4 detik
    setBarWidth(qid, q.progress);
    if (q.progress >= 100) {
      clearInterval(tickTimers[qid]);
      delete tickTimers[qid];
      q.status = 'complete';
      saveState();
      renderQuestCard(qid);
      toast(tf('quest.complete.toast', 'Quest complete: {title}', {
        title: t(`quest.${q.id}.title`, QUEST_DEFS[q.id].title),
      }));
    }
  }, 200);
}

// Kenaikan level otomatis bila XP melewati ambang tabel.
// Return true bila minimal 1 kenaikan terjadi.
function checkLevelUp() {
  let leveled = false;
  while (state.level < 10 && state.points >= XP_TABLE[state.level + 1]) {
    state.level++;
    state.xpRequired = requiredFor(state.level);
    leveled = true;
    toast(tf('passport.levelup.toast', '🐙 LEVEL UP → LV.{lv} · {tier}', {
      lv: state.level,
      tier: TIERS[state.level - 1].name,
    }));
  }
  if (state.level >= 10) state.xpRequired = XP_TABLE[10];
  return leveled;
}

// Klik Claim: kartu → Claimed, chip +🪙 terbang ke counter, bump, XP & tier disinkron.
function claimQuest(qid, sourceBtn) {
  const q = getQuest(qid);
  if (!q) return;
  if (!state.connected) return toast(t('passport.wallet.first', 'Connect your wallet first'));
  if (q.status !== 'complete') return;

  const fromRect = sourceBtn ? sourceBtn.getBoundingClientRect() : null; // ambil SEBELUM render ulang
  q.status = 'claimed';
  saveState();
  renderQuestCard(qid);

  flyChip(fromRect, `+${q.reward} 🪙`, () => {
    state.points += q.reward;
    renderPoints(true);
    const leveled = checkLevelUp();
    renderPassport();   // XP bar, tier, hint, dots
    renderTreasury();   // pill buka kunci jika LV.10
    if (leveled) flashLevel();
    saveState();
  });
}

function treasuryClick() {
  if (!state.connected) return toast(t('passport.wallet.first', 'Connect your wallet first'));
  if (state.level < 10) {
    if (UI.treasuryClaim) {
      UI.treasuryClaim.classList.remove('shake');
      void UI.treasuryClaim.offsetWidth;
      UI.treasuryClaim.classList.add('shake');
    }
    return toast(t('treasury.locked_toast', 'Reach LV.10 to unlock the Vault'));
  }
  toast(t('treasury.claim_toast', 'Vault unlocked! On-chain claim — SOON.'));
}

/* ============================================================
   11. LISTENER (delegasi — aman terhadap render ulang)
   ============================================================ */

function setupListeners() {
  if (UI.btnConnect) UI.btnConnect.addEventListener('click', toggleConnect);

  // Delegasi klik untuk semua tombol dalam kartu quest
  if (UI.questHost) {
    UI.questHost.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      const card = e.target.closest('.quest-card');
      const qid = card && card.dataset.quest;
      if (!qid) return;
      if (btn.dataset.action === 'claim') claimQuest(qid, btn);
      else if (btn.dataset.action === 'start') startQuest(qid);
    });
  }

  // Milestone dots — hover/tap/kuning fokus memperbarui readout "LV.n · Tier"
  if (UI.dots) {
    const show = (lv) => {
      const tr = TIERS[Math.max(1, Math.min(10, lv)) - 1];
      if (tr && UI.dotsReadout) UI.dotsReadout.textContent = `LV.${tr.lv} · ${tr.name}`;
    };
    ['mouseover', 'focusin', 'click'].forEach((evt) => {
      UI.dots.addEventListener(evt, (e) => {
        const d = e.target.closest('.mdot');
        if (d) show(Number(d.dataset.lv));
      });
    });
  }

  if (UI.treasuryClaim) UI.treasuryClaim.addEventListener('click', treasuryClick);
}

/* ============================================================
   12. ENTRANCE (stagger) & SINKRONISASI BAHASA
   ============================================================ */

// Blueprint: panel kiri 200ms → quest-card stagger 150ms → claim strip fade.
function entrance() {
  const seq = [UI.passportPanel, ...$$('.quest-card', UI.questHost), UI.claimStrip].filter(Boolean);
  seq.forEach((node, i) => {
    node.classList.add('reveal');
    node.style.transitionDelay = (i * 150) + 'ms';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => node.classList.add('is-visible'));
    });
  });
  setTimeout(() => {
    entranceDone = true;
    seq.forEach((node) => { node.style.transitionDelay = ''; });
  }, seq.length * 150 + 500);
}

// i18n.js mengubah <html lang> → render ulang semua teks milik app.js.
// (Teks statis dengan data-i18n diurus i18n.js sendiri.)
function watchLangChange() {
  if ('MutationObserver' in window) {
    const mo = new MutationObserver(debounce(() => renderAll(), 80));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  document.addEventListener('i18n:change', () => renderAll()); // dukung event kustom bila ada
}

/* ============================================================
   13. API DEBUG & INIT
   ============================================================ */

function afterPointsChange() {
  renderPoints(true);
  const leveled = checkLevelUp();
  renderPassport();
  renderTreasury();
  if (leveled) flashLevel();
  saveState();
}

window.FOMO_INK = {
  state,                                     // referensi live (jangan di-reassign)
  version: '1.0.0',
  reset() {
    try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (err) {}
    location.reload();
  },
  addPoints(n) {
    state.points = Math.max(0, state.points + Math.round(n || 0));
    afterPointsChange();
  },
  setLevel(lv) {
    state.level = Math.max(1, Math.min(10, Math.round(lv) || 1));
    state.xpRequired = requiredFor(state.level);
    renderPassport();
    renderTreasury();
    saveState();
  },
  connect(v) {
    state.connected = typeof v === 'boolean' ? v : !state.connected;
    renderHeader();
    applyDim();
    saveState();
  },
};

function init() {
  if (window.__FOMO_APP_INIT__) return; // anti init ganda
  window.__FOMO_APP_INIT__ = true;

  injectStyles();
  ensureDashboard();  // pastikan skeleton lengkap (self-healing)
  cacheEls();
  renderAll();        // isi semua UI dari state
  setupListeners();
  watchLangChange();
  entrance();         // stagger blueprint + mulai IO fill

  console.info(
    '%c🐙 FOMO INK app.js siap!',
    'font-weight: bold; color: #5b21b6;',
    '— API demo: FOMO_INK.addPoints(300) · FOMO_INK.setLevel(10) · FOMO_INK.reset()'
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
