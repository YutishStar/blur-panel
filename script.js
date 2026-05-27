/* Hacker House Collection — interactions
 * 1. liquid-glass shine: panels track the cursor so the spotlight feels real
 * 2. parallax: the floating hero panels nudge with the cursor for depth
 * 3. light reveal: sections fade in on scroll
 * 4. nav: shrink and intensify on scroll
 */

(() => {
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- cursor-tracked shine on every .glass element ---------- */
  if (supportsHover) {
    document.querySelectorAll(".glass").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--mx", `${mx}%`);
        el.style.setProperty("--my", `${my}%`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      });
    });
  }

  /* ---------- subtle parallax on the floating hero panels ---------- */
  if (supportsHover && !reduceMotion) {
    const hero = document.querySelector(".hero");
    const panels = document.querySelectorAll(".float-stack .panel");
    if (hero && panels.length) {
      hero.addEventListener("pointermove", (e) => {
        const rect = hero.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        panels.forEach((p) => {
          const tilt = parseFloat(p.dataset.tilt || 0);
          const tx = cx * (8 + tilt * 2);
          const ty = cy * (8 + tilt * 2);
          // preserve the base rotation from CSS by composing it via custom prop
          p.style.translate = `${tx}px ${ty}px`;
        });
      });
      hero.addEventListener("pointerleave", () => {
        panels.forEach((p) => (p.style.translate = ""));
      });
    }
  }

  /* ---------- debug: flatten hero min-height for full-page screenshots ---------- */
  if (/[?&]flat=1/.test(window.location.search)) {
    const s = document.createElement("style");
    s.textContent = ".hero{min-height:0!important;padding-top:130px!important;padding-bottom:60px!important}";
    document.head.appendChild(s);
  }

  /* ---------- debug: force-scroll for screenshots ---------- */
  const scrollMatch = window.location.search.match(/[?&]scrollY=(\d+)/);
  if (scrollMatch) {
    // wait for layout, then jump
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo(0, parseInt(scrollMatch[1], 10));
    }));
  }

  /* ---------- reveal on scroll ---------- */
  const skipReveal = /[?&]reveal=off/.test(window.location.search);
  if (skipReveal) {
    document
      .querySelectorAll(".concept__card, .house, .resident, .day__schedule li, .faq__item, .apply__card")
      .forEach((t) => {
        t.classList.add("reveal", "is-in");
      });
  } else if (!reduceMotion && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(
      ".concept__card, .house, .resident, .day__schedule li, .faq__item, .apply__card"
    );
    targets.forEach((t) => t.classList.add("reveal"));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    targets.forEach((t) => io.observe(t));
  } else {
    document
      .querySelectorAll(".concept__card, .house, .resident, .day__schedule li, .faq__item, .apply__card")
      .forEach((t) => t.classList.add("is-in"));
  }

  /* ---------- nav state on scroll ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- map trail: size the comet dash to the real path length ---------- */
  const trail = document.getElementById("trail");
  if (trail && typeof trail.getTotalLength === "function") {
    const len = trail.getTotalLength();
    const head = document.createElement("style");
    head.textContent = `
      .map__trail-bright {
        stroke-dasharray: ${Math.round(len * 0.08)} ${Math.round(len)};
      }
      @keyframes trail-draw {
        0%   { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -${Math.round(len)}; }
      }
    `;
    document.head.appendChild(head);
  }
})();
