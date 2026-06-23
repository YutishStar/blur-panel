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
      cam:       { lon: 77.6716, lat: 12.9833, zoom: 12.8, pitch: 45, bearing: 118.7 },
      camMobile: { lon: 77.6405, lat: 12.9700, zoom: 12.8, pitch: 45, bearing: 118.7 },
      // anchor = where the house dot pins to the earth. Independent of `cam`,
      // so dragging the camera (D → free-look) slides the dot across the
      // frame without moving it geographically. Tweak this to reposition the
      // dot; tweak `cam` to reframe the satellite view.
      anchor: { lon: 77.6412, lat: 12.9719 },
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
      cam:       { lon: 108.26627, lat: 16.07186, zoom: 12.8, pitch: 45, bearing: 119.7 },
      camMobile: { lon: 108.2348,  lat: 16.0548,  zoom: 12.8, pitch: 45, bearing: 118 },
      anchor:    { lon: 108.2405,  lat: 16.0560 },
      apps:  { label: "applications filled!", range: "The house starts 1st July", status: "filled" },
      heroTitle: { a: "Are you",   b: "<em>Cracked</em> enough?" },
      heroDesc:  "A house full of builders, creators, hackers, and ambitious misfits living together for thirty days.",
      actions: [
        { label: "Filled!", variant: "ghost" },
        { label: "Apply to next cohort", variant: "primary", arrow: true, cohortJump: 2 },
      ],
      sponsors: [
        { tagline: "Our content sponsors", logos: [
          { logo: "sponsors/sponsor-1.png",      alt: "Team1",   size: "sm", url: "https://x.com/Team1VN" },
          { logo: "sponsors/boardy-favicon.png", alt: "Boardy",  size: "md", url: "https://boardy.ai/" },
        ] },
        { tagline: "Our credits sponsors", logo: "sponsors/razorpay.png", alt: "Razorpay", size: "md", url: "https://razorpay.com/" },
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
      // ---- C2 · DUBAI (NEW) — placeholder content; real copy + Dubai-specific
      // Tally link land later. Photos reuse the Bali set as placeholders until
      // real Dubai shots are dropped into villas/cohort-02/. -------------------
      id: "02",
      badge: 'Cohort 2, Dubai, UAE <span class="hero__cohort-sep">|</span> <span class="hero__cohort-status hero__cohort-status--open">Applications open!</span>',
      title: "CRACKED HACKER HOUSE",
      sub:   "Cohort 02 · Starts 8th Aug!",
      loc:   "Dubai, UAE",
      cam:       { lon: 55.17257, lat: 25.11601, zoom: 12.8, pitch: 45, bearing: 124.2 },
      camMobile: { lon: 55.13957, lat: 25.10801, zoom: 12.8, pitch: 45, bearing: 123.2 },
      anchor:    { lon: 55.15536, lat: 25.09564 },
      apps:  { label: "applications open", range: "Starts 8th August", status: "open" },
      ctaLabel: "Apply C2",
      tally: "https://tally.so/r/VLNzGJ",
      heroTitle: { a: "30 days.", b: "16 cracked founders.", c: "<em>Dubai.</em>" },
      heroDesc:  "Starts 8th August. $500 buys a bed, a seat at the workstation, and 30 days next to sixteen cracked builders in a Dubai villa 10 minutes from the Burj Khalifa. Compute credits, founder dinners, sponsor intros, and demo days that end in the ocean.",
      actions: [
        { label: "Apply C2", variant: "primary", arrow: true, href: "https://tally.so/r/VLNzGJ" },
      ],
      sponsors: [],
      photos: [
        "villas/cohort-02/245A4763-HDR.JPG", "villas/cohort-02/245A4887-HDR.JPG", "villas/cohort-02/245A4896-HDR.JPG", "villas/cohort-02/245A4921-HDR.JPG",
      ],
      stats: [
        { value: "16", label: "founders" },
        { value: "30", label: "days" },
        { value: "9",  label: "beds" },
      ],
      blurb: "Sixteen cracked founders living ten meters apart in Dubai, 10 minutes from the Burj Khalifa. Compute credits to ship faster, founder dinners, sponsor intros, and demo days that end in the ocean.",
    },
    {
      id: "03",
      badge: 'Cohort 3, Canggu, Bali <span class="hero__cohort-sep">|</span> <span class="hero__cohort-status hero__cohort-status--open">Applications open!</span>',
      title: "CRACKED HACKER HOUSE",
      sub:   "Cohort 03 · Starts 1st Sep!",
      loc:   "Canggu, Bali",
      cam:       { lon: 115.16274, lat: -8.65019, zoom: 12.8, pitch: 45, bearing: 136.2 },
      camMobile: { lon: 115.1310,  lat: -8.6575,  zoom: 12.8, pitch: 45, bearing: 135.9 },
      anchor:    { lon: 115.1285,  lat: -8.6573 },
      apps:  { label: "applications open", range: "1st June – 20th June", status: "open" },
      ctaLabel: "Apply C3",
      // TODO: swap in the Bali-specific Tally link when provided.
      tally: "https://tally.so/r/A7yDE0",
      heroTitle: { a: "The Cracked Internet", b: "is moving to", c: "<em>Bali.</em>" },
      heroDesc:  "Starts 1st September. $500 puts you in a Canggu villa with nine other cracked builders for thirty days — rice-paddy mornings, rooftop founder dinners, and demo days that end in the ocean. Compute credits, sponsor intros, scooters at the gate, and a cohort that ships before it surfs.",
      actions: [
        { label: "Apply C3", variant: "primary", arrow: true, href: "https://tally.so/r/A7yDE0" },
      ],
      sponsors: [],
      photos: [
        "villas/cohort-03/01.png", "villas/cohort-03/02.png", "villas/cohort-03/03.png", "villas/cohort-03/04.png",
        "villas/cohort-03/05.png", "villas/cohort-03/06.png", "villas/cohort-03/07.png", "villas/cohort-03/08.png",
      ],
      stats: [
        { value: "10", label: "builders" },
        { value: "30", label: "days" },
        { value: "5",  label: "rooms" },
      ],
      blurb: "Ten cracked builders living ten meters apart. Compute credits to ship faster, founder dinners on the rooftop, sponsor intros, and demo days that end in the ocean.",
    },
  ];
  let cohortIdx = 1; // default landing cohort: Da Nang, Vietnam (01)

  // Desktop and mobile want different camera framings for the SAME anchor:
  // on desktop the glass pane covers the left, so `cam` composes the city to
  // the right (often out over water at center); a centered mobile view of
  // that same cam lands on open ocean. Cohorts may declare an optional
  // `camMobile` used only at mobile widths — anchors stay shared, so the pin
  // never moves. Matches the 820px CSS breakpoint.
  const mqMobile = window.matchMedia("(max-width: 820px)");
  function camFor(c) {
    return (mqMobile.matches && c.camMobile) ? c.camMobile : c.cam;
  }

  /* ---------- satellite tile prefetch ----------
     flyTo() across cohorts lands on a far-away view whose tiles aren't
     cached yet, so the map flashes black until Esri responds. We warm the
     browser HTTP cache with a small tile pyramid for every cohort's
     destination view: switches then land on cached imagery, and there's
     always a blurry low-zoom ancestor to show instead of black. */
  const ESRI_TILE =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  function lonLatToTile(lon, lat, z) {
    const n = Math.pow(2, z);
    const x = Math.floor(((lon + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    return { x, y, n };
  }

  // zoom offsets (from the view's native zoom) + neighbour radius to warm.
  // The low levels guarantee a blurry ancestor exists (no black); the top
  // level covers the actual viewport so the landing is sharp.
  const PREFETCH_LEVELS = [
    { dz: 0,  r: 2 },  // ~the viewport at native zoom
    { dz: -1, r: 1 },  // one level out
    { dz: -4, r: 0 },  // regional ancestor
    { dz: -7, r: 0 },  // continental ancestor
  ];

  function prefetchView(cam, seen) {
    const base = Math.round(cam.zoom);
    PREFETCH_LEVELS.forEach(({ dz, r }) => {
      const z = Math.max(1, base + dz);
      const { x, y, n } = lonLatToTile(cam.lon, cam.lat, z);
      for (let ix = x - r; ix <= x + r; ix++) {
        for (let iy = y - r; iy <= y + r; iy++) {
          if (iy < 0 || iy >= n) continue;       // clamp latitude
          const tx = ((ix % n) + n) % n;          // wrap longitude
          const url = ESRI_TILE
            .replace("{z}", z).replace("{x}", tx).replace("{y}", iy);
          if (seen.has(url)) continue;
          seen.add(url);
          const img = new Image();
          img.decoding = "async";
          img.src = url;
        }
      }
    });
  }

  let prefetchDone = false;
  function prefetchAllCohorts() {
    if (prefetchDone) return;
    prefetchDone = true;
    // Respect data-saver / very slow links — skip the warm-up entirely.
    const conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g/.test(conn.effectiveType || ""))) return;
    const seen = new Set();
    COHORTS.forEach((c, i) => {
      if (i === cohortIdx) return;  // current view is already loading/loaded
      prefetchView(camFor(c), seen);
    });
  }

  function idlePrefetch() {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => prefetchAllCohorts(), { timeout: 3000 });
    } else {
      setTimeout(prefetchAllCohorts, 1200);
    }
  }


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
    const FINAL = { ...camFor(COHORTS[cohortIdx]) };
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
        loaded.then(() => { fireIris(); idlePrefetch(); });
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
      // instead of leaving a black header between them. Once revealed,
      // warm the other cohorts' tiles on idle so switches don't flash.
      loaded.then(() => { fireIris(); idlePrefetch(); });
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
     camera between Bangalore (00) → Da Nang (01) → Dubai (02) → Canggu, Bali (03)
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
      if (c.id === "02" && c.tally) {
        dockCta.href   = c.tally;
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
          row.appendChild(tagline);
          // A row can carry one logo (logo/alt/size/url) or several (logos[]).
          const logos = s.logos || [{ logo: s.logo, alt: s.alt, size: s.size, url: s.url }];
          logos.forEach((l, i) => {
            if (i > 0) {
              const sep = document.createElement("span");
              sep.className = "hero__sponsor-sep";
              sep.textContent = "|";
              row.appendChild(sep);
            }
            const img = document.createElement("img");
            const sizeCls = l.size === "sm" ? " hero__sponsor-logo--sm"
                          : l.size === "lg" ? " hero__sponsor-logo--lg" : "";
            img.className = "hero__sponsor-logo" + sizeCls;
            img.src = l.logo;
            img.alt = l.alt || "";
            if (l.url) {
              const link = document.createElement("a");
              link.className = "hero__sponsor-link";
              link.href   = l.url;
              link.target = "_blank";
              link.rel    = "noopener noreferrer";
              link.setAttribute("aria-label", l.alt || s.tagline);
              link.appendChild(img);
              row.appendChild(link);
            } else {
              row.appendChild(img);
            }
          });
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

    // Same re-trigger for the house card. Desktop ignores this class; on
    // mobile (phone-test.css) it drives an appear+expand that fires after
    // the map flyTo, since the card lives in the flow there.
    const hm = document.getElementById("house-marker");
    if (hm) {
      hm.classList.remove("is-switching");
      void hm.offsetWidth;
      hm.classList.add("is-switching");
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

    const cam = camFor(c);
    inspector.map.flyTo({
      center:  [cam.lon, cam.lat],
      zoom:    cam.zoom,
      pitch:   cam.pitch,
      bearing: cam.bearing,
      duration: 4200,
      essential: true,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    });

    inspector.map.once("moveend", () => {
      inspector.flying = false;
      inspector.orbitBearing = cam.bearing;
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

  /* =========================================================
     COHORTS · CRACKED DEPARTURES
     The cohorts panel as an airport. A departures board lists every
     cohort as a flight (application status → flight state); selecting a
     row issues a per-city portrait boarding pass (left) + a "gate"
     details panel (right): photos, what's on board, apply. Built from
     the COHORTS array; the main hero map is untouched.
     ========================================================= */
  const departures = (() => {
    const STATE = {
      closed: { board: "departed", stamp: "departed",      kind: "departed" },
      filled: { board: "boarding", stamp: "now boarding",  kind: "boarding" },
      open:   { board: "check-in", stamp: "check-in open", kind: "open" },
    };
    const FLIGHT = {
      "00": { iata: "BLR", depart: "JUL '25", date: "JUN 2025",    livery: "#c2563a" }, // bangalore · terracotta
      "01": { iata: "DAD", depart: "JUL '26", date: "01 JUL 2026", livery: "#0f8a86" }, // da nang · teal
      "02": { iata: "DXB", depart: "AUG '26", date: "08 AUG 2026", livery: "#b8902f" }, // dubai · gold
      "03": { iata: "DPS", depart: "SEP '26", date: "01 SEP 2026", livery: "#9b4d8f" }, // bali · orchid
    };
    const FUTURE = { flight: "CR04", city: "wherever", iata: "????", depart: "2027", board: "scheduled" };
    const PLANE = "✈";

    const boardEl = document.querySelector("[data-departures-board]");
    const passEl  = document.querySelector("[data-pass-wrap]");
    let entered = false;

    const flightNo = (c) => "CR" + c.id;
    const statusOf = (c) => STATE[c.apps?.status] || { board: c.apps?.label || "", stamp: "", kind: "open" };
    const findStat = (c, re) => (c.stats || []).find((s) => re.test(s.label)) || null;

    function buildBoard() {
      if (!boardEl) return;
      const head = document.createElement("div");
      head.className = "dep-row dep-row--head";
      head.innerHTML = `<span>flight</span><span>destination</span><span>date</span><span>status</span>`;
      boardEl.appendChild(head);

      COHORTS.forEach((c, i) => {
        const [city] = (c.loc || "").split(",");
        const st = statusOf(c);
        const f  = FLIGHT[c.id] || {};
        const row = document.createElement("button");
        row.type = "button";
        row.className = `dep-row dep-row--${st.kind}`;
        row.dataset.idx = String(i);
        row.style.setProperty("--i", String(i + 1));
        row.innerHTML =
          `<span class="dep-flight">${flightNo(c)}</span>` +
          `<span class="dep-dest">${(city || "").trim()}<i>${f.iata || ""}</i></span>` +
          `<span class="dep-date">${f.depart || ""}</span>` +
          `<span class="dep-status"><span class="dep-status__dot" aria-hidden="true"></span>${st.board}</span>`;
        row.addEventListener("click", () => select(i));
        boardEl.appendChild(row);
      });

      const fr = document.createElement("div");
      fr.className = "dep-row dep-row--future";
      fr.style.setProperty("--i", String(COHORTS.length + 1));
      fr.innerHTML =
        `<span class="dep-flight">${FUTURE.flight}</span>` +
        `<span class="dep-dest">${FUTURE.city}<i>${FUTURE.iata}</i></span>` +
        `<span class="dep-date">${FUTURE.depart}</span>` +
        `<span class="dep-status"><span class="dep-status__dot" aria-hidden="true"></span>${FUTURE.board}</span>`;
      boardEl.appendChild(fr);
    }

    function passHTML(c, i) {
      const [city] = (c.loc || "").split(",").map((s) => s.trim());
      const st = statusOf(c);
      const f  = FLIGHT[c.id] || {};
      const livery = f.livery || "#5a5a58";
      const pax  = findStat(c, /cracked|founder|builder/);
      const days = findStat(c, /day/);
      const prev = i > 0 ? COHORTS[i - 1] : null;
      const origIata = prev ? (FLIGHT[prev.id]?.iata || "—") : "···";
      const origCity = prev ? ((prev.loc || "").split(",")[0] || "").trim() : "the internet";

      return `
        <article class="pass pass--${st.kind}" style="--livery:${livery}">
          <div class="pass__top">
            <span class="pass__label">boarding pass</span>
            <span class="pass__status-chip">${st.stamp}</span>
          </div>
          <div class="pass__body">
            <span class="pass__map" aria-hidden="true"></span>
            <div class="pass__airline-row">
              <span class="pass__airline"><span class="pass__plane">${PLANE}</span>cracked<b>air</b></span>
              <span class="pass__flightno">${flightNo(c)}</span>
            </div>
            <div class="pass__route">
              <span class="pass__leg"><b>${origIata}</b><small>${origCity}</small></span>
              <span class="pass__plane2" aria-hidden="true">${PLANE}</span>
              <span class="pass__leg pass__leg--to"><b>${f.iata || ""}</b><small>${city || ""}</small></span>
            </div>
            <div class="pass__grid">
              <span class="pass__f"><small>passenger</small><b>the cracked</b></span>
              <span class="pass__f"><small>seats</small><b>${pax ? pax.value : "—"}</b></span>
              <span class="pass__f"><small>date</small><b>${f.date || ""}</b></span>
              <span class="pass__f"><small>duration</small><b>${days ? days.value + " " + days.label : "—"}</b></span>
              <span class="pass__f"><small>gate</small><b>the villa</b></span>
              <span class="pass__f"><small>flight</small><b>${flightNo(c)}</b></span>
            </div>
          </div>
          <div class="pass__tear" aria-hidden="true"></div>
          <div class="pass__stub">
            <div class="pass__stub-info">
              <span class="pass__f"><small>seat</small><b>${pax ? pax.value : "—"}</b></span>
              <span class="pass__f"><small>date</small><b>${f.depart || ""}</b></span>
              <span class="pass__f"><small>gate</small><b>villa</b></span>
            </div>
            <span class="pass__barcode" aria-hidden="true"></span>
          </div>
        </article>`;
    }

    function gateHTML(c) {
      const photos = (c.photos || []).slice(0, 4)
        .map((src) => `<span class="gate__photo" style="background-image:url('${src}')"></span>`).join("");
      const chips = (c.stats || []).map((s) => {
        const win = /raised|made/.test(s.label);
        return `<span class="gate__chip${win ? " gate__chip--win" : ""}"><b>${s.value}</b>${s.label}</span>`;
      }).join("");
      const apply = (c.actions || []).find((a) => a.href) || (c.tally ? { href: c.tally } : null);
      const cta = c.apps?.status === "open" && apply
        ? `<a class="gate__cta" href="${apply.href}" target="_blank" rel="noopener noreferrer">${c.ctaLabel || "check in"} &rarr;</a>`
        : `<span class="gate__closed">${statusOf(c).kind === "departed" ? "this flight has departed" : "boarding closed · seats filled"}</span>`;
      return `
        <section class="gate">
          ${photos ? `<div class="gate__photos">${photos}</div>` : ""}
          ${chips ? `<div class="gate__chips">${chips}</div>` : ""}
          <p class="gate__blurb">${c.blurb || ""}</p>
          <div class="gate__foot">${cta}</div>
        </section>`;
    }

    function select(i) {
      boardEl?.querySelectorAll(".dep-row").forEach((r) =>
        r.classList.toggle("is-active", r.dataset.idx === String(i)));
      if (!passEl) return;
      passEl.innerHTML = passHTML(COHORTS[i], i) + gateHTML(COHORTS[i]);
      const card = passEl.querySelector(".pass");
      if (card) { card.classList.remove("is-issued"); void card.offsetWidth; card.classList.add("is-issued"); }
    }

    buildBoard();

    const defIdx = (() => {
      const i = COHORTS.findIndex((c) => c.apps?.status === "filled" || c.apps?.status === "open");
      return i >= 0 ? i : Math.max(0, COHORTS.length - 1);
    })();

    window.addEventListener("panel:change", (e) => {
      if (e.detail?.name !== "cohorts") return;
      if (!entered) {
        entered = true;
        boardEl?.classList.add("is-in");
        select(defIdx);
      }
    });

    return { select };
  })();
  void departures;

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
   FELLOWS — open passport ID cards (3×2 grid), flip to stamps
   Each fellow renders as the photo/data page of a passport: photo +
   name + "why they're cracked" labeled fields + an MRZ strip, all
   visible upfront. Tapping a card flips it to a second page of visa
   stamps for the houses they've been in. Bails cleanly on pages with
   no [data-fellows-grid].
   ========================================================= */
(() => {
  const grid = document.querySelector("[data-fellows-grid]");
  if (!grid) return;

  // House meta → drives the visa stamps.
  const HOUSES = {
    bangalore: { city: "Bangalore", code: "BLR", cohort: "00", dates: "06·25 → 09·25", tint: "#b2472f" },
    vietnam:   { city: "Da Nang",   code: "DAD", cohort: "01", dates: "07·26 → 08·26", tint: "#0f7d7a" },
    dubai:     { city: "Dubai",     code: "DXB", cohort: "02", dates: "08·26 → 09·26", tint: "#b8902f" },
    bali:      { city: "Canggu",    code: "DPS", cohort: "03", dates: "09·26 → 10·26", tint: "#9b4d8f" },
  };

  // ⚠ PLACEHOLDER fellows — swap in the 6 real "most cracked" here.
  // creds = the labeled "why cracked" fields (k = label, v = value).
  const FELLOWS = [
    { id: "vagdev", name: "Vagdev", surname: "Korrapati", handle: "@vagdev",
      number: "CRK · 00 · 0001", houses: ["bangalore"], photo: "fellows/BHEWwnjs_400x400.jpg",
      creds: [ { k: "builds", v: "payment rails for emerging markets" },
               { k: "shipped", v: "ex-Stripe payments infra" },
               { k: "known for", v: "the dosa-fuelled all-nighter" } ] },
    { id: "riza", name: "Riza", surname: "Aydin", handle: "@rzaydn",
      number: "CRK · 00 · 0002", houses: ["bangalore", "vietnam"], photo: "fellows/UfGyY5_j_400x400.jpg",
      creds: [ { k: "builds", v: "small models that actually think" },
               { k: "shipped", v: "3 open-source eval frameworks" },
               { k: "known for", v: "running the Vietnam kitchen" } ] },
    { id: "ashrith", name: "Ashrith", surname: "Reddy", handle: "@ashr1th",
      number: "CRK · 00 · 0003", houses: ["bangalore"], photo: "fellows/yDrxSxQu_400x400.jpg",
      creds: [ { k: "builds", v: "cold-chain sensors for vaccines" },
               { k: "shipped", v: "first investor at the table" },
               { k: "known for", v: "hardware in a software house" } ] },
    { id: "kalash", name: "Kalash", surname: "Mehta", handle: "@kalashm",
      number: "CRK · 01 · 0004", houses: ["vietnam"], photo: "fellows/90960705.jpeg",
      creds: [ { k: "builds", v: "compilers · WASM & Rust" },
               { k: "shipped", v: "a working JIT in two weekends" },
               { k: "known for", v: "a keyboard in checked luggage" } ] },
    { id: "karthik", name: "Karthik", surname: "Nair", handle: "@karthikn",
      number: "CRK · 00 · 0005", houses: ["bangalore", "vietnam"],
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2.4&w=520&h=640&q=85",
      creds: [ { k: "builds", v: "dev tools for AI agents" },
               { k: "shipped", v: "10k GitHub stars in a month" },
               { k: "known for", v: "never sleeping before a demo" } ] },
    { id: "tanish", name: "Tanish", surname: "Jain", handle: "@tanishj",
      number: "CRK · 01 · 0006", houses: ["vietnam"],
      photo: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2.4&w=520&h=640&q=85",
      creds: [ { k: "builds", v: "weird consumer social apps" },
               { k: "shipped", v: "1M views in a single week" },
               { k: "known for", v: "the 3am idea that worked" } ] },
  ];

  function mrz(f) {
    const last  = (f.surname || "FELLOW").toUpperCase().replace(/[^A-Z]/g, "");
    const first = (f.name || "").toUpperCase().replace(/[^A-Z]/g, "");
    const num   = (f.number || "0").replace(/[^0-9]/g, "").padEnd(9, "0").slice(0, 9);
    const dest  = (f.houses[0] || "").toUpperCase().slice(0, 3).padEnd(3, "<");
    const l1 = `P<CRK${last}<<${first}`.padEnd(44, "<").slice(0, 44);
    const l2 = `${num}<CRK${dest}`.padEnd(44, "<").slice(0, 44);
    return [l1, l2];
  }

  function stampHTML(key, i) {
    const h = HOUSES[key];
    if (!h) return "";
    const rot = [-8, 6, -5, 9, -4][i % 5];
    return `
      <span class="vstamp" style="--tint:${h.tint};--rot:${rot}deg">
        <span class="vstamp__arc">cracked · cohort ${h.cohort}</span>
        <span class="vstamp__city">${h.city}</span>
        <span class="vstamp__code">${h.code}</span>
        <span class="vstamp__date">${h.dates}</span>
      </span>`;
  }

  const CRED_LABELS = {
    "builds":    "BUILDS / CONSTRUIT",
    "shipped":   "SHIPPED / EXPÉDIÉ",
    "known for": "KNOWN FOR / CONNU POUR",
  };

  function cardHTML(f) {
    const cohortPart = (f.number.match(/·\s*(\d+)\s*·/) || ["","00"])[1].padStart(2,"0");
    const seqPart    = (f.number.match(/(\d+)\s*$/)      || ["","0001"])[1].padStart(4,"0");
    const passNo     = `CRK${cohortPart}${seqPart}`;
    const serialNo   = `P${f.number.replace(/[^0-9]/g,"").padStart(9,"0")}`;
    const houseNames = (f.houses || []).map(k => HOUSES[k]?.city || k).join(" · ");
    const n          = (f.houses || []).length;
    const stamps     = (f.houses || []).map((k, i) => stampHTML(k, i)).join("");
    const m          = mrz(f);
    const credsHtml  = (f.creds || []).map(c => `
              <div class="pid__f">
                <span class="pid__lbl">${CRED_LABELS[c.k.toLowerCase()] || c.k.toUpperCase()}</span>
                <span class="pid__val">${c.v}</span>
              </div>`).join("");
    return `
      <article class="fellow-card" data-fellow="${f.id}">
        <div class="fellow-card__flip">
          <div class="fellow-card__face fellow-card__face--front">
            <div class="pid">
              <div class="pid__hdr">
                <div class="pid__country">
                  <div class="pid__emblem">C</div>
                  <div class="pid__cnames">
                    <span>CRACKED HACKERHOUSE</span>
                    <span>PASSEPORT HACKERHOUSE</span>
                    <span>HACKER HAUS AUSWEIS</span>
                    <span>CASA CRACKED PASAPORTE</span>
                  </div>
                </div>
                <div class="pid__metarow">
                  <div class="pid__metacol"><span class="pid__mlab">TYPE</span><span class="pid__mval">PM</span></div>
                  <div class="pid__metacol"><span class="pid__mlab">CODE</span><span class="pid__mval">CRK</span></div>
                  <div class="pid__metacol"><span class="pid__mlab">PASSPORT NO</span><span class="pid__mval">${passNo}</span></div>
                  <div class="pid__holo"></div>
                </div>
              </div>
              <div class="pid__body">
                <div class="pid__photo" style="background-image:url('${f.photo}')">
                  <span class="pid__pbadge">${serialNo}</span>
                </div>
                <div class="pid__fields">
                  <div class="pid__f">
                    <span class="pid__lbl">SURNAME / NOM / APELLIDO</span>
                    <span class="pid__val pid__val--big">${f.surname.toUpperCase()}</span>
                  </div>
                  <div class="pid__f pid__f--row">
                    <div class="pid__sf">
                      <span class="pid__lbl">GIVEN NAMES / PRÉNOMS</span>
                      <span class="pid__val pid__val--med">${f.name}</span>
                    </div>
                    <div class="pid__sf">
                      <span class="pid__lbl">HANDLE / X</span>
                      <span class="pid__val">${f.handle || ""}</span>
                    </div>
                  </div>
                  ${credsHtml}
                  <div class="pid__f pid__f--row">
                    <div class="pid__sf">
                      <span class="pid__lbl">COHORT(S) / MAISONS</span>
                      <span class="pid__val">${houseNames}</span>
                    </div>
                    <div class="pid__sf" style="flex:none">
                      <span class="pid__lbl">&nbsp;</span>
                      <span class="pid__val pid__val--flip" data-flip>${n}&nbsp;${n===1?"stamp":"stamps"}&nbsp;&#8594;</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="pid__mrz">
                <div class="pid__mrzlines">
                  <span>${m[0]}</span>
                  <span>${m[1]}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="fellow-card__face fellow-card__face--back">
            <div class="pstamps">
              <div class="pstamps__top">
                <span>VISAS &middot; RESIDENCIES</span>
                <span class="pstamps__back" data-flip>&#8592; back</span>
              </div>
              <div class="pstamps__grid">${stamps}</div>
              <div class="pstamps__name">${f.name} ${f.surname}</div>
            </div>
          </div>
        </div>
      </article>`;
  }

  grid.innerHTML = FELLOWS.map(cardHTML).join("");

  // Tap a card → flip between the ID page and the stamps page.
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".fellow-card");
    if (!card) return;
    const flipped = card.classList.toggle("is-flipped");
    if (flipped && window.posthog) {
      try { window.posthog.capture("fellow_stamps_open", { fellow_id: card.dataset.fellow }); } catch (_) {}
    }
  });
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

  // Delegated so dynamically-injected [data-panel-link] elements are
  // covered without re-binding.
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-panel-link]");
    if (!el) return;
    const target = el.dataset.panelLink;
    if (!target) return;
    // panel links inside <a href="..."> would otherwise navigate or
    // push a hash; intercept and swap panels in place.
    e.preventDefault();
    // Pills marked [data-disabled="true"] (fellows / about while those
    // pages are still being built) are inert — CSS shows a "coming soon"
    // tooltip on hover; we just swallow the click here.
    if (el.dataset.disabled === "true") return;
    activate(target);
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
