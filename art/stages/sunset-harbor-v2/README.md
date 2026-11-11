# Sunset Harbor v2 — simpler native-resolution review

Fresh built-in imagegen generation, requested to address v1's fine detail collapsing during native reduction. Full prompt: generation-prompt.txt. Original generation preserved in sunset-harbor-source.png.

Design changes: broad silhouette cranes and cargo ship, chunky horizontal reflections, small simple tugboat and broad dock planks. No painted wood grain, dense rigging or fine water sparkle.

sunset-harbor-192.png is the exact 192 × 240 nearest-neighbor export. sunset-harbor-gameplay.png shows actual Riot/Taiko, HUD and CRT at 3×; cabinet and phone captures are included. These are static browser-only stage overrides, not installed playable stages. Source generation still has slight color variation and crane tips near logical row 65; enforce the stage contract's quiet rows 0–71 and clean palette/grid before final production layering. Do not claim the generator guarantees a native pixel grid or exact 24-color output.

Reproduce: run Vite for apps/game on 127.0.0.1:5190, then `node tools/art/preview-three-stage-concepts.mjs --harbor-v2`. review-checks.json records zero page/asset errors and successful actual fighter captures. Animation is not yet implemented. Other stage concepts are unchanged.
