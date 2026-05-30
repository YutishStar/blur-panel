# Design Guidelines

> Status: settled. This documents the locked-in decisions for the current implementation. Treat as the reference, not a starting point for debate.

---

## Pages

The site is structured as multi-page, but only the landing page is currently built. The nav and footer link to `houses.html` and `fellows.html` as planned future pages. When those pages are built, they should reuse the same `.nav` and `.foot` chrome so the system feels like one product; only the canvas between them changes.

| Path | File | Status |
|------|------|--------|
| `/` | `index.html` | Landing — cinematic dark hero with the 3D map, mission, what-to-expect, FAQ, apply banner. **Built.** |
| `/houses` | `houses.html` | The houses directory — page-level header + poster grid for every active residency. **Planned.** |
| `/fellows` | `fellows.html` | Fellows roster page. **Planned.** |

Standalone pages (anything without the dark `.hero`) should get `is-scrolled` applied to the nav at load via `script.js`, so the pill text reads ink-on-white from the first frame. The page-vignette element is reserved for the landing only — it makes sense over the dark hero, but oppresses a white canvas.

---

## Overall Style

Minimal, editorial, premium. Light neutral canvas, heavy contrast in text and UI chrome, restrained decorative effects. The mood: **quiet luxury + modern landing page** — generous whitespace, a few strong focal points, nothing competing for attention.

---

## Color Palette (locked)

```
--bg:           #ffffff        (page background)
--bg-soft:      #f7f6f3        (soft surface variant)
--ink:          #0b0b0b        (primary text / black elements)
--ink-2:        #2a2a2a        (secondary text)
--ink-3:        #5a5a58        (muted text)
--ink-4:        #8b8b88        (placeholder / de-emphasised)
--accent:       #3d6b4e        (moss green — live dot only, used sparingly)
--accent-soft:  rgba(61,107,78,0.18)
```

The palette is intentionally near-monochrome. The only chromatic element is the accent green, reserved for the live-status pulsing dot. No other colors are introduced.

---

## Typography (locked)

| Role | Family | Weight | Notes |
|------|--------|--------|-------|
| Display / headline | `Instrument Serif` | 400, italic | Set very large; carries the brand voice |
| Body | `Geist` | 300 – 600 | Clean grotesque; stabilises layout |
| Mono accents | `JetBrains Mono` | 400, 500 | Coordinates, labels, chips, inspector |

All three are loaded via Google Fonts with `display=swap`.

---

## Buttons

### Primary (Apply — hero)
- Shape: fully rounded pill (`border-radius: 999px`)
- Fill: solid white sitting on the dark hero, reads as a bright white pill
- Text: ink black
- Trailing `→` arrow that nudges right on hover
- Hover: `translateY(-1px)` + deeper shadow

### Apply CTA on the aurora banner
- Same pill shape, solid white fill, ink text
- Hover: `translateY(-2px)`

> Note: there is no secondary ghost CTA in the hero today. Earlier drafts had an "Explore program" link; it was removed to keep the hero focused on the single Apply action.

---

## Navigation

Single centered pill bar with a right-anchored status badge.

- **Center pill bar** holds four text pills around the brand wordmark: `main`, `houses`, `CrackedHQ.` (serif wordmark), `about us`, `fellows`.
- **Right cluster**: applications-open status badge — glass pill with a pulsing green dot, the label "Applications open", and a mono date range.
- The whole nav is fixed at the top with a soft dark-veil blur shaft that bleeds upward off-screen (no border, no border-radius — feels smushed, never a card).
- Side pills and wordmark flip to ink colour once `.is-scrolled` fires (after scrolling past 85vh).
- Status badge tightens its tint when scrolled.
- The hamburger button and left-side serif logo from earlier mocks are **not** present in the current implementation.

---

## Frosted Glass Treatment

- **Hero veil**: `backdrop-filter: blur(52px) saturate(145%)` — covers the left half of the hero, dissolving toward the map via a mask gradient
- **Hero pane**: transparent shell inside the veil; no card background, no blur of its own
- **House marker card**: `backdrop-filter` glass tile with `rgba(255,255,255,0.055–0.10)` tint and a single-pixel white border
- **Nav pill shaft**: `backdrop-filter: blur(52px) saturate(145%)` with near-zero tint, edge-dissolved on all four sides
- Keep blur values tight — heavy blur reads as muddy

---

## Spacing and Layout

- Global side padding: `clamp(20px, 4vw, 56px)`
- Max content width: `1320px`
- Nav height: `112px` desktop / `92px` tablet
- All section padding via `clamp()` so it breathes at every viewport
- The hero is `position: sticky; top: 0; height: 100vh`; the sheet rises over it with `margin-top: -3vh`
- Mobile hero pane: `margin-left: 20px; padding: 36px 24px 32px` (tighter on small screens)

---

## Map

- **Renderer**: MapLibre GL JS 4 (CDN), Esri World Imagery satellite tiles (no token required).
- **Canvas filter**: subtle contrast/saturation grade applied via CSS for a dark cinematic look.
- **Camera**: `FINAL = { lon, lat, zoom, pitch, bearing }` constant in `script.js`. Use the inspector's *Record view* button to snapshot a new framing.
- **Interaction**: disabled by default (cinematic only). Inspector re-enables drag / scroll-zoom / drag-rotate / touch-pitch on `D` press.
- **Houses page** *(when built)*: no map. `script.js` initialises the map only when `#map` is in the DOM, so standalone pages skip it.

---

## Motion

- Intro camera fly-in: easeInOutQuad, **1800ms**.
- Iris reveal: `clip-path circle()` expand, **1400ms** `cubic-bezier(0.16, 1, 0.3, 1)`.
- Slow orbit after landing: **0.04°/s** (~2.5 hrs per revolution — effectively frozen).
- Scroll reveal: opacity + slight upward translate via IntersectionObserver, soft ease.
- All motion is bypassed (jump to end state) under `prefers-reduced-motion: reduce`.
