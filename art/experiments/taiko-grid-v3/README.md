# Taiko native-grid redraw

An original code-drawn reconstruction of the v2 generated image, made at the user's request. This is a visual approximation of that reference, not a claim to preserve every high-resolution source pixel.

- Frame: 64 x 80 pixels, transparent.
- Figure: 75 pixels tall, occupied rows 2 through 76.
- Foot anchor: (32,77).
- Colours: 18 opaque colours used, binary alpha only.
- Runtime: native scale 1 in the 144 x 180 preview; nearest texture filtering. No runtime sprite resizing or palette conversion.

## Source and editing

`tools/art/draw-taiko-grid.mjs` explicitly draws the silhouette, costume, headband, face, limbs and shading on the small grid with integer pixel coordinates. It never loads or samples the generated reference. Sharp only encodes the finished RGBA grid as the runtime PNG; the script decodes it again and asserts byte-identical RGBA values. Nearest-neighbour enlargement is used only for the separate review image.

`pixels.txt` is an editable 64-column, 80-row grid. Each character maps to a colour in `palette.json`; dots are transparent. Individual pixels can be adjusted directly. Re-encode those edits using `node tools/art/draw-taiko-grid.mjs --from-grid`. Run without that flag to reconstruct the grid from the drawing instructions. Sharp must be available to Node or through RPS_SHARP_PATH.

Runtime PNG: `apps/game/public/assets/experiments/taiko-grid-v3.png`. `sprite-6x.png` is a magnified pixel-exact review image. `in-game.png` captures the running preview. No image generator was used for this redraw.

## Review

The dev-only `/?art=taiko` mockup defaults to **Grid redraw**. **Resized generation** displays the previous v2 reference at the same height for comparison; **Earlier sprite** retains v1. The inspection disclosure follows the selected asset. Normal gameplay remains unchanged on codex/edits.
