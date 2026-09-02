/* ============================================================
   FOMO INK — i18n.js
   Mesin penerjemah ringan (vanilla, tanpa dependensi)
   - Kamus disediakan oleh lang-en/id/ptbr/zh/ko.js
     (masing-masing mengisi window.FOMO_LANGS["xx"] = { "key": "teks" })
   - Elemen HTML memakai atribut data-i18n="nama.key"
     → teks elemen diganti dengan kamus bahasa aktif
   - Kunci aturan: data-i18n hanya di elemen "daun"
     (elemen yang isinya teks murni, TANPA anak elemen di dalamnya)
   - Fallback: kunci tak ditemukan → coba EN → jika tetap tidak ada,
     teks HTML asli dibiarkan apa adanya (halaman tidak pernah rusak)
   - Urutan muat script WAJIB: lang-*.js → i18n.js → home.js/app.js
   ============================================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "fomoink_lang"; // pilihan bahasa tersimpan di sini
  var DEFAULT_LANG = "en";
  var SUPPORTED = ["en", "id", "ptbr", "zh", "ko"];

  var currentLang = DEFAULT_LANG;

  /* ---------- Deteksi & ambil bahasa awal ---------- */

  // Petakan bahasa browser → kode kamus kita
  function detectBrowserLang() {
    var nav = (navigator.language || "en").toLowerCase();
    if (nav.indexOf("id") === 0) return "id";
    if (nav.indexOf("pt") === 0) return "ptbr";
    if (nav.indexOf("zh") === 0) return "zh";
    if (nav.indexOf("ko") === 0) return "ko";
    return "en";
  }

  function getSavedLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return (saved && SUPPORTED.indexOf(saved) !== -1) ? saved : null;
    } catch (e) {
      return null; // localStorage bisa terblokir (mode privat) — abaikan
    }
  }

  function resolveInitialLang() {
    return getSavedLang() || detectBrowserLang();
  }

  /* ---------- Akses kamus ---------- */

  function dictOf(lang) {
    return (window.FOMO_LANGS && window.FOMO_LANGS[lang]) || {};
  }

  // Ambil terjemahan satu kunci; null = biarkan teks asli HTML
  function t(key, lang) {
    var d = dictOf(lang);
    if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    if (lang !== DEFAULT_LANG) {
      var fallback = dictOf(DEFAULT_LANG);
      if (Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
    }
    return null;
  }

  /* ---------- Terapkan bahasa ke seluruh halaman ---------- */

  function apply(lang) {
    currentLang = lang;

    // 1) Ganti teks semua elemen ber-data-i18n
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var val = t(nodes[i].getAttribute("data-i18n"), lang);
      if (val !== null) nodes[i].textContent = val;
    }

    // 2) Perbarui atribut lang <html> (aksesibilitas / SEO)
    var htmlLangMap = { en: "en", id: "id", ptbr: "pt-BR", zh: "zh", ko: "ko" };
    document.documentElement.setAttribute("lang", htmlLangMap[lang] || "en");

    // 3) Sinkronkan semua dropdown bahasa di halaman
    var selects = document.querySelectorAll(".lang-select");
    for (var s = 0; s < selects.length; s++) {
      if (selects[s].value !== lang) selects[s].value = lang;
    }
  }

  /* ---------- Ganti bahasa (dipanggil dropdown / API publik) ---------- */

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang); // ingat pilihan pengguna
    } catch (e) { /* abaikan jika penyimpanan terblokir */ }
    apply(lang);
    // Broadcast: biar home.js / app.js bisa bereaksi jika perlu
    document.dispatchEvent(new CustomEvent("fomo:langchange", { detail: { lang: lang } }));
  }

  /* ---------- Pasang listener dropdown ---------- */

  function bindSelectors() {
    var selects = document.querySelectorAll(".lang-select");
    for (var i = 0; i < selects.length; i++) {
      selects[i].addEventListener("change", function (e) {
        setLang(e.target.value);
      });
    }
  }

  /* ---------- Init ---------- */

  function init() {
    bindSelectors();
    apply(resolveInitialLang());
    document.dispatchEvent(new CustomEvent("fomo:langchange", { detail: { lang: currentLang } }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init(); // script dimuat di akhir <body> → DOM sudah siap
  }

  /* ---------- API publik minimal (dipakai app.js dsb.) ---------- */
  window.FOMO_I18N = {
    t: function (key) { return t(key, currentLang); },
    getLang: function () { return currentLang; },
    setLang: setLang
  };
})();
