# Replacement marquee — 2026-10-25

Edge-fit follow-up: the opening is now(104,46,733,161), still horizontally centered at470.5. Export size is1466 ×322. The image has1-unit overscan on each edge inside the clipped holder to avoid fractional-scaling seams. The opening reaches the inner cabinet uprights/rails, filling the previously visible gaps. These settings supersede the original dimensions below.

User-supplied `source.png` replaces the previous composition. User requested restoring the earlier full-width artwork presentation. No generative changes to this illustration.

`tools/art/prepare-marquee.mjs` removes black letterbox padding (keeps source rows96–621), then proportionally center-crops to1442 ×314, written to `apps/game/public/assets/cabinet/marquee-v4.webp`. It fills the existing721 ×157 cabinet opening, with no smaller-art insets. Purple lower bezel, top/bottom soft shadows, centering and flicker are retained. `export.json` records the source dimensions and crop settings.
