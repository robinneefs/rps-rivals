# Native1x menu font shortlist

2026-10-26. User prefers a font drawn on a larger native bitmap grid, not a tiny face doubled to fill the menu. Earlier m5x7/Thaleah/Cozette research was ruled out for this layout: their1x capitals are only7–8px high. No doubled version is presented as a new candidate.

Current game default remains the previous2x bitmap for reference. Review URLs select an alternative for that page only; unknown values fall back to the normal font. No selection setting is saved.

| Review URL at127.0.0.1:5181 | Source | Ink capitals | CPU label width |
|---|---|---|---|
| ?homeFont=spleen | Spleen12x24 BDF |15px|166px|
| ?homeFont=tamzen-bold | Tamzen10x20 Bold BDF |10px|137px|
| ?homeFont=m6x11 | m6x11 at author's16px size |11px|100px|
| ?homeFont=tamzen | Tamzen10x20 Regular BDF |10px|137px|
| ?homeFont=spleen16 | Spleen8x16 BDF |10px|111px|

All candidates use sourceScale1. BDF bitmap bits are copied directly, with no font rasterizer, resizing, antialiasing or threshold. BDF word spaces are halved to fit the display label; glyph shapes and letter advances are otherwise unchanged. m6x11 is rendered exactly at its creator's recommended16px size and verified to have ZERO partially covered pixels before styling. A source pixel is exactly one192x240 game pixel; monitor/browser enlargement affects the entire screen normally.

All alternatives fit176x20 cells without clipping. Capitals are vertically centred within18px, shadow1px, gold-orange highlight per native row. No italic shear, bold simulation or interpolation. Original font files remain unmodified. Source/metrics: ../native/native-font-study.json. Preparation: `python tools/art/prepare-native-font-study.py`, also called by `prepare-action-menu.mjs --v2`. Copy into game using `node tools/art/install-action-menu.mjs`, then rebuild.

comparison-2x.png is captured CRT-filtered game screens, left-to-right: current2x reference, Spleen24, Tamzen Bold20, m6x11 native16. Each also has a full cabinet screenshot. Recreate with `node tools/art/capture-native-font-study.mjs`, local built game served on5181, installed Chrome, Playwright and sharp/RPS_SHARP_PATH. These screenshots include the existing CRT's glow. Raw native source atlases are under ../native/labels-{id}.png.

Validation: all4 captured game choices entered Options, no page errors. Build and focused lint passed. Existing home navigation/re-entry and phone touch smoke tests passed after adding the review textures. The actual default was not replaced during this comparison.

## Sources / attribution

- Spleen by Frederic Cambus: https://github.com/fcambus/spleen — BSD2-Clause, full licence in art/fonts/spleen/LICENSE.
- Tamzen by Suraj N. Kurapati, based on Tamsyn by Scott Fial: https://github.com/sunaku/tamzen-font — full permissions/copyright in art/fonts/tamzen/LICENSE.
- m6x11 by Daniel Linssen: https://managore.itch.io/m6x11 — free use with attribution; attribution and source mirror recorded in art/fonts/m6x11/ATTRIBUTION.txt. Creator documents16/32/48px sizes; only16px is used here.

Required attribution/licence notices are also copied into public/assets/menus/action/. No publishing/push.
