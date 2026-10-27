# Native 192 x 240 test mockup

The user's chosen intermediate grid is now the native design resolution for both test scenes, not an enlarged 144x180 composition. Normal gameplay remains unchanged.

## Assets

- `tools/art/prepare-taiko-sheet.mjs --192` prepares all nine sheet poses from the original generated high-resolution sheet at one shared scale. Native idle height100; frames128x128, shared anchor(64,124), atlas384x384. Output `apps/game/public/assets/experiments/taiko-flat-sheet-192.png` plus named JSON atlas. The older75px version is preserved. Alignment and individual frames in `art/experiments/taiko-flat-sheet/native-192/`.
- `tools/art/prepare-preview-192.mjs` prepares the static comparison variants at100px high in96x112 frames, anchor(48,108). Generated variants come from their high-resolution originals; only the legacy hand-drawn grid variant is nearest-resampled from its original small grid. No runtime scaling or palette reduction in the native192 preset.
- Stage `rooftop-192.png` is an explicit192x240 nearest-neighbour preparation of the existing288x360 rooftop. Runtime placement is1:1, so the renderer no longer preserves smaller background pixels.

## UI

`ArtPreviewHud.ts` draws a192x240 transparent HUD texture. No header panels, timer box, persistent ROUND1, bottom hand icons or damage legend. Names sit above the bars. YOU/CPU sit below the outer ends of their bars; round counters sit below the opposite ends, toward the centre. Small5x7 glyph dots and outlines are native1px; the prominent timer uses3x3 native-pixel glyph dots. Text is outlined for contrast against the sky. Health bars retain their own frames and fill. Picking/hit/KO mockup messages remain on transparent backgrounds.

## Later flow decisions (recorded, not implemented)

ROUND1 should appear briefly in the middle at actual round start. Remind players of the cabinet buttons briefly at match start only. Damage values belong on the versus screen and during hits, rather than a permanent bottom legend. Those timed intro/versus sequences are outside this static-mockup pass.

## Rendering and verification

PreviewGrid.ts now accepts the scene's native base width; both scenes pass192 and default to192x240. Other grid presets remain for comparison, capturing the native192 composition into the selected framebuffer. All five presets checked against the real rendered RGBA output: PASS, zero broken cells. Comparison scene192 also passes. Atlas preparation rejects clipped poses; all nine frames selected and visually checked in the browser. Typecheck, lint, production build and formatting checks pass. `in-game.png` captures the final compact HUD in the running cabinet.
