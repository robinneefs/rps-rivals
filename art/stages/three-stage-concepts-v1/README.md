# Three stage concepts — first gameplay review

Static concepts for Sunset Harbor, Lantern Courtyard and Foundry Floor, generated with built-in imagegen in this chat and preserved as `*-source.png`.

`*-192.png` are nearest-neighbor reductions to the native 192 × 240 grid. These are review exports, not final cleaned production pixel art. `*-gameplay.png` show the real Riot/Taiko sprites, HUD, pick timer and CRT at 3× size; `*-cabinet.png` and `*-phone.png` show the actual cabinet at desktop and 390 × 664 viewport sizes.

Reproduce with a Vite development server for apps/game at http://127.0.0.1:5190 and `node tools/art/preview-three-stage-concepts.mjs`. The script substitutes the background through browser request routing only; no production assets, stage registration, gameplay or animation are changed. The opaque review backgrounds cover the rooftop cloud layer. Page/asset errors are recorded in review-checks.json.

Animation direction: harbor reflection patches, gently bobbing boat and pennant/rope; courtyard small lantern sway/glow and rare petals; foundry slow gear, gentle furnace variation and rare distant sparks. Motion remains unimplemented pending visual review. Before production, simplify native pixel clusters, enforce quiet upper rows 0–71 (the foundry generation includes scenery near that boundary), and verify contrast across all fighter palettes. The courtyard's generated waterfall is scenery only; it is not an additional planned animation.
