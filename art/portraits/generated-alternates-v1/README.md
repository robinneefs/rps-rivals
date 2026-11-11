# Generated alternate portraits · first review

Created with the built-in image_gen tool as reference-based image edits, not material masks. Exact prompts are saved in `prompts.json`.

The originals are extracted using each installed atlas's `frames.rest.frame` from `apps/game/public/assets/menus/action/{taiko,riot,anchor}-sheet.png`. The game loads these in BootScene via HOME_CHARACTERS; characterPresentation selects the same textures. VictoryView explicitly displays the `rest` frame, as do HomeScene, character-select crops, and VersusView. Neither the old inhale/exhale frames nor historical art sources are used.

Each reference is nearest-neighbor enlarged to 768 × 960 for image editing. The tool returned 1122 × 1402 transparent PNGs, kept intact as `*-generated.png`. `*-alternate-native.png` scales the full returned canvas to 192 × 240 with nearest-neighbor sampling. There is no silhouette warping, masking, color replacement, or anatomy repair in this packaging step. Generated alpha is preserved.

Open `preview.html` to compare the original, generated alternate, and silhouette overlap, at native or enlarged size. The original and alternate occupy the same registered canvas; that does **not** mean their interior details or outlines are identical. First-pass silhouette IoU at alpha ≥128: Taiko 95.7%, Riot 98.1%, Anchor 97.4%. These measurements only compare occupied pixels and do not validate faces, fingers, shading, or color fidelity. Visual review found close poses with small outline/detail changes, including Taiko's tails/hem. The user should judge the generated variations before integration.

`audit.json` confirms that reference pixels match the installed rest frames and records output dimensions/transparency and silhouette measurements. `browser-audit.json` confirms all three selectors/images and native-size switching work without page errors.

Repackage existing generations using `node tools/art/prepare-generated-portrait-review.mjs` with `sharp` or `RPS_SHARP_PATH`. Check the local review with `node tools/art/check-generated-portrait-review.mjs`.

No production game asset or runtime code has been replaced.
