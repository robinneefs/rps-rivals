# Rooftop v2 — generated 2026-10-25

Generated with the built-in ChatGPT image-generation tool. `generated-stage.png` uses the previous `apps/game/public/assets/stages/rooftop-192.png` as a composition/subject reference. `generated-clouds.png` was generated separately with real transparency.

## Stage prompt

Create a replacement production game stage asset based on the reference image (reference is composition and subject guide). Same sunny city rooftop fighting stage: vivid royal/cobalt blue clear sky, blue and cyan distant city skyline, dark navy metal rooftop guardrail, warm peach/gold tiled rooftop floor with perspective lines. Front-on fixed fighting-game camera, no characters. Portrait EXACT 4:5 composition, intended final native canvas 192x240 pixels, enlarge as needed for tool output. Use crisp simple FLAT SHAPES, hard straight stepped contours, limited coordinated colors, broad readable shapes for a small pixel screen. NO painterly detail, no tiny simulated pixel texture, no dithering, no outlines thinner than one intended native pixel. CRITICAL LAYOUT: top 30 percent (native y0 through71 inclusive) must be completely quiet clear blue sky, no clouds, no buildings, no highlights or bright objects, so health bars and text can sit there. Sky continues down to about y132. Skyline occupies y132 through174, guardrail y171 through190. Rooftop paving occupies y190 through239, fighters' feet will be at y220. Keep floor perspective and rail very similar to reference. CRITICAL: NO CLOUDS ANYWHERE; clouds are generated as a separate animated layer. No sun, no birds, no lettering, no borders, no UI, no HUD, no fighter sprites. Image fills entire canvas edge to edge; no margin. This is the static opaque base layer only. Preserve sunny arcade energy and the existing rooftop identity, simplify microdetail to fit a true native 192x240 pixel export.

## Cloud prompt

Production game asset: a separate horizontally scrolling CLOUD LAYER for a bright sunny cobalt-blue city rooftop fighting stage. Wide landscape 3:1 canvas, transparent background, actual alpha, no blue backdrop. Several separated fluffy cumulus cloud clusters distributed across the width, with clear transparent gaps, all fully inside canvas and no cloud touching left or right canvas edges (leave transparent gutter so horizontal tiling joins invisibly). Flat stylized arcade shapes, bright ivory-white lit tops, pale cyan undersides, very simple hard-edged chunky stair-step silhouettes, a few broad flat shade regions, limited 4-6 color palette, NO gradients, NO soft edges, NO blur, NO glow, NO tiny texture or simulated pixel noise. Designed to reduce cleanly onto a real small pixel grid; large readable silhouette clusters with calm varied heights. All clusters at the same loose horizontal band, as a continuous panoramic strip; don't arrange as rows or sheet cells. Entire image contains ONLY isolated clouds on transparent canvas: no skyline, no buildings, no floor, no sky, no sun, no lettering, no labels, no UI, no border, no grid. Intended native image approximately 384 pixels wide by128 high, displayed 1:1, clouds will drift horizontally below the game's clear top HUD area. Keep the clouds relatively shallow and elongated, with usable transparent space above and below. Match classic sunny arcade rooftop sky energy.

## Native export

`tools/art/prepare-rooftop.mjs` resizes from the original generations with nearest sampling, restricts the palette without dithering, removes border-connected cobalt sky so clouds render behind the city, enforces an empty top72 rows, thresholds cloud alpha and removes disconnected speckles. The cloud strip is exported at 576 × 64 to retain a natural 54px silhouette height from the generated panoramic composition; the original approximate 384 × 128 prompt was an art guide, not a runtime size.

Outputs:

- `apps/game/public/assets/stages/rooftop-v2-192.png`: 192 × 240 transparent skyline/rail/floor, 40-colour palette.
- `apps/game/public/assets/stages/rooftop-clouds-576.png`: 576 × 64 transparent cloud panorama, 8-colour palette, empty left/right gutters.
- Solid sky colour `#0066fe`; cloud band starts at y52 (raised24px at the user's request), wraps every576px, moves left by1px every200ms. Persistent HUD rows0–47 stay clear. No runtime image scaling.

Run from the repository root with `RPS_SHARP_PATH` pointing to the available Sharp module, then `node tools/art/prepare-rooftop.mjs`. `export.json` records the final asset dimensions and placement.
