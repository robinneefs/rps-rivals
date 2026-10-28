# Taiko regenerated sheet v2

User requested regenerating Taiko through the same simple-style/native-preparation workflow as Anchor and Riot, with consistent physical proportions across poses. Built-in image generation used Taiko's original sheet as identity/costume/style reference. Original output is preserved in `source/generated.png`; exact prompt in `source/generation-prompt.txt`. Original production Taiko and all previous sheets remain intact.

Same broad flat angular shapes, restrained navy contours, sparse interior lines, red tunic/trousers, orange headband, gold sash, white wraps and sandals. No new costume, moves, traits or balance.

`tools/art/prepare-taiko-sheet-v2.mjs` uses the established nine-component extraction/opaque alpha/nearest-neighbour pipeline. Idle100 native pixels;160×160 transparent cells, origin80,156; same floor as Riot100 and Anchor114. One idle-derived source scale, with a visual1.05 victory correction so the raised fist gets extra height without shrinking the standing body. Kick uses the base scale. This is hand-reviewed anatomical consistency, not a measured skeletal rig; silhouette heights intentionally vary with posture:100/100/100/100/99/96/26/114/94 for idle0/idle1/punch/block/shove/hurt/KO/win/kick. Placement/component audit in `native-192/alignment.json`.

Live art review **http://127.0.0.1:5184/?art=taiko-sheet** shows this sheet versus existing production Taiko or Riot, all9 poses/loops under the actual192×240/current CRT/rooftop/cabinet. The historical Taiko preview moved to `?art=taiko-legacy-sheet`. Anchor and Riot review routes retain their selected versions. KO/kick shift toward screen center only in artwork review, like the other sheets.

Review atlas `apps/game/public/assets/experiments/taiko-v2.png/.json`. Production `assets/taiko.png/.json` remain unchanged until artwork is accepted and new origin is integrated. Build/focused lint and9-pose desktop/phone/native/CRT/asset-error checks passed; screenshots in `review/`. No push/deploy/commit/version bump; existing work preserved.
