# Taiko idle v2 and native 144 x 180 HUD

Latest pass: closed grey-blue borders and muted navy panels, larger 13x15 hand icons within 33x22 badges, fighter baseline lowered from 158 to 166, HUD drawn in front of feet. Screenshot: in-game-hud-closed.png. The sprite inspection disclosure displays the exact loaded 64x80 asset at nearest-neighbour 3x; prepared-sprite-6x.png is a standalone enlarged copy. Source audit: original 1254x1254; cropped opaque bounds (248,117)..(1040,1219), 793x1103; nearest reduction to 54x75 followed by 24-entry palette reduction. Padding is removed before resizing; these preparation steps explain differences from the generated image. Runtime new-sprite scale is 1; camera enlargement is an integer. No claim that high-resolution generated pixels are preserved at 75px.

HUD refinement: blue stepped-corner plates and coloured trim replace the near-black full-width header. YOU/CPU have six clear pixel rows below them; the feedback ribbon starts at y=57. Three 27x13 hand-sign/damage chips replace the 144x18 footer. Picking and hit examples visually checked in the browser; screenshot: in-game-hud-refined.png. Icons are drawn on the native grid in code using white fist/open-hand/scissors silhouettes, matching red/yellow/cyan controls.

2026-10-25, local codex/edits experiment only. Generated with the built-in image generation tool, using art/source/fighters-lineup.webp as character identity reference.

## Prompt

Generate a NEW TAIKO idle fighting sprite using the LEFT MAN in the reference for identity, not its pixel density. One character only, facing RIGHT, full body side view fighting guard, fists raised, wide bent-knee stance. Red sleeveless kung-fu top with just two gold fasteners, baggy red trousers, orange sash and headband with trailing tails, short black hair, short goatee, white forearm/ankle wraps, black sandals. Transparent background, no shadow, text or UI. TARGET: a strict 64 x 80 game-pixel design, figure 75 game pixels tall, approximately 48-52 game pixels wide. Enlarge that tiny pixel sprite to output size with uniform square pixel blocks. Intentionally CHUNKY LOW RESOLUTION: strong 1-pixel dark navy continuous outline, big face pixels, large fists and feet, broad connected colour clusters, 2 or 3 flat shades per material, total 20-24 colours. Every game pixel equally sized. This is for a 144 x 180 game screen; do NOT draw fine embroidery, individual fingers, hair strands, tiny wrap stripes, anti-aliasing, gradients, texture or dithering. Simplify the reference boldly so his face and costume read at only 75 pixels tall. Keep full figure centred in a square transparent canvas with clear padding. One pose, no sheet.

## Exact asset format

Original generated.png retained. Prepared output: apps/game/public/assets/experiments/taiko-idle-v2.png. A transparent 64 x 80 frame contains a 54 x 75 figure, centred horizontally at y=2. Foot anchor (32,77). Binary alpha threshold 128, nearest-neighbour resizing, at most 24 palette entries, no dithering. Reproduce with sharp available to Node (or RPS_SHARP_PATH), then node tools/art/prepare-taiko.mjs --compact.

The image generator did not produce a native tiny sprite directly; the saved high-resolution output was prepared to this exact grid. It still needs artistic approval. No generated animation is implied.

## Mockup

Open /?art=taiko in npm run dev. This scene now draws directly in 144 x 180 coordinates, with its own camera zoom. New Taiko displays at 1:1 in that grid: 75 pixels tall, matching the prior 100px sprite at +50% size rendered into the half-resolution preview. Normal game resolution remains 288 x 360.

The new HUD is painted directly using the project's 5 x 7 glyph definitions, one glyph bit per game pixel. Top: names, health bars, timer, round indicators, YOU/CPU. Picking prompt sits below it; move names/damage occupy the bottom strip. The Moment selector shows static Picking, Rock wins, or K.O. examples, not a live match. Sprite selector compares the newly generated sprite with the earlier one at the same visible height. Default is mirrored Taikos; keyboard/cabinet 1 compares old/new, 2 mirrors Taiko, 3 shows placeholders. CRT hidden locally, saved preference unchanged. Exit/reload without query returns normal gameplay. in-game-hud.png is a captured browser screenshot.

This supersedes v1's resolution and size selectors: the user's chosen 144 x 180 / 50% larger look is now fixed in this mockup. No normal gameplay, rules, network messages, production assets or deployments changed.

