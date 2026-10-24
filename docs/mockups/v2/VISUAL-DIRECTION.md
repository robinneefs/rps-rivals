# v2 visual direction and fighters

_Decided 2026-10-24 with the user. Any agent working on art, sprites, the select screen or the roster reads this first, together with `PROJECT_CONTEXT.md`._

## Reference images

| File | What it is |
|---|---|
| `7-key-art-poster.webp` | The game poster (key art). **The target for colour and energy of all on-screen graphics**, drawn in pixel art instead of painting. |
| `8-characters-taiko-anchor-riot.webp` | The three selectable fighters, full body on grey, with their names. **The character reference.** |
| `0-vibe-fight.webp` | The cabinet and the look chosen for v2 (see the plan and the decision log). |

## The look

Take the poster as the mood board for the monitor:

- **Bright, saturated, colourful.** Clear blue sky with white clouds, a sunny city rooftop with a skyline behind, warm sunlight on the floor. Nothing muddy or dark except the outlines and shadows.
- **Title lettering:** RPS RIVALS in brush-style letters, yellow to orange to red, with a dark navy outline and small speed marks. The tagline ROCK · PAPER · SCISSORS sits under it in white.
- **Figures:** bold dark outlines, flat light with a clear shadow side, big hands and feet, dynamic stances with a wide base. Energetic and exaggerated, like a 90s fighting game.
- **On screen it is pixel art.** The same colour family and energy as the poster, drawn on the monitor's pixel grid. The pixel-perfect rules in `PROJECT_CONTEXT.md` apply to the monitor.

## The three selectable fighters

The roster is now **three selectable fighters**. They replace the four working titles in the v2 plan (Brawler, Martial artist, Bruiser, Skater).

| Name | Who | Look (from the reference) | Main colours |
|---|---|---|---|
| **Taiko** | Male martial artist | Black hair with an orange headband and its long ends tied behind, short goatee, red sleeveless top with a mandarin collar and gold frogging, baggy red pants, orange-yellow sash, white hand and foot wraps, black sandals. Reference pose: arms crossed. | Red, gold/orange, white, black |
| **Anchor** | Big, powerful woman | Dark skin, long black dreadlocks with gold ties, teal sleeveless vest over a black tank top, rust-orange cargo pants with dark brown knee patches, black belt with a gold buckle, black combat boots, white hand wraps. Reference pose: hands on hips. | Teal, rust orange, black, gold |
| **Riot** | Quick, short-haired woman | Short spiky brown hair, a white tape strip on one cheek, purple track jacket with white stripes over a yellow crop top, purple and white shorts with a white stripe, black fingerless gloves, black leggings with white shin guards, purple and white high-top sneakers. Reference pose: hands on hips, grin. | Purple, yellow, white, black |

### Not decided yet

- **Balance numbers for the three.** The v2 plan's damage and health numbers belong to the old four working titles. Do not reuse them for these fighters. Set the numbers with the balance tool, and let the user approve them.
- **Sprite format.** Assume the plan's format (8 frames, 128 x 128, facing right, about 100 px tall) until the user says otherwise.
- **The select screen layout** (three across, names above, as the reference sheet shows). Draw it when the select screen is built.

## What this changes

- Sprite sheets are needed for **Taiko, Anchor and Riot** (not Brawler and Bruiser). Portraits and the select screen use the reference sheet.
- The City Rooftop stays the only stage for now. It should match the poster's brightness.
- The fight HUD and menus take the poster's colours: yellow-orange-red for titles, the blue sky for backgrounds.
