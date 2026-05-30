# Camera inspector

A dev tool built into the hero. Press `D` while the landing page is open to toggle it.

## What it does

Pressing `D`:

1. Pauses the cinematic slow orbit.
2. Enables MapLibre's interaction handlers: drag to pan, drag-rotate to spin, scroll to zoom, two-finger drag to pitch.
3. Shows the inspector panel anchored to the hero with:
   - Three sliders (orbit bearing, pitch, zoom) bound directly to `map.setBearing`, `map.setPitch`, `map.setZoom`.
   - A live readout of the current center (lat/lon), zoom, pitch, bearing, and the dLon/dLat offset from the `FOCUS_LOCATION` anchor.
   - A **Record view** button — click to start, move the map freely, click **End**. Snapshots the current `lon, lat, zoom, pitch, bearing` and copies a ready-to-paste line for the `FINAL` constant in `script.js`.
   - A **pin dropper** — click "+ Create pin point", then click anywhere on the map to drop a labelled marker (A, B, …, Z, AA, AB, …). Each pin's coordinates are click-to-copy. Pins persist across inspector open/close within the session.

The inspector is hidden on small screens (`max-width: 860px`) because touch devices have no `D` key.

## Slider reference

| slider  | range       | drives          |
|---------|-------------|-----------------|
| orbit ↻ | 0 – 360°    | `map.setBearing` |
| pitch ↕ | 0 – 85°     | `map.setPitch`   |
| range → | zoom 8 – 18 | `map.setZoom`    |

> The slider input IDs (`cam-h`, `cam-p`, `cam-r`) and the displayed min/max in `index.html` are overwritten by `initInspectorSliders()` in `script.js` on open, so the source of truth for slider ranges is `script.js`, not the HTML.

## Workflow to update the camera framing

1. Reload the page, wait for the intro fly-in to settle.
2. Press `D` — slow orbit pauses, inspector appears.
3. Move sliders or drag the map until the framing is right.
4. Click **Record view**, adjust if needed, click **End**.
5. Copy the snippet from the result bar and paste it into the `FINAL` constant inside `initMap` in `script.js`.
6. Press `D` to close.
