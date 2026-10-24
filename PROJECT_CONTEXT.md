# RPS Rivals: Project Context

_Last updated: 2026-10-24_

This is the single source of truth for the project. **Any Claude working on this project: read this file first, and update it whenever a decision is made or something changes.** Keep edits small, add to the decision log, and bump the date above.

## Folder layout (2026-10-10)

Same layout here and in the repository (the archive stays out of the repo):

| Folder | What's in it |
|---|---|
| `PROJECT_CONTEXT.md` | This file |
| `README.md` | Repository front page |
| `docs/idea/` | Original idea brief |
| `docs/design/` | Interactive design document (saved HTML) |
| `docs/architecture/` | Architecture document (`ARCHITECTURE.md`, matched to the real code in v0.5.4), online hosting options (`ONLINE-OPTIONS.md`) and the diagrams (`diagrams/*.svg`) |
| `docs/brand/` | Studio logo masters: Chain Shift white (the user's original) and purple |
| `docs/tuning/` | Tuning panel guide (`TUNING-PANEL.md`): how to use the dev panel and how it is set up |
| `docs/screenshots/` | Screenshots of the current build, browser and phone (recapture with `node sources/screenshots/capture.mjs`) |
| `docs/mockups/redesign/` | Redesign mock-ups from the user (added v0.4.2, 2026-10-11), for the upcoming redesign: `mockups-game-1.png` (six cabinet screens: home, fighter select, fight, strike wins, K.O., online match), `mockups-game-2.png`, `mockups-characters-1.png` (one fighter in nine pixel-art styles), `mockups-characters-2.png` |
| `docs/mockups/cabinet/` | Arcade cabinet mock-ups drawn before the build |
| `docs/mockups/landscape-superseded/` | Old landscape mock-ups |
| `docs/art-direction/` | Art direction samples (sizes, styles, body shapes) |
| `sources/` | Code that draws the mock-ups, samples and diagrams (`landscape-mockup/`, `cabinet-mockup/`, `art-direction/`, `architecture/`) builds the interactive design document (`design-doc/`) and captures game screenshots (`screenshots/`) |
| `config/` | Repo only: shared TypeScript settings (`tsconfig.base.json`) and the unit test setup (`vitest.config.ts`), moved out of the root in v0.4.1. Tool configs that editors and tools only look for in the root stay there: `package.json`, `package-lock.json`, `eslint.config.js`, `.gitignore`, `.prettierignore`. Prettier settings live in `package.json`. |
| `archive/old-draft/` | Discarded first draft (not in the repo) |

New art samples go in `docs/art-direction/` (their source in `sources/art-direction/`); new mock-ups in `docs/mockups/`.

## Links

- Game design document (Claude Doc, editable): https://claude.ai/code/artifact/3f1b261a-b2c2-4342-b7f6-22d848beccb6
- Interactive design document (HTML artifact, playable sketch): https://claude.ai/artifact/MvaJcvzYeLjAwK49YtdybZ
- Play it online: https://robinneefs.github.io/RPS-Fighter/ (GitHub Pages, from the `RPS-Fighter/` folder of `robinneefs/robinneefs.github.io`)
- Repository: https://github.com/robinneefs/rock-paper-scissors (game code in `packages/core` + `apps/game`, plus design docs, mock-ups and art samples)
- Original idea brief: `docs/idea/rock-paper-scissors-idea.md`
- Tuning panel guide (how to use it, how it's set up): `docs/tuning/TUNING-PANEL.md`
- **v2.0 overhaul plan** (Claude Doc, editable, made 2026-10-24): https://claude.ai/artifact/JUf7K81V6a77gufHZZY2B8 (new look, phone-fit cabinet, 4-fighter roster with balance numbers, match-flow redesign and pacing panel, asset list, ChatGPT mock-up prompts, order of work). The current plan of record.
- Future plans and roadmap (Claude Doc, editable, made 2026-10-10): https://claude.ai/code/artifact/f1f3ff49-5ab1-4624-8d81-85bf111b8494 (every open decision, balancing thought and planned feature, each with a note on how to proceed, plus the suggested order of work). Tick items off there when they ship.
- Architecture document: `docs/architecture/ARCHITECTURE.md` (diagrams redrawn with `node sources/architecture/diagrams.mjs`)
- Online hosting options for step 5: `docs/architecture/ONLINE-OPTIONS.md` (free options compared; recommends a Cloudflare Durable Object)

## Where things stand

- Phase: **released** (2026-10-12). v1.0.0 is the first public release, live at https://robinneefs.github.io/rps-rivals/ (published at the user's word: "ready to publish v1.0"). The user runs it locally from `D:\Vibe Coding Projects\rps-rivals` (`npm run dev`).
- What works (v1.0.0): Chain Shift logo intro (skippable); home menu START GAME (vs CPU), ONLINE (vs a friend with a 4-letter room code), HOW TO PLAY, OPTIONS (scaling, CRT screen, sound, music and effects volume); best of three vs a random CPU or online, 3s pick timer, 50 health, Rock 15 / Paper 10 / Scissors 20; the clash reveal with move badges, juice (hit pause, shake, sparks, dust, K.O. slow motion and chunky K.O. letters, cabinet rattle), three random stages, a CRT shader and CRT off/on screen transitions; result screen RETRY / MAIN MENU; chiptune sound and music; a flickering marquee, wood-grain cabinet, shaded buttons with hover and glint, a clicking, wobbling joystick. Browser tab title, favicon and link-share image. Desktop browser and phone.
- Art is drawn in code (`apps/game/src/assets/placeholders/`) under the real asset keys (`assets/keys.ts`), so sprite sheets could still swap in without touching views. The marquee art is cut from the user's AI mock-up; the user decided it stays as is (2026-10-11). Sound is synthesised by `tools/audio/make-audio.mjs`.
- Next: nothing scheduled. Ideas for after 1.0: online reconnect grace period, typed names, a share link that fills in the room code, a QUIT MATCH prompt, credits line, Android.
- `archive/old-draft/` in this folder is an **earlier draft the user discarded**. Do not build on it. It is not in the repository.

## Code (updated 2026-10-11, v0.11.0)

| Where | What |
|---|---|
| `packages/core` | `@rps/core`: rules (`resolveExchange`, `applyExchange`, rounds) and the `Referee` phase machine with injected clock + seeded RNG. Rules config and phase timings in `src/config.ts` (pick 3000, reveal 1800, round intro 1600, round over 2200 ms; start health 50). |
| `apps/game/src/session` | `MatchSession`, `LocalSession`, `RandomCpu` (think delay 0.4 to 1.6s), `createSession(setup)` |
| `apps/game/src/scenes` | Boot, Cabinet, Logo, Home, HowTo, Options, Lobby, Fight, Result, Transition (CRT off/on) + `flow.ts` (`SceneFlow`) |
| `apps/game/src/{views,fight,fx,menus,input,platform}` | Dumb views, `FightDirector`, shake/flash, menus as data, `InputRouter`, `PixelScaler` (two scaling modes), `SettingsStore` (`platform/settings.ts`, localStorage) |
| `apps/game/src/config/tuning.ts` | Every feel value |
| `packages/core/src/online/protocol.ts` | Online messages shared by game and server, `PROTOCOL_VERSION`, room codes (4 consonants, no vowels so no words) (v0.6.0) |
| `apps/server` | `@rps/server`: Cloudflare Worker + one Durable Object (`RoomObject`) per room code; `MatchRoom.ts` seats two players and runs the `Referee`. Local: `npm run dev:server` (port 8787). Deployed by `.github/workflows/deploy-server.yml` on main (needs secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). Guide: `apps/server/README.md` (v0.6.0) |
| `apps/game/src/session/OnlineSession.ts`, `socket.ts`; `scenes/LobbyScene.ts`; `config/online.ts` | Online client: real sides on both screens since v0.9.1 (host = P1 on the left, guest = P2 on the right; HUD tags "P1 YOU" / "P2 RIVAL"), opponent named RIVAL; lobby CREATE ROOM / JOIN ROOM; server address (dev: localhost:8787; release: the Worker's address, null until known = ONLINE greyed out) (v0.6.0) |
| `apps/game/src/dev/` | Dev tuning panel (v0.5.0): Tweakpane over `tuning.ts` (live) plus the core rules and phase timings (next match), with Restart match, Copy changes, Reset all; edits kept in localStorage; backquote hides it. Only in `npm run dev`. Guide: `docs/tuning/TUNING-PANEL.md`. |
| `apps/game/public/assets/logo.png` | Studio logo (Chain Shift as purple pixel art, 192x84 native): the master reduced to 94 blocks wide, each block 2x2 native pixels like the title's scaled font, violet #A35BFF fill with a light top edge, darker bottom edge, drop shadow in `palette.shadow` and a 1 px `palette.ink` outline. Built from the white master `docs/brand/logo-chain-shift-white.png` by `python3 tools/make-logo.py` (needs Pillow), which also writes the full-size `docs/brand/logo-chain-shift-purple.png` |

Changelog: `CHANGELOG.md` at the repo root.

Commands: `npm install`, `npm run dev`, `npm test` (91 tests), `npm run test:e2e` (9 Playwright tests), `npm run audio` (regenerate sounds), `node tools/make-icons.mjs` (favicon, share image, README play button), `node sources/screenshots/capture.mjs` (docs screenshots), `npm run lint`, `npm run typecheck`, `npm run build`. CI (GitHub Actions) runs all of them.

**Versions and changelog (rule, user's request 2026-10-10):** every build that goes online gets a version bump and a `CHANGELOG.md` entry, no exceptions. Semver: new features bump the middle number (1.0.0 → 1.1.0), fix-only builds the last (1.0.1). The version is set in one place, `apps/game/package.json`; Vite injects it (`src/version.ts`) and the home screen shows it small in the bottom-right corner. Each version is tagged `vX.Y.Z` with a GitHub release by the Release workflow (`.github/workflows/release.yml`): on every push to production it tags a package.json version that has no tag yet, using its changelog entry as the notes (cloud sessions can't push tags themselves). Current: **v1.0.0** in main (staging) and production (live), 2026-10-12. Before it: v0.11.1 (bug-hunt fixes, PR #24 @ 1b3d8be); live was v0.5.4 until 1.0.

Publishing (since v0.6.0, agreed with the user 2026-10-11; replaces the manual copy into `robinneefs.github.io/RPS-Fighter/`): three levels. **Feature branches** go by PR into `main` (CI must pass). **`main` = staging**: every push publishes it to https://robinneefs.github.io/rps-rivals/staging/ with the staging match server `rps-rivals-server-staging`. **`production` = live**: https://robinneefs.github.io/rps-rivals/ with the live server `rps-rivals-server`. "Publish" = a PR from main into production, merged with the user's OK; the Release workflow tags `vX.Y.Z` on production pushes. Workflows: `.github/workflows/pages.yml` (builds both branches into one Pages site), `deploy-server.yml` (Worker per branch), `release.yml`. User setup: Pages source = GitHub Actions; github-pages environment must allow `main` and `production`; secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variable `CLOUDFLARE_WORKERS_SUBDOMAIN`. The old RPS-Fighter folder in `robinneefs/robinneefs.github.io` is a redirect to the new live address since 2026-10-11 (site repo @ 2a764f5; never touch that repo's `moment37/`). A game-named GitHub org was considered and dropped (user, 2026-10-11).

## The game in one paragraph

A browser fighting game built on rock paper scissors. Two pixel-art fighters stand close together in the middle of the screen. Each exchange, both players secretly pick Rock, Paper or Scissors within a 3 second countdown; the picks are revealed together, the two move badges collide in the middle, the fighters act out their moves, and the loser of the exchange takes damage. Best of three rounds. Against a random computer or a friend online (room codes); an Android app later. (The moves were called Attack, Block and Throw until v0.7.0.)

## Core rules

| Winning move    | Beats  | Damage to loser |
|-----------------|--------|-----------------|
| Scissors (was Throw)       | Paper    | 20              |
| Rock (was Attack)          | Scissors | 15              |
| Paper (counter, was Block) | Rock     | 10              |

- Tie: no damage. Only the loser of an exchange takes damage (no double KO).
- 50 health per fighter per round (was 100 until v0.9.0; tunable).
- Round ends when a fighter hits 0. Match = best of three rounds. Health resets each round.
- Computer opponent: uniformly random pick (decided by the user; no pattern reading for now).

## The mind game (user's insight)

Uneven damage makes this different from classic RPS. Scissors is the tempting big hit, Rock punishes Scissors, Paper punishes Rock, Scissors punishes Paper.

- Nash equilibrium (net damage, zero-sum): **Rock 4/9 (44%), Paper 3/9 (33%), Scissors 2/9 (22%)**. Scissors, the biggest hit, is the rarest optimal pick.
- Low health changes stakes: at 15 HP, a 15 or 20 win ends the round but a 10 paper counter doesn't.
- Rule of thumb: each move's balanced share is proportional to the damage of the move it beats (Rock ∝ Scissors dmg, Scissors ∝ Paper dmg, Paper ∝ Rock dmg).
- Vs the random CPU: Rock and Scissors average +1.67 net damage per exchange, Paper -3.33. A smarter CPU (equilibrium mix or pattern punishing) is a future option.

## Exchange flow

1. 3 second countdown (was 5s until v0.9.0). Player picks via tap/click or keys 1/2/3; can change until time is up.
2. Timer hits 0: anyone without a pick gets a random move. Picks hidden until both are locked.
3. Reveal (since v0.9.0): a move badge pops in beside each fighter, both fly to the middle and collide; the winning badge stays and the loser's is knocked away, with "ROCK WINS" (etc.) or "CLASH!" on a tie.
4. Both fighters animate their move. Winner lands with hit flash, hit sound, small screen shake. Tie = clash, no damage.
5. Loser's health bar drains.
6. Next countdown, or KO, round banner ("Round 2", "Final round"), or the result screen with Retry / Main menu (see "Menus and screen flow").

Online: the server runs the timer and the random fallback pick.

## Presentation

- Pixel art. **Vertical layout framed as an arcade cabinet** (see "Arcade cabinet layout" below); this replaces the earlier landscape 16:9 plan. Fighters about one body-width apart near the center of the monitor.
- On the monitor, top: health bars (player left, opponent right), two round-win pips each, timer in the middle.
- Move choice happens on the cabinet's control panel (three physical arcade buttons), not on on-screen buttons. Keys 1, 2, 3 on desktop.
- Animations per fighter: idle, attack, throw, block (+ counter strike), hurt, KO, win pose.
- **Art decision:** the free packs found (Jestaa free character, LuizMelo Fantasy Martial Characters, Pixel Moon Studio Fighter v2) don't look good enough and lack block/throw. Before building: find better packs (paid OK) or AI-generate our own fighters and clean them into sprite sheets.
- Move icons: Kenney (CC0) is an option.
- **Art direction (2026-10-10, in progress):** fighters stay martial artists in gi (white gi + red headband vs blue gi + gold band), but drawn cute and cartoony with a slight Japanese (chibi) feel: short, wide, big heads. Tone: arcade neon '80s (synthwave sunset, neon grid floor, neon torii). The user did not like the style of the first mock-ups. Size samples at 48, 64 and 80 px tall are in `docs/art-direction/` (source in `sources/art-direction/`). **Sprite size: medium, 64 px tall (decided).** The user is not crazy about the overall aesthetic yet and wants to revisit it later.

## Arcade cabinet layout (decided 2026-10-10)

The whole game is drawn as an upright arcade machine. This gives a vertical layout that works the same in a desktop browser and on a phone held upright.

| Part | What it shows / does |
|---|---|
| Monitor (top ~2/3) | The fight: both fighters, health bars, round pips, timer, and the move coins/icons that show each player's pick on reveal. |
| Control panel (bottom ~1/3) | Three physical arcade buttons: Attack, Throw, Block. Click/tap them or press keys 1/2/3. They press down visibly when used. |
| Joystick (left of the buttons) | No effect in a fight (just for fun); in menus it moves the cursor. Tilts in 8 directions with the arrow keys (two keys = diagonal) or by click-and-drag; springs back to center on release. |

- **Browser:** the cabinet stands centered and is scaled to fit the window height; the space around it is a dark arcade-room backdrop.
- **Phone:** portrait; the cabinet fills the screen, with the control panel in thumb reach.
- Monitor content is a 3:4 portrait screen (default picked by Claude; open to change). Game resolution 216x288 with 64 px fighters.
- **Cabinet frame 270x472 native (decided 2026-10-10):** marquee 32, bezels 12, monitor 216x288, control panel 128. Shows at 2x in a 1080p browser window and 4x on most phones. Mock-ups redrawn at this size.
- Mock-ups: `docs/mockups/cabinet/cabinet-browser-pick.png`, `cabinet-browser-reveal.png`, `cabinet-phone-pick.png`, `cabinet-phone-reveal.png`, plus the menu screens (`cabinet-phone-logo.png`, `cabinet-phone-home.png`, `cabinet-phone-result.png`, `cabinet-browser-home.png`). Source in `sources/cabinet-mockup/` (`cabinet.html#browser-pick` etc.; render with `node shotcab.mjs browser-pick phone-reveal ...`). The older landscape mock-ups (`docs/mockups/landscape-superseded/`) are superseded.

## Menus and screen flow (decided 2026-10-10)

The user asked for menu infrastructure now, so multiplayer menus can be added later without restructuring. Flow: **Boot → Logo intro → Home → Fight → Result → (Retry → Fight | Main menu → Home)**. Diagram: `docs/architecture/diagrams/7-screen-flow.svg`; details in section 6 of the architecture doc.

| Screen | What it shows / does |
|---|---|
| Logo intro | The **Chain Shift** studio logo in purple (since v0.4.0; replaced the "YOUR STUDIO" placeholder) fades in, holds, fades out (about 0.5s / 1.5s / 0.5s, tunable). Any button or tap skips it. The image is `assets/logo.png`. Fades step through a few palette levels (pixel perfect, no smooth alpha). |
| Home (main menu) | Game title, both fighters idling, and a menu: **START GAME (VS CPU)**; **ONLINE** shown greyed out with "SOON" as the slot for multiplayer; **OPTIONS**. More buttons (online lobby, how to play) are added as new menu items. |
| Options (added 2026-10-10) | **SCALING**: FILL HEIGHT (default since v0.3.0) or PIXEL PERFECT; confirm or stick left/right flips it and it applies at once; **BACK** (or Esc) returns home. Two lines under the menu explain the current mode. Saved in localStorage. |
| Fight | The match vs the CPU, as before. |
| Result | Shown over the last fight frame: "YOU WIN!" or "CPU WINS" (online: "RIVAL WINS"), the round score (e.g. 2-1), and a menu: **RETRY** (default, new match with the same setup) and **MAIN MENU**. |

- Menu controls: joystick or arrow keys move the cursor; any of the three cabinet buttons, Enter or Space confirms; items can also be tapped/clicked on the monitor; Esc / Android back goes back. (Default picked by Claude: gives the joystick a use in menus; easy to change.)
- Structure: menus are data (`menus/homeMenu.ts`, `menus/resultMenu.ts`) drawn by one reusable `MenuView`; one `SceneFlow` handles all screen changes and transitions; a `MatchSetup` (`{ mode: 'cpu' }` now, `{ mode: 'online', roomCode }` later) is passed Home → Fight → Result so Retry replays the same kind of match (online: both players must agree to the rematch).
- Music: menu loop on Home and Result, fight loop in the fight.
- Menu text uses a 5x7 bitmap pixel font (pixel-perfect rule 5).
- Mock-ups: `docs/mockups/cabinet/cabinet-phone-logo.png`, `cabinet-phone-home.png`, `cabinet-phone-result.png`, `cabinet-browser-home.png` (source: `sources/cabinet-mockup/screens.js` + `pixfont.js`, render with `node shotcab.mjs phone-home ...`).
- Later menus (not now): online lobby (create/join room code), more options (volumes, mute), pause, how to play.

## Pixel perfect (requirement, 2026-10-10)

The user wants the game to be, or at least look, pixel perfect. Rules:

1. **One pixel size everywhere.** Fighters, backgrounds, cabinet, HUD, icons and effects all share the same pixel grid; no mixing of sizes ("mixels").
2. **Whole-number scaling only.** The game renders at its native resolution and is scaled up 2x, 3x, 4x... with nearest-neighbour (no smoothing). Leftover screen space is filled by the backdrop/border, never by stretching.
3. **Snap to whole pixels.** Sprites, camera, screen shake and tweens land on whole pixels; no sub-pixel drift or blur.
4. **No free rotation or scaling of sprites.** Turning, squash or zoom is drawn as frames, not done by the engine.
5. **Pixel UI.** Text uses a pixel font at its native size (or a whole multiple); bars, buttons and glows are drawn as pixels, not as smooth CSS/vector effects.
6. **Limited palette** shared across all art, so everything looks like one piece.

**Exception, chosen by the player (2026-10-10):** Options → Scaling → **Fill height** scales the cabinet to fill the window (height on desktop, width on a narrow phone) at a fractional scale. Still nearest-neighbour and one native grid, so no blur, but some pixel rows/columns come out one device pixel wider than others (slightly uneven lines and text). Since v0.3.0 Fill height is the default for a first visit (user's call); Pixel perfect is one press away in Options. Details in section 7 of the architecture doc.

Engine: Phaser with `pixelArt: true` / `roundPixels: true` and integer zoom. The current mock-ups break rules 1 and 5 (smooth HTML text and glows over the pixel art; the big-pixel version uses a different pixel size for the monitor and the cabinet). Real art must follow the rules.

## Polish and game feel (core goal, 2026-10-10)

Very important to the user: the final product must look and feel polished. Besides the art style this means game feel ("juice"):
- Screen shake that feels good (short, punchy, scaled to damage; whole pixels).
- Visual effects: hit flash, sparks, impact frames, dust, brief hit-pause on big hits.
- Dynamic, lively animations (anticipation, overshoot, follow-through; idle never static).
- Sound effects for every action, layered and varied.
- UI motion: buttons press down, bars drain smoothly, banners slam in.

- **Timer juice (user's note 2026-10-11):** the pick timer must be big and impossible to miss, so the player knows to pick before time runs out. In the real game add juice to it: a pulse or pop on each second, colour change and shake in the last 3 seconds, a tick sound, and a slam when it hits 0.

When: a dedicated tuning pass near the end, before release, at the latest before the third version. Build systems so this is easy to tune (central tuning values for shake, hit-pause, timings).

## Audio

- Decided with the user 2026-10-11 ("Game audio" thread): 90s arcade chiptune style; sound effects first, then music; no announcer voice for now; mute plus separate music and effects volumes in Options.
- Built in v0.8.0 (PR #19, merged into main 2026-10-11): every sound and both music loops are synthesised by `tools/audio/make-audio.mjs` (original, owned by the project; no outside samples). Asset sites (OpenGameArt, Kenney) are blocked from Claude's cloud sessions, so the planned CC0 hit layers and CC0 music loops were replaced by generated ones; real CC0 files can be dropped in later under the same names. Guide, sound list and licence table: `docs/audio/AUDIO.md`.
- SFX: menu move/select/back, countdown ticks (last 3s, rising), time-up slam, lock-in, icon whoosh, a hit per winning move (rock thud, paper slap, scissors slash; 3 variations each), tie clash, K.O., round start, FIGHT!, win and lose jingles.
- Music: menu loop (A minor, 132 BPM, ~29s) on Home, Options, lobby and Result (after the jingle); fight loop (D minor, 156 BPM, ~25s) in the fight. OGG with MP3 fallback.
- Later: announcer voice; replace or layer with recorded CC0 sounds if the user wants.

## Technology (decided)

| Part | Choice |
|---|---|
| Engine | Phaser 3 (chosen over Godot) |
| Language | TypeScript |
| Build | Vite |
| Tests | Vitest |
| Online (later) | Server-authoritative match room running `@rps/core`'s Referee. Host: **Cloudflare Workers + a Durable Object per room** (user's decision 2026-10-11, free plan; see `docs/architecture/ONLINE-OPTIONS.md`). Replaces the original Node + Colyseus plan |
| Android (later) | Capacitor wrapping the web build |

Architecture rules:
- **Shared rules module** in plain TypeScript: no Phaser, no timers, no network. Both moves in, result out; also tracks health, rounds, match.
- Scenes only display what the rules module returns; they never decide results.
- Moves arrive through a **move source**: now local input + random CPU; later the server.
- Online: only the server knows both picks before the reveal (anti-cheat).

**Architecture (proposed 2026-10-10, see `docs/architecture/ARCHITECTURE.md`):**
- npm workspaces monorepo: `packages/core` (rules + referee, zero dependencies), `apps/game` (Phaser client), later `apps/server` (Colyseus).
- Four layers, dependencies only point down: Platform, Presentation (scenes, director, views, fx, audio, input), Session, Core. Import rules enforced by ESLint.
- Core = pure rules functions + a `Referee` phase machine (RoundIntro, Picking, Reveal, RoundOver, MatchOver) with injected clock and seeded RNG; the same referee runs in the Colyseus room later.
- Scenes talk only to a `MatchSession` interface: `LocalSession` (referee + `RandomCpu` move source) now, `OnlineSession` later.
- Scenes wire, a `FightDirector` choreographs, views are dumb. `CabinetScene` always runs; monitor scenes (Logo, Home, Fight, Result) draw through a 216x288 camera viewport. Menus are data + one `MenuView`; `SceneFlow` owns screen changes.
- Two homes for numbers: rules and phase timings in `packages/core/src/config.ts` (shared with server); all feel values in `apps/game/src/config/tuning.ts`. Dev-only Tweakpane panel to tune live.
- Pixel scaler in `platform/`: largest whole scale in device pixels, canvas fills the window, leftover is arcade room.
- Built as proposed (2026-10-10): npm workspaces monorepo, `eslint-plugin-import` `no-restricted-paths` + `no-restricted-imports` (no Phaser in core/session, no `Referee` outside the session). Tweakpane panel added in v0.5.0 (`apps/game/src/dev/`, dev builds only). `MatchSession` gained `ready()` (scene is listening; local starts the match) and a `rematchAccepted` event for Retry.

## Roadmap

1. Rules core with tests (console only). **Done 2026-10-10.**
2. Playable prototype: placeholder fighters, buttons, bars, timer, best of three, plus the menu flow (logo intro, home with Start game, result with Retry / Main menu). **Done 2026-10-10.**
3. Art and juice: sprites, falling icons, hit flash, shake, SFX, music.
4. Polish and release on the web (e.g. GitHub Pages), including a dedicated game-feel pass (see "Polish and game feel").
5. Online play (Cloudflare Durable Object match room, room codes; see `docs/architecture/ONLINE-OPTIONS.md`). **First version built in v0.6.0** (thread "Online play on Cloudflare"); waiting on the user's Cloudflare account and GitHub secrets to deploy. Still open: reconnect grace period, typed names, share link.
6. Android build (Capacitor). Started 2026-10-12 (thread "Android version"): first step v1.1.0 adds phone vibration that follows the screen shake (capped at 40 ms a buzz, K.O. = buzz-pause-buzz) with VIBRATION on/off in Options; web phones use the Vibration API, the Android app will use the Capacitor Haptics plugin (`apps/game/src/platform/haptics.ts`). The Capacitor wrapper followed in the same PR (#27): `apps/android` (app id `com.chainshift.rpsrivals`, permanent once on Play), `npm run android` builds and opens Android Studio; how to build, sign and upload is in `apps/android/README.md`. Next: the user's first run on a phone, then the Play Store steps (personal developer account).

## Open questions

- Fighter art: better pack or AI-generated? (no longer blocks building: placeholders are in; real art swaps in under the same asset keys)
- Overall aesthetic: the user is "not crazy about it yet" (cute chibi + neon '80s); parked, revisit later.
- Art tools (researched 2026-10-10): best fit is **PixelLab** (pixel-art AI with character directions + animations, hosted MCP at https://api.pixellab.ai/mcp, Bearer API key, plans from ~$12/mo). Alternatives: Retro Diffusion (great look, Aseprite extension, $20-65 one-time, has API), Ludo, Scenario; Aseprite for hand cleanup. Claude's cloud sessions currently cannot reach api.pixellab.ai (built-in environment blocks it): needs a cloud environment that allows the domain plus the key as a secret, or run Claude Code locally with the MCP. User wants a more attractive pixel style with slightly bigger pixels.
- Cabinet look: monitor aspect (3:4 portrait chosen as default), cabinet colours and side art.
- ~~Online seat: always show yourself on the left or real sides.~~ Decided 2026-10-11: real sides (host P1 left, guest P2 right).
- Art direction references for the NEXT step (user, 2026-10-11): use the user's four redesign mock-ups in `docs/mockups/redesign/` as the starting point. `mockups-characters-1.png`: one Ryu-like karate fighter (brown hair, red wraps, torn gi, black belt, barefoot) in nine pixel styles (classic 16-bit, modern, low-res, anime, detailed, chibi, dark, minimalist, cartoon). `mockups-characters-2.png`: the same fighter as a chibi in nine variants (clean, white sticker outline, shaded, anime, Game Boy, SNES, dithered, minimalist, expressive). `mockups-game-1.png` and `mockups-game-2.png` ("RPS Rivals" sheet): the vertical cabinet with marquee art, joystick plus red/yellow/blue ROCK/PAPER/SCISSORS buttons, menu, fighter select, fight HUD, hit effects, K.O., online match, and a palette of hot pink, cyan, violet, navy and pale lavender. These lean toward relabelling the moves Rock/Paper/Scissors (see Move animations).
- Move animations (user's note 2026-10-10): Attack, Throw and Block currently look nearly the same. Either make each clearly read as a strike, a grab/throw and a block/counter, or relabel the moves Rock, Paper, Scissors with animations to match. Roadmap doc recommends trying distinct silhouettes on the placeholders first.

## How the user likes to work

- Discuss and decide first, then design docs, then build. (Building was approved 2026-10-10: "yes start that" for the first playable.)
- Keep questions short and few at a time; offer a recommendation.
- Online multiplayer readiness is "very important" to the user.
- Wants a solid, expandable base with readable, structured code (asked for the architecture document before any building).

## Artifacts

- Mock-up images (1280x720 PNG, superseded by the cabinet layout): `docs/mockups/landscape-superseded/1-pick-your-move.png`, `2-reveal-throw-beats-block.png`, `3-tie-clash.png`, `4-match-won.png`. Fighters are placeholders drawn in code.
- Interactive design document: https://claude.ai/artifact/MvaJcvzYeLjAwK49YtdybZ (rebuilt 2026-10-10 around the cabinet: a playable 270x472 cabinet running logo intro → home → fight → result, plus all chapters, menu and cabinet mock-ups, art samples and diagrams). Saved copy: `docs/design/interactive-gdd.html`. Source: `sources/design-doc/gdd.html` (page template) + `sketch.js` (the playable cabinet), using `sources/cabinet-mockup/art.js`, `pixfont.js`, `screens.js`. Build with `node sources/design-doc/build.mjs [artifact-out.html]`; the artifact copy is published with the images under `screenshots/`, `art-direction/`, `architecture/diagrams/`. The old landscape page sources stay in `sources/landscape-mockup/` (superseded).
- Keep the Claude Doc, the interactive page and this file in sync when decisions change.

## Decision log

- 2026-10-10: Discarded the first draft; restarted with features, then engine, then design doc.
- 2026-10-10: Random CPU; pure Attack/Throw/Block; buttons + bars + animated fighters; best of three.
- 2026-10-10: Pixel art; web first, Android later; online later (very important); 5s countdown with random auto-pick; falling move icons; fighters close together; hit SFX + music.
- 2026-10-10: Engine: Phaser 3 + TypeScript.
- 2026-10-10: Added the mind-game analysis (user's insight on uneven damage).
- 2026-10-10: Free art packs rejected; find better art or AI-generate before building.
- 2026-10-10: Added the project context file, 4 mock-up images and the interactive HTML design document with a playable sketch.
- 2026-10-10: Art direction: cute, short and wide chibi martial artists with a slight Japanese feel; neon '80s arcade tone. Size samples drawn (48/64/80 px).
- 2026-10-10: Sprite size medium (64 px). Overall aesthetic parked to revisit later.
- 2026-10-10: Polish and game feel is a core goal; dedicated tuning pass before release (at the latest before the third version).
- 2026-10-10: Pixel perfect is a requirement (see section).
- 2026-10-10: User approved the cabinet layout and proportions (art style to be refined).
- 2026-10-10: Organized the project files (docs/, sources/, archive/) and pushed them with a README to the repository.
- 2026-10-10: Architecture document written (`docs/architecture/ARCHITECTURE.md`): layers, monorepo, core rules + referee, MatchSession, director/views, pixel scaler, tuning, online, Android, code rules, testing. Proposal pending the user's review.
- 2026-10-10: Cabinet frame trimmed to 270x472 native (from 502) so it shows at 2x in a 1080p browser window; mock-ups redrawn.
- 2026-10-10: Layout: vertical arcade cabinet (monitor on top, control panel with 3 physical buttons + decorative joystick below), in browser and on phone. Replaces landscape 16:9.
- 2026-10-10: Menu flow added: placeholder logo intro (fade in/out, replaceable), home screen with Start game vs CPU and a greyed Online slot for later, result screen with Retry / Main menu. Menus as data so multiplayer menus slot in later. Architecture doc, design documents and mock-ups updated.
- 2026-10-10: First playable built (logo, home, best-of-three vs random CPU, result with Retry / Main menu) with placeholder art drawn in code; rules/referee/session tests, layer lint rules, Playwright smoke test and CI. PR from `claude/first-playable-8tihq6`.
- 2026-10-10: User merged-approved; PR #3 (first playable) merged into main. Next steps agreed: tuning panel, juice, sound, then final art.
- 2026-10-10: Cleared the npm install warnings: Vitest 3 → 5 (3 advisories in dev-only test tooling: `@vitest/mocker`, `tinypool`) and approved esbuild's install script in `allowScripts` (newer npm asks for it). The placeholder-logo tool now runs with plain `node`.
- 2026-10-10: Published the playable build (main @ a1a96aa) to GitHub Pages at https://robinneefs.github.io/RPS-Fighter/. Static hosting is enough until online multiplayer, which will need a separate realtime server.
- 2026-10-10: Added OPTIONS to the home menu with a Scaling setting: Pixel perfect (default) or Fill height (fractional nearest-neighbour scale that fills the screen; a player-chosen exception to pixel-perfect rule 2), remembered in localStorage. Also fixed the e2e smoke test, which was red on main because one big fake-clock jump let game time fall behind (now steps the clock in 50 ms chunks).
- 2026-10-10: Design documents and README now show screenshots of the real build instead of the mock-ups (`docs/screenshots/{browser,phone}-{logo,home,pick,reveal,result}.png`, captured by `sources/screenshots/capture.mjs` with a seeded CPU). The interactive page, the Claude Doc and the README use them; the mock-up files stay in `docs/mockups/`. Retaken after v0.2.0 (Options screen and version label); the README also links the online build.
- 2026-10-10: Versioning set up at the user's request: semver under 1.0, version in `apps/game/package.json` shown on the home screen, `CHANGELOG.md`, a git tag per build. Tagged the first playable v0.1.0; the Options build is v0.2.0. Every build gets a version bump and changelog entry.
- 2026-10-10: PR #5 merged (main @ 7008415); the Release workflow tagged v0.1.0 and v0.2.0 with GitHub releases, and v0.2.0 was published to https://robinneefs.github.io/RPS-Fighter/. `robinneefs/robinneefs.github.io` is now in the project's repository list, so threads can push the build there.
- 2026-10-10: v0.3.0: Fill height is now the default scaling for first-time players (user's request); a saved choice still wins. README play link moved directly under the title. Doc screenshots stay Pixel perfect (the capture script sets it). Merged as PR #6 (main @ c49023e, tagged v0.3.0) and published to GitHub Pages (robinneefs.github.io @ f3001c7).
- 2026-10-10: v0.4.0: the startup intro shows the user's Chain Shift studio logo instead of the placeholder. The user dropped a white master; Claude made it purple (#A35BFF, 5.3:1 contrast on the intro's near-black, picked over paler lavender to stay clearly purple), sized 176 px wide at native resolution with hard edges (pixel perfect). Masters in `docs/brand/`, rebuilt with `tools/make-logo.py`; the placeholder painter and its tool were removed.
- 2026-10-10: At the user's request (same thread) the in-game logo was then redrawn in a pixel-art style matching the game's title: 2x2-pixel blocks, highlight/lowlight edges, `palette.shadow` drop shadow, ink outline. The full-size purple copy in `docs/brand/` stays smooth for non-game use.
- 2026-10-10: PR #7 merged (main @ cdabb84, Release workflow tagged v0.4.0) and v0.4.0 published to GitHub Pages (robinneefs.github.io @ 2aa77f2) at the user's request. The repo copy of this file lags this line until the next PR syncs it.
- 2026-10-10: Wrote the future plans and roadmap Claude Doc (link under Links) collecting all plans so far by area, with a how-to-proceed note per item and a suggested order: game feel and sound, final art, polish and 1.0 on the web, online, Android. Re-added the move-animation open question, which had dropped out of this file.
- 2026-10-10: Dev tuning panel built (v0.5.0, step 3 item 1) at the user's go-ahead: Tweakpane in dev builds only, editing feel values live and rules/timings for the next match, so the open 3s vs 5s timer and 100 health questions can be tried by feel. Each match now gets its own copy of the rules, and the fight HUD reads them from the session.
- 2026-10-10: v0.4.1: tidied the repo root at the user's request (PR #9). `tsconfig.base.json` and `vitest.config.ts` moved to `config/` (`npm test` passes `--config`), `.prettierrc.json` folded into `package.json`. Kept in the root: LICENSE, README, CHANGELOG, PROJECT_CONTEXT, `package.json`, `package-lock.json` (npm needs both there), `eslint.config.js` (ESLint and the VS Code extension only look in the root) and `.prettierignore`. Merged 2026-10-11 (main @ 5576d4b, Release workflow tags v0.4.1); not republished to GitHub Pages, since the game is unchanged.
- 2026-10-10: At the user's request, documented the tuning panel: new guide `docs/tuning/TUNING-PANEL.md` (how to use it, a tuning workflow, how changes get back into the code, and how it is built and extended), linked from the README, the architecture doc and the changelog, with a screenshot (`docs/screenshots/browser-tuning-panel.png`). Workflow agreed: the user tunes, presses Copy changes and pastes the note in the thread; Claude writes the values in as new defaults.
- 2026-10-11: v0.4.2: the user's four redesign mock-ups added to `docs/mockups/redesign/` (PR #10, merged into main @ 533d40b at the user's request; Release workflow tags v0.4.2). Docs only; not republished to GitHub Pages. PR #8 (tuning panel, v0.5.0) will need its version/changelog lines merged with this.
- 2026-10-11: Decided to move hosting, once the game is rebranded and renamed, to a free GitHub organization named after the game at `<org>.github.io`, replacing robinneefs.github.io/RPS-Fighter/. Added to the roadmap doc.
- 2026-10-11: PR #8 (dev tuning panel, v0.5.0) merged into main @ d34be69 at the user's request (Release workflow tags v0.5.0). The user's local checkout (D:\Vibe Coding Projects\rps-rivals) is on main. Not republished to GitHub Pages (the panel is dev-only, so the online game looks the same). The user put the music/sound/juice thread on hold; next in that thread when resumed: juice, then sound.
- 2026-10-11: The game is renamed **RPS Rivals** (user's decision, replacing "Rock Paper Scissors Fighter" / "RPS Fighter"). All docs updated. Kept on purpose until later steps: the live URL robinneefs.github.io/RPS-Fighter/ (moves with the planned hosting change), the `rps-fighter.*` localStorage keys (changing them would reset saved settings), and in-game text such as the cabinet marquee (part of the asset rebrand, next). The GitHub repo rename to `rps-rivals` and the user's local folder rename are done by the user.
- 2026-10-11: Rename PR #11 (v0.5.1) merged into main @ de5a0c5 at the user's request. The user renamed the GitHub repo to `robinneefs/rps-rivals` (the old URL redirects). The user then renamed their local folder to `D:\Vibe Coding Projects\rps-rivals`.
- 2026-10-11: The README discloses that RPS Rivals is AI-developed, in a whimsical centered banner right under the title and Play link ("This is a Claude-run operation", "Coded on only the purest of vibes", shields.io badges). User's request; v0.5.2, PR #12 merged into main @ e82ad95 at the user's request.
- 2026-10-11: Asset rebrand plan proposed in its own thread (`docs/rebrand/REBRAND-PLAN.md`): pixel RPS RIVALS wordmark, palette shift to the sheet's pink/cyan/violet/navy/lavender, ROCK/PAPER/SCISSORS buttons and icons, moves renamed Rock (=Attack), Paper (=Block), Scissors (=Throw) with the same rules, chibi fighters (own designs, not Ryu/Chun-Li lookalikes). Waiting on the user's approval; v0.6.0 planned.
- 2026-10-11: Rebrand thread: the redesign mock-ups are AI images, not real pixel art, so they are a style guide only, not cut up into assets. The user can't afford PixelLab; UI is drawn in code for free. At the user's request the UI rebrand kit was built in a separate folder, not in the game: `docs/rebrand/` (kit + previews), source `sources/rebrand/draw_ui.py`. Fighters and stage in the previews are stand-ins. Waiting on the user's feedback before anything goes into the game.
- 2026-10-11: Checked how pixels are enforced (user's question): the native-size canvas, nearest-neighbour upscaling, `pixelArt`/`roundPixels`/`antialias: false` force everything onto one grid with no blur, but nothing converts a smooth image into pixel art (no palette reduction, no averaging on shrink). Art must be made at native size in palette colours first; an import helper would go in `tools/`. Documented in architecture section 7; v0.5.3, PR #13 merged into main @ 580de26 at the user's request.
- 2026-10-11: The user wants a different direction from the neon kit: a bright, colourful 90s fighting-game look (Street Fighter II era) for the UI, stage and cabinet, with big clear rock/paper/scissors icons on the buttons. Mock-ups made in `docs/rebrand/mockups-90s/` (source `sources/rebrand/draw_90s.py`), in two layouts: current (216x288 monitor) and square (216x216 monitor, marquee grown from 26 to 98 px for bigger marquee art). Waiting on the user's pick.
- 2026-10-11: Round 3 mock-ups (`docs/rebrand/mockups-round3/`, source `sources/rebrand/draw_round3.py`) after the user's feedback: they like the SF2-style health bars (now 12 px tall) and want a much bigger timer (now 15x21 digits) with juice in the real game (noted under Polish and game feel). They didn't like the cabinet, so four cabinet styles, four stages, four marquees and two flatter button-icon styles (white, engraved) were drawn. Square screen used by default. Waiting on the user's picks.
- 2026-10-11: The asset rebrand thread is paused at the user's request, after round 3. Nothing is in the game yet. On resume: get the user's picks (cabinet, stage, marquee, icon style, square vs tall screen, Rock/Paper/Scissors naming), then build v0.6.0.
- 2026-10-11: At the user's request (saved architecture prompt), the architecture doc was rewritten to match the real code (v0.5.4): real types, events, timings, tuning values, scenes, GameContext, lint rules and tests, planned parts marked; 7 diagrams redrawn, 2 new (code map, online hosting options). Section 10 now lists what is already online-ready and the gaps (opponent name, seat side, disconnect events, rematch waiting, lobby, server input checks, version match). New `ONLINE-OPTIONS.md` compares free online hosts; recommends a Cloudflare Durable Object per room (free plan: 100k requests and 13,000 GB-s a day, about 800 two-minute matches) over PeerJS P2P or Colyseus on Render. Waiting on the user's pick of host.
- 2026-10-11: PR #14 (v0.5.4, architecture docs) merged into main @ 9c8e68e at the user's request. **The user chose Cloudflare Workers + Durable Objects for online play** (replacing Node + Colyseus). Implementation moves to its own thread on a new branch.
- 2026-10-11: v0.6.0, first online play, built on branch `claude/project-thread-pxob0s` in its own thread: Cloudflare Worker + Durable Object room per 4-letter code running the core `Referee`, lobby (CREATE ROOM / JOIN ROOM), always-on-the-left seat mirror, opponent shown as RIVAL, rematch needs both players, leave/disconnect goes home, same game version required. Tested with two browsers against a local Worker. The user was given setup steps (free Cloudflare account, workers.dev subdomain, API token from the "Edit Cloudflare Workers" template, account ID, both as GitHub repo secrets). Release builds keep ONLINE greyed out until the Worker address goes into `apps/game/src/config/online.ts`.
- 2026-10-11: Publishing setup agreed: feature branches → main (staging, auto-published to robinneefs.github.io/rps-rivals/staging/) → production branch (live, robinneefs.github.io/rps-rivals/), each with its own Cloudflare Worker; tags on production. The user dropped the idea of a rps-rivals GitHub org after hearing it needs a repo transfer. Added to PR #15.
- 2026-10-11: PR #15 merged into main @ 63dfaf6 at the user's request; first Pages publish succeeded (staging = v0.6.0 at robinneefs.github.io/rps-rivals/staging/, live = v0.5.4 at robinneefs.github.io/rps-rivals/). The user set Pages to GitHub Actions and allowed main + production on the github-pages environment. Old RPS-Fighter page now redirects. Still to do by the user: Cloudflare secrets and the `CLOUDFLARE_WORKERS_SUBDOMAIN` variable.
- 2026-10-11: Cloudflare set up by the user (workers.dev subdomain `ggenie`, secrets + `CLOUDFLARE_WORKERS_SUBDOMAIN` variable). Staging Worker live at rps-rivals-server-staging.ggenie.workers.dev; staging site rebuilt with online play on. The live Worker (`rps-rivals-server`) deploys on the first publish to production. Claude's cloud sessions can't reach workers.dev (proxy), so online checks need the user's browser.
- 2026-10-11: v0.6.1 (PR #16, merged into main @ f427573 with the user's pre-approval; on staging, not yet live): JOIN ROOM letters now come from `KeyboardEvent.key` (AZERTY reported by the user typed by QWERTY position before), and the code boxes are backed by an invisible `<input>` laid over them so phones open their keyboard on tap. Pattern for future text entry: a transparent DOM input positioned from `scaler.layout` + `scaler.zoom`; `InputRouter` leaves letters and Backspace to a focused text field.
- 2026-10-11: v0.6.2 (PR #17, merged into main @ c51cd60 at the user's OK; on staging, not yet live): NEW ROOM and JOIN ROOM get on-screen CANCEL/BACK buttons (the user found no way back on the create screen; only Esc worked, nothing on phones or cabinet buttons). Any cabinet button or Enter also cancels NEW ROOM. Room codes skipping vowels (A etc.) is intended; the user said to leave it without a hint.
- 2026-10-11: Audio ("Game audio" thread): the user took all the recommended defaults (chiptune, generated SFX, music loops, SFX first, no announcer). Built as v0.8.0: `audio/AudioService` in the GameContext, music per screen from `SceneFlow`, SOUND / MUSIC / EFFECTS in Options. CC0 sites were unreachable from the cloud session, so all audio is generated by `tools/audio/make-audio.mjs`. PR #19 merged into main @ d2ef165 at the user's request (on staging; not yet live).
- 2026-10-11: Polish thread, v0.9.0 (PR #20, draft): flat white move icons on the cabinet buttons and reveal coins (round 3 "white icons" style), deeper button press with a lock-in flash and ring, a control panel with depth (slanted lit top, bevels, bolts, front lip). At the user's request the pick timer is now 3s (was 5s) and start health 50 (was 100). Polish changes are copied straight into the user's local clone for testing before any merge.
- 2026-10-11: The user asked for fixed online sides: the room's host is always Player 1 on the left and the guest Player 2 on the right, the same on both screens (before, each player saw themselves on the left). Built as v0.9.1 (PR #21, merged into main @ 95fa118 at the user's OK; on staging, not yet live): the client seat mirror (`mirror.ts`) was removed, the server already seated create = p1 and join = p2. The user's character redesign request (P1 man in jeans and red shirt, P2 woman in a fighting outfit) runs in its own thread, "New fighter designs".
- 2026-10-11: New fighter designs at the user's request ("New fighters" thread), v0.10.0 (PR #22, merged into main @ 7ee7f98 at the user's OK; on staging, not yet live): P1 (left) a strong brawler in blue jeans, brown boots and an open red shirt over a white undershirt; P2 (right) a woman martial artist with a high ponytail, teal wrap top with white trim, gold sash, navy pants, white boots, wrapped hands. Still drawn in code (`apps/game/src/assets/placeholders/fighters.ts`, colours in `config/palette.ts` `fighterColors`), now with two body builds posed by two-bone IK so both share the same poses. Preview: `docs/art-direction/9-new-fighters.png`. This replaces the white-gi / blue-gi chibi placeholders; the user approved the look as is.
- 2026-10-11: Final polish thread before 1.0 ("Final polish"), v0.11.0 on branch `claude/final-polish-x0olnn`: buttons get a chrome collar, cylinder shading, a rimmed cap with glint, an embossed icon, a hover state and a glint that sweeps them every 6s (`buttons.shine*` in tuning); the marquee flickers every 1.5-4.5s (was 4-11s), darker (dip 0.7, blackout 0.92), with the neon loop going out too and a bright surge on relight (`marquee` in tuning). Copied to the user's local clone for testing; merge only on the user's OK.
- 2026-10-11: Final polish round 2 (same thread, still v0.11.0, PR #23): at the user's picks, softer marquee flicker (dip 0.45, blackout 0.7, surge 0.1; frequency kept), new chunky gradient K.O. letters (`assets/placeholders/koLetters.ts`; the user wanted only the letters changed, no freeze/zoom/PERFECT), joystick click (`stickClick` sfx) and wobble on release, CRT off/on screen transitions (TransitionScene), a HOW TO PLAY home-menu item and screen (HowToScene), and wood grain plus wear on the cabinet body. Skipped at the user's call: fighter reactions, the INSERT COIN attract screen. The user decided the marquee art stays as is (2026-10-11: "the art is fine").
- 2026-10-11: Release prep (same thread, v0.11.0, PR #23): tab title "RPS Rivals: Rock Paper Scissors Fighter", favicon + apple-touch-icon (the Rock button) and a 1200x630 share image with og/twitter tags pointing at the live address, all made by `tools/make-icons.mjs` (also makes `docs/readme/play-button.png`). Screenshots retaken (now also `howto` and `ko`). README rebuilt at the user's request: kept the play link and AI disclosure, added a PLAY button, game description, screenshots, tech list, mermaid architecture diagram, an assets/credits disclosure (marquee cut from the owner's AI-generated mock-up; Chain Shift logo is the owner's; everything else generated in code), privacy note. The GitHub About description can't be set from a cloud session: text given to the user to paste.
- 2026-10-12: Bug hunt before 1.0 (same thread, v0.11.1), at the user's request. Tested online play with two browsers against a local server (full match, rematch, leaving at every stage, full/unknown/cancelled rooms, mashing), a hidden tab, random input across screen sizes. Fixed: keys pressed while loading froze the game on black (TransitionScene wipe before its create); online, the rival leaving between the K.O. and the result left a dead RETRY; CPU matches now pause while the tab is hidden (`PausableClock`); lobby BACK/CANCEL overlapped the hint. Real phones still need the user's own check.
- 2026-10-12: v1.0.0, the first public release, at the user's word ("ready to publish v1.0") after the phone checklist looked good to them. Version bump PR into main, then main into `production` (live was v0.5.4).
- 2026-10-12: Android work started at the user's request (thread "Android version"). v1.1.0 on branch `claude/android-vibration-kwtbzw`: vibration on every screen shake, scaled to it (clash 12 ms, hits 16/24/32 ms by damage, time-up 16 ms, K.O. 40-70-20 ms, light/medium/heavy in the Android app), a weaker buzz right after a stronger one is dropped, never while the game is in the background; VIBRATION (default ON) in Options, listed only on touch devices that can vibrate (Options items sit 2 px closer then so the hint fits). Plan for the app: Capacitor wrapping the Vite build; the user needs a Google Play developer account (one-time 25 USD, identity check), and a new personal account must run a closed test with 12 testers for 14 days before going to production.
- 2026-10-12: Android app project added to PR #27 (still v1.1.0), after the user installed Android Studio: Capacitor 8 in `apps/android` (workspace `@rps/android`, native project in `apps/android/android/`), game built with `vite --mode android` (`apps/game/src/config/online.ts` points android mode at the live Worker), portrait only, system bars hidden, VIBRATE permission, phone back button = Esc (leaves the app from Home) via `@capacitor/app`, haptics via `@capacitor/haptics` (`apps/game/src/platform/native.ts`). versionName/versionCode come from `apps/game/package.json` (1.2.3 -> 10203). Release signing reads `android/keystore.properties` (gitignored; upload key kept outside the repo). Launcher icons (Rock button on ink), splash (marquee on room colour) and store art (moved to `play-store/` on 2026-10-13) are made by `tools/make-icons.mjs`. The Android SDK can't be downloaded in cloud sessions (dl.google.com blocked), so Gradle builds only run on the user's PC. Play Console: the user and a friend are not a registered company, so a personal developer account (12 testers for 14 days before production).
- 2026-10-12: At the user's request (same PR #27, still v1.1.0): in the Android app Options has no SCALING (the app always uses fill height) and Home has QUIT (closes the app); the app going to the background (`@capacitor/app` appStateChange) acts like a hidden tab, so the game loop and CPU match pause and all sound stops; the result screen's RETRY is now REMATCH (web and app).
- 2026-10-13: v1.1.1, at the user's request: Google Play kit in `play-store/` at the repo root (listing text, Play Console form answers, icon, feature graphic, six 1080x1920 app-look screenshots made by `sources/play-store/capture.mjs`) and a privacy policy page `apps/game/public/privacy.html` (live at /rps-rivals/privacy.html; contact via GitHub issues so no email is published). The user is waiting on Google's identity check before creating the app in Play Console.
- 2026-10-17: v1.2.0, at the user's request ("new players have a hard time following what's going on"): a "YOU VS RIVAL" card before round 1; bobbing YOU / RIVAL tags over the fighters through round 1 (they blink out at round 2); side colours (`sideColors` in `config/palette.ts`: red p1, teal p2) on HUD names, bar frames and round pips; pick chips over the heads while picking (your move, the rival's "?"); a bigger PICK YOUR MOVE under the fighters, with "▼ PRESS A BUTTON ▼" for the first 3 picks; owner names on the reveal badges; the verdict is now the rule plus who hit ("ROCK BEATS SCISSORS" / "YOU HIT!", "CLASH!" / "NO DAMAGE"); the damage number is red and the hurt bar flashes white. The user asked for every CPU label to say RIVAL (HUD, result, home menu tag "VS RIVAL"). Everything works the same online. New view: `views/TagView.ts`.
- 2026-10-17: v1.3.0, at the user's request. The CPU is called CPU again in CPU matches: the user only wanted RIVAL for online, so v1.2.0's "every CPU label says RIVAL" is reverted for CPU matches. The ONLINE menu tag is now "VS RIVAL" (was "VS FRIEND"). Other changes: mouse hover selects menu items (`MenuView`, ignored for touch); How to Play draws the moves as a circle with arrows; sound levels rebalanced (`SFX_GAIN` re-measured from the files to about -11 dB peak short-term, buses music 0.7 / sfx 0.7, a limiter on Phaser's master output in `AudioService`); CRT scanlines redrawn on a full-window device-resolution canvas aligned to the browser's actual pixel rows (`fx/crtOverlay.ts`).
- 2026-10-24: v2.0 overhaul planned with the user (plan doc linked under Links; nothing built yet). Decisions: detail closer to the ChatGPT mock-ups (monitor 288x360 at 4:5, fighters ~100 px tall in 128x128 frames); the cabinet becomes a glossy non-pixel illustration drawn as a page layer around the game canvas, only the monitor stays pixel art (pixel-perfect rules now apply to the monitor only, scaled with sharp scaling to fill its bezel); bright, colourful 90s arcade look replaces the purple/navy synthwave palette; cabinet is a 9:16 core (1080x1920 design units) inside 1170x2340 art so upright phones with browser bars showing (about 0.52 to 0.59 wide-to-tall) are filled with no empty bars. 4 fighters to start, differing only in damage and health: Brawler R15 P10 S20 HP50, Martial artist R10 P20 S15 HP50, Bruiser R25 P10 S10 HP55, Skater R15 P15 S15 HP50 (every matchup 47-53% in a best-of-three under optimal play; names are working titles). The match flow on screen gets redesigned too (one focus per beat, clear, fast), designed as a storyboard before any code, then tuned with a pacing page in the dev tuning panel. Next: the user runs the ChatGPT mock-up prompts in the plan doc and picks direction A, B or C.
- 2026-10-24: The user picked the look for v2.0: `docs/mockups/v2/0-vibe-fight.webp` (their ChatGPT image: navy cabinet with worn edges, red/yellow/blue speed-stripe trim, brush-lettered "RPS RIVALS" marquee in yellow-orange-red, red ball joystick, pink ROCK / yellow PAPER / cyan SCISSORS buttons, Brawler vs Bruiser on a sunny city rooftop in 16-bit pixel art). It is the basis for every other screen. Next: assets are cut from it with ChatGPT, one part per image (cabinet body with a magenta screen area, marquee, buttons, joystick, room backdrop, rooftop stage, Brawler and Bruiser sprite sheets, portraits, effects), saved to `art/source/`, then cleaned up by Claude. The cabinet body is asked for with the plan's taller 4:5 screen (the mock-up's screen is nearly square) so it fills an upright phone.
- 2026-10-24: v2.0 cabinet parts all in `art/source/` (cabinet body 941x1672 with a 616x767 magenta 4:5 screen at x162 y322; marquee; buttons up/pressed + labels; joystick in 9 directions as a 3x3 grid; arcade room; rooftop stage, which cleans to 288x360 at 40 colours with almost no loss). Control panel layout approved by the user ("perfect"), in cabinet-body pixels: joystick centre x225, base about 150 wide, bottom at y1306; buttons 148 wide, centres x395 / 555 / 715, ring bottoms at y1258, labels just below. The user wants big, easy touch controls; tap zones will cover the whole panel slice around each control. On a 390 px wide phone the cabinet fits by width (screen about 267x332 CSS px, buttons about 64 px). Preview script: `sources/v2-preview/compose.py`; previews in `docs/mockups/v2/`.
