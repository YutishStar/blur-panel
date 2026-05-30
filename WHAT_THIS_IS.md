# Cracked Hacker House — Site

A small, production-grade marketing site for **Cracked Hacker House**: a curated, multi-city residency for builders, hackers, and founders who are, frankly, a little cracked.

The site exists to do three things, in order of importance:

1. Make someone feel something the first time they see it.
2. Convince them this is a serious, hand-made operation — not a coworking franchise.
3. Get the right people to click **Apply**.

Today it is a single landing page (`index.html`). The nav and footer link to `houses.html` and `fellows.html`, but those pages don't exist yet — the links are placeholders until those sub-pages are built.

---

## The Design Direction

The visual language is **premium editorial white** — a clean, gallery-quality canvas with a single liquid-glass pane floating over a live map. Think *Kinfolk* / *Aēsop* / *The Residency* — not warm tungsten film stills.

Direct references (see `/references`):

- `look and feel.png` — the master reference. A bright white page, a black pill nav, an italic editorial serif headline ("live and grow with the ambitious"), and a single hero subject.
- `layout.png` — the structural diagram. Glass pane on the **left** (headline, sub-copy, apply button); the world **map as Layer 1 on the right**.

Concretely, the page leans on:

- A **dark, cinematic** hero canvas (satellite imagery + atmospheric overlays) that resolves to bright editorial white below the fold.
- A **live MapLibre GL map** with Esri World Imagery tiles as the right-hand hero element, focused on Da Nang. No API key required.
- A single **liquid-glass pane** on the left of the hero with the headline, sub-copy, apply CTA, and fellows preview.
- A **centered pill nav**: four text pills (`main`, `houses`, `about us`, `fellows`) flanking a serif `CrackedHQ.` wordmark, plus an applications-open status badge anchored to the right.
- Type stack:
  - **Display:** `Instrument Serif` *italic* — characterful, editorial, set very large.
  - **Body:** `Geist` — clean modern grotesque, neutral, set small.
  - **Mono accents:** `JetBrains Mono` — indices, coordinates, chips.
- **Near-monochrome palette**: paper white, ink black, one warm-neutral mid-grey, one accent (moss green `#3d6b4e`) for the live-dot only.

No frameworks, no build step — just `index.html`, `styles.css`, `script.js`.

---

## Pages

| Path | File | Status |
|---|---|---|
| `/` | `index.html` | Landing — the cinematic page. **Built.** |
| `/houses` | `houses.html` | Houses directory. **Planned — link exists in nav and footer; file not yet created.** |
| `/fellows` | `fellows.html` | Fellows roster. **Planned — link exists in nav and the hero fellows row; file not yet created.** |

## Sections — landing (`index.html`)

| § | Section | Class / ID |
|---|---|---|
| — | Top nav | `.nav` (centered pills + right status badge) |
| 00 | Hero | `.hero` — cinematic 3D map + glass pane left |
| 01 | Mission / About | `#about .mission` |
| 02 | What to Expect | `#day .expect` — body copy + floating polaroids |
| 03 | FAQ | `#faq .faq` — `<details>` accordion |
| 04 | Apply banner | `#apply .apply` — aurora gradient card |
| — | Footer | `.foot` — brand + nav links + giant wordmark |

---

## Interactions

- **Cinematic map intro**: camera flies from a high orbit to the `FINAL` framing over 1800ms (easeInOutQuad), then enters a near-imperceptible slow drift (0.04°/s ≈ one revolution every 2.5 hours).
- **Iris reveal**: the map is clipped to a zero-radius circle on load; after the intro lands it expands from the house-marker position over 1400ms.
- **House marker**: a floating glass card (HACKER HOUSE · Cohort 1 · Da Nang, Vietnam) tracks the Da Nang anchor in screen space via `map.project()` every frame.
- **Cursor-tracked shine** on the hero glass pane (CSS variables updated from JS pointer events).
- **Scroll reveal** with a soft fade on `.poster` and `.faq__item` elements via IntersectionObserver.
- **Nav state**: `is-scrolled` class flips pill text from white-on-dark to ink-on-white once the page scrolls past 85vh. Standalone pages (any page without a `.hero` element) get this class applied at load.
- **Hero clipping**: `inset()` clip-path shrinks the hero from the bottom as the sheet rises, keeping a ~15vh map strip visible at all times.
- **Reduced motion**: animations and transitions skip / jump to end state when `prefers-reduced-motion: reduce` is set.
- **Camera inspector**: press `D` to open a dev tool to re-frame the map. See `camera-inspector.md`.

---

## How to Run / Preview

It's a static site. Any of these works:

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

```bash
npx serve .
```

You can also just **double-click `index.html`** — the only external resources are Google Fonts, the MapLibre GL JS CDN, the Esri tile server, and a handful of Unsplash photos.

> Heads-up: real `backdrop-filter` is required for the hero veil and glass elements to look right. Modern Safari, Chrome, Edge, and Firefox all support it.

---

## Editing Guide

- **Brand name** — search `Cracked Hacker House` / `CrackedHQ` in `index.html`.
- **Cohort badge** — `.hero__cohort` in the hero pane; update text directly.
- **Map focus / camera framing** — `config.js` (`FOCUS_LOCATION`), and the `FINAL` constant in `script.js`. Use the camera inspector (press `D`) to find a framing.
- **Apply form URL** — the `href="#"` on `.apply__btn` and any other Apply CTAs. Point at your Tally / Typeform / Airtable form before going live.
- **Footer placeholder links** — `donate`, `for investors`, `brand kit`, `keep updated` all currently have `href="#"`. Wire these up before launch.
- **Color palette** — `:root` in `styles.css`.

---

## What's Intentionally Not Here

- No tracking / analytics.
- No newsletter modal.
- No cookie banner (no cookies set).
- No `<form>` element — Apply is a link out to an external form.
- No build step, no framework, no package.json.

---

## Files

```
blur panel/
├── index.html            — landing page (the cinematic one)
├── styles.css            — layout, glass pane, map, typography, motion, page chrome
├── script.js             — map, cursor shine, scroll reveal, nav state, iris reveal, camera inspector
├── config.js             — runtime config (gitignored)
├── config.example.js     — template for config.js
├── .gitignore
├── .env.example          — note redirecting to config.example.js
├── camera-inspector.md   — how to use the D-key camera dev tool
├── design-guidelines.md  — locked design system reference
├── references/           — moodboard: look and feel, layout, glass pane, map
└── WHAT_THIS_IS.md       — this file
```
