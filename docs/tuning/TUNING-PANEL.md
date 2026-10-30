# Tuning panel

## Current development tools (29 October 2026)

The default dev panel is now **Effects Studio**, toggled with **F4**. Its CRT controls, presets, persisted settings and one-shot effects playground are complete and accepted. The older all-values Tweakpane documented below is available with `?legacyTuning`; its backquote toggle still applies to that panel.

The current combat UI work uses `?roundReview&beat=0` (local preview: http://127.0.0.1:5300/?roundReview&beat=0). It provides 19 selectable real-game beats, held frames, Replay/Previous/Next and Try Rock/Paper/Scissors controls. The `beat` parameter is zero-based. Effects Studio is omitted on this review route. This visual harness is not a complete pacing editor or an authoritative referee match.

Current presentation controls in `tuning.ts` include `banner.fightHoldMs` (350), `banner.afterFightMs` (250), `identity.introFlickerMs` (60), `identity.circlePopMs` (280), `hud.pickPromptFlickerMs` (1600), and the `hud.pickBounce*` wave parameters. FIGHT is scheduled inside the round introduction so the pause does not consume picking time. YOU stays steady while its arrow flickers. Reduced-motion mode suppresses these new flickers/bounces/pops.

See [current handoff](../checkpoints/2026-10-29-round-loop-handoff.md) for selected hand artwork and preview-only limitations. The sections below describe the legacy tuning panel.

A small panel that sits over the game while you play and lets you change every feel value, the match rules and the phase timings with sliders, without editing code. It is for the game-feel pass. It exists only when the game runs with `npm run dev`; the online build does not include it.

![Where the panel sits: top-right corner, next to the cabinet](../screenshots/browser-tuning-panel.png)

## Using it

### Open it

```sh
npm install        # once, or after pulling (installs Tweakpane)
npm run dev        # http://localhost:5173
```

The panel appears in the top-right corner. The backquote key (`` ` ``, left of 1) hides and shows it. Typing in the panel's number fields never reaches the game, so typing a 1 there doesn't pick Rock.

### What is in it

| Section | What it holds | When a change applies |
|---|---|---|
| **Feel (live)** | Everything in `apps/game/src/config/tuning.ts`: reveal timing, hit pause, shake, flash, K.O. slow motion, particles, health bar drain and timer, cabinet buttons and their glint, joystick and its wobble, cabinet rattle, idle breathing, logo intro, CRT screen transitions, menu cursor, banners, CRT shader, marquee flicker, result delay | At once, while you play (a few values that set up an animation, like idle breathing, apply when the screen is next opened) |
| **Rules (next match)** | Start health, damage per move, rounds to win (`defaultRules` in `packages/core/src/config.ts`) | From the next match |
| **Phase timings (next match)** | How long each phase lasts: round intro, picking countdown (`pickMs`), reveal, round over (`defaultTimings` in the same file) | From the next match |

Values ending in `Ms` are milliseconds and values ending in `Px` are game pixels. Each section folds open into groups. The `byDamage` tables (hit pause and shake) have one slider per hit size, labelled `10 dmg`, `15 dmg` and `20 dmg`.

### The buttons

| Button | What it does |
|---|---|
| **Restart match** | Starts a fresh match against the CPU at once, so rules and timing changes take effect |
| **Copy changes** | Copies a short note of every value you changed, with its old value, grouped by file (also printed in the browser console) |
| **Reset all to defaults** | Puts every value back to what is in the code |

Your edits are saved in the browser (localStorage), so they survive a reload or a code change that reloads the page. They do not change any file. Reset clears them.

A copied note looks like this:

```text
// apps/game/src/config/tuning.ts
hitPause.byDamage.20: 120 (was 90)
shake.durationMs: 220 (was 280)

// packages/core/src/config.ts (defaultTimings)
pickMs: 3000 (was 5000)
```

### A good way to tune

1. Start a match and keep playing while you tune.
2. Change one thing at a time and play a few exchanges after each change.
3. Go too far first: double a value, then halve it, then settle in between. Small nudges are hard to feel.
4. Work in this order:
   - **The hit:** `reveal.strikeAtMs`, `reveal.impactAtMs`, `hitPause`, `shake` and `flash`. They all fire on the same hit, so tune them together.
   - **The health bar:** `hud.drainMs` and `hud.trailDelayMs`.
   - **Pacing:** `pickMs`, `startHealth` and the other phase timings, pressing Restart match after each change.
   - **Menus and transitions:** buttons, joystick, transitions, banners, intro, marquee.
5. Hide the panel for the final check, and try it again a little later with fresh eyes.
6. When it feels right, press **Copy changes** and paste the note into the project thread. Claude writes the values into the code as the new defaults in the next version. You don't need to edit files yourself.

Open questions to settle with it: a 5 or 3 second countdown (`pickMs`), and whether 100 start health is right (`startHealth`).

### Watch out for

- The reveal animation plays inside the reveal phase. If you shorten `revealMs`, keep `reveal.recoverAtMs` and the hit timings below it, or the animation gets cut off.
- Rules decide who wins, so changes there are balance changes, not just feel. With different damage values the best mix of moves shifts too (see "The mind game" in the README).
- If the game seems off after a tuning session, press **Reset all to defaults**: old edits stay in effect until you do.
- Rules and timings changes only apply to a new match (Restart match, or START GAME from the home menu). **Retry** on the result screen replays with the same rules as the match before.
- Slider limits are picked from each value's name (milliseconds, pixels, health, counts). Typing a number in the field still works up to the limit. If a slider runs out of room, ask for it to be widened (see `rangeFor` below).

## How it is set up

### The pieces

| File | Role |
|---|---|
| `apps/game/src/dev/tuningPanel.ts` | Builds the panel with [Tweakpane](https://tweakpane.github.io/docs/) 4: buttons, one folder per group, one slider per number. Stops key events in the panel from reaching the game's input, wires the backquote toggle and saves after every change. |
| `apps/game/src/dev/tunables.ts` | The panel's logic, with no Tweakpane or DOM so it is unit tested (`apps/game/test/tunables.test.ts`): reading and writing number values by path (`flatten`, `assign`), the "Copy changes" note (`changeNote`), saving to localStorage (`TuningMemory`), and slider limits (`rangeFor`). |
| `apps/game/src/main.ts` | Loads the panel only in dev builds and tells it which objects to edit and how to restart a match. |
| `apps/game/package.json` | `tweakpane` and `@tweakpane/core` (its types) as dev dependencies, pinned. |

### Dev builds only

`main.ts` loads the panel with a dynamic import inside `if (import.meta.env.DEV)`. Vite replaces that flag with `false` in `npm run build`, so the panel and Tweakpane are left out of the release bundle (checked: the built `dist/` contains no Tweakpane code).

A lint rule in `eslint.config.js` (`import/no-restricted-paths`) stops any game folder other than `main.ts` from importing `src/dev/`, so the game can never come to depend on the panel.

### How edits reach the game

The panel edits three live objects in place: `tuning` (`config/tuning.ts`), `defaultRules` and `defaultTimings` (`packages/core/src/config.ts`).

- **Feel values** are read by views and the fight director each time they are used (for example `tuning.shake.durationMs` when a shake starts), so a change shows on the next hit.
- **Rules and timings** are copied when a match starts: `createSession` gives each session its own copy (`structuredClone`), so an edit never changes a match halfway through. The fight screen reads start health and rounds to win from `session.rules`, so the health bars and round pips match the rules of the match being played. Online play will get its rules from the server the same way.
- **Restart match** calls `flow.toFight({ mode: 'cpu', cpu: 'random' })`, the same call as START GAME on the home menu.

On load, the panel records each value as its default, then applies any edits saved in localStorage (key `rps-fighter.dev-tuning`). After every change it saves only the values that differ from the defaults, and removes the key when nothing differs.

### Adding a value

Add a number to `config/tuning.ts` (or to the rules or timings) and read it where it is used. The panel finds every number in those objects by itself, so there is nothing to register. Non-number values, like the rules' `beats` table, are skipped.

If the slider limits don't suit it, add a case to `rangeFor` in `tunables.ts`. Today: names ending in `Ms` get 0 to three times the value (at least 1000) in steps of 10; `startHealth` 10 to 300; `roundsToWin` 1 to 5; `damage.*` 1 to 60; everything else 0 to three times the value (at least 10) in steps of 1.

### Adding another group

Add an entry to the `groups` list in `main.ts`: the file it comes from (shown in the copied note and used as its save key), a title and the live object. For example, audio volumes can get their own group once sound is in.
