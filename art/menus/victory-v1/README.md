# Victory splash: integrated results screen

Review at http://127.0.0.1:5184/?menuReview=victory (Vite development server).

The approved concept is retained in `approved-concept.png`. The preview uses the actual Riot portrait atlas, shared menu colors/font/controls, native 192 × 240 rendering, and existing CRT/cabinet display settings. The brush headline is extracted and reduced to native pixels by `tools/art/prepare-victory-title.mjs` (set `RPS_SHARP_PATH` when sharp is external).

`VictoryView.ts` supplies the presentation for all normal CPU and online match results, showing the actual winner's portrait/name. In mirrors the header identifies YOU or the opponent instead, so identical portraits do not obscure who won. Existing ResultScene rematch, waiting, disconnection and main-menu handlers remain in use. The development review route starts a synthetic victory; add `&fighter=taiko` or `&fighter=anchor` to inspect other winners. Rematch launches a playable CPU fight with the same identities.

Entrance: 850ms portrait slide, headline arriving over 750ms after a 350ms delay; disabled for reduced motion. Deep-plum headline shadow and a slanted pixel-textured torso blend reflect the approved refinements. Background and portrait remain separate from the text/menu; no full-screen mockup image is stretched into the game.

Validation: production build, game TypeScript check and focused lint. `tools/art/check-victory-preview.mjs` captures desktop/phone/CRT-off/Pixel Perfect cases and checks keyboard/touch Rematch and Main Menu. Results in `checks.json`.

All three portrait layouts were visually reviewed. Full CPU match/rematch checks passed for the smoke flow and Anchor mirrors; 120 unit tests passed, with build, TypeScript and focused lint passing. Online validation captures/checks are under `online/`. Online-match exit cleanup remains tracked in `docs/design/revamp-follow-ups.md`.
