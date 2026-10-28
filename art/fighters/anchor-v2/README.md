# Anchor simplified sheet, v2

User rejected v1's excess detail and requested Taiko's simple production style. Built-in image generation redrew the sheet using Taiko's original sheet as the primary style reference and Anchor v1 as the identity/pose reference. A second edit removed accidentally copied Taiko facial-hair marks from hurt/victory. Original outputs and exact prompts are preserved in `source/generated.png`, `source/clean-face.png`, `source/style-prompt.txt` and `source/face-correction-prompt.txt`. Earlier v1 remains intact.

Broad angular color planes, thick navy outlines, chunky hair masses, plain wraps and simple boots replace fine strands, stitching, laces, little folds and muscle lines. Nine poses retain Anchor's teal/charcoal/rust/olive costume and tall heavyweight silhouette.

Preparation: `tools/art/prepare-anchor-sheet-v2.mjs` (sharp or RPS_SHARP_PATH). Same connected-component/opaque-alpha/nearest-neighbour pipeline as the other fighters. Native idle114px, cell160×160, origin80,156. One idle-derived base scale, with visual anatomical scale corrections1.10 for victory and1.02 for kick; these are hand-reviewed approximations, not a skeleton measurement. Pose silhouettes deliberately have different heights. Placement audit/native frames in `native-192/`; runtime review atlas `apps/game/public/assets/experiments/anchor-v2.png/.json`.

The existing development-only `?art=anchor-sheet` preview now loads v2. Actual rooftop/cabinet/192×240/CRT are preserved. KO moves16px right and kick13px right for whole-silhouette review at the monitor edge; future combat integration needs its own movement/spacing review. Anchor remains unavailable for matches pending artwork review; no balance or traits changed.

Build/focused ESLint passed. `tools/art/capture-anchor-sheet.mjs` checked all9 poses, Taiko/Riot comparisons, native192×240 snapshots, desktop/phone and missing assets/page errors. Captures/checks in `review/`, including `poses-in-game-2x.png`. No package-version bump, push or deployment.
