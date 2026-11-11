# Restored Pixel Perfect mode

User requested the monitor determine an exact whole-device-pixel scale and the cabinet fit around it. Options now includes **PIXEL PERFECT ON/OFF**, persisted as boolean `pixelPerfect` in SettingsStore. OFF retains the approved fill layout/default. Old v1 `scaling` values remain ignored; current setting uses its own validated field.

The approved616×767 cabinet opening is very slightly wider than the native192×240 aspect ratio. Pixel mode centers a613.6×767 cabinet-unit monitor rectangle inside it (1.2-unit black side inset), preserving the artwork and uniform cabinet scale. The largest fitting integer device-pixel multiple is chosen from the safe visible viewport and DPR; cabinet scale follows that monitor size. Monitor origin snaps to the device pixel grid. Fill mode preserves its existing dimensions. Minimum integer multiple is1: on an exceptionally tiny viewport the cabinet can exceed the available area rather than fractionally shrinking pixels.

Native renderer remains192×240. Phaser zoom/CSS margin, screen metrics and monitor-to-page HTML field coordinates use the same monitor geometry. Resize/visual viewport events and display-density changes recompute layout/input bounds. Cabinet shake remains whole monitor pixels. No CRT/shader/art values changed. Options panel extends to accommodate all7 phone rows with Back at201, native16px M6X11 and previous row geometry/volume touch targets preserved.

## Checks

- Build, full lint/typecheck;119 unit tests/16files;15 installed-Chrome regressions passed.
- `tools/art/check-pixel-perfect.mjs`: actual screenshot device-pixel audit with CRT ON at desktop/phone sizes and DPR1/1.25/1.5/2/3. Every tested monitor origin/size aligns to the device grid.37,840 interior blocks per case, **zero unequal pixel blocks** in all5 cases. Toggles via real Options row, reload persistence and viewport resizing pass. Test contexts use isolated storage. Actual current CharacterSelectScene preview and assets also verified at5184/?menuReview=characters.
- `tools/art/check-pixel-touch.mjs`: mobile390×664/DPR3; touch toggle off/on, music meter, monitor Back and cabinet confirmation after reflow pass. Seven-row phone screenshot in `phone-touch-options.png`.
- Existing Options production slider/settings checks pass; preserved mouse/touch dragging, bounds/wrapping, vibration, CRT/audio, back/home/fight navigation. Captures under `art/menus/options-v2/`.

Local servers restored after finding both stopped: production5181 and dev5184. Normal game http://127.0.0.1:5181/ . No version bump, push/deployment/commit; all prior work preserved.
