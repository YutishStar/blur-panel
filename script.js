/* Cracked Hacker House — interactions
 *
 * 1. Hero map:
 *      a. If a valid Google Maps API key is in config.js → render Google's
 *         Photorealistic 3D Tiles of Da Nang via CesiumJS, with a cinematic
 *         camera fly-in.
 *      b. Otherwise → fall back to the 2D Leaflet map (Bangalore + Da Nang
 *         with alumni dots), so the page keeps working while the key is set up.
 * 2. Cursor-tracked shine on the hero glass pane
 * 3. Scroll reveal
 * 4. Nav state on scroll
 */

(() => {
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Camera inspector shared state. Filled in by initCesium3D once the
  // viewer exists; read by toggleInspector / slider / readout code below.
  const inspector = { on: false, viewer: null, place: null, raf: 0 };

  /* ---------- locations ---------- */
  const HOUSES = [
    { id: "blr", name: "Bangalore", code: "H/01", coords: [12.9716, 77.5946] },
    { id: "dad", name: "Da Nang",   code: "H/02", coords: [16.0544, 108.2022] },
  ];

  const ALUMNI = [
    { name: "New York",   coords: [40.7128,  -74.0060] },
    { name: "London",     coords: [51.5074,   -0.1278] },
    { name: "Singapore",  coords: [ 1.3521,  103.8198] },
    { name: "Lagos",      coords: [ 6.5244,    3.3792] },
    { name: "Cape Town",  coords: [-33.9249,  18.4241] },
    { name: "Dubai",      coords: [25.2048,   55.2708] },
    { name: "Seoul",      coords: [37.5665,  126.9780] },
    { name: "São Paulo",  coords: [-23.5505, -46.6333] },
    { name: "Istanbul",   coords: [41.0082,   28.9784] },
    { name: "Mumbai",     coords: [19.0760,   72.8777] },
    { name: "Mexico City",coords: [19.4326,  -99.1332] },
    { name: "Nairobi",    coords: [-1.2921,   36.8219] },
  ];

  /* ---------- map: choose the engine ---------- */
  const mapEl = document.getElementById("map");
  const cfg = window.CONFIG || {};
  const apiKey = cfg.GOOGLE_MAPS_API_KEY;
  const focus = cfg.FOCUS_LOCATION || { name: "Da Nang", lon: 108.224, lat: 16.054 };
  const hasValidKey =
    typeof apiKey === "string" &&
    apiKey.length > 20 &&
    !apiKey.includes("YOUR_") &&
    !apiKey.includes("PLACEHOLDER");
  const use3D = cfg.USE_3D === true && hasValidKey && !!window.Cesium;

  if (mapEl) {
    if (use3D) {
      initCesium3D(mapEl, apiKey, focus);
    } else if (window.L) {
      initLeaflet2D(mapEl);
    }
  }

  /* =========================================================
     CESIUM — Google Photorealistic 3D Tiles, focused on Da Nang
     ========================================================= */
  async function initCesium3D(el, key, place) {
    // Cesium will warn without an Ion token. We don't use any Ion-hosted
    // assets — the imagery comes entirely from Google's 3D tileset.
    Cesium.Ion.defaultAccessToken = "";

    const viewer = new Cesium.Viewer(el, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });

    // The Google 3D tileset includes terrain; hide Cesium's default globe so
    // it doesn't render as a separate sphere underneath.
    viewer.scene.globe.show = false;

    // Atmosphere: a subtle haze in the distance so the horizon doesn't end
    // abruptly. Cheap, no post-process needed.
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.00022;
    viewer.scene.fog.minimumBrightness = 0.85;
    // Hide the Cesium sky/space tint — we want the page background to read
    // through where the tileset doesn't cover.
    viewer.scene.skyBox.show = false;
    viewer.scene.sun.show = false;
    viewer.scene.moon.show = false;
    viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;

    // Disable all user interaction — the camera is purely cinematic
    // (the inspector flips these back on while it's open)
    const ctl = viewer.scene.screenSpaceCameraController;
    ctl.enableRotate = false;
    ctl.enableTranslate = false;
    ctl.enableZoom = false;
    ctl.enableTilt = false;
    ctl.enableLook = false;

    // Expose the viewer + focus to the inspector so D-toggle can drive
    // the camera once the page is interactive.
    inspector.viewer = viewer;
    inspector.place = place;

    // Narrow the field of view so the scene reads as long-lens cinema
    // rather than wide-angle satellite. Subject compresses, distances
    // collapse, and Son Tra fills the middle of the frame.
    viewer.camera.frustum.fov = Cesium.Math.toRadians(50);

    // Hide the little Cesium logo that ships with the widget; Google's
    // attribution stays (required by the Map Tiles API ToS).
    if (viewer.cesiumWidget && viewer.cesiumWidget.creditContainer) {
      const cesiumLogo = viewer.cesiumWidget.creditContainer.querySelector(".cesium-credit-logoContainer");
      if (cesiumLogo) cesiumLogo.style.display = "none";
    }

    // FINAL is the absolute camera world position + facing direction.
    // Use the "Record view" tool in the inspector (press D) to capture
    // these values — move the scene how you want, click End, copy/paste.
    const FINAL = { lon: 108.1078, lat: 16.1367, height: 6229, heading: 113.4, pitch: -19.9 };

    // START uses orbit-relative coords (lookAt around Da Nang) just for
    // the dramatic fly-in. We read the Cartesian3 position it produces,
    // then lerp toward FINAL's absolute position so the landing is exact.
    const START = { heading: 72, pitch: -38, range: 44000 };
    applyOrbit(viewer, place, START.heading, START.pitch, START.range);
    const startPos    = viewer.camera.position.clone();
    const startH      = Cesium.Math.toDegrees(viewer.camera.heading);
    const startP      = Cesium.Math.toDegrees(viewer.camera.pitch);
    const finalPos    = Cesium.Cartesian3.fromDegrees(FINAL.lon, FINAL.lat, FINAL.height);
    const lerpScratch = new Cesium.Cartesian3();

    // Load Google's Photorealistic 3D Tiles
    let tileset;
    try {
      tileset = await Cesium.Cesium3DTileset.fromUrl(
        `https://tile.googleapis.com/v1/3dtiles/root.json?key=${encodeURIComponent(key)}`,
        { showCreditsOnScreen: true }
      );
      viewer.scene.primitives.add(tileset);
    } catch (err) {
      console.error(
        "[Cracked Hacker House] Failed to load Google Photorealistic 3D Tiles. " +
        "Check that the API key in config.js has 'Map Tiles API' enabled and " +
        "isn't restricted from this origin.",
        err
      );
      // graceful fallback: tear down Cesium and start Leaflet
      viewer.destroy();
      el.innerHTML = "";
      if (window.L) initLeaflet2D(el);
      return;
    }

    // Cinematic intro: a slow descending orbit. The camera starts high
    // and steep, and over a few seconds spirals in toward Da Nang,
    // dropping range + pitch while sweeping ~60° around the focus.
    // Once it lands on FINAL, an infinitely-slow orbit takes over so
    // the scene keeps breathing.
    const startIntro = () => {
      startMarkerProjection(viewer, place);
      const onLanded = () => {
        document.getElementById("house-marker")?.classList.add("is-landed");
      };
      if (reduceMotion) {
        viewer.camera.setView({
          destination: finalPos,
          orientation: { heading: Cesium.Math.toRadians(FINAL.heading), pitch: Cesium.Math.toRadians(FINAL.pitch), roll: 0 }
        });
        viewer.scene.requestRender();
        onLanded();
        return;
      }
      const duration = 3800; // ms — quick but still reads as cinematic
      const t0 = performance.now();
      const step = (now) => {
        if (inspector.on) { requestAnimationFrame(step); return; }
        const t = Math.min(1, (now - t0) / duration);
        const e = easeInOutQuad(t);
        Cesium.Cartesian3.lerp(startPos, finalPos, e, lerpScratch);
        viewer.camera.setView({
          destination: lerpScratch,
          orientation: {
            heading: Cesium.Math.toRadians(lerpAngle(startH, FINAL.heading, e)),
            pitch:   Cesium.Math.toRadians(lerp(startP, FINAL.pitch, e)),
            roll: 0
          }
        });
        viewer.scene.requestRender();
        if (t < 1) requestAnimationFrame(step);
        else {
          startSlowOrbit(viewer, FINAL);
          onLanded();
        }
      };
      requestAnimationFrame(step);
    };

    // Wait briefly so the first frame paints before the intro starts
    setTimeout(startIntro, reduceMotion ? 0 : 450);

    // Keep the viewer sized correctly when the window resizes
    window.addEventListener("resize", () => viewer.resize());
  }

  /* Place the camera at a (heading, pitch, range) around the focus
     point. We use lookAt + an immediate transform release so any
     subsequent setView calls still operate in world space. */
  function applyOrbit(viewer, place, headingDeg, pitchDeg, range) {
    const center = Cesium.Cartesian3.fromDegrees(place.lon, place.lat, 0);
    viewer.camera.lookAt(
      center,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(headingDeg),
        Cesium.Math.toRadians(pitchDeg),
        range
      )
    );
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    viewer.scene.requestRender();
  }

  /* After the intro lands, keep the camera quietly orbiting the focus
     at the final pitch + range. Very slow so it never reads as motion
     sickness — about one revolution every six minutes. */
  function startSlowOrbit(viewer, final) {
    const degPerSec = 0.04; // 360° in ~2.5 hours — effectively frozen
    let last = performance.now();
    let heading = final.heading;
    const pos = Cesium.Cartesian3.fromDegrees(final.lon, final.lat, final.height);
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!inspector.on) {
        heading = (heading + degPerSec * dt) % 360;
        viewer.camera.setView({
          destination: pos,
          orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(final.pitch), roll: 0 }
        });
        viewer.scene.requestRender();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* tiny easing + lerp helpers */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  /* lerp two angles on the short arc through ±360° */
  function lerpAngle(a, b, t) {
    let d = ((b - a + 540) % 360) - 180;
    return a + d * t;
  }

  /* Project the Da Nang anchor to screen space every frame so the
     floating HACKER HOUSE marker tracks the camera. */
  function startMarkerProjection(viewer, place) {
    const marker = document.getElementById("house-marker");
    if (!marker) return;
    const anchor = Cesium.Cartesian3.fromDegrees(place.lon, place.lat, 30);

    const update = () => {
      const project =
        Cesium.SceneTransforms.worldToWindowCoordinates ||
        Cesium.SceneTransforms.wgs84ToWindowCoordinates;
      const win = project(viewer.scene, anchor);
      if (!win) {
        marker.hidden = true;
        return;
      }
      // simple horizon test: the anchor is behind the camera if its
      // dot product with the camera direction is negative
      const cam = viewer.camera;
      const toAnchor = Cesium.Cartesian3.subtract(anchor, cam.positionWC, new Cesium.Cartesian3());
      const dot = Cesium.Cartesian3.dot(toAnchor, cam.directionWC);
      if (dot <= 0) {
        marker.hidden = true;
        return;
      }
      marker.hidden = false;
      marker.style.transform = `translate3d(${win.x}px, ${win.y}px, 0)`;
    };

    viewer.scene.postRender.addEventListener(update);
    update();
  }

  /* =========================================================
     LEAFLET — 2D fallback (used while the API key is unset)
     ========================================================= */
  function initLeaflet2D(el) {
    const map = L.map(el, {
      center: [25, -70],
      zoom: 2.2,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoom: true,
      worldCopyJump: true,
      preferCanvas: true,
      zoomSnap: 0.25,
    });

    // CartoDB Voyager — subtle color in oceans, land, parks. Premium but alive.
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap · © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Helper: a quadratic-bezier arc between two [lat, lng] points.
    // Apex offset perpendicular to the segment, scaled by distance, so the
    // result looks like a great-circle-ish flight path.
    const arcPoints = (start, end, height = 0.22, segments = 48) => {
      const [lat1, lng1] = start;
      const [lat2, lng2] = end;
      const dLat = lat2 - lat1;
      const dLng = lng2 - lng1;
      const dist = Math.hypot(dLat, dLng);
      if (dist === 0) return [start, end];
      const perpLat =  dLng / dist;
      const perpLng = -dLat / dist;
      const apexLat = (lat1 + lat2) / 2 + perpLat * dist * height;
      const apexLng = (lng1 + lng2) / 2 + perpLng * dist * height;
      const pts = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const it = 1 - t;
        pts.push([
          it * it * lat1 + 2 * it * t * apexLat + t * t * lat2,
          it * it * lng1 + 2 * it * t * apexLng + t * t * lng2,
        ]);
      }
      return pts;
    };

    ALUMNI.forEach((a) => {
      const icon = L.divIcon({
        className: "map-pin-wrap",
        html: `<div class="map-pin map-pin--alumni"><span class="map-pin__dot"></span></div>`,
        iconSize: [6, 6],
        iconAnchor: [3, 3],
      });
      L.marker(a.coords, { icon, keyboard: false, interactive: false }).addTo(map);
    });

    const pinMarkers = HOUSES.map((h) => {
      const labelSide = h.coords[1] > 100 ? "map-pin__label--left" : "";
      const icon = L.divIcon({
        className: "map-pin-wrap",
        html: `
          <div class="map-pin map-pin--active">
            <span class="map-pin__halo"></span>
            <span class="map-pin__dot"></span>
            <span class="map-pin__label ${labelSide}">${h.name} · ${h.code}</span>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      return L.marker(h.coords, { icon, keyboard: false, interactive: false, opacity: 0 }).addTo(map);
    });

    // Main hub-to-hub arc — curved, moss green, the most prominent line on the map.
    // Drawn in two layers: a wide soft underglow + a sharp dashed top.
    const hubArc = arcPoints(HOUSES[0].coords, HOUSES[1].coords, 0.28, 64);
    const trailGlow = L.polyline(hubArc, {
      color: "#3d6b4e",
      weight: 6,
      opacity: 0,
      lineCap: "round",
      interactive: false,
    }).addTo(map);
    const trail = L.polyline(hubArc, {
      color: "#3d6b4e",
      weight: 1.8,
      opacity: 0,
      dashArray: "3 8",
      lineCap: "round",
      interactive: false,
    }).addTo(map);

    const bounds = L.latLngBounds(HOUSES.map((h) => h.coords));
    const padForRightSide = () => ({
      paddingTopLeft: [Math.round(window.innerWidth * 0.42), 120],
      paddingBottomRight: [80, 120],
    });

    if (reduceMotion) {
      map.fitBounds(bounds, padForRightSide());
      pinMarkers.forEach((m) => m.setOpacity(1));
      trail.setStyle({ opacity: 0.85 });
      trailGlow.setStyle({ opacity: 0.18 });
    } else {
      setTimeout(() => {
        map.flyToBounds(bounds, { ...padForRightSide(), duration: 1.9, easeLinearity: 0.35 });
      }, 500);

      let armed = false;
      setTimeout(() => { armed = true; }, 550);
      map.on("moveend", () => {
        if (!armed) return;
        armed = false;
        pinMarkers.forEach((m, i) => setTimeout(() => m.setOpacity(1), i * 180));
        let o = 0;
        const t = setInterval(() => {
          o += 0.08;
          trail.setStyle({ opacity: Math.min(o, 0.85) });
          trailGlow.setStyle({ opacity: Math.min(o * 0.22, 0.18) });
          if (o >= 0.85) clearInterval(t);
        }, 40);
      });
    }

    window.addEventListener("resize", () => map.invalidateSize());
  }

  /* =========================================================
     UI bits — cursor shine, scroll reveal, nav state
     ========================================================= */
  if (supportsHover && !reduceMotion) {
    document.querySelectorAll(".hero__pane").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      });
    });
  }

  // Keep reveals narrow on the post-hero sections so content is never blanked
  // out waiting for the observer to fire. Only a couple of accents fade in —
  // and only ones whose absence on first paint doesn't make the page look empty.
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
     Weather — Open-Meteo (no key required) for the focus location
     ========================================================= */
  fetchFocusWeather(focus).catch(() => { /* silent — placeholder stays */ });

  async function fetchFocusWeather(place) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}` +
      `&longitude=${place.lon}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather fetch failed");
    const data = await res.json();
    const t = Math.round(data?.current?.temperature_2m);
    const code = data?.current?.weather_code;
    if (!Number.isFinite(t) || code == null) return;

    const wx = wmoToWeather(code);
    const temp = document.getElementById("hero-loc-temp");
    const desc = document.getElementById("hero-loc-desc");
    const icon = document.getElementById("hero-loc-icon");
    if (temp) temp.textContent = `${t}°C`;
    if (desc) desc.textContent = wx.label;
    if (icon) icon.textContent = wx.glyph;
  }

  /* WMO weather code → label + glyph. Tight subset, good enough for a chip. */
  function wmoToWeather(code) {
    if (code === 0) return { label: "Sunny", glyph: "☀" };
    if (code >= 1 && code <= 3) return { label: "Mostly clear", glyph: "◐" };
    if (code === 45 || code === 48) return { label: "Foggy", glyph: "≋" };
    if (code >= 51 && code <= 57) return { label: "Drizzle", glyph: "☂" };
    if (code >= 61 && code <= 67) return { label: "Rain", glyph: "☂" };
    if (code >= 71 && code <= 77) return { label: "Snow", glyph: "❄" };
    if (code >= 80 && code <= 82) return { label: "Showers", glyph: "☂" };
    if (code >= 95 && code <= 99) return { label: "Storm", glyph: "⚡" };
    return { label: "Clear", glyph: "◐" };
  }

  /* =========================================================
     Camera inspector — press D to take manual control of the
     Cesium camera and stream the live values to a readout box.
     Read the numbers, paste them back, I bake them into the file.
     ========================================================= */
  window.addEventListener("keydown", (e) => {
    if (e.key !== "d" && e.key !== "D") return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    toggleInspector();
  });

  function toggleInspector() {
    if (!inspector.viewer) return;
    inspector.on = !inspector.on;
    const ctl = inspector.viewer.scene.screenSpaceCameraController;
    ctl.enableRotate = inspector.on;
    ctl.enableTranslate = inspector.on;
    ctl.enableZoom = inspector.on;
    ctl.enableTilt = inspector.on;
    ctl.enableLook = inspector.on;
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
     Record View — click Record, move the map however you want,
     click End. Snapshots the camera at that exact moment and
     produces a ready-to-paste FINAL snippet.
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
        } catch { /* blocked */ }
      };
    }
  }

  function startRecording() {
    if (!inspector.viewer) return;
    inspector.grabRecording = true;

    // Hide any previous result
    const result = document.getElementById("cam-grab-result");
    if (result) result.hidden = true;

    // Swap button to "End" state — red dot, pulsing, clear label
    const btn = document.getElementById("cam-grab-btn");
    if (btn) {
      btn.classList.add("is-recording");
      btn.querySelector(".cam-grab-btn__label").textContent = "End";
    }
  }

  function stopRecording() {
    if (!inspector.viewer) return;
    inspector.grabRecording = false;

    // Reset button
    const btn = document.getElementById("cam-grab-btn");
    if (btn) {
      btn.classList.remove("is-recording");
      btn.querySelector(".cam-grab-btn__label").textContent = "Record view";
    }

    // Snapshot absolute camera world position + facing direction
    const cam    = inspector.viewer.camera;
    const carto  = Cesium.Cartographic.fromCartesian(cam.positionWC);
    const lon    = +(Cesium.Math.toDegrees(carto.longitude).toFixed(4));
    const lat    = +(Cesium.Math.toDegrees(carto.latitude).toFixed(4));
    const height = Math.round(carto.height);
    const heading = +((((Cesium.Math.toDegrees(cam.heading) % 360) + 360) % 360).toFixed(1));
    const pitch   = +(Cesium.Math.toDegrees(cam.pitch).toFixed(1));

    const snippet = `lon: ${lon}, lat: ${lat}, height: ${height}, heading: ${heading}, pitch: ${pitch}`;
    const code    = document.getElementById("cam-grab-code");
    const result  = document.getElementById("cam-grab-result");
    if (code)   code.textContent = snippet;
    if (result) result.hidden = false;
  }

  function disarmGrab() {
    // Called when inspector closes — reset everything cleanly
    if (inspector.grabRecording) stopRecording();
  }

  /* =========================================================
     Pin dropper — click "Create pin point", then click the
     scene. The picked world position is turned into lon/lat/h,
     labeled A/B/C…, drawn as a Cesium entity, and pushed into
     a clickable-to-copy list in the inspector UI.
     ========================================================= */
  function initPinDropper() {
    if (!inspector.viewer) return;
    const btn = document.getElementById("cam-pin-btn");
    if (!btn) return;
    if (!inspector.pins) inspector.pins = [];
    if (!inspector.pinHandler) {
      inspector.pinHandler = new Cesium.ScreenSpaceEventHandler(
        inspector.viewer.scene.canvas
      );
    }
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
    if (!inspector.viewer || inspector.dropping) return;
    inspector.dropping = true;
    const btn = document.getElementById("cam-pin-btn");
    const lbl = btn?.querySelector(".cam-pin-btn__label");
    if (btn) btn.classList.add("is-armed");
    if (lbl) lbl.textContent = "click on the scene…";
    inspector.viewer.scene.canvas.style.cursor = "crosshair";
    // Suppress camera rotation while arming so the click isn't eaten by a
    // drag-rotate. Restored on stopPinDrop.
    const ctl = inspector.viewer.scene.screenSpaceCameraController;
    inspector.savedCtl = {
      rotate: ctl.enableRotate,
      tilt: ctl.enableTilt,
      look: ctl.enableLook,
    };
    ctl.enableRotate = false;
    ctl.enableTilt = false;
    ctl.enableLook = false;
    inspector.pinHandler.setInputAction((evt) => {
      const scene = inspector.viewer.scene;
      // Prefer pickPosition (3D tileset depth) so we land on a building.
      // Fall back to globe.pick for sky-or-edge cases.
      let cart = scene.pickPosition(evt.position);
      if (!Cesium.defined(cart)) {
        const ray = inspector.viewer.camera.getPickRay(evt.position);
        if (ray) cart = scene.globe.pick(ray, scene);
      }
      if (!Cesium.defined(cart)) {
        stopPinDrop();
        return;
      }
      const carto = Cesium.Cartographic.fromCartesian(cart);
      addPin(
        Cesium.Math.toDegrees(carto.longitude),
        Cesium.Math.toDegrees(carto.latitude),
        carto.height
      );
      stopPinDrop();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function stopPinDrop() {
    if (!inspector.dropping) return;
    inspector.dropping = false;
    const btn = document.getElementById("cam-pin-btn");
    const lbl = btn?.querySelector(".cam-pin-btn__label");
    if (btn) btn.classList.remove("is-armed");
    if (lbl) lbl.textContent = "+ Create pin point";
    if (inspector.viewer) {
      inspector.viewer.scene.canvas.style.cursor = "";
      if (inspector.pinHandler) {
        inspector.pinHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
      }
      const ctl = inspector.viewer.scene.screenSpaceCameraController;
      if (inspector.savedCtl) {
        ctl.enableRotate = inspector.savedCtl.rotate;
        ctl.enableTilt = inspector.savedCtl.tilt;
        ctl.enableLook = inspector.savedCtl.look;
        inspector.savedCtl = null;
      }
    }
  }

  function addPin(lon, lat, height) {
    const label = pinLabel(inspector.pins.length);
    const entity = inspector.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      point: {
        pixelSize: 10,
        color: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString("#0b0b0b"),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: label,
        font: "600 12px 'JetBrains Mono', monospace",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString("#0b0b0b"),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(12, -10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    inspector.pins.push({ label, lon, lat, height, entity });
    inspector.viewer.scene.requestRender();
    renderPinList();
  }

  /* A, B, …, Z, AA, AB, … so the dropper doesn't run out of labels. */
  function pinLabel(idx) {
    let s = "";
    let n = idx;
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
      const copyText =
        `${pin.label}: lon ${pin.lon.toFixed(6)}, ` +
        `lat ${pin.lat.toFixed(6)}, ` +
        `h ${pin.height.toFixed(1)}m`;
      coords.textContent =
        `${pin.lon.toFixed(5)}, ${pin.lat.toFixed(5)} · ` +
        `${Math.round(pin.height)}m`;
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
        } catch {
          /* clipboard may be blocked — silent */
        }
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "cam-pin-row__del";
      del.setAttribute("aria-label", `delete pin ${pin.label}`);
      del.textContent = "×";
      del.addEventListener("click", () => removePin(i));

      li.append(name, coords, del);
      list.appendChild(li);
    });
  }

  function removePin(idx) {
    const pin = inspector.pins[idx];
    if (!pin) return;
    inspector.viewer.entities.remove(pin.entity);
    inspector.pins.splice(idx, 1);
    // Re-label remaining pins so the list stays A, B, C…
    inspector.pins.forEach((p, i) => {
      p.label = pinLabel(i);
      if (p.entity && p.entity.label) p.entity.label.text = p.label;
    });
    inspector.viewer.scene.requestRender();
    renderPinList();
  }

  /* Slider control: orbit around the focus point. Each slider directly
     positions the camera via lookAt(focus, HeadingPitchRange), so
     moving "orbit" sweeps the camera around Da Nang in a circle. */
  function initInspectorSliders() {
    if (!inspector.viewer) return;
    const place = inspector.place || focus;
    const focusCart = Cesium.Cartesian3.fromDegrees(place.lon, place.lat, 0);

    const h = document.getElementById("cam-h");
    const p = document.getElementById("cam-p");
    const r = document.getElementById("cam-r");
    const hv = document.getElementById("cam-h-val");
    const pv = document.getElementById("cam-p-val");
    const rv = document.getElementById("cam-r-val");
    if (!h || !p || !r) return;

    // initialize the sliders from where the camera currently is, so
    // moving them from there feels continuous.
    const camCarto = Cesium.Cartographic.fromCartesian(inspector.viewer.camera.position);
    const dLon = Cesium.Math.toDegrees(camCarto.longitude) - place.lon;
    const dLat = Cesium.Math.toDegrees(camCarto.latitude) - place.lat;
    const bearing = ((Math.atan2(dLon, dLat) * 180) / Math.PI + 360) % 360;
    const range3D = Cesium.Cartesian3.distance(inspector.viewer.camera.position, focusCart);
    h.value = bearing.toFixed(1);
    p.value = "-15";
    r.value = Math.max(500, Math.min(30000, Math.round(range3D))).toString();

    const apply = () => {
      const headingDeg = parseFloat(h.value);
      const pitchDeg = parseFloat(p.value);
      const rangeM = parseFloat(r.value);
      hv.textContent = `${headingDeg.toFixed(0)}°`;
      pv.textContent = `${pitchDeg.toFixed(0)}°`;
      rv.textContent = `${Math.round(rangeM)}m`;
      inspector.viewer.camera.lookAt(
        focusCart,
        new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(headingDeg),
          Cesium.Math.toRadians(pitchDeg),
          rangeM
        )
      );
      // release the lookAt frame so other inputs (mouse drag) work in
      // world space again until the next slider event
      inspector.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      inspector.viewer.scene.requestRender();
    };

    h.oninput = apply;
    p.oninput = apply;
    r.oninput = apply;
    // sync labels without moving the camera on open
    hv.textContent = `${parseFloat(h.value).toFixed(0)}°`;
    pv.textContent = `${parseFloat(p.value).toFixed(0)}°`;
    rv.textContent = `${Math.round(parseFloat(r.value))}m`;
  }

  function startInspectorReadout() {
    const body = document.getElementById("cam-inspect-body");
    if (!body) return;
    const place = inspector.place || focus;
    const tick = () => {
      const cam = inspector.viewer.camera;
      const carto = Cesium.Cartographic.fromCartesian(cam.position);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const height = carto.height;
      const heading = ((Cesium.Math.toDegrees(cam.heading) % 360) + 360) % 360;
      const pitch = Cesium.Math.toDegrees(cam.pitch);
      const dLon = lon - place.lon;
      const dLat = lat - place.lat;
      body.textContent =
        `arrivalLon    = place.lon ${dLon >= 0 ? "+" : "-"} ${Math.abs(dLon).toFixed(4)}\n` +
        `arrivalLat    = place.lat ${dLat >= 0 ? "+" : "-"} ${Math.abs(dLat).toFixed(4)}\n` +
        `arrivalHeight = ${Math.round(height)}\n` +
        `arrivalHeading= ${heading.toFixed(1)}\n` +
        `arrivalPitch  = ${pitch.toFixed(1)}\n` +
        `\n` +
        `(abs lon ${lon.toFixed(4)}, lat ${lat.toFixed(4)})`;
      inspector.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();
