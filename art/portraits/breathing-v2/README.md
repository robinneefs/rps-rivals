# Taiko / Anchor home breathing revision

The previous generated inhale/exhale endpoints altered facial/hand details between frames. Home now uses the unmodified rest portrait for both fighters, with a native-pixel torso displacement in `apps/game/src/fx/portraitBreathing.ts`. A3600ms loop includes a quiet rest,800ms inhale,140ms peak and1100ms exhale; no negative overshoot, whole-image bob or independent facial redraw. Pixel movement is quantized, with a soft spatial falloff. Head/hair, hands/forearms and bottom registration are protected. Original portraits and generated endpoints are preserved. Riot retains her approved original animation and timing.

Reduced motion holds rest. Non-WebGL fallback holds the unchanged portrait. Logo entrance/hover, background, music and CRT treatment are unchanged.

`tools/art/check-portrait-breathing.mjs` captures true192×240 renderer snapshots with CRT temporarily disabled in its isolated test contexts to measure pixels. In both fighters, opaque sampled face/left-hand/right-hand/waist regions show zero changed pixels; chest710/779 sampled pixels move at peak. Reduced motion passes. This is a sampled regional audit, not a claim that every protected pixel was exhaustively compared. Results in `checks.json`; rest/inhale PNGs alongside.

`tools/art/capture-home-breathing.mjs` captures actual current-CRT motion frames and real capture intervals under `{taiko,anchor}-motion/`, plus cabinet PNGs. Native source images and CRT tuning values are untouched. Build, lint, all-workspace typecheck and14 installed-Chrome regression tests passed.
