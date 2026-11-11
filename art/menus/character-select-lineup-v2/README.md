# Character selection — portrait lineup implementation

Historical implementation notes: the original two-character limit below is superseded by the [installed three-character roster](../../fighters/three-character-roster/README.md). Taiko, Riot and Anchor are now playable in CPU/online/mirror/rematch flows.

Concept **1: Portrait lineup** is the approved direction. The hero/thumbnail and versus concepts in `../character-select-v1/` are historical studies, not production routes. All three prominent portraits and the clear browsing gap beneath them are retained.

## Working now

- Home → Play versus CPU → Character Select → confirmed selection → Fight.
- Online lobby → both peers' character selection → server-confirmed lock-in → Fight only once both clients are ready.
- Taiko and Riot are playable on either side using their own combat sheets. CPU opponents are drawn from those two; mirrors are allowed. Rematches retain the actual selected identities locally and online.
- Keyboard arrows, joystick/cabinet buttons, mouse hover/click, and phone portrait/Confirm/Back taps. Confirmation uses a cyan frame, Ready badge and header; duplicate confirms are ignored. Back cancels CPU confirmation before its brief start delay, or unconfirms while waiting online. Once the server receives both confirmations the selection is final, avoiding a split start.
- Leaving before confirmation, while waiting, and during the transition is handled without a stuck match. The local server times out abandoned selection rooms.

## Honest stats and roster limit

The initial playable phase uses the existing shared rules for everyone: **ROCK 15, PAPER 10, SCISSORS 20, HP 50**. The screen reads the current CPU rules or online room's authoritative rules. No mockup-only unequal numbers were installed, no trait/balance advantage is introduced, and the actual rule/timing configuration is unchanged.

**Anchor is prominent and browsable but marked COMING SOON and cannot confirm.** Available Anchor assets are portraits/breathing/menu artwork; no matching integrated combat sheet with the required idle/attack/block/hurt/KO/win poses exists. Neither client nor server silently substitutes Taiko or Riot for Anchor. Anchor's combat artwork is required to complete the three-character playable roster. When that is ready, enable her identity and combat texture together; agree any stat differences separately.

Mirror-match color swaps are the next deferred discussion **after character selection is fully completed**. No palette swaps are implemented here. CRT optimization/brightness/tuning controls, How to Play, new music/stages and further menu redesign remain out of scope.

## Review

- Working local selector: http://127.0.0.1:5184/?menuReview=characters (dev review link to the real production scene).
- Normal built game: http://127.0.0.1:5181/ — choose Play versus CPU.
- Current images: `taiko-browsing.png`, `riot-browsing.png`, `riot-ready.png`, `anchor-coming-soon.png`, `phone-browsing.png`, `phone-ready.png`, `online-waiting.png`, `online-mirror-cabinet.png`, `online-mirror-phone.png`.
- The current cabinet and CRT treatment are unchanged. M6X11 stays native16px/scale1 in the192×240 framebuffer.

## Architecture and files

- `apps/game/src/scenes/CharacterSelectScene.ts`, `config/characters.ts`: production lineup, truthful availability and match-rule stats.
- `scenes/flow.ts`, `keys.ts`, `main.ts`, `menus/homeMenu.ts`, `scenes/LobbyScene.ts`: routing/session ownership and read-only browser-check hooks.
- `session/{MatchSession,LocalSession,OnlineSession,createSession}.ts`: selected cosmetic identities, synchronized confirmation and retained disconnect reason.
- `views/FighterView.ts`, `scenes/FightScene.ts`: per-identity texture selection and transition-edge recovery; RPS animation timing/rules unchanged.
- `packages/core/src/characters.ts`, `online/protocol.ts`, `apps/server/src/MatchRoom.ts`: shared identity/selection types and authoritative peer lock-in.
- Wire protocol is now **2** because it has new selection messages; old incompatible clients are explicitly refused. This is not a package/release version bump. Client and server must be deployed together when a future deployment is authorized. No deployment occurred.
- Browser tests `apps/game/e2e/characterSelect.spec.ts`; existing smoke entry checks now pass through selection. Protocol and real client/room roundtrip tests live in `packages/core/test/protocol.test.ts` and `apps/server/test/CharacterSelection.test.ts`.

## Validation

- Production build, full ESLint and all-workspace type checking passed. Existing bundle-size advisory remains.
- **112 unit tests** across15 files, including real client/session/room roundtrips: invalid/Anchor choices, both-confirmed gating, confirmation cancellation, same-character picks, immutable locked identities, complete rematches, disconnect and timeout recovery.
- **14 installed-Chrome tests**, including all prior smoke checks plus keyboard/mouse/touch selection, unavailable Anchor, cancel-ready, both Taiko/Riot mirrors, actual texture identities, complete CPU match and rematch.
- `tools/art/check-character-online.mjs`: **two actual browser clients against the local Worker on8787**, no mocked socket. Full Riot mirror match and rematch, shared identities/combat textures, wait/unconfirm/reconfirm, opponent exit. `--disconnect-only` additionally targets the exact selection-to-fight transition. Results in `online-checks.json` / `disconnect-checks.json`.
- Existing Options slider/settings browser check passed with the new CPU entry step. Existing check helpers were adjusted for selection where necessary.
- Touch checks use Chrome emulation; physical-phone testing remains separate.

No new checkpoint commit, push, deployment or package version change was performed. Previous checkpoint and all other work are preserved.
