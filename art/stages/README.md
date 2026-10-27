# Stage art contract

Every future stage's generated base must reserve the **top 30% of the monitor (native rows 0–71 on a 192 × 240 screen)** as quiet, low-detail negative space for the HUD. No architecture, sun, bright highlights or foliage in this area. Do not bake UI or text into stage images. The persistent HUD (names, health bars, role labels, counters and timer) must always have clear space through row47. The user subsequently approved moving the rooftop's separate cloud band up to y52; the transient pick/hit messages use outlines over this lower sky area.

Use broad flat shapes, a restrained palette and hard edges that remain readable after native export. The image generator's enlarged output is source art, not a guaranteed native pixel grid. Export to the exact logical dimensions and display at 1:1 with nearest sampling. Use binary alpha, no dithering or filtered runtime scaling, and integer positions for moving layers.

Keep the standing line at y220. The rooftop's paving begins around y185–190 and extends to the bottom. Preserve sufficient room around the roughly 100px fighters.

Generate moving scenery separately. Cloud strips must be wider than the 192px viewport, genuinely transparent, and have matching/transparent end gutters for horizontal wrapping. Keep clouds clear of the health-bar area and behind buildings (rooftop band begins at y52). Use whole-pixel motion; the current strip moves left at 5 native pixels per second. Layer order: solid sky → clouds → skyline/railing/floor → fighters → fight UI.

Current source art, prompts and export settings: `rooftop-v2/`. Production assets live in `apps/game/public/assets/stages/`. Preserve original generations so future exports never resample a previously reduced asset.
