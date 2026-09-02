/* ============================================================
   FOMO INK — lang-en.js · FILE 7/11
   Kamus Bahasa INGGRIS (bahasa default aplikasi)
   ------------------------------------------------------------
   · Dimuat oleh : i18n.js (FILE 4)
   · Global name : window.LANG_EN
   · Mekanisme   : setiap elemen HTML dengan atribut
                   data-i18n="path.ke.kunci" akan diisi
                   string dari kamus ini oleh i18n.js.
   · Fallback    : jika kunci tidak ditemukan, teks asli
                   HTML dibiarkan apa adanya (tidak error).
   · Aturan      : nilai HARUS string (bukan angka/objek),
                   karena i18n.js hanya replace textContent.
   · Komentar    : Bahasa Indonesia · Copy: English
   ============================================================ */

window.LANG_EN = {

  /* ---------- 0. META BAHASA (jangan diterjemahkan ke data-i18n) ---------- */
  _meta: {
    code: "en",            // kode bahasa — harus sama dengan nama file & localStorage
    name: "English",       // tampil di dropdown <select class="lang-select">
    flag: "🇺🇸",            // emoji bendera di dropdown
    docTitle: "FOMO INK — Every Mood Deserves Ink Onchain"        // <title> index.html
  },

  /* ---------- 1. SHARED · DIPAKAI DI 2 HALAMAN ---------- */
  common: {
    brand: "FOMO INK",

    // Badge status ( dipakai di hero & bento )
    statusNew: "NEW",
    statusPopular: "POPULAR",
    statusSoon: "SOON",
    statusLive: "LIVE",

    // Status pill quest ( app.html )
    stAvailable: "AVAILABLE",
    stProgress: "IN PROGRESS",
    stComplete: "COMPLETE",
    stClaimed: "CLAIMED",

    // Status wallet ( app.html )
    walletOn: "CONNECTED",
    walletOff: "DISCONNECTED"
  },

  /* ---------- 2. NAVIGASI HEADER ---------- */
  nav: {
    how: "How it works",
    features: "Features",
    quests: "Quests",
    treasury: "Treasury",
    connect: "Connect Wallet",
    launch: "Launch App"          // tombol → app.html
  },

  /* ---------- 3. HERO (index.html) ---------- */
  hero: {
    badge: "Season 0 — LIVE NOW",
    title1: "EVERY MOOD",                 // baris 1 · outline stroke
    title2: "DESERVES",                   // baris 2 · teks solid
    title2Accent: "INK ONCHAIN",          // span.grad-text di dalam title2
    sub: "FOMO INK is the onchain playground where artists turn moodboards into collectible Ink Passports, level up through quests, and share a community treasury. No gatekeepers. No platform fees. All vibes.",
    ctaPrimary: "Start Inking",
    ctaPrimaryArrow: "→",                 // span.btn__arrow
    ctaGhost: "Explore Quests",
    micro: "LIVE ON BNB CHAIN · SIGNUP 20 SEC · 0% FEES"
  },

  /* ---------- 4. CHIPS MENGAMBANG (kartu passport, index) ---------- */
  chips: {
    purple: "🔥 STREAK 12",
    gold: "✦ +250 MOOD PTS",
    cyan: "QUEST DONE ✓"
  },

  /* ---------- 5. KARTU INK PASSPORT (index) ---------- */
  card: {
    brand: "INK PASSPORT",
    serial: "№ 0042",
    arenaLabel: "ARENA — MOODBOARD 07",   // img-slot__label
    name: "jenna.eth",
    rank: "RANK · SCRIBBLER",
    xpLabel: "XP",
    xpValue: "2,450 / 3,000",
    mintedLabel: "MINTED",
    mintedValue: "08.2026",
    idLabel: "TOKEN ID",
    idValue: "#0042"
  },

  /* ---------- 6. STAT STRIP (index) ---------- */
  stats: {
    s1Value: "12,480",
    s1Label: "Ink Passports minted",
    s2Value: "3,182",
    s2Label: "Artists onboarding",
    s3Value: "450K $INK",
    s3Label: "Treasury pooled",
    s4Value: "0%",
    s4Label: "Platform fees"
  },

  /* ---------- 7. SECTION · 3 LANGKAH (index) ---------- */
  steps: {
    title: "FROM MOOD TO",
    titleAccent: "MASTERPIECE",
    hint: "THREE STEPS · NO MANUAL NEEDED",
    s1Title: "Connect your wallet",
    s1Desc: "Ghost into FOMO INK with MetaMask, Trust, or any wallet you already love. Your Ink Passport mints itself in one signature — no gas needed in beta.",
    s2Title: "Complete ink quests",
    s2Desc: "Daily and weekly quests push you into the Moodboard Arena. Post, vote, raid — every action drops XP straight into your passport.",
    s3Title: "Claim treasury share",
    s3Desc: "80% of every community fee flows into a shared pool. Level up to unlock your slice, then claim straight to your wallet."
  },

  /* ---------- 8. SECTION · BENTO FITUR (index) ---------- */
  bento: {
    title: "WHY ARTISTS",
    titleAccent: "STAY INKED",
    c1Title: "Moodboard Arena",
    c1Desc: "Weekly themed arenas where the community votes. Top moods get minted as part of the permanent culture vault.",
    c2Title: "Ink Passport ID",
    c2Desc: "Your evolving onchain identity. Frame, rank, and XP grow with every quest you finish.",
    c3Title: "XP & Level Streaks",
    c3Desc: "Consistent inking compounds. Streak multipliers reward artists who show up daily — miss a day, the streak survives 48h.",
    c4Title: "Treasury Sharing",
    c4Desc: "A transparent pool split with the community. Rarity of your passport decides the size of your slice.",
    c5Title: "Zero Platform Fees",
    c5Desc: "We take nothing. Mints, quests, claims — you only ever pay network gas. Forever, written in the contract.",
    c6Title: "Five Languages",
    c6Desc: "English, Indonesia, Português, 中文, 한국어 — the timeline is global and so is the app."
  },

  /* ---------- 9. CTA TREASURY BANNER (index) ---------- */
  treasury: {
    top: "80% OF FEES FLOW BACK TO THE COMMUNITY",
    title: "The Ink Treasury never sleeps",
    desc: "Every quest fee and arena entry feeds one shared pool. Your XP rank decides your claim window — be early, be loud, be inked.",
    cta: "Claim Your Share",
    micro: "NEXT SPLIT WINDOW · SEP 12, 2026"
  },

  /* ---------- 10. FEE STRIP (index) ---------- */
  fee: {
    text: "0% MINT FEE · 0% QUEST FEE · 0% CLAIM FEE · GAS ONLY · FOREVER"
  },

  /* ---------- 11. FOOTER (index) ---------- */
  footer: {
    tagline: "The onchain playground for artists who ink first and ask questions later.",
    exploreTitle: "Explore",
    exploreHow: "How it works",
    exploreFeatures: "Features",
    exploreQuests: "Quests",
    exploreTreasury: "Treasury",
    communityTitle: "Community",
    communityX: "X / Twitter",
    communityDiscord: "Discord",
    communityTelegram: "Telegram",
    communityGithub: "GitHub",
    rights: "© 2026 FOMO INK — All vibes reserved.",
    built: "BUILT ON BNB CHAIN · V0.1 BETA"
  },

  /* ============================================================
     HALAMAN APP (app.html)
     ============================================================ */

  /* ---------- 12. DASHBOARD TITLE STRIP ---------- */
  app: {
    title: "Ink Dashboard",
    pointsValue: "+250",                  // angka statis di beta (mock)
    pointsLabel: "INK PTS",
    walletAddr: "0xjenna…42b7",           // teks mono mock wallet
    change: "↻",                          // tombol icon kecil
    identityName: "jenna.eth",
    identityEdit: "✎ edit",
    levelLabel: "LEVEL",
    tier: "INK APPRENTICE",
    levelHint: " ↳ Complete quests to level up · Lv.3 unlocks Treasury claims",
    xpTitle: "XP TO NEXT LEVEL",
    xpOf: "450 / 3,000 XP",
    milestoneHint: "Lv.1 → 10 · HOVER FOR TIERS",
    uploadBtn: "Upload Avatar",
    uploadRemove: "✕",
    uploadNote: "PNG / JPG · MAX 1MB — STORED LOCALLY (BETA)",

    /* ---------- 13. PANEL QUESTS ---------- */
    questsTitle: "Ink Quests",
    questsHint: "NEW QUESTS DROP EVERY FRIDAY · 14:00 UTC",

    /* Quest 1 — Daily, sedang berjalan */
    q1Tag: "DAILY",
    q1Title: "Post your moodboard",
    q1Desc: "Share today's mood in the Arena. Threads count, screenshots of others do not.",
    q1Progress: "2 / 3 posts",
    q1Reward: "+150 INK",
    q1Btn: "OPEN ARENA",

    /* Quest 2 — Weekly, tersedia */
    q2Tag: "WEEKLY",
    q2Title: "Mint an Ink Passport",
    q2Desc: "First mint of the week grants a streak bonus. One per wallet, no excuses.",
    q2Progress: "0 / 1 mint",
    q2Reward: "+300 INK",
    q2Btn: "MINT NOW",

    /* Quest 3 — Social, sedang berjalan */
    q3Tag: "SOCIAL",
    q3Title: "Raid our X drop",
    q3Desc: "Quote and repost today's featured passport. Both links count — no stealth edits.",
    q3Progress: "0 / 2 actions",
    q3Reward: "+120 INK",
    q3Btn: "OPEN X",

    /* Quest 4 — Seasonal, terkunci (dim) */
    q4Tag: "SEASON",
    q4Title: "Reach Level 5",
    q4Desc: "Season reward for the patient. Level tracks automatically — just keep inking.",
    q4Progress: "Lv.2 → Lv.5",
    q4Reward: "+2,000 INK",
    q4Btn: "LOCKED",

    /* Quest 5 — Complete, siap diklaim */
    q5Tag: "SOCIAL",
    q5Title: "Invite a friend",
    q5Desc: "Your invite minted an Ink Passport. The talent pipeline is alive because of you.",
    q5Reward: "+500 INK",
    q5Btn: "CLAIM +500 INK",

    /* Contoh kartu yang sudah diklaim (dim / claimed) */
    q6Tag: "DAILY",
    q6Title: "Vote in yesterday's Arena",
    q6Desc: "Thanks for shaping the culture. Come back tomorrow for a fresh batch.",
    q6Reward: "+80 INK",
    q6Claimed: "CLAIMED 08.12.2026 ✓",

    feeNote: "NO PLATFORM FEES — EVER. GAS ONLY.",

    /* ---------- 14. CLAIM STRIP · TREASURY ---------- */
    claimTitle: "Treasury Claim",
    claimDesc: "Your slice of the community pool. Size grows with your rank — claim when the window opens.",
    claimPoolLabel: "TREASURY POOL",
    claimPoolValue: "450,000 $INK",
    claimPoolFill: "38% READY",
    claimBtn: "CLAIM 2,500 $INK",
    claimLocked: "LOCKED — REACH Lv.3",
    claimMicro: "↳ CLAIMS OPEN AFTER EACH SEASON SPLIT · NEXT WINDOW SEP 12, 2026"
  },

  /* ---------- 15. TOOLTIP TIER MILESTONE (title attr, dipakai i18n-title) ---------- */
  tiers: {
    t1: "Lv.1 · GHOST",        t2: "Lv.2 · SCRIBBLER",
    t3: "Lv.3 · APPRENTICE — Treasury unlock",
    t4: "Lv.4 · DOODLER",      t5: "Lv.5 · INKER — Season quest",
    t6: "Lv.6 · SKETCHLORD",   t7: "Lv.7 · WEAVE PUSHER",
    t8: "Lv.8 · VIRTUOSO",     t9: "Lv.9 · LIVING MASTERPIECE",
    t10: "Lv.10 · INK IMMORTAL"
  }
};
