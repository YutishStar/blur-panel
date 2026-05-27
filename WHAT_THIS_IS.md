# Cracked Hacker House — Landing Site

A one-page, production-grade landing page for **Cracked Hacker House**: a curated, multi-city residency for builders, hackers, and founders who are, frankly, a little cracked.

The page exists to do three things, in order of importance:

1. Make someone feel something the first time they see it.
2. Convince them this is a serious, hand-made operation — not a coworking franchise.
3. Get the right people to click **Apply**.

---

## The Design Direction

The visual language is **premium editorial white** — a clean, gallery-quality canvas with a single liquid-glass pane floating over a live map. Think *Kinfolk* / *Aēsop* / *The Residency* — not warm tungsten film stills.

Direct references (see `/references`):

- `look and feel.png` — the master reference. A bright white page, a black pill nav with "apply now" as the dark anchor, an italic editorial serif headline ("live and grow with the ambitious"), and a single hero subject.
- `layout.png` — the structural diagram. Glass pane on the **left** (headline, sub-copy, apply button); the world **map as Layer 1 on the right**, with a trail moving across the house locations.
- `glass pane on the left.png` — the panel treatment itself: a soft, rounded glass tile with a real `backdrop-filter: blur()`, a faint inner highlight, and minimal type.
- `map (behind but focus on the right side).png` — a desaturated map with colored pins per city; the trail animates between them.

Concretely, the page leans on:

- A **bright, paper-white** canvas (`#fafaf7` / `#ffffff`) — no warm photographic backdrop, no grain veil, no light leaks. Restraint is the look.
- A **live map** as the right-hand hero element, rendered behind the content with city pins for each house (SF · Tokyo · Berlin · Mexico City) and an animated trail that traces a route between them.
- A single **liquid-glass pane** on the left of the hero — real `backdrop-filter: blur()`, soft rounded corners, a thin 1px inner stroke, a near-imperceptible top highlight. It carries the headline, one line of sub-copy, and the Apply button. Nothing else.
- A **black pill nav** at the top, with `apply now` as the filled-dark anchor (per `look and feel.png`).
- Type stack:
  - **Display:** `Instrument Serif` *italic* — characterful, editorial, set very large. This is the voice of the page.
  - **Body:** `Geist` — clean modern grotesque, neutral, set small.
  - **Mono accents:** `JetBrains Mono` — used sparingly for indices, coordinates, and pin labels on the map.
- A **near-monochrome palette**: paper white, ink black, a single warm-neutral mid-grey, and one accent (a quiet moss or oxblood) reserved for the map trail and active pin only.

No frameworks, no build step — just `index.html`, `styles.css`, `script.js`.

---

## Sections

| § | Section | Purpose |
|---|---|---|
| — | Top nav | Black pill, `main · about us · apply now · homes · inspire`; `apply now` is the filled dark anchor. |
| 00 | Hero | Editorial italic headline + Apply on the **left glass pane**. Live map on the **right** with animated trail across the four cities. |
| — | Dispatch ticker | Minimal mono strip — current cohort, seats remaining per city. |
| 01 | The Concept | Three quiet white cards. Plenty of negative space. |
| 02 | The Houses | SF · Tokyo · Berlin · Mexico City — large editorial photography, set against white with mono captions. |
| 03 | A Day in the House | Timeline of a typical Tuesday, rendered as a single glass tile over the map. |
| 04 | Cohort 06, in Review | Roster sketch — names, one-line bios, the rooms they shipped from. |
| 05 | The Application | Closing card — deadline, dates, cost, stipend, Apply CTA. |
| 06 | FAQ | Honest answers, set as a clean accordion. No glass here — just type and rules. |
| — | Footer | Mono, three columns, mark + tagline. |

---

## Interactions

- **Map trail**: an animated path connects the four city pins in a continuous loop; the active pin pulses; on hover the pin reveals its seat count.
- **Cursor-tracked shine** on the hero glass pane (CSS variables updated from JS).
- **Scroll reveal** with a soft fade + 4px upward nudge — no blur-ins, no parallax. The page should feel calm, not cinematic.
- **Nav state**: the pill compresses slightly and gains a hairline border once the page has scrolled past the hero.
- **Reduced motion**: every animation is disabled when `prefers-reduced-motion: reduce` is set.

---

## How to Run / Preview

It's a static site. Any of these works:

```bash
# from the project root
python3 -m http.server 5173
# then open http://localhost:5173
```

```bash
# or, with Node
npx serve .
```

You can also just **double-click `index.html`** to open it in the browser — the only external resources are Google Fonts, the map tiles, and a handful of Unsplash photos, all of which load over the network.

> Heads-up: real `backdrop-filter` is required for the hero glass pane to look right. Modern Safari, Chrome, Edge, and Firefox all support it. On Firefox specifically, make sure `layout.css.backdrop-filter.enabled` is on (it is, by default, on recent versions).

---

## Editing Guide

The most likely things you'll want to change:

- **Brand name** — search `Cracked Hacker House` in `index.html`. It appears in the nav mark, the footer, and the document title.
- **Houses, dates, seats** — `index.html`, inside `<section id="houses">`. Each city's map pin is also defined in `script.js` (`MAP_PINS`), keyed by city code (`sf`, `tyo`, `ber`, `mex`).
- **Cohort number, application deadline, cost** — search `Cohort 07` and `June 28` in `index.html`; both appear in the hero glass pane, the apply section, and the ticker.
- **Map style / trail color** — `styles.css`, `:root` variables `--map-tint` (the desaturation on the map tiles) and `--trail` (the accent color of the animated path).
- **Apply form** — currently the Apply CTAs are anchor links to `#apply` and a placeholder `href="#"` on the main button. Point that at your actual application form / Tally / Typeform / Airtable.
- **Color palette** — `:root` in `styles.css`. The page is intentionally near-monochrome; the only chromatic variable that should ever change is `--trail`.

---

## What's Intentionally Not Here

- No warm tungsten backdrop. No grain. No light leaks.
- No tracking / analytics.
- No newsletter modal.
- No cookie banner (no cookies set).
- No `<form>` element — Apply is a link out to your real application form. Wire that up before going live.

---

## Files

```
blur panel/
├── index.html      — markup + content
├── styles.css      — glass pane, map styling, typography, layout, motion
├── script.js       — map trail, cursor shine, scroll reveal, nav state
├── references/     — moodboard: look and feel, layout, glass pane, map
└── WHAT_THIS_IS.md — this file
```
