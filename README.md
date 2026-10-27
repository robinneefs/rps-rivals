# RPS Rivals

<div align="center">

[![Built by Claude](https://img.shields.io/badge/built_by-Claude-D97757?style=for-the-badge&logo=claude&logoColor=white)](https://claude.ai/code)
![Vibes: 100% pure](https://img.shields.io/badge/vibes-100%25_pure-ff69b4?style=for-the-badge)
![Hand-written code: 0 lines](https://img.shields.io/badge/hand--written_code-0_lines-8a2be2?style=for-the-badge)

### 🤖✨ This is a Claude-run operation ✨🤖

***Coded on only the purest of vibes.***

</div>

---

<div align="center">

<a href="https://robinneefs.github.io/rps-rivals/"><img src="docs/readme/play-button.png" alt="PLAY NOW" width="296" /></a>

**Free · No install · Desktop and phone**

vs the CPU, or vs a friend online with a 4-letter room code

</div>

---

## The game

RPS Rivals is a pixel-art arcade fighter built on rock paper scissors. Two fighters face off on the monitor of an upright '90s arcade cabinet. Each exchange, both players secretly pick **Rock**, **Paper** or **Scissors** on the cabinet's big buttons before a 3 second timer runs out. The picks clash in the middle of the screen, the winning move lands, and the loser takes damage. Win two rounds to win the match.

It's not classic rock paper scissors, because every move hits for a different amount:

| Winning move | Beats    | Damage |
|--------------|----------|--------|
| ✂️ Scissors  | Paper    | **20** |
| 🪨 Rock      | Scissors | **15** |
| 📄 Paper     | Rock     | **10** |

- Each fighter starts a round with 50 health. Only the loser of an exchange gets hurt.
- The same move on both sides is a **clash**: no damage.
- No pick before the timer runs out? A random one is made for you (marked AUTO).
- Best of three rounds. City Rooftop stage, with Taiko on the left and Riot on the right.
- Illustrated action main menu with animated speed lines, Riot breathing, and CPU / online / options choices.
- The monitor renders everything on a native **192 × 240** pixel grid.

**The mind game.** Scissors is the tempting big hit, but Rock punishes it. The balanced mix works out to roughly **Rock 44%, Paper 33%, Scissors 22%**: the biggest hit is the one you should pick least. At low health the stakes shift again, since a 10 damage paper counter may not finish the round while a 15 or 20 hit will.

### Controls

| | Desktop | Phone |
|---|---|---|
| Pick Rock / Paper / Scissors | keys **1 / 2 / 3**, or click the buttons | tap the buttons |
| Move through menus | arrow keys, or drag the joystick | drag the joystick, or tap an item |
| Select / back | any button, Enter or Space / Esc | any button / the BACK item |

## Screenshots

| Home | How to play | Pick | Clash | K.O. | Result |
|---|---|---|---|---|---|
| ![Home menu](docs/screenshots/phone-home.png) | ![How to play card](docs/screenshots/phone-howto.png) | ![Picking a move, 1 second left](docs/screenshots/phone-pick.png) | ![Both picked paper: a clash](docs/screenshots/phone-reveal.png) | ![K.O.](docs/screenshots/phone-ko.png) | ![Result screen with Retry and Main menu](docs/screenshots/phone-result.png) |

![The game in a desktop browser](docs/screenshots/browser-ko.png)

<sub>Captured from the real build by `node sources/screenshots/capture.mjs` (seeded, so the shots come out the same every run).</sub>

## Built with

| Part | What |
|---|---|
| Game engine | [Phaser 3](https://phaser.io/), pixel-art mode with whole-number scaling |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict), in an npm workspace monorepo |
| Build and dev server | [Vite](https://vite.dev/) |
| Online match server | [Cloudflare Workers](https://workers.cloudflare.com/) with one Durable Object per room, over WebSockets |
| Hosting | GitHub Pages (game) and Cloudflare (match rooms), deployed by GitHub Actions |
| Tests | [Vitest](https://vitest.dev/) for the rules, referee and sessions; [Playwright](https://playwright.dev/) for in-browser smoke tests |
| Code quality | ESLint (with layer import rules) and Prettier |
| Dev tuning panel | [Tweakpane](https://tweakpane.github.io/docs/) (dev builds only) |
| Art and sound tools | Node scripts and Python + Pillow, all in `tools/` |

## How it's built

```mermaid
flowchart TB
  subgraph Browser["Browser (GitHub Pages)"]
    P["<b>Presentation</b><br/>Phaser scenes, fight director, views,<br/>menus, effects, input, audio"]
    S["<b>Session</b><br/>LocalSession (vs CPU) or OnlineSession"]
    C1["<b>Core</b> · @rps/core<br/>rules + referee, zero dependencies"]
    PL["<b>Platform</b><br/>screen scaling, saved settings"]
    P --> S --> C1
    P --> PL
  end
  subgraph Cloudflare["Cloudflare Worker"]
    R["Room (Durable Object)<br/>one per room code"]
    C2["<b>Core</b> · the same @rps/core referee"]
    R --> C2
  end
  S -. "WebSocket (online only)" .-> R
```

- **Core** (`packages/core`) holds the rules (who wins, damage, health, rounds) and the referee that runs the match phases. It's plain TypeScript with no engine, timers or network, so the exact same code referees online matches on the server.
- **Session** is "a match in progress" from one player's side. Against the CPU it runs the referee locally; online it talks to the room. The rest of the game can't tell the two apart.
- **Presentation** draws and animates everything and never decides a result. Dependencies only point down, and the linter enforces it.
- **Online**, the room keeps both picks secret until the reveal and runs the clock, so neither player can peek or stall.

The full write-up, with diagrams, is in [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

## Assets and credits

Nearly everything in the game is generated by code in this repository, and every asset is disclosed below.

| Asset | Where it comes from |
|---|---|
| Legacy placeholder graphics, icons, effects, K.O. letters | Drawn pixel by pixel in code by Claude (`apps/game/src/assets/placeholders/`). Original. |
| Action main-menu artwork | AI-generated separate layers and breathing frames, prepared on the native grid. Sources/prompts: `art/menus/action-v2/`; install: `tools/art/install-action-menu.mjs`. |
| Main-menu lettering | m6x11 by Daniel Linssen at native 16px, with prepared gold gradient/shadow states. Font and attribution retained in `art/fonts/m6x11/`. |
| Menu font experiments | Pixelify Sans by Stefie Justprince / The Pixelify Sans Project Authors, SIL OFL1.1. Font and licence retained in `art/fonts/pixelify-sans/`. |
| Cabinet engraved lettering | Rock Salt by Sideshow / Font Diner, Inc., Apache2.0. Font/license in `art/fonts/rock-salt/`; live CSS text, with version sourced from the build. |
| Native bitmap font comparisons | Spleen by Frederic Cambus (BSD2-Clause); Tamzen by Suraj N. Kurapati, based on Scott Fial's Tamsyn (permissions retained); m6x11 by Daniel Linssen, [free use with attribution](https://managore.itch.io/m6x11). Sources/notices in `art/fonts/`. |
| Pixel font (5×7) | Designed in code for this project (`apps/game/src/assets/glyphs.ts`). Original. |
| Marquee art (the RPS RIVALS banner) | Cut from a mock-up sheet the project owner made with an AI image generator (`tools/make-marquee.py`). |
| Chain Shift studio logo | The project owner's original logo, prepared at native resolution with a clipped sheen by `tools/art/prepare-studio-logo.py`. Sources and captures: `art/brand/chain-shift-v2/`. |
| Sound effects and music | Original chiptune synthesis: `tools/audio/make-audio.mjs` for SFX/fight; `tools/audio/make-menu-anthem.mjs` for the approved menu theme One More Round. No samples. See [docs/audio/AUDIO.md](docs/audio/AUDIO.md). |
| Browser icon and link preview image | Made from the game's own button and marquee art by `tools/make-icons.mjs`. |
| Code and docs | Written by Claude (Anthropic) in Claude Code, directed by the project owner. |
| Phaser, Tweakpane and the other libraries | Used under their own open source licences (MIT). |

## Run it locally

Needs Node 22.

```sh
npm install
npm run dev          # the game at http://localhost:5173
npm run dev:server   # optional: a local match server for online play (ws://localhost:8787)
```

In `npm run dev` a **tuning panel** in the top-right corner lets you change every feel value, the rules and the phase timings while you play, then copy the changes back into the code. The backquote key (`) hides it. See [docs/tuning/TUNING-PANEL.md](docs/tuning/TUNING-PANEL.md).

| Command | What it does |
|---|---|
| `npm test` | Rules, referee and session tests (Vitest) |
| `npm run test:e2e` | Browser smoke tests (Playwright) |
| `npm run lint` | ESLint, including the layer import rules |
| `npm run typecheck` | TypeScript, strict |
| `npm run build` | Production build into `apps/game/dist` |
| `npm run audio` | Regenerate every sound and music file (needs ffmpeg) |

## Repository layout

| Path | What's in it |
|---|---|
| [`packages/core/`](packages/core/) | `@rps/core`: the rules and the referee, zero dependencies |
| [`apps/game/`](apps/game/) | The Phaser game: scenes, views, sessions, input, audio, pixel scaler, tuning |
| [`apps/server/`](apps/server/) | The online match server: a Cloudflare Worker with a Durable Object per room |
| [`tools/`](tools/) | Scripts that make the logo, marquee, icons and all audio |
| [`docs/`](docs/) | Architecture, design document, audio notes, tuning panel guide, screenshots, mock-ups and art direction |
| [`sources/`](sources/) | Scripts that draw the mock-ups and diagrams and capture the screenshots |
| [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | Full project context: rules, decisions and the decision log |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed in every version |

## Privacy

No accounts, no ads, no tracking. Your settings (scaling, sound, CRT screen) are saved in your own browser. Online matches only send your picks to the match room, which forgets everything when the match ends.

## License

[MIT](LICENSE)
