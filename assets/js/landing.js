/* ============================================================
   IL METODO ARGO — Interazioni della landing
   - Scroll reveal (IntersectionObserver)
   - Carosello recensioni con autoplay lento
   - Codice sconto dinamico + countdown + copia (localStorage)
   - Menu mobile, sticky CTA, barra promo
   Nessuna dipendenza. Rispetta prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Menu mobile ---------- */
  (function navMenu() {
    const toggle = $("#navToggle");
    const nav = $("#siteNav");
    if (!toggle || !nav) return;
    const close = () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", (e) => { if (e.target.tagName === "A") close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  })();

  /* ---------- Scroll reveal ---------- */
  (function reveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  })();

  /* ---------- Codice sconto dinamico ---------- */
  const ArgoDiscount = (function discount() {
    const KEY = "argo_discount";
    const PERCENT = 10;
    const WINDOW_MS = 30 * 60 * 1000; // valido 30 minuti per visita
    let state = null;

    const gen = () => ({
      code: "ARGO-" + (1000 + Math.floor(Math.random() * 9000)),
      percent: PERCENT,
      expires: Date.now() + WINDOW_MS,
    });

    function load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && p.code && p.expires > Date.now()) return p;
        }
      } catch (e) { /* localStorage non disponibile */ }
      return null;
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    function ensure() {
      if (!state || state.expires <= Date.now()) { state = gen(); save(); }
      return state;
    }

    function render() {
      $$("[data-discount-code]").forEach((el) => (el.textContent = state.code));
      $$("[data-discount-percent]").forEach((el) => (el.textContent = state.percent));
      const bar = $("#promoBar");
      if (bar) bar.hidden = false;
      const finalLine = $("[data-discount-final]");
      if (finalLine) finalLine.hidden = false;
      document.dispatchEvent(new CustomEvent("argo:discount"));
    }

    function fmtCountdown(ms) {
      const t = Math.max(0, Math.floor(ms / 1000));
      const m = String(Math.floor(t / 60)).padStart(2, "0");
      const s = String(t % 60).padStart(2, "0");
      return m + ":" + s;
    }

    function tick() {
      const left = state.expires - Date.now();
      if (left <= 0) {
        state = gen(); save(); render();
        // piccolo flash sul codice al rinnovo
        $$("[data-discount-code]").forEach((el) => {
          el.animate(
            [{ background: "rgba(224,160,46,.35)" }, { background: "transparent" }],
            { duration: 900, easing: "ease-out" }
          );
        });
      }
      const txt = fmtCountdown(state.expires - Date.now());
      $$("[data-discount-count]").forEach((el) => (el.textContent = txt));
    }

    function initCopy() {
      $$("[data-copy-code]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(state.code);
          } catch (e) {
            // fallback: selezione manuale non necessaria, ignoriamo silenziosamente
          }
          const original = btn.innerHTML;
          btn.classList.add("copied");
          btn.textContent = "Copiato ✓";
          setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = original; }, 1600);
        });
      });
    }

    // init
    state = load() || gen();
    save();
    render();
    initCopy();
    tick();
    setInterval(tick, 1000);

    return {
      get() { return ensure() && state.expires > Date.now() ? { code: state.code, percent: state.percent } : null; },
    };
  })();
  window.ArgoDiscount = ArgoDiscount;

  /* ---------- Carosello recensioni ---------- */
  (function testimonials() {
    const track = $("#tstTrack");
    const prev = $("#tstPrev");
    const next = $("#tstNext");
    const dotsWrap = $("#tstDots");
    if (!track) return;
    const cards = $$(".tst-card", track);
    if (!cards.length) return;
    const GAP = 22;

    let perView = 3, pages = 1, page = 0, step = 0, maxOffset = 0;

    function measure() {
      const cardW = cards[0].getBoundingClientRect().width;
      step = cardW + GAP;
      const vp = track.parentElement.getBoundingClientRect().width;
      perView = Math.max(1, Math.round((vp + GAP) / step));
      pages = Math.max(1, Math.ceil(cards.length / perView));
      maxOffset = Math.max(0, cards.length - perView);
      page = Math.min(page, pages - 1);
      buildDots();
      apply();
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (let i = 0; i < pages; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Vai al gruppo " + (i + 1));
        if (i === page) b.classList.add("on");
        b.addEventListener("click", () => { go(i, true); });
        dotsWrap.appendChild(b);
      }
    }

    function apply() {
      const offset = Math.min(page * perView, maxOffset);
      track.style.transform = "translateX(" + -(offset * step) + "px)";
      if (dotsWrap) $$("button", dotsWrap).forEach((d, i) => d.classList.toggle("on", i === page));
    }

    function go(p, user) {
      page = (p + pages) % pages;
      apply();
      if (user) restart();
    }

    if (prev) prev.addEventListener("click", () => go(page - 1, true));
    if (next) next.addEventListener("click", () => go(page + 1, true));

    // autoplay lento
    let timer = null;
    function start() {
      if (reduceMotion || pages <= 1) return;
      stop();
      timer = setInterval(() => go(page + 1, false), 6000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    const tst = track.closest(".tst");
    if (tst) {
      tst.addEventListener("mouseenter", stop);
      tst.addEventListener("mouseleave", start);
      tst.addEventListener("focusin", stop);
      tst.addEventListener("focusout", start);
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 150); });

    measure();
    start();
  })();

  /* ---------- Sticky CTA mobile ---------- */
  (function stickyCta() {
    const el = $("#stickyCta");
    if (!el) return;
    const onScroll = () => {
      const show = window.scrollY > 700;
      el.classList.toggle("show", show);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  })();

  /* ---------- Placeholder video (hook di sostituzione) ---------- */
  (function videos() {
    $$("[data-video]").forEach((el) => {
      const activate = () => {
        const src = el.getAttribute("data-video");
        if (!src) return; // resta un segnaposto finché non colleghi una sorgente
        const v = document.createElement("video");
        v.src = src;
        v.controls = true;
        v.autoplay = true;
        v.playsInline = true;
        v.preload = "metadata";
        v.style.cssText = "width:100%;height:100%;object-fit:cover";
        el.innerHTML = "";
        el.appendChild(v);
      };
      el.addEventListener("click", activate);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      });
    });
  })();
})();
