# Taiko prompt comparison

2026-10-25, codex/edits. Three separate built-in image-generation calls. Originals retained in a/generated.png, b/generated.png, c/generated.png. No manual redraw of these candidates.

## A — Coarse arcade

Reference: art/source/fighters-lineup.webp, left man (identity only).

Use case: stylized-concept. Single game sprite on a transparent background. Use only the LEFT male fighter in the reference for Taiko's identity: short black hair and goatee, orange headband and trailing ribbons, red sleeveless kung-fu top with gold fasteners, red trousers, orange sash, white forearm and ankle wraps, black sandals. Variant A: authentic COARSE 16-bit arcade sprite. Deliberately much simpler and chunkier than the reference: about five-and-a-half heads tall, head roughly 12 game pixels tall, big readable fists and boots, compact broad stance. Facing RIGHT, fists raised in idle guard, full body. Visual detail budget of a 75-pixel-tall character. Strong continuous dark navy outline; 16 flat colours; two shades per material; large connected pixel clusters. No fine cloth folds, finger lines, wrap stripes, individual hair strands, texture, gradients, dithering or tiny highlights. Make this feel like an actual low-resolution fighting-game sprite, not a high-resolution illustration wearing a pixel-art filter. One character, no floor, no shadow, no words, no border. Generous transparent padding.

## B — Explicit grid

Same identity reference, explicit tile-grid/upscaling instructions.

Use case: stylized-concept. Create ONE tiny sprite, NOT an illustration. Use the LEFT MAN in the reference only to identify his costume and face. Taiko: black hair, short goatee, orange headband tails, red sleeveless kung-fu jacket, baggy red pants, gold sash, white wrist/ankle wraps, black sandals. Face RIGHT in fighting guard. Variant B / logical-grid experiment: imagine a 64-column by 80-row tile mosaic. Each tile is ONE solid colour and ALL tiles are the same size. The figure occupies 75 rows and about 50 columns; blank transparent tiles surround it. Enlarge this tile mosaic exactly 16 times: every logical pixel becomes a solid 16 by 16 square. Treat the result as a crisp enlarged screenshot of a tiny game asset. No visible grid lines. Restrict to 16 colours and transparency. No sub-tile detail of any kind: no smooth curves, no partial squares, no soft alpha, no gradients, no glow, no shading inside a tile. All contours are stairs on the same square lattice. One-pixel dark outline on that lattice. Outline the face, hands, sandals and headband clearly with a few intentional squares. Full body, one idle pose, no ground, no shadow, no text, no frame. Transparent background.

## C — Flat shapes

No image reference: fresh generation from written identity description, intentionally a flat illustration to test small-size readability rather than simulated pixel texture.

Use case: stylized-concept. Transparent-background cutout for a very small arcade fighting game. Single adult male kung-fu fighter, full body facing RIGHT in a relaxed fighting guard, feet spread and knees bent, two fists raised. Black swept hair, orange headband with two ribbons trailing LEFT, small black goatee. Sleeveless dark red mandarin-collar top with two tiny gold fasteners, loose red trousers, orange-gold sash, solid ivory wrist wraps and ankle wraps, black open sandals. Variant C: extremely simple flat-colour GAME ICON / screen-printed character design, built from bold angular geometric shapes with a thick continuous navy outline. Approximate six-head-tall proportions, broad shoulders, big mitten-like fists, large feet, readable triangular gaps between arms and torso. NOT detailed pixel art. Do not mimic artificial pixel texture. Use only 12 solid colour swatches, at most ONE shadow shape per body part, no highlights except face and wraps. Face is a simple dark eye, angular nose and goatee. Absolutely no fabric texture, wrap stripes, embroidery details, finger details, hatching, gradients or tiny marks. Simple clean silhouettes designed to survive reduction to just 75 pixels tall. Keep whole body inside frame. No floor, shadow, aura, border, text or other characters.

## Equal-size preparation

node tools/art/prepare-prompt-study.mjs (sharp or RPS_SHARP_PATH). Every original is alpha-thresholded at 128, cropped to its opaque subject bounds, reduced to 75px tall with nearest-neighbour, centred in a transparent 64x80 frame at y=2. Anchor (32,77). NO palette quantization, smoothing, or manual repainting. Native colour values at sampled pixels are retained. This is still a lossy resize; it does not recover or guarantee a strict pixel grid from the original. Resampling can change which details survive.

Runtime files: apps/game/public/assets/experiments/taiko-prompt-a.png, taiko-prompt-b.png, taiko-prompt-c.png. preparation.json records exact original sizes, crop bounds and output colour counts. Actual opaque output colour counts A=1493, B=1069, C=945: the generator did not enforce the requested tiny palettes. No candidate is certified exact-grid artwork.

comparison-6x.png shows the actual runtime sprites enlarged by six using nearest-neighbour. Each candidate's in-game.png captures it in the running cabinet. Preview /?art=taiko lists A/B/C first and retains the grid redraw and older generations. All are compared at 75px tall in the unchanged 144x180 mockup; C is somewhat broader (59px) than A/B (55px). No normal game assets, rules, or deployments changed.

## Observations

A and B remain close to the earlier referenced design despite different prompt language; B's requested exact tile lattice is not guaranteed by the output. C visibly changes the treatment and proportions; the flat silhouette remains readable at game size. These are visual candidates for the user to judge, not a claim that prompting has solved exact-grid generation.

