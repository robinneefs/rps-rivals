# Architecture

## Current architecture (v2 revamp, 30 October 2026)

This section describes the code as it is now. The longer reference further down is a v0.11 snapshot (11 October): its principles (four layers, the referee, sessions, menus as data, tuning in one place, the lint rules) still hold, but its sizes, scenes, rules values and file lists are out of date wherever they differ from this section.

### What changed since the v0.11 reference

| Area | v0.11 reference | Now |
|---|---|---|
| Screen | One Phaser canvas drew the pixel cabinet and a 216 × 216 monitor | The cabinet is a painted HTML/CSS layer (`cabinet/CabinetView.ts`, `cabinet/geometry.ts`) with hit zones for the buttons and joystick. Phaser draws only the monitor: a native **192 × 240** framebuffer |
| CRT | A camera shader on the native canvas | `fx/CrtDisplay.ts` nearest-enlarges the finished framebuffer into a separate WebGL canvas and runs the CRT pass (`fx/crt.ts`) at display resolution. Without WebGL, the native camera shader is the fallback |
| Scaling | Fill height or Pixel perfect for the whole pixel cabinet | The cabinet fits the window. **Pixel perfect** (Options, off by default) picks the largest whole-device-pixel multiple of 192 × 240 and scales the cabinet around it |
| Rules | One shared damage table (15/10/20) and 50 health | Per-fighter health and damage (`packages/core/src/characters.ts`), bound into the match rules for each side |
| Flow | Home → Fight → Result | Home → Character select → Versus → Fight → Victory splash. How to Play was removed on 30 October |
| Fighters | Two placeholder fighters, 64 px | Taiko, Riot and Anchor: nine-pose generated sheets in 160 px cells (about 100–114 px tall), with masked alternate palettes for mirror matches |
| Stages | Three painted stages | Five animated stages, each with its own view, effects and music |
| Online | No character choice | Protocol **4**: the server confirms both fighter choices, freezes the identities and plays per-side rules; disconnects and phone suspension are reconciled |

### Code map (game client)

```
apps/game/src/
├── main.ts       builds CabinetView, InputRouter, settings, the Phaser game, SceneFlow, audio, haptics; mounts the CRT display; loads dev/ in dev builds
├── cabinet/      CabinetView (DOM cabinet, buttons, joystick, marquee, engraving) and its geometry
├── config/       tuning.ts (feel), stages.ts, characters.ts (menu roster), fighterGeometry.ts, layout.ts, palette.ts, menuTypography.ts, online.ts
├── scenes/       Boot, Logo, Home, Options, CharacterSelect, Lobby, Fight, Result, Transition + flow.ts, monitor.ts, watchSessionEnd.ts
├── views/        FighterView, HudView, ClashView, BannerView, VersusView, VictoryView, StageView + Storm/Harbor/Courtyard/Foundry views, menu views
├── fight/        FightDirector and choreography.ts (session events → the round's beats)
├── fx/           CrtDisplay, crt, screenEffects (one-shot CRT bursts), shake, cabinetShake, flash, particles, koImpact, portraitBreathing
├── session/      MatchSession, LocalSession, OnlineSession + socket, RandomCpu, PausableClock, createSession
├── assets/       texture keys, alternate palettes and portraits, move-hand coins, pixel font, legacy placeholders
├── audio/        AudioService and sounds.ts (effects and the six music tracks)
├── platform/     settings.ts, haptics.ts, native.ts (Capacitor back button and app state)
└── dev/          Effects Studio, round review, menu review, legacy tuning panel (dev builds only)
```

### Scenes and the flow

| Scene | Draws |
|---|---|
| `BootScene` | Loads fighters, alternates, stages, combat art, menu art and audio, then starts the logo |
| `LogoScene` | The Chain Shift intro (any button skips it) |
| `HomeScene` | A random fighter's breathing portrait, the title, and PLAY VERSUS CPU / PLAY ONLINE / OPTIONS. Online is selected first when the build has a server address; without one it is greyed out |
| `OptionsScene` | CRT SCREEN, PIXEL PERFECT, HAPTICS, SOUND, MUSIC, SFX, BACK |
| `LobbyScene` | The Online menu, Create Room (shows a 4-letter code) and Join Room (code entry); hands the connected session to character select |
| `CharacterSelectScene` | The three-portrait lineup with live stats, Confirm and Back. Online, both players lock in before the match starts |
| `FightScene` | The stage, fighters, HUD, countdown, coins, banners and effects, driven by `FightDirector` |
| `ResultScene` | The victory splash (the winner's portrait, YOU WIN or the opponent's win) with Rematch and Main menu, plus online notices |
| `TransitionScene` | Screen wipes and the versus panels (`VersusView`), which slam together over the old screen and open onto the fight |

`SceneFlow` (`scenes/flow.ts`) is still the one place screens change: `toLogo`, `toHome`, `toOptions`, `toLobby`, `toCharacterSelect`, `toFight`, `toResult`. It owns the session's lifetime, gates input during transitions, picks each screen's music (the fight's theme comes from its stage) and returns online players to the main menu after a match or a disconnect.

### Rules and characters

- `CHARACTER_HEALTH` and `CHARACTER_DAMAGE` in `packages/core/src/characters.ts`: Taiko 100 health and 25 / 25 / 25 damage (rock / paper / scissors), Riot 80 and 15 / 15 / 35, Anchor 120 and 50 / 5 / 5.
- `rulesForFighters(rules, fighters)` binds `healthBySide`, `damageBySide` and `autoPickBySide` (Anchor's timeout pick is always Rock). `LocalSession` and the server's `MatchRoom` both use it, so local and online matches play the same rules.
- Phase timings (`packages/core/src/config.ts`): round intro 2800 ms (ROUND, then FIGHT, then a short clear pause), picking 3000 ms, reveal 1800 ms, round over 2200 ms. Two rounds win the match.
- The stage comes from `session.stageSeed()` (it changes every rematch, and online both players get the same one), or from `?stage=<id>`.

### Online

- `PROTOCOL_VERSION` is 4. Older clients are refused, so the browser build and the Worker must be deployed together.
- The room seats host and guest, runs character confirmation, freezes both identities, waits for both clients' `ready`, then runs the referee. Picks stay secret until the reveal.
- `OnlineSession` keeps a persistent `endedReason`. `watchSessionEnd` checks it on focus, visibility and every frame, so a notice missed while a phone was suspended still appears, and the player returns to the main menu. Stale connections are detected and the check also runs on focus.

### Development tools

- **Effects Studio** (`dev/effectsPanel.ts`, F4): CRT controls and presets plus one-shot screen effects, saved per device.
- **Round review** (`?roundReview&beat=N`): 19 scripted beats of a round on the real fight views.
- **Menu review** (`?menuReview=…`): opens a single screen directly.
- **Legacy tuning panel** (`?legacyTuning`): the Tweakpane panel described in section 8.

### Tests

193 unit tests in 31 files (Vitest: rules, referee, characters, protocol, sessions, the server room, stages, audio, palettes, choreography, haptics, session-end handling) and the Playwright suites in `apps/game/e2e/` (`smoke`, `characterSelect`, `effects`, `onlineReturn`). The browser tests play full CPU matches and rematches, mirror matches and phone touch input, check menus, music and effects persistence, and script online exits and disconnects.

## Historical architecture reference

_Historical: describes the code as it was in v0.11.0 (2026-10-11). See [Current architecture](#current-architecture-v2-revamp-30-october-2026) for what has changed since. Kept as a design reference; when the code changes, update the current section above._

How the RPS Rivals code is organised so that it stays readable as it grows: from a local game against a random CPU, to online play, to an Android app. It builds on the decisions in [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md) (Phaser 3, TypeScript, Vite, Vitest, arcade cabinet layout, pixel perfect, polish as a core goal). Where online matches could be hosted for free is compared in [`ONLINE-OPTIONS.md`](ONLINE-OPTIONS.md).

## Contents

1. [Goals](#1-goals)
2. [The big picture: four layers](#2-the-big-picture-four-layers)
3. [Repository layout and code map](#3-repository-layout-and-code-map)
4. [Core: rules and referee](#4-core-rules-and-referee)
5. [Session: local now, online later](#5-session-local-now-online-later)
6. [Presentation: scenes, director, views](#6-presentation-scenes-director-views)
7. [Screen and pixel-perfect rendering](#7-screen-and-pixel-perfect-rendering)
8. [Tuning: every feel value in one place](#8-tuning-every-feel-value-in-one-place)
9. [Input, audio, assets, settings, wiring](#9-input-audio-assets-settings-wiring)
10. [Online play](#10-online-play)
11. [Android](#11-android)
12. [Keeping the code clean](#12-keeping-the-code-clean)
13. [Testing and CI](#13-testing-and-ci)
14. [How the design grows](#14-how-the-design-grows)
15. [Build order](#15-build-order)
16. [Decisions and open choices](#16-decisions-and-open-choices)

---

## 1. Goals

| Goal | What it means for the code |
|---|---|
| **Readable** | Small files with one job each (the biggest, `fighters.ts`, is under 200 lines). A newcomer can find "where does damage happen?" in seconds: `packages/core/src/rules/exchange.ts`. |
| **Expandable** | New moves, CPUs, fighters, modes and online play slot in without rewriting what exists. |
| **Online ready** | The rules run identically on a server. The client never needs to know the opponent's move early. |
| **Testable** | Everything that decides something is plain TypeScript, tested without a browser. |
| **Pixel perfect** | One pixel grid, whole-number scaling by default, whole-pixel positions, enforced in one place. |
| **Polished** | All timings and juice values are named and tunable (`tuning.ts` and the dev panel), never buried in scene code. |

The one rule behind all of it: **the code that decides is separate from the code that shows.**

## 2. The big picture: four layers

![Layers and dependencies](diagrams/1-layers.svg)

| Layer | Where | Job | Knows about |
|---|---|---|---|
| **Core** | `packages/core` (`@rps/core`) | The rules (who wins, damage, health, rounds) and the referee (match phases and their timing). | Nothing. Zero dependencies: no Phaser, no browser, no network. |
| **Session** | `apps/game/src/session` | "A match in progress" as seen by one player. Takes the player's pick, reports what happened. | Core. |
| **Presentation** | `apps/game/src/` `scenes`, `fight`, `views`, `menus`, `fx`, `input`, `assets` | Draws, animates, reads input. | The session (through its interface), Phaser. |
| **Platform** | `apps/game/src/platform` | The browser page now, the Capacitor shell later: screen scaling and stored settings. | The device. Exposed to the game through small classes. |

Dependencies only point **down**. Core never imports anything from the game, the session never imports Phaser, and scenes never decide a result. The linter checks this (see [section 12](#12-keeping-the-code-clean)), so it can't erode quietly.

Two small shared folders sit beside the layers: `config/` (numbers and colours: `tuning.ts`, `layout.ts`, `palette.ts`) and `util/` (`snap`, `frameRect`). `dev/` holds the tuning panel, which only dev builds load.

## 3. Repository layout and code map

An npm workspaces monorepo. The core is its own package, so a future server can depend on it and the "no Phaser in the rules" rule is enforced physically: `packages/core` has no Phaser dependency to import.

```
rps-rivals/
├── packages/
│   └── core/                    @rps/core: rules + referee, zero dependencies
│       ├── src/
│       │   ├── rules/           types.ts, exchange.ts (resolve, apply, rounds), sides.ts
│       │   ├── referee/         referee.ts (phase machine), clock.ts (Clock, Rng, seededRng), emitter.ts
│       │   ├── config.ts        defaultRules (damage, health, rounds), defaultTimings (phase lengths)
│       │   └── index.ts         the public API; nothing else is imported from outside
│       └── test/                rules, referee (+ a fake clock)
├── apps/
│   ├── game/                    the Phaser client (Vite)
│   │   ├── index.html
│   │   ├── public/              favicon, touch icon and link-share image; assets/: logo.png, marquee.png, audio/
│   │   ├── e2e/                 Playwright smoke tests
│   │   ├── test/                LocalSession, OnlineSession, scaling + settings, stages, audio files, tuning panel plumbing
│   │   └── src/
│   │       ├── main.ts          builds the Phaser game and the GameContext, loads dev/ in dev builds
│   │       ├── version.ts       VERSION, injected by Vite from package.json
│   │       ├── config/          tuning.ts (feel), layout.ts (cabinet geometry), palette.ts, stages.ts, online.ts (server address)
│   │       ├── platform/        PixelScaler (+ computeLayout), settings.ts (SettingsStore)
│   │       ├── session/         MatchSession, LocalSession, OnlineSession + socket, MoveSource, cpu/RandomCpu, createSession, browserClock, PausableClock
│   │       ├── input/           InputRouter: keys, taps, joystick → actions
│   │       ├── scenes/          Boot, Cabinet, Logo, Home, HowTo, Options, Lobby, Fight, Result, Transition + flow.ts, context.ts
│   │       ├── menus/           MenuItem + homeMenu, optionsMenu, lobbyMenu, resultMenu (menus as data)
│   │       ├── fight/           FightDirector: session events → choreography
│   │       ├── views/           FighterView, HudView, ClashView, BannerView, ButtonsView, JoystickView, MenuView, MenuBackdrop, PixelText
│   │       ├── fx/              shake, cabinetShake, flash, particles, koImpact, crt + crtOverlay (CRT shader)
│   │       ├── audio/           AudioService (music + effects buses), sounds.ts (typed sound keys)
│   │       ├── assets/          keys.ts (typed texture keys), pixel font, placeholders/ (art drawn in code)
│   │       ├── dev/             tuning panel (Tweakpane), dev builds only
│   │       └── util/            snap, gfx
│   └── server/                  the online match server: a Cloudflare Worker, MatchRoom Durable Object per room code, using @rps/core
├── config/                      tsconfig.base.json, vitest.config.ts
├── tools/                       make-logo.py, make-marquee.py, make-icons.mjs, audio/make-audio.mjs (every sound)
├── docs/  sources/              design docs, mock-ups, art direction, the scripts that draw them
├── .github/workflows/           ci.yml (checks), pages.yml (publishes staging and live), deploy-server.yml (Workers), release.yml (tags each version)
└── package.json                 workspaces, shared lint/format/test scripts
```

A folder is added when there is something to put in it.

![Code map](diagrams/8-code-map.svg)

## 4. Core: rules and referee

The core has two parts with different jobs. `index.ts` exports exactly what the rest of the code may use: the rule functions and types, `defaultRules` and `defaultTimings`, the `Referee`, `Clock`/`Rng`/`seededRng`/`mathRandomRng`, and the small typed `Emitter`.

### 4a. Rules: pure functions

Data in, data out. No time, no randomness, no side effects. This is where the damage table and "only the loser takes damage" live, and nowhere else.

```ts
// packages/core/src/rules/types.ts
export type Move = 'rock' | 'paper' | 'scissors';
export type Side = 'p1' | 'p2';
export type Picks = Record<Side, Move>;

export interface RulesConfig {
  beats: Record<Move, Move>;          // rock→scissors, scissors→paper, paper→rock
  damage: Record<Move, number>;       // dealt when this move wins: scissors 20, rock 15, paper 10
  startHealth: number;                // 50
  roundsToWin: number;                // 2 (best of three)
}

export interface MatchState {
  round: number;                      // 1-based
  health: Record<Side, number>;
  roundsWon: Record<Side, number>;
  winner: Side | null;                // set when the match is over
}

export type ExchangeOutcome =
  | { kind: 'tie'; picks: Picks }
  | { kind: 'win'; picks: Picks; winner: Side; loser: Side; damage: number };

export type RuleEvent =
  | { type: 'damage'; side: Side; amount: number; health: number }
  | { type: 'ko'; side: Side }
  | { type: 'roundWon'; side: Side; round: number; roundsWon: number }
  | { type: 'matchWon'; side: Side };
```

```ts
// packages/core/src/rules/exchange.ts
resolveExchange(picks, cfg): ExchangeOutcome                 // who wins one exchange, for how much
applyExchange(state, picks, cfg): { state, outcome, events } // new state + what happened, for playback
createMatchState(cfg) · isRoundOver(state) · startNextRound(state, cfg) · isFinalRound(state, cfg)
```

The state is never changed in place; a new state comes back. That makes every result easy to test, log and replay, and it is exactly what a server needs. `applyExchange` refuses to play on after a K.O. or after the match is won, so a bug can't silently keep a finished round going.

Moves are data (`beats` and `damage` tables), not `if` chains, so a balance change or a renamed move is a config and type edit, not a logic rewrite. (The moves were renamed from Attack / Block / Throw to Rock / Paper / Scissors in v0.7.0 exactly that way.)

### 4b. Referee: the match phases

The referee runs one match: it moves through the phases, collects picks, fills in a random pick when time runs out, and calls the rules. It needs a clock and randomness, but **both are passed in**, so the referee stays engine-free and testable with a fake clock and a seeded RNG.

![Match phases](diagrams/2-match-phases.svg)

```ts
// packages/core/src/referee/clock.ts
export interface Clock { now(): number; schedule(ms: number, fn: () => void): Cancel; }
export interface Rng { next(): number; }                  // [0, 1); seededRng(seed) is mulberry32

// packages/core/src/referee/referee.ts
export type Phase = 'idle' | 'roundIntro' | 'picking' | 'reveal' | 'roundOver' | 'matchOver';

export class Referee {
  constructor(cfg: RulesConfig, timings: PhaseTimings, clock: Clock, rng: Rng);
  start(): void;                                  // a fresh match; calling it again is a rematch
  submitPick(side: Side, move: Move): boolean;    // only while picking; changeable; false if refused
  on(event, fn): Unsubscribe;
  readonly currentPhase, phaseEndsAt, matchState; hasPicked(side); dispose();
}

export interface RefereeEvents {
  phase:     { phase: Phase; endsAt: number | null; round: number; finalRound: boolean };
  locked:    { side: Side };                      // once per side per exchange, never the move
  reveal:    { picks: Picks; autoPicked: Record<Side, boolean>; outcome: ExchangeOutcome;
               events: RuleEvent[]; state: MatchState };
  matchOver: { winner: Side; state: MatchState };
}
```

Picks are kept in a private field until the reveal; the only thing announced while picking is `locked { side }`. That is the property online play depends on.

The same `Referee` class runs inside the local game now and can run inside an online match room later with a different `Clock`. That is the main reason online play won't need a rewrite.

**Phase timings are rules, not feel.** They live in `packages/core/src/config.ts` because a server has to use the same ones:

| Phase | Value | What happens |
|---|---|---|
| `roundIntroMs` | 1600 | "ROUND 1" (or "FINAL ROUND") banner; "FIGHT!" as picking starts |
| `pickMs` | 3000 | The countdown. Picks can change until it ends; nobody picks = random |
| `revealMs` | 1800 | The move badges collide, fighters act it out, the loser's bar drains |
| `roundOverMs` | 2200 | K.O. and the winner's pose, then the next round or the result |

The client plays its animations *inside* those windows (see [section 6](#6-presentation-scenes-director-views)). The dev tuning panel can change them for the next match.

## 5. Session: local now, online later

The fight and result screens must not care whether the opponent is a CPU on the same device or a person across the world. So they talk to one interface, `MatchSession`, and never to the referee directly (a lint rule forbids importing `Referee` in scenes, views and the director).

![Local and online sessions](diagrams/3-sessions.svg)

```ts
// apps/game/src/session/MatchSession.ts
export interface MatchSession {
  readonly me: Side;
  readonly rules: RulesConfig;            // the rules this match uses (the HUD reads start health from it)
  ready(): void;                          // the scene is listening: local starts the match, online tells the room
  submitPick(move: Move): void;
  requestRematch(): void;                 // answered by a 'rematchAccepted' event
  snapshot(): MatchView;                  // { phase, state, msLeft, myPick }
  on(event, fn): Unsubscribe;             // phase, locked, reveal, matchOver, rematchAccepted
  dispose(): void;
}

export type MatchSetup = { mode: 'cpu'; cpu: CpuKind };   // step 5 adds { mode: 'online'; roomCode }
```

`MatchView.msLeft` is "time left in this phase", not a clock time. The HUD timer reads it every frame, so it never needs to know whose clock the phase runs on. This matters online (section 10).

| Implementation | Status | How it works |
|---|---|---|
| `LocalSession` | Built | Owns a `Referee` on `browserClock` (`performance.now` + `setTimeout`) and `Math.random`, through a `PausableClock`: while the tab is hidden the whole match (timer, phases, CPU) waits, since the screen stops drawing then. Online matches can't pause. You are always `p1`; your picks go straight in. The opponent's picks come from a **move source**. `requestRematch()` is accepted at once. |
| `OnlineSession` | Planned (step 5) | A WebSocket client. Sends your pick to the match room and turns room messages into the same `SessionEvents`. |

`createSession(setup)` builds the session for a match. It gives each match its own copy of the rules and timings, so the dev panel's edits apply from the next match instead of halfway through one.

A **move source** is anything that can produce a pick for one side:

```ts
// apps/game/src/session/MoveSource.ts
export interface MoveSource {
  onPickingStarted(ctx: PickContext, submit: (move: Move) => void): void;  // ctx: side, state, deadline, clock, rng
  cancel(): void;                                                         // picking ended or the match was torn down
}
```

`RandomCpu` is the only one so far: a uniformly random move after a 0.4 to 1.6 s "thinking" pause, always before the deadline. An equilibrium CPU (44/33/22), a pattern-reading CPU or local hot-seat play would each be one new file.

## 6. Presentation: scenes, director, views

Phaser code is split into three kinds of pieces, each with one job:

| Piece | Job | Example |
|---|---|---|
| **Scene** | Wiring only: creates views, connects the session and input, starts and stops. Short (the longest is 83 lines). | `FightScene` |
| **Director** | Listens to session events and turns them into choreography over time, using tuning values. | `FightDirector` plays the reveal timeline below |
| **View** | A dumb visual piece with a small API. Knows nothing about rules or sessions. | `FighterView.pose('scissors')`, `HudView.setHealth('p2', 70)` |

The **juice kit** (`fx/`) so far has two effects: `shake` (camera jumps between whole-pixel offsets that shrink to nothing) and `flash` (the sprite turns solid white for a few frames). Sparks, dust and impact frames join it in step 3, reading their numbers from `tuning.ts` the same way.

### The scenes

Scenes are listed in `main.ts` in draw order: the cabinet at the bottom, monitor screens above it, the screen transition on top.

| Scene | Runs | Draws |
|---|---|---|
| `BootScene` | Once | Loads `logo.png`, `marquee.png` and the audio with a pixel loading bar, registers the pixel font at sizes 1 to 7, generates placeholder art, launches the cabinet and transition scenes, then the logo |
| `CabinetScene` | Always, underneath everything | Arcade room backdrop, the wood-grain cabinet, the marquee (with its flickering backlight), the three buttons (hover, glint, lock-in) and the joystick (click and wobble) |
| `LogoScene` | Once per launch, on the monitor | The Chain Shift studio logo: fades in, holds, fades out. Any button or tap skips it |
| `HomeScene` | On the monitor | Idle fighters (the RPS Rivals title is the marquee art above the monitor), the home menu, the version in the corner |
| `HowToScene` | On the monitor, from Home | A one-card How to play: which move beats which, each move's damage, the few rules. Any button goes back |
| `OptionsScene` | On the monitor, from Home | Scaling (Fill height or Pixel perfect), CRT screen, sound on/off, music and effects volume, applied at once and saved |
| `LobbyScene` | On the monitor, from Home | Online: CREATE ROOM (shows a 4-letter code and waits) or JOIN ROOM (type the code), then hands the connected session to the fight |
| `FightScene` | On the monitor | One of three stages, fighters, HUD, the clash of move badges, banners (K.O. in its own letters), effects |
| `ResultScene` | On the monitor, over the paused last fight frame | "YOU WIN!" or "CPU WINS", the round score, Retry or Main menu |
| `TransitionScene` | Always, on top | The CRT switch-off and switch-on between screens (the picture closes to a line, then a dot, the screen swaps, it opens again) |

Monitor scenes call `useMonitorCamera(scene)`, which places their camera over the cabinet's screen, so they always draw in their own 216 × 216 space and don't care where the cabinet sits in the window. Screen shake moves only the monitor camera; the cabinet stays put.

**Shared services.** `main.ts` builds one `GameContext` (`scenes/context.ts`) and stores it in Phaser's registry; scenes read it with `getContext(this)`:

| Service | What it is |
|---|---|
| `input` | The `InputRouter` |
| `scaler` | The `PixelScaler` (current layout, change events) |
| `settings` | The `SettingsStore` |
| `flow` | The `SceneFlow` |
| `lights` | `CabinetLights`: which cabinet button is lit (the player's current pick), shared by the fight and the cabinet scene |
| `audio` | The `AudioService` (music and effects) |
| `cabinetShake` | Rattles the whole cabinet on a K.O. and big hits |

### Screen flow and menus

![Screen flow](diagrams/7-screen-flow.svg)

The game always starts the same way: Boot, the logo intro, then the home screen. **Start game** begins a match against the CPU and **Online** goes through the lobby to a match against a friend; when a match ends, the result screen offers **Retry** (a new match with the same setup) or **Main menu**. How to play and Options sit beside Home.

- **One place for screen changes.** Scenes never start each other by key. `SceneFlow` (`scenes/flow.ts`) has `toLogo()`, `toHome()`, `toHowTo()`, `toOptions()`, `toLobby()`, `toFight(setup, session?)` and `toResult(data)`. It plays the screen transition (`tuning.transitions`), ignores new requests mid-transition, and **owns the match session's lifetime**: it creates it in `toFight`, keeps it for a rematch, and disposes of it on the way home.
- **`MatchSetup` describes a match.** It travels Home → Fight → Result. **Retry** is `session.requestRematch()`: the session answers `rematchAccepted` (locally at once; online once both players agree), and the flow reopens the fight with the same session, which starts again on `ready()`.
- **Menus are data.** A menu is a list of `MenuItem { id, label, tag?, enabled, onSelect? }` in `menus/`. One `MenuView` draws any list, moves and blinks the cursor, skips disabled items, accepts taps, and shows a setting's value as the item's tag (`setTag`). The home menu today:

  ```ts
  // apps/game/src/menus/homeMenu.ts
  export const homeMenu = (flow: SceneFlow): MenuItem[] => [
    { id: 'cpu', label: 'START GAME', tag: 'VS CPU', enabled: true, onSelect: () => flow.toFight({ mode: 'cpu', cpu: 'random' }) },
    // greyed out (SOON) in a build that has no match server address
    { id: 'online', label: 'ONLINE', tag: 'VS FRIEND', enabled: true, onSelect: () => flow.toLobby() },
    { id: 'howto', label: 'HOW TO PLAY', enabled: true, onSelect: () => flow.toHowTo() },
    { id: 'options', label: 'OPTIONS', enabled: true, onSelect: () => flow.toOptions() },
  ];
  ```

  Options, Online and How to play were each added this way: a new item here plus its scene.
- **Menu input.** `InputRouter` actions: `nav` (joystick, arrow keys), `confirm` (Enter, Space), `back` (Esc, Backspace), and `pick` from the three cabinet buttons, which menus treat as confirm.
- **Music (since v0.8.0).** `SceneFlow` picks the track for each screen (`SCENE_MUSIC` in `scenes/flow.ts`): the menu loop on Home, Options and the lobby, the fight loop in the fight. On the result screen the fight music fades out for the win or lose jingle, and the menu loop comes back after it.

### One reveal, as the director plays it

![Reveal choreography timeline](diagrams/4-reveal-timeline.svg)

The director receives a single `reveal` event (both picks, whether each was auto-picked, the outcome, the new state) and plays it as a timeline with `scene.time.delayedCall`, using the values in `tuning.reveal`, `hitPause`, `shake`, `flash` and `hud`. The show ends at `recoverAtMs` (1400 ms), inside the 1800 ms `revealMs` window, which leaves 400 ms of slack. Online, that slack absorbs network delay.

The director also handles the other phases: on `roundIntro` it resets poses, icons, health and pips and shows the round banner; on `picking` it shows the prompt and "FIGHT!" on the first exchange of a round; on `roundOver` it plays the K.O. (poses, a 5 px shake, the banner); on `matchOver` it waits `tuning.result.delayAfterMatchMs` and asks the flow for the result screen.

Views animate toward the state the session reports; they never compute it. If the health bar and the rules ever disagree, the rules win, by design.

## 7. Screen and pixel-perfect rendering

The pixel-perfect rules from the project context are enforced in one place, the **pixel scaler** in `platform/`, plus a few habits in the views.

![Screen layout and scaling](diagrams/5-screen-and-scaling.svg)

1. **One native canvas, one pixel size.** The cabinet, monitor, HUD, backdrop and effects all draw into one Phaser canvas at native resolution. No HTML or CSS overlays for game visuals (the dev panel is the one HTML overlay, and only in dev builds).
2. **Whole-number zoom.** In **Pixel perfect** mode, `computeLayout` picks the largest whole scale at which the 270 × 472 cabinet fits the window, measured in *device* pixels (so it is crisp on high-DPI phones too). It re-runs on resize and rotation.
3. **The canvas fills the window; the leftover is arcade room.** The canvas is the window divided by the scale, the cabinet is centred, and the space around it is a tiled backdrop at the same pixel size. Nothing is stretched.
4. **Phaser settings:** `pixelArt: true`, `roundPixels: true`, `antialias: false`, `Scale.NONE` with `zoom = scale / devicePixelRatio`.
5. **Whole pixels only.** Positions are whole numbers (`util/snap.ts`), shake uses whole-pixel offsets, and sprites are never scaled or rotated (turns and squash are drawn as frames).
6. **Pixel text.** A 5 × 7 bitmap font (`assets/glyphs.ts`, `pixelFont.ts`) at whole sizes 1 to 4, drawn by `PixelText`. No browser fonts on the canvas.

**What this does and doesn't guarantee for imported images (checked 2026-10-11).** Because the canvas itself is native size, anything drawn lands on the native grid: no image, however smooth, can show detail finer than one game pixel, and nothing blurs. But the engine does **not** turn a non-pixel-art image into pixel art. It does no colour reduction to the palette, no outline cleanup and no averaging when shrinking:

- A smooth image drawn at 1:1 keeps its gradients, soft anti-aliased edges and thousands of colours, so it reads as a blocky blurred picture, not as pixel art.
- A large image shrunk in the game is sampled nearest-neighbour, which drops pixels instead of averaging them; it looks crunchy and shimmers when it moves (and breaks rule 5 anyway).

So every image must be made at its final native size, in palette colours, before it goes into `public/assets/`. The Chain Shift logo was converted this way offline with `tools/make-logo.py`; any future import helper (resize, reduce to the palette, outline) belongs in `tools/`, not in the game.

**Fill height (player option, the default since v0.3.0).** Whole-number scaling can leave the cabinet small (a 1280 × 800 window only fits 1×). Options → Scaling → **Fill height** uses the exact fit scale instead: the cabinet fills the window height on a desktop, or its width on a narrow phone, never smaller than the pixel-perfect scale. This is a deliberate, player-chosen exception to rule 2:

- Sampling stays nearest-neighbour (`pixelArt`, `image-rendering: pixelated`), so nothing blurs, and everything inside the game still sits on one native grid.
- At a fractional scale some rows and columns of native pixels come out one device pixel wider than their neighbours (at 1.7×, pixels are 1 or 2 device pixels wide). Thin lines and text can look slightly uneven.
- The choice is kept in `SettingsStore` and read before the game starts, so the first frame is already at the chosen scale. Changing it in Options re-runs the scaler, and `main.ts` resizes and re-zooms the game.

**Geometry** lives in `config/layout.ts`: cabinet 270 × 472, marquee 104 (its 234 × 78 art at (18, 13)), a square monitor 216 × 216 at (27, 116), control panel 128 from y 344, button and joystick positions, and the stage (floor at y 180, fighters at x 84 and 132).

## 8. Tuning: every feel value in one place

Every number that changes how the game *feels* lives in one typed file, `apps/game/src/config/tuning.ts`. Scenes, views and effects import from it. Its groups, each with a comment saying what the numbers do:

| Group | Tunes |
|---|---|
| `reveal`, `hitPause`, `shake`, `flash`, `ko`, `sparks`, `dust` | The clash of the move badges, the hit, the K.O. slow motion and the particles |
| `hud` | Health bar drain and the big juiced timer |
| `buttons`, `joystick`, `cabinet` | Button press, lock-in flash and glint; joystick tilt, spring-back and wobble; the cabinet rattle |
| `idle`, `intro`, `transitions`, `menu`, `banner`, `result` | Idle breathing, the logo intro, the CRT screen transition, menu cursor and backdrop, banners, the result delay |
| `crt` | The CRT shader: glow, vignette, scanlines, and the impact effects |
| `marquee` | How often and how hard the marquee light flickers |
| `online` | How long online ending messages stay up |

For example:

```ts
  transitions: { closeMs: 120, lineMs: 80, offMs: 60, stepMs: 20 },
  marquee: { minGapMs: 1500, maxGapMs: 4500, dimAlpha: 0.45, blackoutAlpha: 0.7, surgeAlpha: 0.1, surgeMs: 50 },
```

There are two homes for numbers, on purpose:

| File | Holds | Why separate |
|---|---|---|
| `packages/core/src/config.ts` | `defaultRules` (damage, health, rounds) and `defaultTimings` (phase lengths) | A server must use the same values. Changing them changes the game's rules. |
| `apps/game/src/config/tuning.ts` | Everything about look and feel | Client only. Changing them never changes who wins. |

**Dev tuning panel** (`apps/game/src/dev/`, since v0.5.0). In `npm run dev` only, a Tweakpane panel lists both files' numbers with sliders. Feel values apply live; rules and phase timings apply from the next match, with a Restart match button. Edits are remembered in localStorage, Copy changes lists what changed per file to paste back, Reset all goes back to the defaults, and the backquote key hides it. `main.ts` loads it behind `import.meta.env.DEV`, and a lint rule stops the rest of the game importing `dev/`, so release builds don't contain it. The panel's plumbing (`tunables.ts`) has no Tweakpane or DOM in it, so it is unit tested. Guide: [`docs/tuning/TUNING-PANEL.md`](../tuning/TUNING-PANEL.md).

## 9. Input, audio, assets, settings, wiring

**Input.** One `InputRouter` turns every source into game actions: keys 1/2/3 (and the numpad), taps on the cabinet buttons, arrow keys and drag for the joystick. Scenes only hear `action` events (`pick`, `confirm`, `back`, `nav`); the cabinet also hears `button` (pressed or released) and `stick` (tilt) to animate. Two arrow keys at once tilt the stick diagonally; holding the stick repeats `nav` every `tuning.menu.repeatDelayMs`. Releasing the window releases everything. A gamepad or rebinding touches only `input/`.

**Audio (since v0.8.0).** `AudioService` in `audio/` wraps Phaser sound with two buses (music, sfx), mute and saved volumes, and is in the `GameContext` as `audio`. Sounds are typed keys (`audio/sounds.ts`); a key with variations plays one at random. Music cross-fades and waits for the browser to allow sound (the first tap or key). Views and the director only see the small `SfxPlayer` interface (`play(key)`); a lint rule keeps game logic out of `audio/`. Every sound is synthesised by `tools/audio/make-audio.mjs`. Guide and licences: [`docs/audio/AUDIO.md`](../audio/AUDIO.md).

**Assets.** Until the real art exists, `assets/placeholders/` paints every texture in code at boot (room tile, cabinet, buttons, joystick ball, stage, fighters, move icons) under the real keys from `assets/keys.ts`. `generatePlaceholders` skips any key that is already loaded, so loading a real sprite sheet under the same key in `BootScene` replaces its placeholder without touching a view. The only real images so far are `logo.png` and `marquee.png` (the marquee art, cut from a mock-up by `tools/make-marquee.py`). Each fighter sheet provides the frames `idle0, idle1, rock, paper, scissors, hurt, ko, win` (64 px tall). The palette is in `config/palette.ts`.

**Settings.** `SettingsStore` in `platform/settings.ts` holds the player's settings, emits `change`, and saves them as JSON under the localStorage key `rps-fighter.settings` (kept on purpose so saved settings survive the rename). Broken or missing storage falls back to the defaults and never stops the game. It holds the scaling mode, mute and the music and effects volumes (0 to 10). Behind it is a small key-value type (`getItem`/`setItem`), so Capacitor Preferences can replace localStorage on Android.

**Version.** Set once, in `apps/game/package.json`; `vite.config.ts` injects it and `src/version.ts` exports `VERSION`, which the home screen shows in the corner. Every build bumps it and adds a `CHANGELOG.md` entry, and the Release workflow tags it `vX.Y.Z` with a GitHub release when it reaches main.

**Wiring.** No global singletons. `main.ts` builds the services once and hands them to scenes through the `GameContext`. It also exposes a small read-only `window.__rps` (running scenes, match phase, scale, version) for the Playwright tests.

## 10. Online play

Online play is step 5; its first version is built (v0.6.0). This section says what the code already gets right for it, what still has to change, and how the online part is meant to work. **Where** the match room runs (it can't be GitHub Pages, which only serves files) is compared in [`ONLINE-OPTIONS.md`](ONLINE-OPTIONS.md). The user chose a free Cloudflare Durable Object running the same `Referee` (2026-10-11); the first version is built (v0.6.0, below).

![Online exchange sequence](diagrams/6-online-exchange.svg)

**How it works.** A match room on a server (one per room code) wraps the same `Referee` from `@rps/core` with a server clock. It is the only place both picks exist before the reveal.

- **Hidden picks.** The referee keeps picks private and only announces `locked { side }`. The room forwards exactly the referee's events, so the opponent's move first leaves the server inside `reveal`.
- **Server clock.** The room decides when time is up and makes the random fallback pick. It sends the time *left* in each phase (`msLeft`) instead of its own clock time; each client adds that to its own clock. Clocks never have to match, and a slow connection can't buy extra time (late picks are refused by the referee).
- **Same events.** `OnlineSession` turns room messages into the same `SessionEvents` the local game uses. The fight scene, director and views don't change.
- **Latency.** The client starts the reveal when the message arrives; the 400 ms slack in the reveal window absorbs the delay before the next phase message.

**Already online-ready in the code:**

| What | Where |
|---|---|
| Rules and referee have no engine, browser or network code; clock and RNG are injected | `packages/core` |
| The referee never announces a move before the reveal | `RefereeEvents.locked` |
| Scenes see only `MatchSession`; the referee is lint-banned from scenes, views and the director | `session/MatchSession.ts`, `eslint.config.js` |
| The HUD timer reads `msLeft`, not a clock time | `MatchView`, `FightScene.update` |
| `ready()` and `requestRematch()` → `rematchAccepted` already model "wait for the other side" | `MatchSession` |
| A match is described by `MatchSetup`, and sessions are built in one place | `createSession(setup)` |
| An ONLINE slot already sits on the home menu | `menus/homeMenu.ts` |

**Built in v0.6.0 (Cloudflare Durable Objects, the user's choice on 2026-10-11):**

| Part | Where | What it does |
|---|---|---|
| Protocol | `packages/core/src/online/protocol.ts` | The JSON messages both ways (`ClientMessage`, `ServerMessage`), `PROTOCOL_VERSION`, room codes (four consonants, so no words) and `parseClientMessage`, which turns anything unexpected into `null` |
| Match room | `apps/server/src/MatchRoom.ts` | Seats `create` as p1 and `join` as p2, refuses wrong codes, full rooms, other protocol versions and a rival on another build; starts the `Referee` when both are ready; forwards its events with `msLeft`; rematch when both ask; closes the room when someone leaves or it sits idle (10 min lobby, 2 min after a match) |
| Worker | `apps/server/src/index.ts` | `GET /room/CODE` (WebSocket) goes to the Durable Object named after the code; `RoomObject` holds the two sockets and feeds `MatchRoom` |
| Deploy | `.github/workflows/deploy-server.yml` | Wrangler deploy: main to `rps-rivals-server-staging`, `production` to `rps-rivals-server` |
| `OnlineSession` | `apps/game/src/session/OnlineSession.ts` | WebSocket client implementing `MatchSession`; turns `msLeft` into a local deadline; reports `opponentJoined`, `refused`, `rematchRequested`, `opponentLeft`, `disconnected` |
| Lobby | `apps/game/src/scenes/LobbyScene.ts`, `menus/lobbyMenu.ts` | CREATE ROOM (shows the code, waits) and JOIN ROOM (four letter boxes; stick or typed letters); hands the connected session to `flow.toFight({ mode: 'online', roomCode }, session)` |
| Server address | `apps/game/src/config/online.ts` | `VITE_SERVER_URL` (set by `pages.yml` to the staging or live Worker), else `ws://localhost:8787` in dev; null keeps ONLINE greyed out |

How the gaps from the earlier list were closed:

| Gap | Now |
|---|---|
| Opponent's name | `MatchSession.opponentName` (`CPU` or `RIVAL`) on the HUD and the result screen. Typed player names are a later step |
| Which side I am | The room's real side on both screens (since v0.9.1): host = p1 on the left, guest = p2 on the right; `OnlineSession.me` comes from the room's welcome and the HUD tags say "P1 YOU" / "P2 RIVAL" |
| Leaving and disconnects | The room tells the other player and closes; the fight and result screens show RIVAL LEFT or OFFLINE and go home. No reconnect grace period yet |
| Rematch waiting | RETRY shows WAITING FOR RIVAL; the other player sees RIVAL WANTS A REMATCH; MAIN MENU stays available |
| Lobby | Built (above) |
| Input checks on the server | `parseClientMessage` checks every message; picks only count for the sender's own seat |
| Version match | Protocol version against the server; game version between the two players |
| Server randomness | Still `mathRandomRng` |

**Still open:** reconnecting after a short drop, typed player names, and a share link that fills in the room code.

## 11. Android

Step 6 wraps the built `apps/game` in Capacitor. Nothing in the game changes; device-specific things sit behind `platform/`:

| Need | Browser (today) | Android (planned) |
|---|---|---|
| Storage | localStorage through `SettingsStore` | Capacitor Preferences behind the same key-value type |
| Haptics on hits and button presses | none | Capacitor Haptics |
| Back button | Esc / Backspace → `back` | `back` action: Result goes to the main menu, Home exits the app, in a fight it opens a pause menu (once that exists) |
| Orientation | portrait layout in any window | Locked to portrait |
| Safe areas (notch, gesture bar) | n/a | The scaler leaves room; the extra space is backdrop |

## 12. Keeping the code clean

**Import rules, checked by ESLint** (`eslint.config.js`), so a wrong import fails CI:

| Folder | Must not import | Rule |
|---|---|---|
| `packages/core` | anything in `apps/`, Phaser | `import/no-restricted-paths`, `no-restricted-imports` |
| `session/` | `scenes`, `views`, `fight`, `fx`, `input`, `platform`; Phaser | both |
| `views/`, `fx/` | `session`, `scenes`, `fight` | `import/no-restricted-paths` |
| `fight/` | `scenes` | `import/no-restricted-paths` |
| `fight/`, `scenes/`, `views/` | the `Referee` (talk to a `MatchSession`) | `no-restricted-imports` |
| `platform/` | `session`, `scenes`, `views`, `fight` | `import/no-restricted-paths` |
| everything except `main.ts` | `dev/` | `import/no-restricted-paths` |

Views may use types from `@rps/core` (like `Move` and `Side`) and the `InputRouter`'s types; that is allowed on purpose.

**Conventions.**
- TypeScript `strict`, no `any` (lint error), type-only imports marked `import type`. Prettier for formatting (single quotes, 110 columns), checked in CI.
- One class or one concern per file; a file growing past about 200 lines is a hint to split it.
- Names say what things are: `FighterView`, `RandomCpu`, `resolveExchange`. No `Manager`/`Helper` grab bags.
- No magic numbers outside `config/` and the core config.
- Events are typed with the shared `Emitter` (`on('reveal', …)` knows its payload).
- Comments explain *why*; the code says *what*.

## 13. Testing and CI

| Level | Tool | File | What |
|---|---|---|---|
| Rules | Vitest | `packages/core/test/rules.test.ts` | Every pairing, damage, ties, health floor, K.O., rounds, match end, refusing to play on |
| Referee | Vitest + fake clock + seeded RNG | `packages/core/test/referee.test.ts` | Phase order and end times, pick windows, changing picks, random fallback, a whole match, rematch, dispose |
| Session and CPU | Vitest | `apps/game/test/LocalSession.test.ts` | `ready()`, time left, picks per side, a full match and rematch, dispose; `RandomCpu` odds and deadline |
| Scaler and settings | Vitest | `apps/game/test/scaling.test.ts` | `computeLayout` in both modes, settings saved, reloaded, broken values ignored |
| Tuning panel plumbing | Vitest | `apps/game/test/tunables.test.ts` | Flatten, assign, change notes, remembered edits, broken storage |
| Online room | Vitest | `apps/server/test/MatchRoom.test.ts`, `packages/core/test/protocol.test.ts` | Room codes, joining, hidden picks, the server clock, rematch, leaving |
| Game in a browser | Playwright | `apps/game/e2e/smoke.spec.ts` | Boots to the logo and home, plays an exchange, shows the right version, skips the logo, Options switches scaling and remembers it, the music per screen, the online lobby menus and code entry |

That is 91 unit tests and 9 browser tests today. **Planned:** a pixel-perfect screenshot check (at 3× every 3 × 3 block is one colour).

**CI** (`.github/workflows/ci.yml`, on every push to main and every PR): `npm ci`, lint, format check, typecheck, unit tests, build, then the Playwright tests in Chromium. **Release** (`release.yml`): on a push to main, tags a new version from `apps/game/package.json` and makes a GitHub release from its changelog entry. **Pages** (`pages.yml`): main publishes the staging copy at `/rps-rivals/staging/` and the `production` branch the live game at `/rps-rivals/`, each pointing at its own match server. **Deploy server** (`deploy-server.yml`) deploys the matching Cloudflare Worker.

## 14. How the design grows

What a typical future change touches:

| Change | Files touched |
|---|---|
| Rebalance damage or health | `packages/core/src/config.ts` (try it first in the dev panel) |
| Make the reveal snappier | `config/tuning.ts` (or live in the dev panel) |
| Smarter CPU | new `session/cpu/EquilibriumCpu.ts`, a new `CpuKind`, one line in `createSession` |
| A fourth move | core config (`beats`, `damage`), one new icon, fighter frames, one button in `layout.ts` |
| New fighter art | a sprite sheet loaded in `BootScene` under the existing `Tex` key; no view changes |
| A new stage | one painter plus one line in `config/stages.ts` |
| A new sound | a `voice()` recipe in `tools/audio/make-audio.mjs`, its key in `audio/sounds.ts`, an `audio.play('key')` call |
| Local two-player (hot-seat) | new `HotSeatSource` move source, input bindings for player 2 |
| Another menu (more options, how to play, pause) | one scene + one menu file + an item in an existing menu |
| Android | Capacitor config + `platform/` adapters; game unchanged |
| Gamepad | `input/` only |

## 15. Build order

Matches the roadmap in the project context:

1. **Rules core with tests.** Monorepo, lint rules, CI, `@rps/core`. _Done 2026-10-10._
2. **Playable prototype.** Scaler, cabinet, menus, fight vs `RandomCpu` with placeholder art, result screen. _Done 2026-10-10 (v0.1.0), Options and scaling modes since v0.2.0 / v0.3.0._
3. **Art and juice.** Dev tuning panel (v0.5.0), rebrand to RPS Rivals with the square screen (v0.7.0), audio (v0.8.0), clash reveal, stages, juice and CRT (v0.9.0), new fighters (v0.10.0). _Done._
4. **Polish and web release.** Final polish, How to play, link previews and an automatic Pages deploy (v0.11.0); then 1.0 goes live. _In progress._
5. **Online.** Cloudflare match rooms, `OnlineSession`, lobby with room codes (v0.6.0, fixed sides v0.9.1). _Done; still open: a reconnect grace period, typed names, a share link._
6. **Android.** Capacitor and the platform adapters.

## 16. Decisions and open choices

Built as decided:

| Choice | Decision |
|---|---|
| Repo shape | npm workspaces monorepo: `packages/core`, `apps/game`, later `apps/server` |
| Dev tuning panel | Tweakpane, dev builds only (`apps/game/src/dev/`) |
| Lint for import rules | `eslint-plugin-import` `no-restricted-paths` plus `no-restricted-imports` for Phaser and the `Referee` |
| Cabinet size | 270 × 472 native, monitor 216 × 216 |
| Default scaling | Fill height (Pixel perfect in Options) |

Open:

| Choice | Options | Recommendation |
|---|---|---|
| Where online matches run | Cloudflare Durable Object, peer-to-peer (PeerJS), Colyseus on a free host | Cloudflare Durable Object: free, server-decided, no sleeping server. Details in [`ONLINE-OPTIONS.md`](ONLINE-OPTIONS.md) |
| Online seat display | Always show yourself on the left, or real sides | Real sides (user's choice, v0.9.1) |
| Square or tall monitor | From the rebrand mock-ups | The user's pick in the rebrand thread |
