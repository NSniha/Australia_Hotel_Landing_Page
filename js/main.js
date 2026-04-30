/* =========================================================
   Aurora Haven - main.js (FULL UPDATED)
   - HARD FIX: prevent refresh hash auto-jump (reload only)
   - Mobile menu: full-height right panel + smooth animation
   - Scroll reveal: works across full site + dynamic (View More) items
   - Parallax hero background (smooth rAF)
   - Booking form validation + date min lock
   - Auth modal (Login/Register): strong UX + focus trap + strength meter
   - Section 3: Search + View More / View Less (NO AUTO SCROLL ON LOAD ✅)
   - Section 4: Testimonials slider (single system only ✅)
========================================================= */

// ---------- Helpers ----------
const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => [...ctx.querySelectorAll(q)];

/* =========================================================
   HARD FIX: prevent browser auto jump to any #hash on reload
   - Detects reload
   - Temporarily removes hash before browser scrolls to anchor
   - Restores hash in URL after load WITHOUT scrolling
========================================================= */
(function preventHashJumpOnReload() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const navEntry = performance.getEntriesByType?.("navigation")?.[0];
  const isReload =
    (navEntry && navEntry.type === "reload") ||
    (performance.navigation && performance.navigation.type === 1);

  const hash = window.location.hash;

  // Only intervene on RELOAD, not normal navigation
  if (isReload && hash) {
    const clean = window.location.pathname + window.location.search;
    history.replaceState(null, document.title, clean);
    window.scrollTo(0, 0);

    window.addEventListener("load", () => {
      // restore hash in URL but do not trigger scroll
      history.replaceState(null, document.title, clean + hash);
      window.scrollTo(0, 0);
    });
  }
})();

// =========================================================
// DOM Ready
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // Mobile Menu (right panel, full height)
  // =========================================================
  const hamburger = $(".hamburger");
  const mobileMenu = $("#mobileMenu");
  const mobilePanel = $(".mobilePanel");
  const mobileClose = $(".mobileClose");

  function lockScroll(lock) {
    document.body.style.overflow = lock ? "hidden" : "";
  }

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("show");
    mobileMenu.setAttribute("aria-hidden", "false");
    hamburger?.setAttribute("aria-expanded", "true");
    lockScroll(true);
    setTimeout(() => mobilePanel?.focus(), 60);
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("show");
    mobileMenu.setAttribute("aria-hidden", "true");
    hamburger?.setAttribute("aria-expanded", "false");
    lockScroll(false);
  }

  hamburger?.addEventListener("click", openMenu);
  mobileClose?.addEventListener("click", closeMenu);

  mobileMenu?.addEventListener("click", (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  $$(".mLink").forEach((a) => a.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu?.classList.contains("show")) closeMenu();
  });

  // =========================================================
  // Scroll Reveal (works full site + supports new elements later)
  // =========================================================
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let revealObserver = null;

  function revealNow(el) {
    el.classList.add("show");
  }

  function setupRevealObserver() {
    const revealEls = $$(".reveal");

    if (reduceMotion) {
      revealEls.forEach(revealNow);
      return;
    }

    if (!revealEls.length) return;

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealNow(entry.target);
            revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => {
      if (!el.classList.contains("show")) revealObserver.observe(el);
    });
  }

  function observeReveal(el) {
    if (reduceMotion) return revealNow(el);
    if (!revealObserver) return;
    if (!el.classList.contains("show")) revealObserver.observe(el);
  }

  setupRevealObserver();

  // =========================================================
  // Parallax Background (smooth)
  // =========================================================
  const heroBg = $(".heroBg");
  let ticking = false;

  function updateParallax() {
    if (!heroBg) return;
    const y = window.scrollY || 0;
    heroBg.style.transform = `scale(1.03) translateY(${Math.min(y * 0.08, 24)}px)`;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
    },
    { passive: true }
  );

  updateParallax();

  // =========================================================
  // Booking Form (validation)
  // =========================================================
  const bookingForm = $("#bookingForm");
  const note = $("#formNote");

  function setNote(msg, isError = false) {
    if (!note) return;
    note.textContent = msg;
    note.style.color = isError ? "rgba(245, 120, 120, 0.95)" : "rgba(255,255,255,.78)";
  }

  function toDate(val) {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  bookingForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const location = bookingForm.location.value.trim();
    const person = bookingForm.person.value;
    const checkin = bookingForm.checkin.value;
    const checkout = bookingForm.checkout.value;

    if (!location) return setNote("Please enter a location.", true);
    if (!person) return setNote("Please select number of guests.", true);
    if (!checkin) return setNote("Please select a check-in date.", true);
    if (!checkout) return setNote("Please select a check-out date.", true);

    const dIn = toDate(checkin);
    const dOut = toDate(checkout);
    if (!dIn || !dOut) return setNote("Invalid date selected.", true);
    if (dOut <= dIn) return setNote("Check-out must be after check-in.", true);

    setNote(`Searching stays in "${location}" for ${person} guest(s) from ${checkin} to ${checkout}...`);
  });

  (function lockPastDates() {
    if (!bookingForm) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const min = `${yyyy}-${mm}-${dd}`;

    const checkin = bookingForm.querySelector('input[name="checkin"]');
    const checkout = bookingForm.querySelector('input[name="checkout"]');

    if (checkin) checkin.setAttribute("min", min);
    if (checkout) checkout.setAttribute("min", min);

    checkin?.addEventListener("change", () => {
      const v = checkin.value;
      if (!v || !checkout) return;
      checkout.min = v;
      if (checkout.value && checkout.value <= v) checkout.value = "";
    });
  })();

  // =========================================================
  // Prevent "#" anchor links inside Section 3 (so it won't jump)
  // =========================================================
  $("#bestGrid")?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";

    if (href.startsWith("#")) {
      e.preventDefault();
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  });

  // =========================================================
  // Section 3: Search + View More / View Less  (FIXED NO JUMP ON LOAD ✅)
  // =========================================================
  (function bestListInit() {
    const form = document.getElementById("bestHotelSearch");
    const input = document.getElementById("bestSearchInput");
    const grid = document.getElementById("bestGrid");
    const empty = document.getElementById("bestEmpty");
    const moreBtn = document.getElementById("bestMoreBtn");

    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".bestCard"));
    const extras = cards.filter((c) => c.classList.contains("isExtra"));
    let expanded = false;

    const normalize = (v) => (v || "").toLowerCase().trim();

    function applyFilter(q) {
      const query = normalize(q);
      let shown = 0;

      cards.forEach((card) => {
        const name = normalize(card.getAttribute("data-name"));
        const loc = normalize(card.getAttribute("data-loc"));

        const match = !query || name.includes(query) || loc.includes(query);
        const isExtra = card.classList.contains("isExtra");
        const hideExtra = isExtra && !expanded;

        const show = match && !hideExtra;
        card.style.display = show ? "" : "none";

        if (show) {
          shown++;
          if (card.classList.contains("reveal")) observeReveal(card);
        }
      });

      if (empty) empty.textContent = shown ? "" : "No matches found. Try a different hotel name or destination.";

      if (!moreBtn) return;
      if (!extras.length) {
        moreBtn.style.display = "none";
        return;
      }

      if (query) {
        const matchedExtras = extras.some((card) => {
          const name = normalize(card.getAttribute("data-name"));
          const loc = normalize(card.getAttribute("data-loc"));
          return name.includes(query) || loc.includes(query);
        });
        moreBtn.style.display = matchedExtras ? "" : "none";
      } else {
        moreBtn.style.display = "";
      }
    }

    // ✅ FIX: scrollIntoView only when user collapses after expanding (NOT on init)
    function setExpanded(next, opts = { silent: false }) {
      const wasExpanded = expanded;
      expanded = next;

      grid.classList.toggle("showAll", expanded);

      if (moreBtn) {
        moreBtn.textContent = expanded ? "View Less" : "View More";
        moreBtn.setAttribute("aria-expanded", String(expanded));
      }

      applyFilter(input?.value || "");

      // Only when collapsing AFTER user expanded, not during init
      if (wasExpanded && !expanded && !opts.silent) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilter(input?.value || "");
    });

    input?.addEventListener("input", () => applyFilter(input.value));
    moreBtn?.addEventListener("click", () => setExpanded(!expanded));

    // ✅ init without scrolling
    setExpanded(false, { silent: true });
  })();
});

// =========================================================
// AUTH MODAL (Strong JS)
// =========================================================
(() => {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;

  const authDialog = authModal.querySelector(".authDialog");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");

  const authTabs = [...document.querySelectorAll("[data-auth-tab]")];
  const authPanels = [...document.querySelectorAll("[data-auth-panel]")];
  const authOpenBtns = [...document.querySelectorAll(".authOpen")];

  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");

  let lastFocusedEl = null;

  function lockScroll(lock) {
    document.body.style.overflow = lock ? "hidden" : "";
  }

  function setAuthCopy(mode) {
    if (!authTitle || !authSubtitle) return;
    if (mode === "login") {
      authTitle.textContent = "Welcome back";
      authSubtitle.textContent = "Sign in to continue your journey.";
    } else {
      authTitle.textContent = "Create your account";
      authSubtitle.textContent = "Save favorites and manage bookings in one place.";
    }
  }

  function clearMessages() {
    authPanels.forEach((p) => {
      const msg = p.querySelector(".authMsg");
      if (msg) msg.textContent = "";
    });
  }

  function switchAuth(mode) {
    authTabs.forEach((t) => {
      const active = t.dataset.authTab === mode;
      t.classList.toggle("isActive", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    authPanels.forEach((p) => p.classList.toggle("show", p.dataset.authPanel === mode));
    setAuthCopy(mode);
    clearMessages();
  }

  function openAuth(mode = "login") {
    lastFocusedEl = document.activeElement;

    authModal.classList.add("show");
    authModal.setAttribute("aria-hidden", "false");
    lockScroll(true);

    switchAuth(mode);

    setTimeout(() => {
      authDialog?.focus();
      const firstInput = authModal.querySelector(`[data-auth-panel="${mode}"] input`);
      firstInput?.focus();
    }, 60);
  }

  function closeAuth() {
    authModal.classList.remove("show");
    authModal.setAttribute("aria-hidden", "true");
    lockScroll(false);

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
  }

  authOpenBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuth(btn.dataset.auth || "login");
    });
  });

  authModal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.closest && t.closest("[data-auth-close]")) closeAuth();
  });

  authTabs.forEach((tab) => tab.addEventListener("click", () => switchAuth(tab.dataset.authTab)));

  authModal.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-switch]");
    if (!btn) return;
    switchAuth(btn.dataset.switch);
    const first = authModal.querySelector(`[data-auth-panel="${btn.dataset.switch}"] input`);
    first?.focus();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal.classList.contains("show")) closeAuth();
  });

  // Focus trap
  document.addEventListener("keydown", (e) => {
    if (!authModal.classList.contains("show")) return;
    if (e.key !== "Tab") return;

    const focusable = authModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const list = [...focusable].filter((el) => !el.disabled && el.offsetParent !== null);
    if (!list.length) return;

    const first = list[0];
    const last = list[list.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Toggle password eye
  authModal.addEventListener("click", (e) => {
    const eye = e.target.closest("[data-eye]");
    if (!eye) return;

    const wrap = eye.closest(".authPassWrap");
    const input = wrap?.querySelector("input");
    const icon = eye.querySelector("i");
    if (!input) return;

    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    if (icon) icon.className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  function setMsg(formEl, msg, isError = false) {
    if (!formEl) return;
    const box = formEl.querySelector(".authMsg");
    if (!box) return;
    box.textContent = msg;
    box.style.color = isError ? "rgba(245, 80, 80, 0.95)" : "rgba(255,255,255,.78)";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function strengthScore(pw) {
    let s = 0;
    if (pw.length >= 8) s += 25;
    if (pw.length >= 12) s += 15;
    if (/[A-Z]/.test(pw)) s += 20;
    if (/[0-9]/.test(pw)) s += 20;
    if (/[^A-Za-z0-9]/.test(pw)) s += 20;
    return Math.min(100, s);
  }

  const strengthBar = regForm?.querySelector("[data-strength-bar]");
  const strengthText = regForm?.querySelector("[data-strength-text]");
  const regPass = regForm?.querySelector('input[name="password"]');

  regPass?.addEventListener("input", () => {
    const v = regPass.value || "";
    const score = strengthScore(v);

    if (strengthBar) strengthBar.style.width = `${score}%`;

    let label = "Weak";
    if (score >= 70) label = "Strong";
    else if (score >= 45) label = "Medium";

    if (strengthText) strengthText.textContent = `Password strength: ${v ? label : "—"}`;
  });

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !isValidEmail(email)) return setMsg(loginForm, "Please enter a valid email address.", true);
    if (!password || password.length < 6) return setMsg(loginForm, "Password must be at least 6 characters.", true);

    setMsg(loginForm, "Signed in successfully.");
    setTimeout(closeAuth, 650);
  });

  regForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const first = regForm.firstName.value.trim();
    const last = regForm.lastName.value.trim();
    const email = regForm.email.value.trim();
    const pass = regForm.password.value;
    const terms = regForm.terms?.checked;

    if (!first) return setMsg(regForm, "Please enter your first name.", true);
    if (!last) return setMsg(regForm, "Please enter your last name.", true);
    if (!email || !isValidEmail(email)) return setMsg(regForm, "Please enter a valid email address.", true);
    if (!pass || pass.length < 8) return setMsg(regForm, "Password must be at least 8 characters.", true);
    if (!terms) return setMsg(regForm, "Please accept the Terms & Privacy Policy.", true);

    localStorage.setItem("aurora_user", JSON.stringify({ first, last, email }));
    setMsg(regForm, "Account created successfully.");

    setTimeout(() => {
      switchAuth("login");
      const firstInput = loginForm?.querySelector("input");
      firstInput?.focus();
    }, 650);
  });

  authModal.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-forgot]");
    if (!btn) return;
    setMsg(loginForm, "Password reset link sent. Please check your email.");
  });
})();

/* =========================================================
   Section 4: Testimonials Overflow Slider (INFINITE LOOP)
   - seamless repeat (no blank ever)
   - next/prev + drag/swipe
   - auto measure card width + gap
   - rebuild on resize
========================================================= */
(function testiSlider4Infinite() {
  const slider = document.querySelector(".testiSlider4");
  if (!slider) return;

  const viewport = slider.querySelector(".testiViewport4");
  const track = slider.querySelector(".testiTrack4");
  const btnPrev = slider.querySelector(".testiArrow4.prev");
  const btnNext = slider.querySelector(".testiArrow4.next");
  const bars = Array.from(slider.querySelectorAll(".testiBar4"));

  if (!viewport || !track) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let originalCards = [];
  let realCount = 0;

  let step = 0;            // card width + gap
  let cloneCount = 0;      // how many cloned at both ends
  let index = 0;           // current index (in cloned list)
  let isAnimating = false;

  // Drag state
  let isDown = false;
  let startX = 0;
  let startTranslate = 0;
  let currentTranslate = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function getGap() {
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");
    return Number.isFinite(gap) ? gap : 0;
  }

  function getStep() {
    const first = track.querySelector(".testiCard4");
    if (!first) return 0;

    const rect = first.getBoundingClientRect();
    const gap = getGap();
    return Math.round(rect.width + gap);
  }

  function setTransition(on) {
    if (prefersReduced) {
      track.style.transition = "none";
      return;
    }
    track.style.transition = on ? "transform 560ms cubic-bezier(.2,.9,.2,1)" : "none";
  }

  function translateTo(px) {
    currentTranslate = px;
    track.style.transform = `translate3d(${-px}px,0,0)`;
  }

  function translateForIndex(i) {
    return i * step;
  }

  function updateBars() {
    if (!bars.length || !realCount) return;

    const realIndex = ((index - cloneCount) % realCount + realCount) % realCount;

    // If you have 4 bars but many cards, map progress into 4 steps
    const progress = realCount === 1 ? 0 : realIndex / (realCount - 1);
    const active = Math.round(progress * (bars.length - 1));

    bars.forEach((b, i) => b.classList.toggle("isActive", i === active));
  }

  function build() {
    if (!originalCards.length) {
      originalCards = Array.from(track.querySelectorAll(".testiCard4"));
    }

    track.innerHTML = "";
    originalCards.forEach((c) => track.appendChild(c));

    realCount = originalCards.length;
    if (!realCount) return;

    step = getStep();

    const viewW = viewport.clientWidth;
    const visible = step ? Math.ceil(viewW / step) : 1;
    cloneCount = clamp(visible + 2, 2, Math.min(8, realCount));

    const headClones = originalCards.slice(0, cloneCount).map((n) => n.cloneNode(true));
    const tailClones = originalCards.slice(-cloneCount).map((n) => n.cloneNode(true));

    track.innerHTML = "";
    tailClones.forEach((n) => track.appendChild(n));
    originalCards.forEach((n) => track.appendChild(n));
    headClones.forEach((n) => track.appendChild(n));

    index = cloneCount;

    setTransition(false);
    translateTo(translateForIndex(index));
    updateBars();

    requestAnimationFrame(() => setTransition(true));
  }

  function goTo(nextIndex) {
    if (!step) return;
    isAnimating = true;
    index = nextIndex;
    setTransition(true);
    translateTo(translateForIndex(index));
    updateBars();
  }

  function next() {
    if (isAnimating) return;
    goTo(index + 1);
  }

  function prev() {
    if (isAnimating) return;
    goTo(index - 1);
  }

  function onTransitionEnd() {
    isAnimating = false;
    if (!realCount) return;

    if (index >= cloneCount + realCount) {
      index = cloneCount;
      setTransition(false);
      translateTo(translateForIndex(index));
      updateBars();
      requestAnimationFrame(() => setTransition(true));
    }

    if (index < cloneCount) {
      index = cloneCount + realCount - 1;
      setTransition(false);
      translateTo(translateForIndex(index));
      updateBars();
      requestAnimationFrame(() => setTransition(true));
    }
  }

  function pointerDown(clientX) {
    if (!step) return;
    isDown = true;
    startX = clientX;
    startTranslate = currentTranslate;
    setTransition(false);
  }

  function pointerMove(clientX) {
    if (!isDown) return;
    const dx = clientX - startX;
    translateTo(startTranslate - dx);
  }

  function pointerUp() {
    if (!isDown) return;
    isDown = false;

    const snapped = Math.round(currentTranslate / step);
    index = snapped;

    setTransition(true);
    translateTo(translateForIndex(index));
    updateBars();
  }

  btnNext?.addEventListener("click", next);
  btnPrev?.addEventListener("click", prev);

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  track.addEventListener("transitionend", onTransitionEnd);

  viewport.addEventListener("mousedown", (e) => pointerDown(e.clientX));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX));
  window.addEventListener("mouseup", pointerUp);

  viewport.addEventListener("touchstart", (e) => pointerDown(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchmove", (e) => pointerMove(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchend", pointerUp);

  // Bars click (jump by quartile)
  bars.forEach((bar, i) => {
    bar.addEventListener("click", () => {
      if (!realCount) return;
      const t = i / Math.max(1, (bars.length - 1));
      const realIndex = Math.round(t * (realCount - 1));
      goTo(cloneCount + realIndex);
    });
  });

  let rzT = null;
  window.addEventListener("resize", () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => {
      const realIndex = realCount
        ? ((index - cloneCount) % realCount + realCount) % realCount
        : 0;

      build();

      index = cloneCount + realIndex;
      setTransition(false);
      translateTo(translateForIndex(index));
      updateBars();
      requestAnimationFrame(() => setTransition(true));
    }, 140);
  });

  window.addEventListener("load", build);
  setTimeout(build, 60);
})();



// =========================================================
// Footer: Auto Copyright Year + Subscribe Validation
// =========================================================
(function footerInit() {
  const yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form = document.getElementById("footerSubscribeForm");
  const email = document.getElementById("footerEmail");
  const msg = document.getElementById("footerMsg");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  function setMsg(text, isError = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = isError ? "rgba(200, 0, 0, .85)" : "rgba(0,0,0,.70)";
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const v = (email?.value || "").trim();
    if (!v || !isValidEmail(v)) {
      setMsg("Please enter a valid email address.", true);
      email?.focus();
      return;
    }

    setMsg("Subscribed successfully. Welcome aboard!");
    form.reset();
  });
})();



/* ========================= LEGAL TABS START ========================= */
(function () {
    const legalTabs = document.querySelectorAll(".legalTab");
    const legalPanels = document.querySelectorAll(".legalPanel");

    if (!legalTabs.length || !legalPanels.length) return;

    function activateLegalTab(tabId, shouldScroll = false) {
        const targetTab = document.querySelector(`.legalTab[data-tab="${tabId}"]`);
        const targetPanel = document.getElementById(tabId);

        if (!targetTab || !targetPanel) return;

        legalTabs.forEach((tab) => {
            tab.classList.remove("isActive");
            tab.setAttribute("aria-selected", "false");
        });

        legalPanels.forEach((panel) => {
            panel.classList.remove("show");
        });

        targetTab.classList.add("isActive");
        targetTab.setAttribute("aria-selected", "true");
        targetPanel.classList.add("show");

        if (shouldScroll) {
            const legalContent = document.querySelector(".legalContent");

            if (legalContent) {
                legalContent.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    }

    legalTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const targetId = tab.dataset.tab;

            activateLegalTab(targetId, false);
            history.replaceState(null, "", `#${targetId}`);
        });
    });

    function openTabFromHash() {
        const hashTab = window.location.hash.replace("#", "");

        if (hashTab) {
            activateLegalTab(hashTab, true);
        }
    }

    openTabFromHash();

    window.addEventListener("hashchange", openTabFromHash);
})();
/* ========================= LEGAL TABS END ========================= */


/* ========================= CONTACT FORM START ========================= */
const guestSupportForm = document.getElementById("guestSupportForm");
const contactMsg = document.getElementById("contactMsg");

if (guestSupportForm && contactMsg) {
    guestSupportForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(guestSupportForm);
        const name = formData.get("name")?.trim();
        const email = formData.get("email")?.trim();
        const topic = formData.get("topic");
        const message = formData.get("message")?.trim();

        if (!name || !email || !topic || !message) {
            contactMsg.textContent = "Please complete all required fields before sending.";
            return;
        }

        contactMsg.textContent = "Thank you. Your support request has been received.";
        guestSupportForm.reset();
    });
}
/* ========================= CONTACT FORM END ========================= */


/* ========================= CONTACT FAQ START ========================= */
const faqItems = document.querySelectorAll(".faqItem");

faqItems.forEach((item) => {
    const question = item.querySelector(".faqQuestion");

    question.addEventListener("click", () => {
        faqItems.forEach((faq) => {
            if (faq !== item) {
                faq.classList.remove("show");
            }
        });

        item.classList.toggle("show");
    });
});
/* ========================= CONTACT FAQ END ========================= */



/* ========================= BLOG FILTER START ========================= */
const blogSearchInput = document.getElementById("blogSearchInput");
const blogCatButtons = document.querySelectorAll(".blogCatBtn");
const blogCards = document.querySelectorAll(".blogCard");
const blogEmpty = document.getElementById("blogEmpty");

let activeCategory = "all";

function filterBlogPosts() {
    const searchValue = blogSearchInput ? blogSearchInput.value.trim().toLowerCase() : "";
    let visibleCount = 0;

    blogCards.forEach((card) => {
        const category = card.dataset.category;
        const title = card.dataset.title || "";
        const content = card.textContent.toLowerCase();

        const matchCategory = activeCategory === "all" || category === activeCategory;
        const matchSearch = !searchValue || title.includes(searchValue) || content.includes(searchValue);

        if (matchCategory && matchSearch) {
            card.classList.remove("isHidden");
            visibleCount++;
        } else {
            card.classList.add("isHidden");
        }
    });

    if (blogEmpty) {
        blogEmpty.textContent = visibleCount === 0 ? "No travel guide found. Try another keyword or category." : "";
    }
}

blogCatButtons.forEach((button) => {
    button.addEventListener("click", () => {
        blogCatButtons.forEach((item) => item.classList.remove("isActive"));
        button.classList.add("isActive");

        activeCategory = button.dataset.filter;
        filterBlogPosts();
    });
});

if (blogSearchInput) {
    blogSearchInput.addEventListener("input", filterBlogPosts);
}
/* ========================= BLOG FILTER END ========================= */