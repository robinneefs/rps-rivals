# Lantern Courtyard v2 — native-resolution review

Refined still generated with built-in imagegen using the approved rooftop as the style/detail-density reference and courtyard v1 as the subject/composition reference. Exact prompt is in generation-prompt.txt; original generation is retained as lantern-courtyard-source.png.

Native export: 192 × 240, nearest-neighbor, 40-color indexed PNG, no dithering, matching the rooftop/approved harbor export approach. Broader paving, layered violet mountains, distant temple, warm red-orange lanterns, side blossoms and open valley. No waterfall.

lantern-courtyard-gameplay.png uses actual Riot/Taiko, HUD, CRT and current stance shadows, captured during move selection at 3×. Cabinet and phone views are included. Native output and gameplay views were visually inspected; review-checks.json records no page/asset errors. Reproduce with Vite on port5190 and `node tools/art/preview-three-stage-concepts.mjs --courtyard-v2`, setting RPS_SHARP_PATH if needed.

This is a static review-only browser override, not registered as a fourth stage. No existing gameplay or production assets changed. Before final layer extraction, settle the composition; source roof corners currently reach native row60 at extreme edges despite the prompt's stricter y72 target, while persistent HUD rows0–47 remain clear. Planned animation remains gentle individual lantern sway/glow and occasional petals; moving scenery is not yet extracted or implemented.
