# Camera inspector (removed — restore notes)

A dev tool that previously lived in the hero. Removed once we found a
framing we liked. Documented here so it can be brought back when we
want to fine-tune the camera again.

## What it did

Pressing `D` while the page was loaded:

1. Paused the cinematic camera drift.
2. Enabled Cesium's mouse controls (left-drag = rotate around globe,
   right-drag = tilt, scroll = zoom).
3. Showed a black readout pill at the bottom of the hero with three
   sliders + a live text dump of the resulting camera parameters,
   formatted to paste straight back into `script.js`.

Sliders:

| slider | range            | bound to                                |
|--------|------------------|-----------------------------------------|
| orbit  | 0 – 360°         | heading in `HeadingPitchRange`          |
| pitch  | −89° to −1°      | pitch in `HeadingPitchRange`            |
| range  | 500 – 30000 m    | range (distance from focus) in `HPR`    |

Each slider applied `viewer.camera.lookAt(focusCart, new HeadingPitchRange(...))`
followed by `viewer.camera.lookAtTransform(Matrix4.IDENTITY)` so the
orbit was around the Da Nang focus point, not Earth's center.

There was also a Mac trackpad two-finger rotate gesture (`gesturestart` /
`gesturechange` events) wired up that called `camera.rotateLeft` with a
focus-point transform, doing the same orbit by twist.

## To restore

1. Re-add the markup in `index.html` inside the `.hero` section, just
   before the closing `</section>` tag of the hero:

```html
<div id="cam-inspect" class="cam-inspect" hidden>
  <div class="cam-inspect__head">
    <span>CAM · free-look ON</span>
    <span class="cam-inspect__hint">slide · drag · scroll · D to close</span>
  </div>
  <div class="cam-inspect__sliders">
    <label class="cam-slider">
      <span class="cam-slider__name">orbit ↻</span>
      <input type="range" id="cam-h" min="0" max="360" step="0.5" value="128" />
      <span class="cam-slider__val" id="cam-h-val">128°</span>
    </label>
    <label class="cam-slider">
      <span class="cam-slider__name">pitch ↕</span>
      <input type="range" id="cam-p" min="-89" max="-1" step="0.5" value="-11" />
      <span class="cam-slider__val" id="cam-p-val">-11°</span>
    </label>
    <label class="cam-slider">
      <span class="cam-slider__name">range →</span>
      <input type="range" id="cam-r" min="500" max="30000" step="100" value="12000" />
      <span class="cam-slider__val" id="cam-r-val">12000m</span>
    </label>
  </div>
  <pre id="cam-inspect-body" class="cam-inspect__body"></pre>
</div>
```

2. Re-add the CSS rules to `styles.css`:

```css
.cam-inspect {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 200;
  min-width: 320px;
  max-width: 480px;
  padding: 12px 16px 14px;
  font-family: var(--mono);
  font-size: 11px;
  color: #fff;
  background: rgba(11, 11, 11, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.cam-inspect[hidden] { display: none; }
.cam-inspect__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  text-transform: uppercase;
}
.cam-inspect__hint { color: rgba(255, 255, 255, 0.45); font-size: 9.5px; }
.cam-inspect__sliders {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.cam-slider {
  display: grid;
  grid-template-columns: 70px 1fr 64px;
  align-items: center;
  gap: 10px;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.06em;
}
.cam-slider__name { text-transform: lowercase; }
.cam-slider__val { text-align: right; color: #fff; font-variant-numeric: tabular-nums; }
.cam-slider input[type="range"] {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 4px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 4px; cursor: pointer;
}
.cam-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 13px; height: 13px;
  border-radius: 50%; background: #fff; border: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}
.cam-slider input[type="range"]::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%; background: #fff; border: 0;
}
.cam-inspect__body {
  margin: 0; white-space: pre; line-height: 1.55;
  font-size: 11.5px; color: #f4f4f0;
  user-select: text; cursor: text;
}
```

3. Re-add the JS to `script.js`. The inspector needs a shared state
   object near the top of the IIFE, then the toggle / readout / slider
   functions, then a `keydown` listener and a `gesturechange` listener.
   The full code lives in this repo's git history — search for
   `cam-inspect` or `toggleInspector` and revert the deletion commit.

   Key entry points:
   - Shared state: `const inspector = { on: false, viewer: null, place: null, raf: 0 };`
   - Bind in `initCesium3D`: `inspector.viewer = viewer; inspector.place = place;`
   - Keyboard: `window.addEventListener("keydown", e => e.key.toLowerCase() === "d" && toggleInspector())`
   - Slider orbit: `viewer.camera.lookAt(focusCart, new Cesium.HeadingPitchRange(...))`
     followed by `viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)`
   - Trackpad twist: same `lookAt` pattern, driven by `e.rotation` deltas
     from `gesturechange`

   Remember to gate the slow-orbit animation on the inspector flag so
   the cinematic motion pauses while the user is editing.

## Workflow when restored

1. Reload the page, wait for the intro animation to settle.
2. Press `D` — drift pauses, sliders appear.
3. Move sliders (or drag the canvas) until the framing is right.
4. Copy the five `arrivalLon / arrivalLat / arrivalHeight / arrivalHeading / arrivalPitch`
   lines from the readout, paste them into the chat or directly into
   `script.js` inside `initCesium3D`.
5. Press `D` to close.
