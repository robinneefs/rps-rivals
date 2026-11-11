# Anchor v3: light exterior-outline trim

User requested less outer-outline weight without regenerating, with notice beforehand. Announced the deterministic cleanup before editing. No image-generation calls were made. Source remains the unmodified v2 `source/clean-face.png`; v2 atlas/frames/review captures are preserved.

`tools/art/prepare-anchor-sheet-v3.mjs` reproduces v2's extraction, scale, pose correction, cell packing and floor origin, then removes one source-pixel shell only where a dark contour pixel directly borders transparent space. Cardinal neighbours are read from an immutable mask, so the trim cannot propagate inward. The bottom two source rows remain registered. At the0.28 native conversion scale this is a restrained sub-native-pixel contour reduction; it does not remove a whole native-pixel ring.

Native comparison across all9 frames:1117 pixels removed, zero added pixels and zero RGB changes to retained opaque pixels. Interior lines/color regions are untouched. Audit `outline-checks.json`; per-pose source trim counts and unchanged placement in `native-192/alignment.json`.

Review-only atlas `apps/game/public/assets/experiments/anchor-v3.png/.json`. Existing `?art=anchor-sheet` route now loads it. All9 native-frame/CRT/desktop/phone/asset browser checks passed; captures in `review/`. No gameplay, balance, CRT, version or deployment change.
