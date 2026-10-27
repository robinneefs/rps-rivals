# Taiko idle experiment v1

## Resolution comparison update (2026-10-25)

The preview now has external controls for 288 x 360, 216 x 270, 144 x 180, and 96 x 120, plus independent original / 25% larger / 50% larger fighter sizes. It defaults to 144 x 180 and 25% larger. R cycles resolutions; S cycles sizes. Buttons 1/2/3 keep their comparison modes. This supersedes the original CRT-toggle instructions below: CRT is temporarily hidden only in this scene, without changing saved preferences, to inspect raw pixels. Labels and controls are outside the monitor; the art preview deliberately omits the HUD. Existing textures are rendered into a smaller offscreen texture and enlarged with nearest-neighbour sampling; no source sprites, stage files, normal monitor resolution, or gameplay settings are changed. This is a sampling experiment, not art redrawn for each resolution. Screenshot: low-resolution-preview.png. Work remains on codex/edits.

Created on codex/edits, 2026-10-25, using the built-in image generation tool.

Reference: art/source/fighters-lineup.webp (left fighter). Original output: generated.png.

## Generation prompt

Use case: stylized-concept. Asset type: single production game sprite, TAIKO idle stance. Use the LEFT man in the supplied reference as character identity only; exclude the woman. Red sleeveless Chinese kung-fu top with gold frog fasteners, red baggy trousers, orange headband with two trailing ends, short black hair, short dark goatee, orange-gold sash, white forearm and ankle wraps, black open sandals. Full body facing RIGHT in a readable side-on fighting guard, both fists raised, knees slightly bent, feet apart. Actual transparent background, no floor or shadow, no text, no UI. Draw a clean 1990s 16-bit fighting-game sprite as if on a strict 128x128 pixel canvas with the figure exactly about 100 pixels tall and at most 80 wide, then enlarged with nearest-neighbour into the output. Large coherent square pixel clusters, continuous dark navy 1-game-pixel outline, no isolated noisy pixels, 3 flat tones per material, about 24 colours total. Bold proportions and readable silhouette; no gradients, no antialiasing, no fine hatching, no painted texture. Keep whole body with generous clear padding in a square image. One character, one pose, no sprite sheet. This will be reduced to 100 pixels tall; prioritize clarity at that size.

## Preparation

tools/art/prepare-taiko.mjs uses sharp: threshold alpha at 128, crop to opaque bounds, nearest-neighbour resize to 100 pixels tall (72 wide), centre in a transparent 128 x 128 frame at y=20, quantize to at most 32 palette entries without dithering. Foot anchor: (64,120). This is size/palette preparation, not hand-cleaned pixel art. Original generated output is retained.

Run with sharp available to Node, or set RPS_SHARP_PATH to a sharp package directory, then run node tools/art/prepare-taiko.mjs.

Prepared game asset: apps/game/public/assets/experiments/taiko-idle-v1.png.

## In-game review

Start npm run dev and open /?art=taiko. The comparison uses the actual Phaser monitor camera, rooftop, cabinet, scaling and CRT. It is enabled only in development. 1 compares old vs new at spaced positions; 2 shows mirrored Taiko sprites at the actual current fight positions (120 and 168); 3 shows the original placeholders. C toggles the saved CRT preference. Backquote hides the tuning panel. Normal gameplay is unchanged. This is one static idle pose, not an eight-frame animation sheet.

At current match spacing, the larger sprites' hands/feet touch: review spacing before adopting larger fighters. New sprites also need new HUD/tag placement and action poses before use in normal combat.

No version bump or deployment: this is a local experiment only.

