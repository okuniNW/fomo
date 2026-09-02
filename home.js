/* ============================================================
   FOMO INK — home.js
   Interaksi & efek khusus halaman utama (index.html)
   ------------------------------------------------------------
   URUTAN MUAT di index.html (sebelum </body>):
     lang-en.js → lang-id.js → ... → i18n.js → home.js
   Dependensi: window.I18N (opsional — efek tetap jalan tanpa itu)
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Utilitas kecil ---------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     1. BAHASA — sinkron dropdown dengan i18n.js
     Mendukung 2 markup:
       a) <select class="lang-select"> ... </select>
       b) elemen custom dengan attribute data-lang="id" dst.
     ============================================================ */
  function initLang() {
    if (!window.I18N) return;

    $$("select.lang-select").forEach((sel) => {
      sel.value = window.I18N.getLang();
      sel.addEventListener("change", (e) => window.I18N.setLang(e.target.value));
    });

    $$("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        window.I18N.setLang(btn.getAttribute("data-lang"));
      });
    });

    // Kalau i18n.js mengumumkan perubahan bahasa, sinkronkan dropdown
    document.addEventListener("i18n:changed", () => {
      $$("select.lang-select").forEach((sel) => {
        sel.value = window.I18N.getLang();
      });
    });
  }

  /* ============================================================
     2. REVEAL ON SCROLL — elemen muncul berurutan saat discroll
     after-render cleanup: class .reveal dilepas setelah selesai
     supaya transisi hover asli (.step, .bento__card) kembali normal.
     ============================================================ */
  const REVEAL_GROUPS = [
    { sel: ".hero__content > *",     delay: 90  },
    { sel: ".card-passport",         delay: 0   },
    { sel: ".card-passport .chip",   delay: 100 },
    { sel: ".stat",                  delay: 80  },
    { sel: ".step",                  delay: 90  },
    { sel: ".bento__card",           delay: 90  },
    { sel: ".treasury-banner",       delay: 0   },
  ];

  function initReveal() {
    if (REDUCED || !("IntersectionObserver" in window)) return;

    const targets = [];
    const seen = new WeakSet();

    REVEAL_GROUPS.forEach(({ sel, delay }) => {
      const siblingIndex = new WeakMap();
      $$(sel).forEach((el) => {
        if (seen.has(el)) return; // jangan dobel (chips di dalam kartu, dll.)
        seen.add(el);

        // stagger: hitung urutan di antara saudara satu parent
        const parent = el.parentElement;
        const i = siblingIndex.get(parent) || 0;
        siblingIndex.set(parent, i + 1);
        if (delay > 0) el.style.transitionDelay = i * delay + "ms";

        el.classList.add("reveal");
        targets.push(el);
      });
    });

    if (!targets.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    targets.forEach((el) => io.observe(el));
  }

  function revealNow(el) {
    el.classList.add("is-visible");

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      el.classList.remove("reveal", "is-visible");
      el.style.transitionDelay = "";
    };

    el.addEventListener("transitionend", function h(e) {
      if (e.target !== el || e.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", h);
      cleanup();
    });
    setTimeout(cleanup, 700); // jaring pengaman
  }

  /* ============================================================
     3. PROGRESS BAR — isi lebar sesuai data-progress (0–100)
     Markup: <div class="progress">
               <div class="progress__fill" data-progress="82"></div>
             </div>
     ============================================================ */
  function initProgress() {
    const fills = $$(".progress__fill").filter((f) => f.hasAttribute("data-progress"));
    if (!fills.length) return;

    const apply = (el) => {
      const v = Math.min(100, Math.max(0, parseFloat(el.dataset.progress) || 0));
      requestAnimationFrame(() => { el.style.width = v + "%"; });
    };

    if (REDUCED || !("IntersectionObserver" in window)) {
      fills.forEach(apply);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { apply(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    fills.forEach((el) => io.observe(el));
  }

  /* ============================================================
     4. COUNT-UP STATISTIK — angka menghitung naik saat terlihat
     Markup opsional: <span class="stat__value" data-count="12483">12,483</span>
     Suffix opsional: data-suffix="+"  → hasil: "12,483+"
     ============================================================ */
  function initCountUp() {
    const nums = $$("[data-count]");
    if (!nums.length) return;

    const fmt = (n) => n.toLocaleString("en-US");

    const finish = (el) => {
      el.textContent = fmt(parseFloat(el.dataset.count) || 0) + (el.dataset.suffix || "");
    };
    const animate = (el) => {
      if (REDUCED) { finish(el); return; }
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || "";
      const dur = 1200, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        el.textContent = fmt(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) { nums.forEach(animate); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => io.observe(el));
  }

  /* ============================================================
     5. PERAPIAN KECIL
     ============================================================ */
  function initPolish() {
    // Judul section tidak tertutup header sticky saat lompat anchor
    $$("section[id]").forEach((s) => { s.style.scrollMarginTop = "84px"; });

    // Keamanan tautan eksternal
    $$('a[target="_blank"]').forEach((a) =>
      a.setAttribute("rel", "noopener noreferrer")
    );

    // Tahun footer otomatis
    $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- 6. Sentuhan brand di console ---------- */
  function brandConsole() {
    try {
      console.log(
        "%c🐙 FOMO INK%c — Don't FOMO. Conquer the Ink Ocean.",
        "background:#5b21b6;color:#fcfaf5;padding:4px 10px;border-radius:999px;font-weight:700",
        "color:#5b21b6;font-weight:600"
      );
    } catch (e) { /* diam saja */ }
  }

  /* ---------- BOOT ---------- */
  function boot() {
    initLang();
    initReveal();
    initProgress();
    initCountUp();
    initPolish();
    brandConsole();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
