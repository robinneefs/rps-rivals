# Combat sprite mask trial

## Riot and Anchor

`riot/preview.html` and `anchor/preview.html` now provide the same nine-frame review: animated idle, individual poses, native/enlarged sizes, and original/alternate/mask panels. Links between all three characters appear at the top of each preview.

- Riot: blue jacket/skirt/shoe accents, white top and buckle, blonde hair. Existing white trim, gloves, leggings and skin are protected.
- Anchor: olive trousers, mustard vest/tank, steel-blue hair, charcoal wraps/buckle, mustard hair tie. Boots, knee patches and skin are protected. The knockout hand has an explicit exclusion contour because its skin overlaps and shares colors with the trousers.

Generate with `node tools/art/prepare-roster-masked-atlases.mjs`, or add `--render-only` to retain edited PNG masks. Each subfolder contains its fixed mask, original/alternate atlases, individual alternate frames, full comparison sheets, authoring geometry/palettes, and per-frame pixel audit. `node tools/art/check-masked-roster.mjs` verifies both previews in headless Chrome: all frame selectors, image loading, animated idle, native-size toggle and page errors. Review all mask changes visually as well; containment audits do not establish anatomy by themselves.

All eighteen poses were inspected against originals and overlays; missed trouser edges, cuff boundaries, the knockout buckle/hand and shared hair/boot shades received additional attention. These remain isolated art previews; no production game asset or runtime behavior is replaced.

## Full-atlas revision

Final installed Taiko cleanup: 136 pixels across all nine poses corrected in the headband/tails and wrist-wrap shadows. Dark headband reds previously assigned to ivory now use the crimson ramp; missed neutral/blue wrap shadows use crimson shadow shades. The generator uses bounded material-neighbor corrections without changing palette stops. `red-speck-cleanup-audit.json` records every changed coordinate and verifies all differences are red-material pixels with identical alpha. The reviewed sheet and installed `public/assets/taiko-alternate.png` match. Portraits and other fighters are untouched.

The current `preview.html` reviews **all nine Taiko combat poses**, with animated idle playback and individual frame selectors. `taiko-masked-atlas.png` is the completed alternate sheet, and `taiko-atlas-material-mask.png` is its fixed editable mask. `all-frames-comparison.png` and `review-0.png` through `review-2.png` show every original, alternate and overlay side by side.

This revision fills the wrist-wrap edge pixels, excludes warm skin shades from the ivory fabric selection, retains the original approved ivory ramp, uses deeper/brighter crimson on wrists and headband, and darkens the charcoal belt. Pose-specific corrections include the rotated knockout headband and victory-pose fasteners. Ankle wraps stay ivory.

Use `node tools/art/prepare-taiko-masked-atlas.mjs` to regenerate selections and output, or add `--render-only` to preserve a manually retouched full-atlas mask. Requires `sharp` or `RPS_SHARP_PATH`. `atlas-audit.json` records checks for every frame: unchanged alpha and no pixel changes outside the fixed material mask. All nine poses were visually compared with originals and material overlays, with additional enlarged wrist inspection. The preview remains isolated from production game artwork.

The earlier single-pose tool below is preserved as experiment history; rerunning it will overwrite the idle preview with the older palette. Use the full-atlas tool for current output.

## Original single-pose trial

Taiko `idle0`, extracted from the installed combat atlas at its original 160 × 160 registration. This isolated trial does not change production artwork.

`preview.html` shows original, alternate, and mask overlay at native and enlarged sizes. `detail-comparison.png` crops empty canvas equally from all three images for convenient inspection.

The tunic/trousers become ivory, headband/wrist wraps crimson, and gold belt/fasteners charcoal. Skin, hair, ankle wraps, ink and transparency remain outside the selected materials.

`taiko-idle-material-mask.png` is the actual editable raster mask: cyan fabric, pink wrist wraps, green headband, gold belt/fasteners. Mask creation uses color-assisted selections within explicitly authored contours. The recoloring pass consumes the fixed mask and applies separate multi-stop shading ramps; it does not infer material from the source color.

Generate with `node tools/art/prepare-sprite-mask-study.mjs` using `sharp` or `RPS_SHARP_PATH`. To preserve a manually retouched PNG mask and rerender the alternate, use `--render-only`. Normal generation overwrites the mask. Geometry and palette stops are recorded in `authoring.json`.

`audit.json` verifies identical alpha, canvas registration, and all pixels outside the mask. Semantic boundary accuracy is assessed visually. One idle pose is a feasibility trial, not validation of the entire combat atlas.
