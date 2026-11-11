# Character selection — layout study 01

Historical comparison: the user chose **concept 1, portrait lineup**. Current implementation and roster limitations are documented in `../character-select-lineup-v2/README.md`; its live review is http://127.0.0.1:5184/?menuReview=characters. Hero/versus remain historical studies only.

Three isolated mockups for the existing 192 × 240 game screen. This is a layout comparison, not character-selection gameplay. No match, character trait, damage rule, health rule or server state is changed.

## Review

- Comparison gallery: http://127.0.0.1:5185/ (`index.html` in this folder). Choose a fighter and switch between Monitor, Desktop cabinet and Phone cabinet captures.
- Live previews: http://127.0.0.1:5184/?characterReview=lineup, http://127.0.0.1:5184/?characterReview=hero, http://127.0.0.1:5184/?characterReview=versus. Add `&fighter=taiko`, `riot`, or `anchor` for a starting selection.
- Use arrows/joystick or tap a portrait. SELECT provides menu sound only; Esc returns to Home. No lock-in/waiting implementation is included.
- Start the comparison server with `node tools/art/serve-character-review.mjs`; start the game review server with `node node_modules/vite/bin/vite.js apps/game --host 127.0.0.1 --port 5184 --strictPort` from the repository root. Both servers are local only.

## Concepts

1. **Portrait lineup:** all three portraits are visible together; selected portrait has a taller/wider gold frame. Strongest for comparing the roster at a glance, but has less space for each personality.
2. **Hero portrait — recommended:** one wide expressive character above a strip of three small portraits, selected name, numerical stats and confirmation. Best use of the existing action artwork while keeping the selection and stats clear at native resolution.
3. **Versus:** selected fighter opposite an unknown opponent slot, with a small vertical roster between them. Conveys a matchup most directly, but the central choices are smaller and an actual opponent-selection flow remains undecided.

## Provisional stats — mockups only

These are invented layout fixtures, not balanced or approved gameplay numbers. The preview never imports them into rules, sessions, fights or the server.

| Fighter | ROCK damage | PAPER damage | SCISSORS damage | HP |
| --- | ---: | ---: | ---: | ---: |
| Taiko | 15 | 10 | 20 | 50 |
| Riot | 10 | 20 | 15 | 50 |
| Anchor | 20 | 15 | 10 | 55 |

All four labelled values remain visible in every concept and for every selection. Scissors uses the wider stat column so its full label and number have separate space. Font: approved M6X11, 16px, scale 1, integer coordinates. Portraits are crops/downsampled thumbnails of existing rest artwork; no new character image generation.

## Cabinet and CRT

The live scene uses the existing cabinet, monitor camera and actual current CRT shader. CRT is enabled temporarily for this isolated review, even if a saved preference is off, and the previous runtime flag is restored on exit. Saved settings and CRT tuning are not modified. Deferred CRT optimization, brightness and a tuning control panel remain separate future work.

Desktop captures use 600 × 1000 and phone captures use 390 × 664 touch emulation. Native PNGs come from the real post-processed renderer at 192 × 240; 4× images use nearest-neighbour expansion of those exact screenshots. Tiny thumbnails are layout references, not final portrait assets.

## Files

- `comparison.png` / `comparison-{taiko,riot,anchor}.png`: all three layouts side by side with the same selected fighter.
- `comparison-cabinets.png` / `comparison-phones.png`: cabinet comparisons.
- `{lineup,hero,versus}-{taiko,riot,anchor}-native.png`: individual native views.
- The same prefixes with `-4x.png`, `-cabinet.png`, and `-phone.png`: readable enlarged and actual viewport/cabinet views.
- `checks.json`: exact selected stats, device/layout coverage, current CRT/shader verification and asset/page errors.
- Code: `apps/game/src/dev/characterSelectReview.ts`, imported only for dev `?characterReview=` links. Production navigation is unchanged and Vite excludes the preview from its production bundle.
- Capture helpers: `tools/art/capture-character-select.mjs`, `tools/art/capture-character-comparison.mjs`.

## Validation

Build and focused ESLint passed. All 18 layout × fighter × device checks passed: exact four stats, no label/value overlap or clipping, native text size/scale/alignment, active CRT pipeline, keyboard/touch selection, return to Home, no gameplay started, no missing assets or page errors. The comparison gallery loads all fighter/view combinations. Production output retains the same `index-C217LCC9.js` filename/content hash as before these dev-only previews. Physical-device testing, real lock-in/waiting behavior and character balance are outside this study.

No commit, push, deployment or version bump was requested or performed for this study. The user's menu-approval notes preceding it are preserved.
