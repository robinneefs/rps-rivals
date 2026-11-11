# Approved three-character roster installed

User authorized all selected sheets in gameplay and Anchor as a new playable character.

| Character | Installed approved variant | Native idle |
| --- | --- | --- |
| Taiko | `taiko-v2` regenerated simple sheet |100px|
| Riot | `riot-v2-first` FIRST regenerated version, as requested |100px|
| Anchor | `anchor-v3` simplified sheet with light deterministic outer-outline trim |114px|

`tools/art/install-approved-fighters.mjs` installs named atlases to `apps/game/public/assets/{taiko,riot,anchor}.{png,json}` and generates `config/fighterGeometry.ts` from their native placement audits. Previous production Taiko/Riot PNG/JSON files are preserved in `art/fighters/installed-before-three-character-roster/`. Sources/earlier variants remain intact. PNG hashes are compared to the exact selected review atlases in the production-check script.

All use160×160 cells,80,156 foot origin, scale1. `FighterView` now reads the atlas-specific origin, kick registration and shadow width. Exact per-pose bounds keep KO, hurt and leaning kick silhouettes inside the192px monitor on either side, including mirrored art and recoil offsets. Clamping changes only cosmetic horizontal placement at the screen edge; RPS choices/damage/timings are unchanged. Anchor's shadow is wider; no sprite scaling or frame-height normalization. Health-bar names now follow real fighter identities rather than hardcoded Taiko/Riot.

Anchor is in core PLAYABLE_CHARACTERS and validation, Boot atlas loading and presentation registry. CPU may choose any of the3; local and online confirmation/mirroring/rematch flows retain all3 identities. Default sides remain Taiko/Riot until chosen. Shared stats remain ROCK15/PAPER10/SCISSORS20/HP50: unique traits await discussion. Existing selection message shape/wire version and package version2.2.0 remain unchanged; no deployment was performed. Any future deployment must pair matching client/server code, as with the prior selection implementation.

## Checks

- Build, full ESLint and all-workspace typecheck passed.
-118 tests across16 files, including new runtime-view placement checks over every approved pose, both sides and multiple offsets; Anchor protocol acceptance and invalid rejection; complete online-session Anchor/Taiko rematch without rule changes.
-15 installed-Chrome regressions: all3 playable, cancel/back/touch/cabinet confirmation, Riot/Taiko/Anchor mirrors, complete CPU match/rematches, existing menus/audio/input.
- `tools/art/check-installed-roster.mjs` uses the actual built game at5181, selects each character, checks exact approved PNG hash, real fight texture and shared stats, and captures192×240/desktop/phone views. Results in `installed-checks.json`.
- `RPS_ONLINE_CHARACTER=anchor RPS_ONLINE_OUTPUT=art/fighters/three-character-roster node tools/art/check-character-online.mjs`: two actual Chrome clients against local Worker8787 (no mocked sockets). Both confirm Anchor, see her real texture, complete a full match and mutually confirm rematch; Anchor identities retained. Waiting and transition disconnect recovery passed. `online-checks.json` and captures alongside. Those online captures precede the final cosmetic health-bar-name fix; final production captures show corrected names.

Normal production preview http://127.0.0.1:5181/ . Dev preview5184 also includes all3, along with historical art-review routes. No commit, push, publish, deploy, version bump, palette swaps or new traits. Approved Home/cabinet/CRT/stage/music and all previous uncommitted work preserved.
