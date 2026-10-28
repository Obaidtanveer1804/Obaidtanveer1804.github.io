/* =====================================================================
   Website motion (site.html), built on Motion, the vanilla-JS build of
   Framer Motion (https://motion.dev).

   1. Intro: the nav, profile card and hero animate in once on load.
   2. Scroll: a progress bar, headings that drift as they pass, and a slow
      zoom on the pinned photo.
   3. Reveal: lists stagger in as they enter the viewport.
   4. Pointer: the profile card tilts toward the cursor, and the orange and
      lime cards' patterns follow it.

   If Motion fails to load, or the visitor prefers reduced motion, nothing
   here runs and the page stays fully visible and static.
   ===================================================================== */
(() => {
  "use strict";

  const rootElement = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (!window.Motion || prefersReducedMotion) {
    rootElement.classList.remove("js-motion");
    return;
  }

  const { animate, scroll, inView, stagger } = window.Motion;
  const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
  const SPRING_SOFT = { type: "spring", stiffness: 120, damping: 18 };
  const SPRING_SNAPPY = { type: "spring", stiffness: 260, damping: 22 };

  const select = (selector, scope = document) => scope.querySelector(selector);
  const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* Set a starting state instantly, before anything is painted visible. */
  function setInitial(elements, keyframes) {
    const targets = [].concat(elements).filter(Boolean);
    if (targets.length > 0) {
      animate(targets, keyframes, { duration: 0 });
    }
  }

  /* ---------- 1. Intro sequence ---------- */
  function playIntro() {
    const nav = select(".pill-nav");
    const card = select(".profile__card");
    const photo = select(".profile__photo img");
    const badge = select(".profile__badge");
    const arcs = selectAll(".profile__arc");
    const cardText = selectAll(".profile__name, .profile__tagline, .profile__social");
    const heroLines = selectAll(".block--hero .display span");
    const heroBlocks = selectAll(".block--hero > .lede, .block--hero > .stats");
    const highlightCards = selectAll(".highlight");

    setInitial(nav, { opacity: 0, y: -24 });
    setInitial(card, { opacity: 0, x: -48, rotate: -3, scale: 0.94 });
    setInitial(photo, { scale: 1.25 });
    setInitial(badge, { scale: 0 });
    setInitial(arcs, { opacity: 0 });
    setInitial(cardText, { opacity: 0, y: 14 });
    setInitial(heroLines, { opacity: 0, y: 70 });
    setInitial(heroBlocks, { opacity: 0, y: 24 });
    setInitial(highlightCards, { opacity: 0, y: 60, scale: 0.96 });

    /* Intro elements were hidden by the .js-motion class. Hand them to Motion
       once its starting styles have been applied (two frames later). */
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => rootElement.classList.remove("js-motion"));
    });

    animate(nav, { opacity: 1, y: 0 }, { duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO });
    animate(card, { opacity: 1, x: 0, rotate: 0, scale: 1 }, { ...SPRING_SOFT, delay: 0.15 });
    animate(photo, { scale: 1 }, { duration: 1.4, delay: 0.15, ease: EASE_OUT_EXPO });
    animate(arcs, { opacity: 1 }, { duration: 0.8, delay: stagger(0.15, { startDelay: 0.55 }) });
    animate(badge, { scale: 1 }, { ...SPRING_SNAPPY, delay: 0.8 });
    animate(cardText, { opacity: 1, y: 0 }, {
      duration: 0.6, delay: stagger(0.08, { startDelay: 0.45 }), ease: EASE_OUT_EXPO,
    });

    animate(heroLines, { opacity: 1, y: 0 }, {
      duration: 1, delay: stagger(0.12, { startDelay: 0.3 }), ease: EASE_OUT_EXPO,
    });
    animate(heroBlocks, { opacity: 1, y: 0 }, {
      duration: 0.8, delay: stagger(0.12, { startDelay: 0.55 }), ease: EASE_OUT_EXPO,
    });
    animate(highlightCards, { opacity: 1, y: 0, scale: 1 }, {
      ...SPRING_SOFT, delay: stagger(0.1, { startDelay: 0.75 }),
    });

    countUpStats();
  }

  function countUpStats() {
    selectAll("[data-count]").forEach((statElement, index) => {
      const target = Number(statElement.dataset.count);
      if (!Number.isFinite(target)) {
        return;
      }
      statElement.textContent = "+0";
      animate(0, target, {
        duration: 1.4,
        delay: 0.7 + index * 0.12,
        ease: EASE_OUT_EXPO,
        onUpdate: (latest) => {
          statElement.textContent = `+${Math.round(latest)}`;
        },
      });
    });
  }

  /* ---------- 2. Scroll-linked effects ---------- */
  function setUpScrollEffects() {
    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    progressBar.setAttribute("aria-hidden", "true");
    document.body.appendChild(progressBar);
    scroll(animate(progressBar, { scaleX: [0, 1] }, { ease: "linear" }));

    /* Pinned photo slowly zooms as you read down the page. */
    const photo = select(".profile__photo img");
    if (photo && window.matchMedia("(min-width: 921px)").matches) {
      scroll(animate(photo, { scale: [1, 1.18] }, { ease: "linear" }));
    }

    /* Grey second line of each big heading drifts sideways while it passes. */
    selectAll(".block:not(.block--hero) .display").forEach((heading) => {
      const dimLine = select(".display__dim", heading);
      if (dimLine) {
        scroll(animate(dimLine, { x: [90, -40] }, { ease: "linear" }), {
          target: heading,
          offset: ["start end", "end start"],
        });
      }
    });
  }

  /* ---------- 3. Reveal on enter ---------- */
  function setUpReveals() {
    selectAll(".block:not(.block--hero) .display").forEach((heading) => {
      const mainLine = select("span:first-child", heading);
      setInitial(mainLine, { opacity: 0, y: 50 });
      inView(heading, () => {
        animate(mainLine, { opacity: 1, y: 0 }, { duration: 0.9, ease: EASE_OUT_EXPO });
      }, { amount: 0.4 });
    });

    const revealGroups = [
      [".rows", ":scope > li", { y: 30 }],
      [".entries", ":scope > li", { y: 30 }],
      [".tools", ":scope > li", { y: 20, scale: 0.92 }],
      [".courses", ":scope > li", { y: 16 }],
      [".form", ":scope > *", { y: 20 }],
      [".subhead", null, { y: 16 }],
      [".all-skills", null, { y: 16 }],
    ];

    revealGroups.forEach(([groupSelector, childSelector, offset]) => {
      selectAll(groupSelector).forEach((group) => {
        const items = childSelector ? selectAll(childSelector, group) : [group];
        const resting = Object.fromEntries(Object.keys(offset).map((key) => [key, key === "scale" ? 1 : 0]));
        setInitial(items, { opacity: 0, ...offset });
        inView(group, () => {
          animate(items, { opacity: 1, ...resting }, {
            duration: 0.7, delay: stagger(0.06), ease: EASE_OUT_EXPO,
          });
        }, { amount: 0.12, margin: "0px 0px -8% 0px" });
      });
    });
  }

  /* ---------- 4. Pointer effects (mouse and trackpad only) ---------- */
  function setUpPointerEffects() {
    if (!hasFinePointer) {
      return;
    }

    const card = select(".profile__card");
    if (card) {
      const MAX_TILT_DEG = 7;
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
        const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
        animate(card, { rotateY: relativeX * MAX_TILT_DEG * 2, rotateX: -relativeY * MAX_TILT_DEG * 2 },
          SPRING_SNAPPY);
      });
      card.addEventListener("pointerleave", () => {
        animate(card, { rotateX: 0, rotateY: 0 }, SPRING_SOFT);
      });
    }

    selectAll(".highlight").forEach((highlightCard) => {
      const pattern = select(".highlight__pattern", highlightCard);
      const arrow = select(".highlight__arrow", highlightCard);
      highlightCard.addEventListener("pointermove", (event) => {
        const rect = highlightCard.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
        const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
        animate(pattern, { x: relativeX * 36, y: relativeY * 24 }, SPRING_SOFT);
        animate(arrow, { x: relativeX * 10, y: relativeY * 10 }, SPRING_SNAPPY);
      });
      highlightCard.addEventListener("pointerleave", () => {
        animate([pattern, arrow], { x: 0, y: 0 }, SPRING_SOFT);
      });
    });
  }

  try {
    window.__siteMotionStarted = true;
    playIntro();
    setUpScrollEffects();
    setUpReveals();
    setUpPointerEffects();
  } catch (error) {
    /* Never leave content hidden because an animation failed. */
    rootElement.classList.remove("js-motion");
    selectAll("[style*='opacity']").forEach((element) => {
      element.style.opacity = "";
      element.style.transform = "";
    });
    console.error("site-motion:", error);
  }
})();
