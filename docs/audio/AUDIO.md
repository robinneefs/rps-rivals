# Sound and music

All game audio is synthesized from scratch with the project's chiptune engine (`tools/audio/synth.mjs`). No outside samples or tracks are used.

## The music

| Key | Track | Plays on | Style | Files (`apps/game/public/assets/audio/music/`) |
| --- | --- | --- | --- | --- |
| `menu` | **One More Round** | Home, Options, Online, character select; the result screen after its jingle | 168 BPM chip-rock | `menu-one-more-round.ogg`, `.mp3` |
| `fight` | **Ready to Rival** | City Rooftop | 160 BPM chiptune | `stage-ready-to-rival.ogg`, `.mp3` |
| `storm` | **Under the Storm** (v2) | Storm Field | 148 BPM C-minor chip-rock | `stage-under-the-storm.ogg`, `.mp3` |
| `harbor` | **Golden Hour** | Sunset Harbor | 144 BPM chiptune-funk | `stage-golden-hour.ogg`, `.mp3` |
| `courtyard` | **Lantern Rush** | Lantern Courtyard | 168 BPM pentatonic chiptune | `stage-lantern-rush.ogg`, `.mp3` |
| `foundry` | **Pressure Point** | Foundry Floor | 156 BPM industrial chip-metal | `stage-pressure-point.ogg`, `.mp3` |

Each stage names its track in `apps/game/src/config/stages.ts` (`music`); a stage without one plays `fight`. The keys map to files in `MUSIC_FILES` (`apps/game/src/audio/sounds.ts`).

### Rebuilding a track

Every track has a composer script and an installer in `tools/audio/`. The installer needs ffmpeg on PATH (or `RPS_FFMPEG` set to its executable) and writes the OGG and MP3 into the game:

| Track | Compose | Install | Sources, masters and notes |
| --- | --- | --- | --- |
| One More Round | `make-menu-anthem.mjs` | `install-menu-anthem.mjs` | `art/audio/menu-anthem-v1/` |
| Ready to Rival | `make-menu-riff.mjs` | `install-stage-riff.mjs` | `art/audio/menu-riff-v1/` |
| Under the Storm | `make-storm-theme-v2.mjs` | `install-storm-theme.mjs` | `art/audio/storm-theme-v2/` (v1 exports kept in `storm-theme-v1/installed-backup/`) |
| Golden Hour | `make-harbor-theme.mjs` | `install-harbor-theme.mjs` | `art/audio/harbor-golden-hour-v1/` |
| Lantern Rush | `make-courtyard-theme.mjs` | `install-courtyard-theme.mjs` | `art/audio/courtyard-lantern-rush-v1/` |
| Pressure Point | `make-foundry-theme.mjs` | `install-foundry-theme.mjs` | `art/audio/foundry-pressure-point-v1/` |

`npm run audio` (`tools/audio/make-audio.mjs`) rebuilds the sound effects and the original `menu` and `fight` loops (`menu.*`, `fight.*`, no longer played). It cannot overwrite the installed themes.

## Sources and licences

| What | Files | Source | Licence |
| --- | --- | --- | --- |
| All sound effects | `apps/game/public/assets/audio/sfx/*.wav` | Made by `tools/audio/make-audio.mjs` (original) | This repository's licence (`LICENSE`) |
| Menu theme: One More Round | `apps/game/public/assets/audio/music/menu-one-more-round.ogg`, `.mp3` | Composed by `tools/audio/make-menu-anthem.mjs`, exported by `install-menu-anthem.mjs` (original) | This repository's licence (`LICENSE`) |
| Stage themes: Ready to Rival, Under the Storm, Golden Hour, Lantern Rush, Pressure Point | `apps/game/public/assets/audio/music/stage-*.ogg`, `.mp3` | Composed and exported by the scripts in the table above (original) | This repository's licence (`LICENSE`) |
| Preserved original fight and menu loops | `apps/game/public/assets/audio/music/fight.*`, `menu.*` | Composed and made by `tools/audio/make-audio.mjs` (original) | This repository's licence (`LICENSE`) |

When an outside sound or track is added later, add a row here with its author, link and licence (only licences that allow use in a game, such as CC0 or CC-BY with credit).

## What plays when

| Sound | When |
| --- | --- |
| `menuMove`, `menuSelect`, `menuBack` | Moving the menu cursor, choosing an item, going back (also the lobby's code entry) |
| `stickClick` | The joystick snapping into a new direction, and springing back to the centre |
| `roundStart` | The ROUND / FINAL ROUND banner |
| `fight` | The FIGHT! banner at the start of each round |
| `tick` | The countdown, in step with the coin ticks on the timer dial |
| `lockIn` | Your pick locks in |
| `timeUp` | The timer ran out and a move was picked for someone (the slam) |
| `whoosh` | The move coins pull back and arc in at the reveal |
| `hitRock`, `hitPaper`, `hitScissors` | The winning move lands: a heavy thud, a slap, a metal slash. Three variations each, picked at random and slightly detuned, so repeated hits don't sound the same |
| `clash` | A tie |
| `ko` | K.O. |
| `winJingle`, `loseJingle` | The victory screen |
| Music `menu` | Home, Options, Online and character select, and the result screen once the jingle is done |
| Stage music | During a match: the stage's own track (see The music) |

## Settings

Options has SOUND (on or off), MUSIC and SFX. The stick left and right change a volume in steps from OFF to 10, and the button steps it up (wrapping round to OFF). The settings are saved with the others in the browser. Browsers only allow sound after the first tap or key press, so the menu music starts then.

## Changing or adding a sound

1. Edit or add the sound in `tools/audio/make-audio.mjs` (each effect is a few `voice()` calls; the music is written as note steps per bar).
2. If it is new, add its key to `SFX` in `apps/game/src/audio/sounds.ts` (with the number of variations), and call `audio.play('key')` where it should play.
3. Run `npm run audio` (needs `ffmpeg` installed for the music files). It rewrites the files in `apps/game/public/assets/audio/`.
4. `npm test` checks that every sound the game loads has a file.

To use a real recorded sound instead, drop the file in `public/assets/audio/sfx/` under the same name (WAV, or change the extension in `sounds.ts`) and add its row to the licence table above.

## How it is built

- `apps/game/src/audio/sounds.ts`: the list of sound keys, how many variations each has, and the file list `BootScene` loads.
- `apps/game/src/audio/AudioService.ts`: plays effects and music on two buses (music, effects) with mute and saved volumes. Music cross-fades between tracks and waits for the browser to allow sound. It is in the `GameContext` as `audio`.
- `SceneFlow` picks the music for each menu screen; `FightScene` plays its stage's track. The fight director, the fight scene, the menus, Options, the lobby and the result screen fire the effects.
- Music is loaded as OGG with an MP3 fallback (Safari); the browser takes the first one it can play.
