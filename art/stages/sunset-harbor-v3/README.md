# Sunset Harbor v3

User requested detail between the busy v1 and overly simplified v2, using the approved rooftop's prompt as a guide. Read art/stages/rooftop-v2/README.md and prepare-rooftop.mjs before generation. Built-in imagegen used the rooftop's original generated-stage.png as a style/pixel-density reference. Full prompt is preserved in generation-prompt.txt.

Restored structured detail: crane supports, container divisions, tugboat windows/trim/fenders, dock posts and rope, plank joints, and grouped water reflections. The native export follows rooftop settings: 192 × 240, nearest-neighbor sampling, indexed PNG palette capped at 40 colors, no dithering. Original source is retained; no previous reduced export was resampled. Unlike rooftop, this is an opaque static review background and has no separate cloud/animation layers.

sunset-harbor-gameplay.png shows the actual Riot/Taiko, HUD and CRT. Desktop cabinet and phone captures are included. Zero page or asset errors; dimensions and export settings recorded in export.json. Reproduce with Vite at 127.0.0.1:5190 and `node tools/art/preview-three-stage-concepts.mjs --harbor-v3`, setting RPS_SHARP_PATH to an available Sharp package if not locally installed.

Still a review-only background override; production stages and animations are unchanged. Before splitting animation layers, verify the rope/boat attachment, exact floor placement and native palette with the approved composition.
