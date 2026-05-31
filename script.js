/* Cracked Hacker House — interactions
 *
 * Map: Maplibre GL JS, Esri satellite tiles (no token required).
 * Inspector: press D to take manual control. Sliders drive bearing /
 *   pitch / zoom. "Record view" snapshots the live values.
 */

/* =========================================================
   SITE LOADER — counts 0% → 100% in the center of the screen,
   then fades out. Exposes window.__siteLoaded as a promise that
   the map intro awaits so the iris reveal can't fire underneath.
   ========================================================= */
window.__siteLoaded = (() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el  = document.getElementById("site-loader");
  const num = el?.querySelector("[data-loader-num]");
  if (!el || !num) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      num.textContent = "100%";
      el.classList.add("is-done");
      // Resolve at the *start* of the fade-out, not after it finishes —
      // the iris reveal needs to fire underneath the loader as it fades,
      // otherwise the hero shows its black background in the gap.
      resolve();
      el.addEventListener("transitionend", () => {
        el.remove();
      }, { once: true });
    };

    if (reduceMotion) {
      requestAnimationFrame(finish);
      return;
    }

    const duration = 1500;            // total count time — keep it fast
    const t0 = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 2);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      num.textContent = Math.round(easeOut(t) * 100) + "%";
      if (t < 1) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);
  });
})();

(() => {
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- inspector shared state ---------- */
  const inspector = { on: false, map: null, el: null, place: null, raf: 0, flying: false, orbitBearing: 0 };

  /* ---------- cohort locations ---------- */
  const COHORTS = [
    {
      id: "00",
      badge: "Cohort 0, Bangalore, India",
      title: "CRACKED HACKER HOUSE",
      sub:   'Cohort C0 · <span class="house-marker__sub-status">Shipped!</span>',
      loc:   "Bangalore, India",
      cam:    { lon: 77.67948, lat: 12.9662, zoom: 12.8, pitch: 45, bearing: 118.7 },
      // anchor = where the house dot pins to the earth. Independent of `cam`,
      // so dragging the camera (D → free-look) slides the dot across the
      // frame without moving it geographically. Tweak this to reposition the
      // dot; tweak `cam` to reframe the satellite view.
      anchor: { lon: 77.64905, lat: 12.95481 },
      apps:  { label: "applications closed", range: "Cohort 0 · shipped", status: "closed" },
      heroTitle: { a: "Where it",   b: "<em>all started.</em>" },
      heroDesc:  "After my tweet on X, I got on a call with over 50+ people and found the 10 most cracked builders. Got a sponsor for Diet Coke (super important). Made a WhatsApp group, added them all, found and booked the villa in Bangalore — 4 bedrooms, no AC, a big stage, a big lawn, and an awesome sunroof. After 30 days, 2 new co-founding startups came out, a Diet Coke tower that reached the ceiling, and someone raised $1.5M. Sleepless nights, unlimited fun, unforgettable friends, and insane progress.",
      actions: [
        { label: "Shipped!", variant: "ghost" },
      ],
      sponsors: [
        { tagline: "Our unlimited diet coke sponsor", logo: "sponsors/cohort-00/diet-coke.svg", alt: "team.shiksha", size: "lg", url: "https://team.shiksha/" },
      ],
      photos: [
        "villas/cohort-00/IMG_1115.jpg",
        "villas/cohort-00/IMG_1118.jpg",
        "villas/cohort-00/IMG_1120.jpg",
        "villas/cohort-00/IMG_0150_Original.jpg",
        "villas/cohort-00/IMG_0723_Original.jpg",
        "villas/cohort-00/image.png",
        "villas/cohort-00/image copy.png",
        "villas/cohort-00/image copy 2.png",
      ],
      stats: [
        { value: "10", label: "cracked" },
        { value: "30", label: "days" },
        { value: "$1.5M", label: "raised" },
      ],
      blurb: "Where it all started. 10 cracked builders, 4 rooms, no AC, and a Diet Coke tower that touched the ceiling.",
    },
    {
      id: "01",
      badge: 'Cohort 1, Da Nang, Vietnam <span class="hero__cohort-sep">|</span> <span class="hero__cohort-status">Spots Filled!</span>',
      title: "CRACKED HACKER HOUSE",
      sub:   "Cohort 01 · next stop",
      loc:   "Da Nang, Vietnam",
      cam:    { lon: 108.2557, lat: 16.07573, zoom: 12.8, pitch: 45, bearing: 118 },
      anchor: { lon: 108.23098, lat: 16.06304 },
      apps:  { label: "applications filled!", range: "The house starts 1st July", status: "filled" },
      heroTitle: { a: "Are you",   b: "<em>Cracked</em> enough?" },
      heroDesc:  "A house full of builders, creators, hackers, and ambitious misfits living together for thirty days.",
      actions: [
        { label: "Filled!", variant: "ghost" },
        { label: "Apply to next cohort", variant: "primary", arrow: true, cohortJump: 2 },
      ],
      sponsors: [
        { tagline: "Our content sponsors",   logo: "sponsors/sponsor-1.png", alt: "Team1",    size: "sm", url: "https://x.com/Team1VN" },
        { tagline: "Our credits sponsor",    logo: "sponsors/razorpay.png",  alt: "Razorpay", size: "md", url: "https://razorpay.com/" },
      ],
      photos: [
        "villas/cohort-01/HIx-N74aIAAgNFg.jpeg",
        "villas/cohort-01/HIx-N8ebcAA0Hr_.jpeg",
        "villas/cohort-01/HIx-N8iawAAzFm1.jpeg",
        "villas/cohort-01/HIx-N8paMAAHUK_.jpeg",
      ],
      stats: [
        { value: "14",   label: "cracked" },
        { value: "30",   label: "days" },
        { value: "$5M+", label: "made by builders" },
      ],
      blurb: "Sleep is optional in this house, but shipping and having fun is undeniable.",
    },
    {
      id: "02",
      badge: "Cohort 2, Canggu, Bali",
      title: "CRACKED HACKER HOUSE",
      sub:   "Cohort 02 · Starts 15th Aug!",
      loc:   "Canggu, Bali",
      cam:    { lon: 115.18879, lat: -8.65997, zoom: 12.8, pitch: 45, bearing: 131.2 },
      anchor: { lon: 115.15130, lat: -8.67235 },
      apps:  { label: "applications open", range: "1st June – 20th June", status: "open" },
      ctaLabel: "Apply C2",
      heroTitle: { a: "30 days.", b: "10 cracked fellows.", c: "<em>Bali.</em>" },
      heroDesc:  "Starts 15th August. $500 buys a bed, a desk, and 30 days next to nine cracked builders in a Canggu villa. Compute credits, founder dinners, sponsor intros, scooters at the gate, and demo days that end in the ocean.",
      actions: [
        { label: "Apply C2", variant: "primary", arrow: true, href: "https://tally.so/r/A7yDE0" },
      ],
      sponsors: [],
      photos: ["villas/cohort-02/01.png", "villas/cohort-02/02.png", "villas/cohort-02/03.png", "villas/cohort-02/04.png"],
      stats: [
        { value: "10", label: "builders" },
        { value: "30", label: "days" },
        { value: "6",  label: "rooms" },
      ],
      blurb: "Ten cracked builders living ten meters apart. Compute credits to ship faster, founder dinners on the rooftop, sponsor intros, and demo days that end in the ocean.",
    },
  ];
  let cohortIdx = 1; // default landing cohort: Da Nang, Vietnam (01)

  /* ---------- map init ---------- */
  const mapEl = document.getElementById("map");
  const cfg   = window.CONFIG || {};
  // The house dot pins to the cohort's `anchor` (falling back to `cam` if a
  // cohort hasn't declared one). This is INDEPENDENT of the camera framing:
  // identical on initial load and every nav, so the dot never jumps. (The
  // legacy cfg.FOCUS_LOCATION anchor is deliberately ignored — stale Da Nang
  // data from the old MapKit build.)
  const landingCohort = COHORTS[cohortIdx];
  const landingAnchor = landingCohort.anchor || landingCohort.cam;
  const focus = { name: landingCohort.loc, lon: landingAnchor.lon, lat: landingAnchor.lat };

  if (mapEl && window.maplibregl) {
    // Don't let a WebGL / tile failure kill the rest of the script.
    try { initMap(mapEl, focus); }
    catch (err) { console.warn("map init failed:", err); }
  }

  /* =========================================================
     MAPLIBRE GL — Esri satellite tiles, focused on Da Nang
     ========================================================= */
  function initMap(el, place) {
    const heroMapEl = el.parentElement;
    if (heroMapEl) heroMapEl.style.clipPath = "circle(0px at 50% 50%)";

    // FINAL is the target view — derived from the landing cohort's recorded
    // camera. Use D → "Record view" to recapture and update COHORTS[].cam.
    const FINAL = { ...COHORTS[cohortIdx].cam };
    const START = { lon: place.lon, lat: place.lat, zoom: 10.0, pitch: 5,  bearing: 95  };

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "© Esri, Maxar, Earthstar Geographics"
          }
        },
        layers: [{ id: "satellite", type: "raster", source: "satellite" }]
      },
      center:  [START.lon, START.lat],
      zoom:    START.zoom,
      pitch:   START.pitch,
      bearing: START.bearing,
      interactive:        false,
      attributionControl: true,
      pitchWithRotate:    false,
    });

    el.style.pointerEvents = "none";
    inspector.map   = map;
    inspector.el    = el;
    inspector.place = place;

    const fireIris = () => {
      const hm = document.getElementById("house-marker");
      let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      if (hm && !hm.hidden && hm.style.transform) {
        const dm = new DOMMatrix(hm.style.transform);
        cx = dm.m41; cy = dm.m42;
      }
      triggerIrisReveal(cx, cy);
    };

    map.on("load", () => {
      startMarkerProjection(map, place, el);

      const loaded = window.__siteLoaded || Promise.resolve();

      if (reduceMotion) {
        map.jumpTo({ center: [FINAL.lon, FINAL.lat], zoom: FINAL.zoom, pitch: FINAL.pitch, bearing: FINAL.bearing });
        document.getElementById("house-marker")?.classList.add("is-landed");
        loaded.then(fireIris);
        return;
      }

      // Fly the camera in *behind* the loader so the hero is already at
      // (or very near) its final view by the time the loader hands off —
      // no gap of black hero between the loader fade and the iris.
      map.flyTo({
        center:   [FINAL.lon, FINAL.lat],
        zoom:     FINAL.zoom,
        pitch:    FINAL.pitch,
        bearing:  FINAL.bearing,
        duration: 1800,
        easing:   (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      });
      map.once("moveend", () => {
        document.getElementById("house-marker")?.classList.add("is-landed");
        startSlowOrbit(map, FINAL);
      });

      // The loader resolves the moment its fade begins, so the iris
      // ripple starts immediately underneath it — they cross-fade
      // instead of leaving a black header between them.
      loaded.then(fireIris);
    });
  }

  /* Project the Da Nang anchor to screen space every frame so the
     floating HACKER HOUSE marker tracks the camera. */
  function startMarkerProjection(map, place, mapEl) {
    const marker = document.getElementById("house-marker");
    if (!marker) return;

    const update = () => {
      const pt   = map.project([place.lon, place.lat]);
      const rect = mapEl.getBoundingClientRect();
      if (pt && rect) {
        marker.hidden = false;
        marker.style.transform =
          `translate3d(${rect.left + pt.x}px, ${rect.top + pt.y}px, 0)`;
      } else {
        marker.hidden = true;
      }
      requestAnimationFrame(update);
    };
    update();
  }

  /* After the fly-in, keep the camera very slowly rotating.
     About one revolution every two hours — enough to feel alive. */
  function startSlowOrbit(map, final) {
    const degPerSec = 0.04;
    let last = performance.now();
    inspector.orbitBearing = final.bearing;

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!inspector.on && !inspector.flying) {
        inspector.orbitBearing = (inspector.orbitBearing + degPerSec * dt) % 360;
        map.setBearing(inspector.orbitBearing);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* =========================================================
     COHORT NAV — left/right arrows on the marker box fly the
     camera between Bangalore (00) → Da Nang (01) → Canggu, Bali (02)
     ========================================================= */
  /* Sync all per-cohort DOM (marker box, hero title/desc/actions, badge,
     apps label/range, dock dot status, expand panel) to a cohort. Runs on
     initial load *and* on every nav, so the static HTML never has to be
     hand-kept in sync with the default cohort. */
  function applyCohortContent(c) {
    const titleEl = document.querySelector("[data-marker-title]");
    const subEl   = document.querySelector("[data-marker-sub]");
    const locEl   = document.querySelector("[data-marker-loc]");
    const badgeEl = document.querySelector("[data-cohort-label]");
    const appsLbl = document.querySelector("[data-apps-label]");
    const appsRng = document.querySelector("[data-apps-range]");
    if (titleEl) titleEl.textContent = c.title;
    if (subEl)   subEl.innerHTML     = c.sub;
    if (locEl)   locEl.textContent   = c.loc;
    if (badgeEl) badgeEl.innerHTML   = c.badge;
    if (appsLbl && c.apps) appsLbl.textContent = c.apps.label;
    if (appsRng && c.apps) appsRng.textContent = c.apps.range;

    // Hero title + description vary per cohort. Title is split across spans
    // (each line is its own block via `.hero__title span { display: block }`).
    // c.heroTitle accepts an optional third line `c` for cohorts that want a
    // stat-style stack like "30 days. / 10 cracked fellows. / Bali."
    const heroTitleEl = document.querySelector("[data-hero-title]");
    const heroDescEl  = document.querySelector("[data-hero-desc]");
    if (heroTitleEl && c.heroTitle) {
      // Each line can carry its own <em>...</em> markup — the renderer doesn't
      // auto-italicise. Lets us put the brand word in serif italic while the
      // rest stays in Geist sans.
      const lines = [c.heroTitle.a, c.heroTitle.b, c.heroTitle.c]
        .filter((l) => l != null)
        .map((l) => `<span>${l}</span>`)
        .join("");
      heroTitleEl.innerHTML = lines;
    }
    if (heroDescEl && c.heroDesc) heroDescEl.innerHTML = c.heroDesc;

    // Dock CTA — when the active cohort is "02" (applications open), the
    // bottom-strip Apply button opens the Tally form in a new tab. On every
    // other cohort it acts as a jump to the cohort-02 view so the user can
    // read the pitch before applying.
    const dockCta = document.querySelector("[data-dock-cta]");
    if (dockCta) {
      if (c.id === "02") {
        dockCta.href   = "https://tally.so/r/A7yDE0";
        dockCta.target = "_blank";
        dockCta.rel    = "noopener noreferrer";
        dockCta.removeAttribute("data-cohort-jump");
      } else {
        dockCta.href   = "#cohort-2";
        dockCta.removeAttribute("target");
        dockCta.removeAttribute("rel");
        dockCta.dataset.cohortJump = "2";
      }
    }

    // Actions row — rebuild from c.actions[] so each cohort can declare
    // its own primary CTA, ghost status pill, and/or secondary buttons.
    const actionsEl = document.querySelector("[data-hero-actions]");
    if (actionsEl) {
      const actions = c.actions || [{ label: "Apply", variant: "primary", arrow: true, href: "#apply" }];
      actionsEl.innerHTML = actions
        .map((a) => {
          const cls   = a.variant === "ghost" ? "hero__apply hero__apply--ghost" : "hero__apply";
          const arrow = a.arrow ? '<span class="hero__apply-arrow" aria-hidden="true">→</span>' : "";
          const href  = a.href || "#apply";
          const jump  = a.cohortJump !== undefined ? ` data-cohort-jump="${a.cohortJump}"` : "";
          // Absolute http(s) URLs open in a new tab — used for application
          // form links so the user doesn't lose their place on the site.
          const ext   = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `<a href="${href}" class="${cls}"${jump}${ext}><span>${a.label}</span>${arrow}</a>`;
        })
        .join("");
    }

    // Sponsors — rebuild rows from c.sponsors[]. Hides the whole block
    // (label + rows) when a cohort has no sponsors declared.
    const sponsorsEl    = document.querySelector("[data-hero-sponsors]");
    const sponsorsLabel = document.querySelector("[data-hero-sponsors-label]");
    if (sponsorsEl) {
      const list = c.sponsors || [];
      // Clear all rows but keep the label element.
      sponsorsEl.querySelectorAll(".hero__sponsors-row").forEach((row) => row.remove());

      if (list.length === 0) {
        sponsorsEl.style.display = "none";
      } else {
        sponsorsEl.style.display = "";
        if (sponsorsLabel) sponsorsLabel.style.display = "";
        list.forEach((s) => {
          const row = document.createElement("span");
          row.className = "hero__sponsors-row";
          const tagline = document.createElement("span");
          tagline.className = "hero__sponsors-tagline";
          tagline.innerHTML = `${s.tagline} &mdash;`;
          const img = document.createElement("img");
          const sizeCls = s.size === "sm" ? " hero__sponsor-logo--sm"
                        : s.size === "lg" ? " hero__sponsor-logo--lg" : "";
          img.className = "hero__sponsor-logo" + sizeCls;
          img.src = s.logo;
          img.alt = s.alt || "";
          row.appendChild(tagline);
          if (s.url) {
            const link = document.createElement("a");
            link.className = "hero__sponsor-link";
            link.href   = s.url;
            link.target = "_blank";
            link.rel    = "noopener noreferrer";
            link.setAttribute("aria-label", s.alt || s.tagline);
            link.appendChild(img);
            row.appendChild(link);
          } else {
            row.appendChild(img);
          }
          sponsorsEl.appendChild(row);
        });
      }
    }

    // Bottom-dock apply CTA — static across all cohorts.
    const dockCtaEl = document.querySelector("[data-dock-cta-label]");
    if (dockCtaEl) dockCtaEl.textContent = "Apply C2";

    // Dock dot color is driven by [data-apps-status] on body — CSS swaps
    // the dot fill + pulse halo from green (open) → red (filled) → grey (closed).
    if (c.apps?.status) document.body.dataset.appsStatus = c.apps.status;

    renderExpand(c);
  }

  function setCohort(nextIdx) {
    if (!inspector.map) return;
    if (nextIdx < 0 || nextIdx >= COHORTS.length) return;
    if (nextIdx === cohortIdx) return;

    cohortIdx = nextIdx;
    const c = COHORTS[cohortIdx];

    applyCohortContent(c);

    // Re-trigger the 2s appear animation on the hero pane content so the
    // copy fades back in over the same window as the map flyTo, instead of
    // snapping while the camera is still drifting.
    const pane = document.querySelector(".hero__pane");
    if (pane) {
      pane.classList.remove("is-switching");
      // force reflow so the animation restarts even when class is re-added
      void pane.offsetWidth;
      pane.classList.add("is-switching");
    }

    // move the dot anchor so the marker rides along with the new city.
    // Uses the cohort's fixed `anchor` (not the camera center) so the dot
    // lands in the same composed spot it was authored at.
    if (inspector.place) {
      const a = c.anchor || c.cam;
      inspector.place.lon  = a.lon;
      inspector.place.lat  = a.lat;
      inspector.place.name = c.loc;
    }

    // pause the slow orbit so it stops fighting the flyTo bearing
    inspector.flying = true;

    inspector.map.flyTo({
      center:  [c.cam.lon, c.cam.lat],
      zoom:    c.cam.zoom,
      pitch:   c.cam.pitch,
      bearing: c.cam.bearing,
      duration: 4200,
      essential: true,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    });

    inspector.map.once("moveend", () => {
      inspector.flying = false;
      inspector.orbitBearing = c.cam.bearing;
    });

    updateNavButtons();
  }

  function updateNavButtons() {
    const prev = document.querySelector("[data-cohort-prev]");
    const next = document.querySelector("[data-cohort-next]");
    if (prev) prev.disabled = cohortIdx <= 0;
    if (next) next.disabled = cohortIdx >= COHORTS.length - 1;

    const prevLbl = document.querySelector("[data-prev-label]");
    const nextLbl = document.querySelector("[data-next-label]");
    const prevC = COHORTS[cohortIdx - 1];
    const nextC = COHORTS[cohortIdx + 1];
    if (prevLbl) prevLbl.textContent = prevC ? `C${parseInt(prevC.id, 10)}` : "";
    if (nextLbl) nextLbl.textContent = nextC ? `C${parseInt(nextC.id, 10)}` : "";
  }

  function renderExpand(c) {
    const photosEl = document.querySelector("[data-marker-photos]");
    const statsEl  = document.querySelector("[data-marker-stats]");
    const blurbEl  = document.querySelector("[data-marker-blurb]");

    if (photosEl) {
      photosEl.innerHTML = "";
      (c.photos || []).forEach((src) => {
        const tile = document.createElement("span");
        tile.className = "house-marker__photo";
        tile.style.backgroundImage = `url('${src}')`;
        photosEl.appendChild(tile);
      });
    }

    if (statsEl) {
      statsEl.innerHTML = "";
      (c.stats || []).forEach(({ value, label }) => {
        const cell = document.createElement("div");
        cell.className = "house-marker__stat";
        const v = document.createElement("span");
        v.className = "house-marker__stat-value";
        v.textContent = value;
        const l = document.createElement("span");
        l.className = "house-marker__stat-label";
        l.textContent = label;
        cell.appendChild(v);
        cell.appendChild(l);
        statsEl.appendChild(cell);
      });
    }

    if (blurbEl) blurbEl.textContent = c.blurb || "";
  }

  const prevBtn = document.querySelector("[data-cohort-prev]");
  const nextBtn = document.querySelector("[data-cohort-next]");
  if (prevBtn) prevBtn.addEventListener("click", () => setCohort(cohortIdx - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setCohort(cohortIdx + 1));

  // Cohort-jump links — any element with [data-cohort-jump="<n>"] is treated
  // as an in-page navigation to that cohort instead of an anchor follow.
  document.addEventListener("click", (e) => {
    const jumpEl = e.target.closest("[data-cohort-jump]");
    if (!jumpEl) return;
    const idx = parseInt(jumpEl.dataset.cohortJump, 10);
    if (Number.isNaN(idx)) return;
    e.preventDefault();
    setCohort(idx);
  });

  updateNavButtons();
  applyCohortContent(COHORTS[cohortIdx]);

  /* =========================================================
     UI bits — cursor shine, scroll reveal, nav state
     ========================================================= */
  if (supportsHover && !reduceMotion) {
    document.querySelectorAll(".hero__pane").forEach((pane) => {
      pane.addEventListener("pointermove", (e) => {
        const r = pane.getBoundingClientRect();
        pane.style.setProperty("--mx", `${((e.clientX - r.left) / r.width)  * 100}%`);
        pane.style.setProperty("--my", `${((e.clientY - r.top)  / r.height) * 100}%`);
      });
      pane.addEventListener("pointerleave", () => {
        pane.style.removeProperty("--mx");
        pane.style.removeProperty("--my");
      });
    });
  }

  const revealTargets = document.querySelectorAll(".poster, .faq__item");
  if (!reduceMotion && "IntersectionObserver" in window) {
    revealTargets.forEach((t) => t.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealTargets.forEach((t) => io.observe(t));
  }

  /* =========================================================
     Camera inspector — press D to take manual control
     ========================================================= */
  window.addEventListener("keydown", (e) => {
    if (e.key !== "d" && e.key !== "D") return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    toggleInspector();
  });

  function toggleInspector() {
    if (!inspector.map) return;
    inspector.on = !inspector.on;

    const map = inspector.map;
    if (inspector.on) {
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.dragRotate.enable();
      map.touchPitch.enable();
    } else {
      map.scrollZoom.disable();
      map.dragPan.disable();
      map.dragRotate.disable();
      map.touchPitch.disable();
    }
    if (inspector.el) {
      inspector.el.style.pointerEvents = inspector.on ? "auto" : "none";
    }

    const box = document.getElementById("cam-inspect");
    if (box) box.hidden = !inspector.on;

    if (inspector.on) {
      startInspectorReadout();
      initInspectorSliders();
      initPinDropper();
      initGrabView();
    } else {
      cancelAnimationFrame(inspector.raf);
      stopPinDrop();
      disarmGrab();
    }
  }

  /* =========================================================
     Record View
     ========================================================= */
  function initGrabView() {
    const btn  = document.getElementById("cam-grab-btn");
    const copy = document.getElementById("cam-grab-copy");
    if (!btn) return;
    btn.onclick = () => {
      if (inspector.grabRecording) stopRecording();
      else startRecording();
    };
    if (copy) {
      copy.onclick = async () => {
        const code = document.getElementById("cam-grab-code");
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent);
          copy.textContent = "copied ✓";
          setTimeout(() => { copy.textContent = "copy"; }, 1400);
        } catch { /* clipboard blocked */ }
      };
    }
  }

  function startRecording() {
    inspector.grabRecording = true;
    const result = document.getElementById("cam-grab-result");
    if (result) result.hidden = true;
    const btn = document.getElementById("cam-grab-btn");
    if (btn) {
      btn.classList.add("is-recording");
      btn.querySelector(".cam-grab-btn__label").textContent = "End";
    }
  }

  function stopRecording() {
    inspector.grabRecording = false;
    const btn = document.getElementById("cam-grab-btn");
    if (btn) {
      btn.classList.remove("is-recording");
      btn.querySelector(".cam-grab-btn__label").textContent = "Record view";
    }

    const map     = inspector.map;
    const center  = map.getCenter();
    const lat     = +(center.lat.toFixed(5));
    const lon     = +(center.lng.toFixed(5));
    const zoom    = +(map.getZoom().toFixed(2));
    const pitch   = +(map.getPitch().toFixed(1));
    const heading = +((((map.getBearing() % 360) + 360) % 360).toFixed(1));

    // Emit the FULL state — camera + dot anchor — in the exact shape of a
    // cohort entry, so it can be pasted straight into COHORTS[]. The anchor
    // is the dot's fixed earth-point (unchanged by camera drags), so the
    // composition reproduces exactly on reload.
    const place   = inspector.place || focus;
    const aLon    = +(place.lon.toFixed(5));
    const aLat    = +(place.lat.toFixed(5));
    const snippet =
      `cam: { lon: ${lon}, lat: ${lat}, zoom: ${zoom}, pitch: ${pitch}, bearing: ${heading} }, ` +
      `anchor: { lon: ${aLon}, lat: ${aLat} }`;
    const code    = document.getElementById("cam-grab-code");
    const result  = document.getElementById("cam-grab-result");
    if (code)   code.textContent = snippet;
    if (result) result.hidden    = false;
  }

  function disarmGrab() {
    if (inspector.grabRecording) stopRecording();
  }

  /* =========================================================
     Pin dropper
     ========================================================= */
  function initPinDropper() {
    if (!inspector.map) return;
    const btn = document.getElementById("cam-pin-btn");
    if (!btn) return;
    if (!inspector.pins) inspector.pins = [];
    if (!inspector.pinEscBound) {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && inspector.dropping) stopPinDrop();
      });
      inspector.pinEscBound = true;
    }
    btn.onclick = () => {
      if (inspector.dropping) stopPinDrop();
      else startPinDrop();
    };
    renderPinList();
  }

  function startPinDrop() {
    if (!inspector.map || inspector.dropping) return;
    inspector.dropping = true;
    const btn = document.getElementById("cam-pin-btn");
    const lbl = btn?.querySelector(".cam-pin-btn__label");
    if (btn) btn.classList.add("is-armed");
    if (lbl) lbl.textContent = "click on the scene…";
    if (inspector.map) inspector.map.getCanvas().style.cursor = "crosshair";

    const handler = (e) => {
      if (!inspector.dropping) return;
      addPin(e.lngLat.lng, e.lngLat.lat);
      stopPinDrop();
    };
    inspector.pinClickHandler = handler;
    inspector.map.once("click", handler);
  }

  function stopPinDrop() {
    if (!inspector.dropping) return;
    inspector.dropping = false;
    const btn = document.getElementById("cam-pin-btn");
    const lbl = btn?.querySelector(".cam-pin-btn__label");
    if (btn) btn.classList.remove("is-armed");
    if (lbl) lbl.textContent = "+ Create pin point";
    if (inspector.map) inspector.map.getCanvas().style.cursor = "";
    if (inspector.pinClickHandler) {
      inspector.map.off("click", inspector.pinClickHandler);
      inspector.pinClickHandler = null;
    }
  }

  function addPin(lon, lat) {
    const label = pinLabel(inspector.pins.length);
    const el    = document.createElement("div");
    el.className   = "cam-pin-dot";
    el.textContent = label;
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lon, lat])
      .addTo(inspector.map);
    inspector.pins.push({ label, lon, lat, marker });
    renderPinList();
  }

  function pinLabel(idx) {
    let s = "", n = idx;
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return s;
  }

  function renderPinList() {
    const list = document.getElementById("cam-pin-list");
    if (!list) return;
    list.innerHTML = "";
    inspector.pins.forEach((pin, i) => {
      const li = document.createElement("li");
      li.className = "cam-pin-row";

      const name = document.createElement("span");
      name.className = "cam-pin-row__name";
      name.textContent = pin.label;

      const coords = document.createElement("span");
      coords.className = "cam-pin-row__coords";
      coords.title = "click to copy";
      const copyText = `${pin.label}: lon ${pin.lon.toFixed(6)}, lat ${pin.lat.toFixed(6)}`;
      coords.textContent = `${pin.lon.toFixed(5)}, ${pin.lat.toFixed(5)}`;
      coords.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(copyText);
          coords.classList.add("is-copied");
          const prev = coords.textContent;
          coords.textContent = "copied ✓";
          setTimeout(() => {
            coords.classList.remove("is-copied");
            coords.textContent = prev;
          }, 900);
        } catch { /* blocked */ }
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "cam-pin-row__del";
      del.setAttribute("aria-label", `delete pin ${pin.label}`);
      del.textContent = "\xd7";
      del.addEventListener("click", () => removePin(i));

      li.append(name, coords, del);
      list.appendChild(li);
    });
  }

  function removePin(idx) {
    const pin = inspector.pins[idx];
    if (!pin) return;
    pin.marker.remove();
    inspector.pins.splice(idx, 1);
    inspector.pins.forEach((p, i) => { p.label = pinLabel(i); });
    renderPinList();
  }

  /* =========================================================
     Slider control — heading / pitch / distance
     ========================================================= */
  function initInspectorSliders() {
    if (!inspector.map) return;
    const map = inspector.map;

    const h  = document.getElementById("cam-h");
    const p  = document.getElementById("cam-p");
    const r  = document.getElementById("cam-r");
    const hv = document.getElementById("cam-h-val");
    const pv = document.getElementById("cam-p-val");
    const rv = document.getElementById("cam-r-val");
    if (!h || !p || !r) return;

    // Maplibre ranges: bearing 0–360, pitch 0–85, zoom 8–18
    h.min = "0";   h.max = "360"; h.step = "0.5";
    p.min = "0";   p.max = "85";  p.step = "0.5";
    r.min = "8";   r.max = "18";  r.step = "0.1";

    h.value = String(((map.getBearing() % 360) + 360) % 360);
    p.value = String(map.getPitch().toFixed(1));
    r.value = String(map.getZoom().toFixed(1));

    const apply = () => {
      const hdg  = parseFloat(h.value);
      const ptch = parseFloat(p.value);
      const zm   = parseFloat(r.value);
      if (hv) hv.textContent = `${hdg.toFixed(0)}\xb0`;
      if (pv) pv.textContent = `${ptch.toFixed(0)}\xb0`;
      if (rv) rv.textContent = `z${zm.toFixed(1)}`;
      map.setBearing(hdg);
      map.setPitch(ptch);
      map.setZoom(zm);
    };

    h.oninput = apply;
    p.oninput = apply;
    r.oninput = apply;

    if (hv) hv.textContent = `${parseFloat(h.value).toFixed(0)}\xb0`;
    if (pv) pv.textContent = `${parseFloat(p.value).toFixed(0)}\xb0`;
    if (rv) rv.textContent = `z${parseFloat(r.value).toFixed(1)}`;
  }

  function startInspectorReadout() {
    const body = document.getElementById("cam-inspect-body");
    if (!body) return;
    const map = inspector.map;

    const tick = () => {
      const place   = inspector.place || focus;
      const center  = map.getCenter();
      const lat     = center.lat;
      const lon     = center.lng;
      const zoom    = map.getZoom().toFixed(2);
      const pitch   = map.getPitch().toFixed(1);
      const heading = (((map.getBearing() % 360) + 360) % 360).toFixed(1);
      const dLon    = lon - place.lon;
      const dLat    = lat - place.lat;
      body.textContent =
        `center   lat ${lat.toFixed(5)}, lon ${lon.toFixed(5)}\n` +
        `zoom     ${zoom}\n` +
        `pitch    ${pitch}\xb0\n` +
        `bearing  ${heading}\xb0\n` +
        `\n` +
        `dot      lat ${place.lat.toFixed(5)}, lon ${place.lon.toFixed(5)}\n` +
        `offset   dLon ${dLon >= 0 ? "+" : ""}${dLon.toFixed(4)},` +
        ` dLat ${dLat >= 0 ? "+" : ""}${dLat.toFixed(4)}`;
      inspector.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  /* =========================================================
     Iris reveal
     ========================================================= */
  function triggerIrisReveal(cx, cy) {
    const target = document.querySelector(".hero__map");
    if (!target) return;

    if (reduceMotion) {
      target.style.clipPath = "none";
      return;
    }

    const rx = (cx != null && isFinite(cx)) ? cx : window.innerWidth  / 2;
    const ry = (cy != null && isFinite(cy)) ? cy : window.innerHeight / 2;

    const maxR = Math.ceil(Math.max(
      Math.hypot(rx,                     ry),
      Math.hypot(window.innerWidth - rx, ry),
      Math.hypot(rx,                     window.innerHeight - ry),
      Math.hypot(window.innerWidth - rx, window.innerHeight - ry)
    )) + 20;

    target.style.transition = "none";
    target.style.clipPath   = `circle(0px at ${rx}px ${ry}px)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.style.transition = "clip-path 1400ms cubic-bezier(0.16, 1, 0.3, 1)";
        target.style.clipPath   = `circle(${maxR}px at ${rx}px ${ry}px)`;
      });
    });

    target.addEventListener("transitionend", () => {
      target.style.clipPath   = "none";
      target.style.transition = "";
    }, { once: true });
  }

  /* =========================================================
     Nav scroll state + hero bottom clip
     ---
     Skipped on the one-pager (body.page--single) — the page no longer
     scrolls and the hero must fill the panel edge-to-edge with no
     rounded inset.
     ========================================================= */
  const isOnePager = document.body.classList.contains("page--single");
  const nav    = document.querySelector(".nav");
  const heroEl = document.querySelector(".hero");
  if (nav && !heroEl) {
    nav.classList.add("is-scrolled");
  } else if (!isOnePager && (nav || heroEl)) {
    const onScroll = () => {
      const vh = window.innerHeight;
      const s  = window.scrollY;
      if (nav)    nav.classList.toggle("is-scrolled", s > vh * 0.85);
      if (heroEl) {
        const pct = Math.min(85, 3 + (s / vh) * 100);
        heroEl.style.clipPath =
          `inset(0 0 ${pct.toFixed(2)}% 0 round 0 0 44px 44px)`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();

/* =========================================================
   FAQ TERMINAL — its own IIFE so a map / WebGL failure
   above can't keep the FAQ animation from running.
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  setupTerminal();

  function setupTerminal() {
    const terminal = document.querySelector("[data-terminal]");
    if (!terminal) return;
    const screen   = terminal.querySelector("[data-terminal-screen]");
    const src      = terminal.querySelector("[data-entries]");
    if (!screen || !src) return;

    const entries = Array.from(src.querySelectorAll("li")).map((li) => ({
      cmd: li.dataset.cmd || "",
      out: (li.querySelector(".t-src-a")?.textContent || "").trim(),
    }));
    if (!entries.length) return;

    terminal.classList.add("is-live");

    let skipped = false;
    let started = false;
    let activeCaret = null;

    function makePrompt() {
      const p = document.createElement("div");
      p.className = "terminal__prompt";
      p.innerHTML =
        '<span class="t-user">cracked</span>' +
        '<span class="t-at">@</span>' +
        '<span class="t-host">hackerhouse</span> ' +
        '<span class="t-path">~/faq</span> ' +
        '<span class="t-sigil">$</span>' +
        '<span class="t-input"></span>' +
        '<span class="t-caret" aria-hidden="true"></span>';
      screen.appendChild(p);
      activeCaret = p.querySelector(".t-caret");
      return p;
    }

    function makeOutput(text) {
      const o = document.createElement("div");
      o.className = "terminal__out";
      o.textContent = text;
      screen.appendChild(o);
      return o;
    }

    function wait(ms) {
      if (skipped) return Promise.resolve();
      return new Promise((r) => setTimeout(r, ms));
    }

    async function typeInto(target, text) {
      for (let i = 0; i < text.length; i++) {
        if (skipped) { target.textContent = text; return; }
        target.textContent += text[i];
        const ch = text[i];
        const base = ch === " " ? 22 : 18 + Math.random() * 38;
        // small jitter pauses on punctuation
        const extra = /[\.\?\!\/\-]/.test(ch) ? 80 : 0;
        await wait(base + extra);
      }
    }

    async function run() {
      if (started) return;
      started = true;

      for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        const prompt = makePrompt();
        const input  = prompt.querySelector(".t-input");

        // leading space after $
        input.textContent = " ";

        await wait(i === 0 ? 280 : 460);
        await typeInto(input, item.cmd);
        await wait(260);

        // "enter" — drop the caret, show output
        if (activeCaret && activeCaret.parentNode === prompt) {
          activeCaret.remove();
          activeCaret = null;
        }
        makeOutput(item.out);
        await wait(640);
      }

      // final idle prompt with blinking cursor
      const finalPrompt = makePrompt();
      finalPrompt.querySelector(".t-input").textContent = " ";
    }

    // Tap / click anywhere on the terminal to skip ahead
    terminal.addEventListener("click", () => {
      if (started) skipped = true;
    });

    if (reduceMotion) {
      skipped = true;
      run();
      return;
    }

    const io = new IntersectionObserver(
      (ents) => {
        if (ents.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(terminal);
  }
})();

/* =========================================================
   FELLOWS — draggable passport deck + open-viewer + page-turn

   Each .passport in #passport-deck is a closed leather passport. They
   sit stacked: depth 0 is the top, slightly larger and dead-centred;
   deeper cards fan out behind with descending size + rotation.

   Behaviours:
   - drag horizontally → release: short drag springs back; longer
     drag or fast flick flies the card off-screen and recycles it to
     the back of the deck so the next fellow comes up.
   - tap (no drag) → opens the viewer overlay; cover swings off behind
     a two-page inside spread with bio (left) + fields (right).
   - inside the viewer: a "stamps" button flips to the second spread,
     where the colored ink stamps for each visited house fade in
     one after another.

   This IIFE is self-contained and bails out cleanly on any page that
   has no #passport-deck — landing & houses pages keep working.
   ========================================================= */
(() => {
  const deck = document.getElementById("passport-deck");
  if (!deck) return;

  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const passports = Array.from(deck.querySelectorAll(".passport"));
  if (!passports.length) return;

  /* ---------- one-time mount: build cover contents into each card ----------
     real passports are sparse. arc text up top, an emblem, the word
     PASSPORT in foil mono caps, a biometric-chip glyph, and a tiny id.
     no italic serif, no "REPUBLIC OF ..." — that read corny. */
  passports.forEach((card) => {
    const id     = card.dataset.fellowId      || Math.random().toString(36).slice(2, 8);
    const num    = card.dataset.fellowNumber  || "";

    card.innerHTML = `
      <div class="passport__cover-inner">
        <div class="passport__cover-arc">Cracked &middot; Hackerhouse</div>
        <div class="passport__cover-emblem" aria-hidden="true">
          <svg viewBox="0 0 116 116" width="100%" height="100%" fill="none">
            <defs>
              <linearGradient id="foil-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"  stop-color="#ecdba8"/>
                <stop offset="55%" stop-color="#cbb986"/>
                <stop offset="100%" stop-color="#8e7842"/>
              </linearGradient>
            </defs>
            <circle cx="58" cy="58" r="48" stroke="url(#foil-${id})" stroke-width="0.7"/>
            <circle cx="58" cy="58" r="42" stroke="url(#foil-${id})" stroke-width="0.4" stroke-dasharray="1 3"/>
            <circle cx="58" cy="58" r="20" stroke="url(#foil-${id})" stroke-width="0.5"/>
            <text x="58" y="68" text-anchor="middle"
                  font-family="Instrument Serif, serif" font-style="italic"
                  font-size="32" fill="url(#foil-${id})">✦</text>
          </svg>
        </div>
        <h2 class="passport__cover-title">Passport</h2>
        <div class="passport__cover-base">
          <div class="passport__cover-chip-icon" aria-hidden="true"></div>
          <div class="passport__cover-base-id">${num.replace(/&middot;/g, "·")}</div>
        </div>
      </div>
    `;
  });

  /* ---------- focal scatter layout ----------
     one big passport dead-centre is the focal point. four smaller ones
     step outward to the sides (medium, then small). one small "back
     peek" pokes above the focal so the silhouette reads as a curated
     composition, not chaos. each slot defines x/y offset, scale, in-
     plane rotation and z-index. */
  const SCATTER = [
    // 0: FOCAL — biggest, dead centre, on top
    { x:    0, y: -20, s: 1.00, rot:   0, z: 16 },
    // 1: left, medium
    { x: -250, y:  25, s: 0.74, rot:  -8, z: 13 },
    // 2: far-left, small
    { x: -430, y:  55, s: 0.58, rot: -15, z: 11 },
    // 3: right, medium
    { x:  250, y:  25, s: 0.74, rot:   8, z: 14 },
    // 4: far-right, small
    { x:  430, y:  55, s: 0.58, rot:  15, z: 12 },
    // 5: back peek — small, lifted up so its top edge pokes above the focal
    { x:  -40, y:-170, s: 0.48, rot:  -3, z: 10 },
  ];

  let topZ = 16;
  const layout = () => {
    passports.forEach((card, i) => {
      const p = SCATTER[i % SCATTER.length];
      card._restX = p.x;
      card._restY = p.y;
      card._restRot = p.rot;
      card._restScale = p.s;
      card.dataset.depth = String(i);
      card.style.left = "50%";
      card.style.top = "50%";
      card.style.right = "auto";
      card.style.bottom = "auto";
      card.style.zIndex = String(p.z);
      card.style.opacity = "1";
      card.style.filter = "";
      card.style.transform =
        `translate3d(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px), 0) rotate(${p.rot}deg) scale(${p.s})`;
      card.classList.remove("is-dragging");
    });
    topZ = 17;
  };
  layout();

  /* ---------- drag — any passport, drop where released ---------- */
  let drag = null;
  const VEL_FRAMES = 6;

  const onPointerDown = (e) => {
    const card = e.target.closest(".passport");
    if (!card || !deck.contains(card)) return;
    if (e.target.closest(".passport-viewer")) return;

    // bring the grabbed card to the top of the desk
    topZ += 1;
    card.style.zIndex = String(topZ);

    card.setPointerCapture?.(e.pointerId);
    drag = {
      card,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      baseX: card._restX || 0,
      baseY: card._restY || 0,
      baseRot: card._restRot || 0,
      baseScale: card._restScale || 1,
      dx: 0,
      dy: 0,
      moved: false,
      t0: performance.now(),
      samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
    };
    card.classList.add("is-dragging");
  };

  const onPointerMove = (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    drag.dx = dx;
    drag.dy = dy;
    if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;

    drag.samples.push({ t: performance.now(), x: e.clientX, y: e.clientY });
    if (drag.samples.length > VEL_FRAMES) drag.samples.shift();

    // tiny rotation tilt while held — feels like a card pinched between fingers
    const tilt = Math.max(-6, Math.min(6, dx * 0.02));
    // grabbed cards lift a touch — scale up by 4% of their resting scale
    const liftScale = drag.baseScale * 1.04;
    drag.card.style.transform =
      `translate3d(calc(-50% + ${drag.baseX + dx}px), calc(-50% + ${drag.baseY + dy}px), 0) rotate(${drag.baseRot + tilt}deg) scale(${liftScale})`;
  };

  const onPointerUp = (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { card, dx, dy, samples, moved, t0, baseX, baseY, baseRot, baseScale } = drag;
    drag = null;

    card.classList.remove("is-dragging");

    // velocity from the last samples — used for a short glide after release
    let vx = 0, vy = 0;
    if (samples.length >= 2) {
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(1, b.t - a.t);
      vx = (b.x - a.x) / dt;
      vy = (b.y - a.y) / dt;
    }
    const dist = Math.hypot(dx, dy);

    // tap (no real drag): open the viewer, leave the card where it was
    if (!moved && (performance.now() - t0) < 380 && dist < 8) {
      // restore exact resting pose (cancels any pre-tap nudge transform)
      card.style.transform =
        `translate3d(calc(-50% + ${baseX}px), calc(-50% + ${baseY}px), 0) rotate(${baseRot}deg) scale(${baseScale})`;
      openViewer(card);
      return;
    }

    // commit the new rest position. add a small momentum glide so it
    // feels like the card has weight; clamp glide so it doesn't fly out.
    const GLIDE = 90;             // ms-scaled
    const MAX_GLIDE = 80;         // px
    const gx = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, vx * GLIDE));
    const gy = Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, vy * GLIDE));
    const newX = baseX + dx + gx;
    const newY = baseY + dy + gy;

    card._restX = newX;
    card._restY = newY;

    const settledTransform =
      `translate3d(calc(-50% + ${newX}px), calc(-50% + ${newY}px), 0) rotate(${baseRot}deg) scale(${baseScale})`;
    if (reduceMotion) {
      card.style.transform = settledTransform;
    } else {
      card.style.transition = "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)";
      card.style.transform = settledTransform;
      setTimeout(() => { card.style.transition = ""; }, 500);
    }
  };

  deck.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup",   onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  /* =========================================================
     VIEWER — open / page-turn / close
     ========================================================= */
  const viewer = document.getElementById("passport-viewer");
  const book   = document.getElementById("passport-book");
  const spreadBio    = viewer?.querySelector(".passport-book__spread--bio");
  const spreadStamps = viewer?.querySelector(".passport-book__spread--stamps");
  const housesList   = viewer?.querySelector("[data-houses-list]");

  function openViewer(card) {
    if (!viewer) return;
    const d = card.dataset;

    // analytics — record which fellow's passport got opened
    if (window.posthog) {
      window.posthog.capture("passport_open", {
        fellow_id: d.fellowId || "",
        fellow_name: d.fellowName || "",
        cohort: d.fellowCohort || "",
      });
    }

    // populate fields
    viewer.querySelector("[data-fellow-photo-target]").style.backgroundImage  = `url("${d.fellowPhoto}")`;
    viewer.querySelector("[data-fellow-surname-target]").textContent   = (d.fellowSurname || "").toUpperCase();
    viewer.querySelector("[data-fellow-name-target]").textContent      = d.fellowName || "";
    viewer.querySelector("[data-fellow-cohort-target]").textContent    = d.fellowCohort || "";
    viewer.querySelector("[data-fellow-issued-target]").textContent    = d.fellowIssued || "";
    viewer.querySelector("[data-fellow-role-target]").textContent      = d.fellowRole || "";
    viewer.querySelector("[data-fellow-bio-target]").textContent       = d.fellowBio || "";
    viewer.querySelector("[data-fellow-handle-target]").textContent    = d.fellowHandle || "";
    viewer.querySelector("[data-fellow-handle-caption]").textContent   = d.fellowHandle || "";
    viewer.querySelector("[data-fellow-number-caption]").textContent   = d.fellowNumber || "";

    // build a synthetic MRZ line from name + number
    const last = (d.fellowSurname || "FELLOW").toUpperCase().replace(/[^A-Z]/g, "");
    const first = (d.fellowName || "").toUpperCase().replace(/[^A-Z]/g, "");
    const numClean = (d.fellowNumber || "0000").replace(/[^0-9]/g, "").padEnd(9, "0");
    const mrz1 = `P<CRK${last}<<${first}`.padEnd(44, "<");
    const mrz2 = `${numClean}<CRK${d.fellowCohort?.replace(/[^0-9]/g, "").padStart(7, "0") || "0000000"}M${(d.fellowIssued || "").replace(/[^0-9]/g, "").padStart(7, "0")}`.padEnd(44, "<");
    viewer.querySelector("[data-mrz-1]").textContent = mrz1.slice(0, 44);
    viewer.querySelector("[data-mrz-2]").textContent = mrz2.slice(0, 44);

    // configure visa stamps based on houses visited
    const houses = (d.fellowHouses || "").split(",").map((s) => s.trim()).filter(Boolean);
    viewer.querySelectorAll(".stamp").forEach((s) => s.classList.remove("is-on"));
    if (houses.includes("bangalore")) viewer.querySelector(".stamp--blr").classList.add("is-on");
    if (houses.includes("vietnam"))   viewer.querySelector(".stamp--vnm").classList.add("is-on");

    // build the legend list
    if (housesList) {
      housesList.innerHTML = "";
      const all = [
        { key: "bangalore", label: "Bangalore",    meta: "cohort 00 · indira nagar", color: "blr", visited: houses.includes("bangalore") },
        { key: "vietnam",   label: "Vietnam",      meta: "cohort 01 · my khe",       color: "vnm", visited: houses.includes("vietnam") },
        { key: "bali",      label: "Bali",         meta: "cohort 02 · canggu",       color: "arg", visited: false },
      ];
      all.forEach((h) => {
        const li = document.createElement("li");
        li.className = "passport-book__legend-item" + (h.visited ? "" : " passport-book__legend-item--ghost");
        li.innerHTML = `
          <span class="passport-book__legend-dot passport-book__legend-dot--${h.color}"></span>
          <span>${h.label}</span>
          <span class="passport-book__legend-meta">${h.meta}</span>
        `;
        housesList.appendChild(li);
      });
    }

    // clone the tapped passport's cover into the flipper so the cover
    // we see swinging open is visually identical to the card the user
    // tapped (same fellow's id, same serial, same emblem).
    const flipper = viewer.querySelector("[data-cover-flipper]");
    const tappedCoverInner = card.querySelector(".passport__cover-inner");
    if (flipper) {
      flipper.innerHTML = "";
      if (tappedCoverInner) {
        flipper.appendChild(tappedCoverInner.cloneNode(true));
      }
    }

    const backCover = viewer.querySelector("[data-book-cover]");

    // always start on the bio spread
    setPage("bio");

    // reset everything to the CLOSED pose with no transition. the book
    // sits shifted left so the flipper (which lives at the right half
    // of the spread) ends up centred in the viewport; the spread is
    // hidden underneath; the back-cover hint is hidden.
    const setClosed = (el, css) => {
      if (!el) return;
      el.style.transition = "none";
      Object.assign(el.style, css);
    };
    setClosed(book, {
      transform: "translateX(calc(var(--book-page-w) * -0.5)) scale(0.9)",
      opacity: "0",
    });
    setClosed(flipper, { transform: "rotateY(0deg)", opacity: "1" });
    setClosed(spreadBio, { opacity: "0" });
    setClosed(spreadStamps, { opacity: "0" });
    setClosed(backCover, { opacity: "0" });

    viewer.hidden = false;
    viewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // force a layout pass so the closed pose is committed BEFORE the
    // animation transitions are applied. without this, the browser
    // batches both updates and we'd see no transition.
    void viewer.offsetWidth;

    // two rAFs to be safe across browsers, then fire the choreographed
    // open animation.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        viewer.classList.add("is-open");

        // stage 1: the book glides up to its open pose
        book.style.transition =
          "transform 1100ms cubic-bezier(0.34, 1.06, 0.22, 1), " +
          "opacity 380ms ease";
        book.style.transform = "translateX(0) scale(1)";
        book.style.opacity = "1";

        // stage 2: the cover flips around its spine (left edge),
        // starting 260ms in so the book has scaled in a touch first.
        flipper.style.transition =
          "transform 1100ms cubic-bezier(0.55, 0.02, 0.18, 0.98) 260ms";
        flipper.style.transform = "rotateY(-180deg)";

        // stage 3: the inside spread fades in mid-flip — by the time
        // the cover has rotated past 90deg (≈ 260+550 = 810ms) the
        // spread should be ~80% visible.
        spreadBio.style.transition = "opacity 520ms ease 720ms";
        spreadBio.style.opacity = "1";

        // the small folded-back-cover hint appears at the very end
        backCover.style.transition = "opacity 360ms ease 1240ms";
        backCover.style.opacity = "1";
      });
    });
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove("is-open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(() => { viewer.hidden = true; }, 380);
  }

  function setPage(page) {
    if (!book) return;
    book.dataset.page = page;
    spreadBio?.classList.toggle("is-on", page === "bio");
    spreadStamps?.classList.toggle("is-on", page === "stamps");
    // clear any inline opacity/transition left over from the open
    // animation so the CSS .is-on rules drive page switches normally.
    [spreadBio, spreadStamps].forEach((el) => {
      if (!el) return;
      el.style.opacity = "";
      el.style.transition = "";
    });
  }

  viewer?.querySelector(".passport-viewer__close")?.addEventListener("click", closeViewer);
  viewer?.querySelector("[data-viewer-scrim]")?.addEventListener("click", closeViewer);
  window.addEventListener("keydown", (e) => {
    if (!viewer || viewer.hidden) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowRight") setPage("stamps");
    if (e.key === "ArrowLeft")  setPage("bio");
  });
  viewer?.querySelector("[data-page-next]")?.addEventListener("click", () => setPage("stamps"));
  viewer?.querySelector("[data-page-prev]")?.addEventListener("click", () => setPage("bio"));
})();

/* =========================================================
   PANEL SWITCHER — one-pager navigation
   ---
   The landing page is no longer a scrolling document. Four panels stack
   in the same viewport and a vertical rail of pills on the right swaps
   the visible one. Any element with [data-panel-link="X"] activates the
   panel whose [data-panel="X"] matches. The active panel name is also
   mirrored to body[data-active-panel] so the brand/rail/dock chrome can
   flip between light + dark themes.
   ========================================================= */
(() => {
  const body = document.body;
  if (!body.classList.contains("page--single")) return;

  const panels = Array.from(document.querySelectorAll(".panel[data-panel]"));
  const links  = Array.from(document.querySelectorAll("[data-panel-link]"));
  if (!panels.length) return;

  // pills live inside the .rail — kept separately so we can update their
  // active state distinctly from generic in-content panel links.
  const pills = Array.from(document.querySelectorAll(".rail__pill[data-panel-link]"));

  const initial =
    document.querySelector(".panel.is-active")?.dataset.panel || "main";
  body.dataset.activePanel = initial;

  function activate(name) {
    if (!name) return;
    const next = panels.find((p) => p.dataset.panel === name);
    if (!next || next.classList.contains("is-active")) {
      // already active — nothing to do
      body.dataset.activePanel = name;
      return;
    }

    panels.forEach((p) => {
      const on = p === next;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-hidden", on ? "false" : "true");
    });
    pills.forEach((b) => {
      const on = b.dataset.panelLink === name;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page");
      else    b.removeAttribute("aria-current");
    });
    body.dataset.activePanel = name;

    // Let other modules know — e.g. MapLibre auto-listens for window
    // resize, and the fellows deck can choose to relayout. Cheap to fire.
    window.dispatchEvent(new CustomEvent("panel:change", { detail: { name } }));
  }

  links.forEach((el) => {
    el.addEventListener("click", (e) => {
      const target = el.dataset.panelLink;
      if (!target) return;
      // panel links inside <a href="..."> would otherwise navigate or
      // push a hash; intercept and swap panels in place.
      e.preventDefault();
      // Pills marked [data-disabled="true"] (cohorts / fellows / about
      // while those pages are still being built) are inert — CSS shows
      // a "coming soon" tooltip on hover; we just swallow the click here.
      if (el.dataset.disabled === "true") return;
      activate(target);
    });
  });

  // Esc → back to main, unless the passport viewer is open (it has its
  // own Esc handler that closes the viewer first).
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const viewer = document.getElementById("passport-viewer");
    if (viewer && !viewer.hidden) return;
    if (body.dataset.activePanel !== "main") activate("main");
  });

  // When the map's panel becomes visible again, nudge MapLibre so it
  // recomputes its canvas size (a noop if dimensions haven't changed but
  // safe insurance after long visibility:hidden runs on some browsers).
  window.addEventListener("panel:change", (e) => {
    if (e.detail?.name !== "main") return;
    // dispatch a window resize one frame later so the panel transition
    // has committed before MapLibre measures.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  });
})();
