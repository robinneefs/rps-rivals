# Riot simplified combat sheet v2

User requested Riot regenerated with the same simple Taiko-led workflow as Anchor and improved body-scale consistency across poses. Generated with built-in image generation, using Taiko's original sheet as style master and Riot's original sheet for identity/costume/pose reference. Initial `source/generated.png` is retained; `source/simplified.png` further simplifies shoes, sleeve stripes, hair shading and folds, and enlarges victory's standing body. Exact generation and edit prompts are saved beside those images.

## Native conversion and proportions

`tools/art/prepare-riot-sheet-v2.mjs` requires sharp or RPS_SHARP_PATH. Same nine-component extraction, opaque alpha, nearest-neighbour conversion and named pose contract as Anchor. Idle100 native pixels, keeping Riot Taiko-sized and below Anchor's114. Larger160×160 transparent cells/origin80,156 leave room for the overhead fist without shrinking the body. Base scale derives from idle; remaining visually reviewed victory/kick body-scale corrections are1.08/1.02. These are visual corrections, not a rigorous skeletal rig. Pose bounding heights deliberately differ: idle100, inhale100, punch100, block93, shove94, hurt92, KO28, victory115, kick90. Victory silhouette exceeds idle; bending/lying poses are naturally shorter. Full source/placement audit in `native-192/alignment.json`.

Simple broad shoe shapes, hair masses, jacket stripes and flat base/shadow regions replace small panel/lace/fold detail. Riot's existing costume, short brown hair and cheek patch remain. No new balance, traits or moves.

## Real game review

http://127.0.0.1:5184/?art=riot-sheet uses the existing development-only sheet review scene, current cabinet/rooftop/CRT and native192×240 renderer. Pose/loop controls and Taiko/current-production-Riot comparison are outside the monitor. KO/kick move slightly toward the monitor center for whole-pose inspection. Source PNG, native unpacked frames and atlas are preserved separately from production Riot.

Review atlas: `apps/game/public/assets/experiments/riot-v2.png/.json`. **Production `assets/riot.png/.json` remain unchanged pending visual acceptance**; integration must use the new frame origin or repack to compatible geometry. Anchor's preview remains at `?art=anchor-sheet`.

Build and focused ESLint passed. `RPS_ART_REVIEW=riot-sheet RPS_ANCHOR_REVIEW=art/fighters/riot-v2/review node tools/art/capture-anchor-sheet.mjs` passed all9 poses, native dimensions, Taiko/old-Riot comparison, desktop/phone and missing asset/page-error checks. Actual CRT snapshots/grid in `review/`. No commit/push/deployment/version change; prior work preserved.
