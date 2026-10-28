# Storm field stage

Animated **Storm Field** is installed as the second stage, alongside City Rooftop. The original static concepts were created with the built-in imagegen tool. Real gameplay uses the approved fighters and native HUD, not the generated mockup characters.

Play the local dev review: http://127.0.0.1:5185/?menuReview=stage&stage=storm-field . Normal matches include both stages in seeded selection; rematches advance the stage. `?stage=storm-field` or `?stage=rooftop` forces a stage for review.

## Assets and animation

Latest cloud movement: centered initial crop (offset96), eased motion limited to offsets48–144. Eight-minute full cycle, two minutes from center to the first turn; several times slower than the initial drift. Integer pixel positions and reduced-motion pause retained. Full-cycle bounds/center/speed tests passed.

User-requested composition adjustment: cloud panorama is flipped vertically at runtime (`setFlipY(true)`), putting the heavy cloud banks overhead and clearer sky near the field. Source image stays intact. In-game captures refreshed; stage tests and game typecheck passed.

- Generated source `generated-clouds-v2.png` is reduced to a 384×160, 16-color panorama. It drifts one native pixel every 420ms and reverses at the panorama edges. Original source/export retained in `generated-clouds.png` and `clouds-v1-backup/`.
- `tools/art/prepare-storm-field.mjs` authors native-pixel grass from a fixed seed. Twelve 192×240 field frames and twelve transparent 192×32 foreground frames form matching wind-driven waves at 120ms/frame.
- Foreground is placed at y208, **after fighters but before HUD and combat effects**. Dense blades overlap footwear and lower ankles, following the user's explicit request. Tallest blades are clipped at y208, keeping knees and attacks readable.
- Rain uses 26 sparse stepped streaks below the persistent HUD; branching background lightning briefly illuminates clouds and grass. First strike is after 2.4–3.6 seconds; later intervals are 4.5–8 seconds. No full-screen white flash or new audio.
- One 60ms scene timer drives all effects and is removed on shutdown; each match starts fresh. Cosmetic RNG is seeded separately from combat. Reduced-motion preference disables weather movement and lightning, including changes while running.
- Production PNGs are in `apps/game/public/assets/stages/storm-*.png`. Re-export using Node with sharp available (or `RPS_SHARP_PATH` pointing to sharp).
- `review/` contains actual CRT-on native, cabinet, lightning and phone captures and browser-check results. `tools/art/check-storm-stage.mjs` checks real match/rematch, weather, layer order, reduced motion and the original rooftop.

Validation: all-workspace typecheck/lint, 160 unit tests and production build passed (build reports a bundle-size advisory). Browser check passed a full CPU match and rematch, weather reset, lightning/cloud movement, foreground ordering, reduced motion and rooftop regression, with zero page/asset errors. `capture-storm-preview.mjs` refreshed clean native/desktop/phone captures and verified that grass frames advance. Preview dev controls start hidden and can be toggled with backquote.

- `normal-storm.png`: normal storm lighting.
- `lightning-strike.png`: matching lightning illumination concept.
- Reference: actual Riot/Taiko gameplay framing, with the user's classic fighting-game storm-field references for mood.
- Five stages planned total, including the existing rooftop and this storm field. Three further concepts remain undecided.

## User feedback and implementation direction

User liked the normal-storm mockup. Explicit follow-up: **make the grass more in front of the fighters' feet when implementing**. Render a separate foreground grass layer above fighter sprites: visibly cover feet, with occasional blades reaching lower ankles; preserve leg/move readability. The mockup's mostly exposed footwear should not be treated as the final overlap target.

Animate layered grass in wind-driven waves, slowly moving storm clouds, sparse diagonal rain, and occasional irregular background lightning with brief cloud/grass illumination. Use the actual game sprites/HUD unchanged during implementation; generated mockups approximate these assets and are not production sprite replacements. Native game resolution is 192×240.

## Generation prompt set

Cloud v2 (built-in imagegen): Production 12:5 storm-cloud panorama, drawn as if hand-pixelled at 384×160 then nearest-neighbor enlarged. Large coherent clusters, crisp stair-stepped silhouettes, limited palette, massive sculptural cumulonimbus with dark undersides and broad indigo/cobalt rims. Several overlapping depths with pockets of dark navy sky; quiet upper quarter for HUD. No noisy dithering, photo/airbrush texture, blur, rain, bolts, scenery, text or UI. Exported to 16 colors without dithering. Final source: `generated-clouds-v2.png`; runtime asset: `apps/game/public/assets/stages/storm-clouds.png`.

V2 validation: timing/lifecycle/reduced-motion tests passed with explicit strike-interval bounds; game typecheck, focused lint and production build passed. Refreshed actual normal/lightning/native/cabinet/phone screenshots show the new cloud shapes. Full CPU-match/rematch checks below refer to the initial stage implementation; no match behavior changed in this revision.

Normal: Portrait 4:5 pixel-art gameplay mockup. Preserve the actual Riot-left/Taiko-right gameplay framing, HUD and poses. Replace rooftop with an original grassy field at night, navy/cobalt rolling storm clouds, low horizon, layered teal-green windblown grass, subtle cool fighter edge lighting and sparse diagonal rain. Foreground grass overlaps feet/lowest ankles. Mood references are an homage, not a copy. No buildings, trees, mountains, moon, cabinet or extra UI.

Lightning edit: Preserve the normal mockup's composition, fighters, grass, rain, clouds and HUD. Add a branching blue-white lightning bolt slightly left of center behind the fighters, electric blue/lavender cloud illumination, silver grass-tip highlights and subtle cool fighter rim lighting. Preserve rich shadows, saturated outfits and HUD readability; no full-screen white flash.

Production cloud prompt: Generate only a full-bleed landscape sky/cloud panorama, matching the approved mockup's midnight navy/cobalt storm palette. Restrained crisp arcade pixel clusters for reduction to 384×160. Darker upper quarter for HUD readability. No fighters, text, UI, grass, field, ground, horizon, rain, lightning, trees, buildings, water, moon, stars, sun, borders or labels. Normal storm lighting; runtime supplies lightning illumination.
