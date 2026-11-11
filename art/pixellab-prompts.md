# PixelLab prompts: combat screen pieces

Prompts for making each piece of the combat screen by hand on pixellab.ai.
Save what you like into `art/source/pixellab/` with the file names below, and Claude puts them together in the game.

## What you make, and what the game draws itself

The monitor is **288 x 360** and every piece is placed 1:1 (one art pixel = one screen pixel, never scaled).

| Piece | Who makes it | Why |
|---|---|---|
| Stage background | **You, in PixelLab** | One 288 x 360 picture, exactly how the game loads stages |
| TAIKO and RIOT portraits | **You, in PixelLab** | Small faces for the HUD |
| Rock, paper, scissors icons | **You, in PixelLab** | The three move buttons / reveal badges |
| Names, round number, 15 / 10 / 20, PICK YOUR MOVE, YOU / CPU | The game (code) | Drawn with the game's own pixel font, so they're always crisp |
| Health bars, round dots, portrait frames | The game (code) | They animate (drain, flash, pulse) |
| Fighters | Done already | TAIKO #1 and RIOT #1 in `art/pixellab-test/` |

**So don't put any text, bars or characters in the pictures.** A drawn-in name or number can't change during a match, and AI text comes out with broken letters.

## Settings for every piece

- **Tool:** Create image (Pro). It gives several candidates per go, and at small sizes many, so you can pick the cleanest.
- **Size:** exactly the size given for each piece.
- **Max colours:** the number given for each piece. Fewer colours is the main thing that stops the speckly, muddy look.
- **Palette:** paste the hex list from that piece's section into the palette field, so all pieces share the same colours.
- **Style reference** (optional): `docs/mockups/v2/7-combat-pick.webp`, set to copy the look only.
- **Pick the candidate with the cleanest outlines and the fewest lone pixels**, not the most detailed one. Check it zoomed in.

Shared colours (from the current stage, so pieces match it):

```
#060915 #0d40a2 #0245c5 #0062fa #0170fd #1092f9 #79c2fe #a3d9fe #e8f5fc #304485 #574e83 #42355d #e2a56d #e9be57
```

---

## 1. Stage background (rooftop)

- **File:** `stage-rooftop.png`
- **Size:** 288 x 360. **Background:** off (opaque). **Max colours:** 32. **Palette:** the shared colours above.

Layout, so the fighters and HUD fit:
- **y 0–60:** plain sky only. The HUD sits here.
- **y 60–200:** clouds, then the skyline rising behind.
- **y 200–245:** the railing.
- **y 245–360:** the tiled floor, down to the bottom edge. Fighters stand on it at about y 280–318.

```
16-bit SNES fighting game stage background, Street Fighter II era, 288x360 portrait, one pixel per art pixel, crisp hand-placed pixels on a strict grid, no anti-aliasing, no gradients, no dithering noise. A city rooftop in daytime: the top fifth is plain bright blue sky, then a few chunky white pixel clouds, then a blue city skyline of tall skyscrapers with small lit yellow windows, then a dark navy metal rooftop railing running straight across the full width, then a warm tan tiled rooftop floor in one-point perspective that fills the bottom third down to the bottom edge, with dark blue grout lines. Empty stage: no people, no text, no UI, no logos. Flat colour areas with 2-3 shades each, clean dark outlines on buildings and railing.
```

**If the full picture comes out messy,** make it in three strips instead. Smaller canvases come out cleaner, and I'll stack them. All strips are 288 wide, with background off for the sky and floor and transparent for the skyline strip:

| File | Size | Prompt (use the style lines from the full prompt above, plus:) |
|---|---|---|
| `stage-sky.png` | 288 x 200 | `bright blue daytime sky with a few chunky white pixel clouds, nothing else` |
| `stage-skyline.png` | 288 x 100, transparent | `a row of blue city skyscrapers with small lit yellow windows, side view, flat bottom edge, transparent sky` |
| `stage-floor.png` | 288 x 160 | `a dark navy metal rooftop railing across the top 40 pixels, then a warm tan tiled rooftop floor in one-point perspective with dark blue grout lines down to the bottom edge` |

---

## 2. Portraits (HUD faces)

- **Files:** `portrait-taiko.png`, `portrait-riot.png`
- **Size:** 32 x 32. **Background:** transparent. **Max colours:** 16.
- **Reference:** the fighter's own sprite (`art/pixellab-test/taiko-pro-1.png` or `riot-pro-1.png`), set to copy the character design. The game draws the frame round the portrait.

TAIKO:
```
16-bit SNES fighting game character select portrait, 32x32, head and shoulders, three-quarter view facing right, crisp pixel art with a dark outline. Muscular martial artist with short spiky dark navy hair, a short dark beard, an orange headband, dark red sleeveless gi collar, determined expression. No text, no frame, transparent background.
```

RIOT:
```
16-bit SNES fighting game character select portrait, 32x32, head and shoulders, three-quarter view facing left, crisp pixel art with a dark outline. Young woman with a loose shaggy chin-length brown bob (no buns), confident grin, purple cropped jacket collar with a white stripe over a yellow top. No text, no frame, transparent background.
```

---

## 3. Move icons (rock, paper, scissors)

- **Files:** `icon-rock.png`, `icon-paper.png`, `icon-scissors.png`
- **Size:** 40 x 40, the game's badge size. **Background:** transparent. **Max colours:** 8.
- Tip: make all three in one go, using the same seed, so they share a style. Or make the rock first and use it as the style reference for the other two.

```
16-bit arcade game button icon, 40x40, a round coin-shaped button with a thick dark outline and a light rim on the upper left, filled in [COLOUR], with a big white [SYMBOL] in the middle outlined in dark ink. Crisp pixel art on a strict grid, no anti-aliasing, no text, transparent background.
```

| Icon | [COLOUR] | [SYMBOL] | Palette |
|---|---|---|---|
| Rock | hot pink | `closed fist seen from the front` | `#1a0f2e #ffffff #ff3b6b #b01846 #ff8fb0` |
| Paper | bright yellow | `open flat hand with fingers together, palm forward` | `#1a0f2e #ffffff #ffd94a #c49a14 #fff1a8` |
| Scissors | cyan | `hand making a V sign with two fingers` | `#1a0f2e #ffffff #3ff0ff #1496be #b8fbff` |

---

## When you're done

Drop the files into `art/source/pixellab/` and tell Claude. Claude then:
1. checks each file is the right size, on the grid, with no half-transparent pixels;
2. builds the combat screen from them at 288 x 360 with TAIKO and RIOT in place;
3. wires them into the game: the stage replaces `assets/stages/rooftop.png`, and the icons replace the code-drawn move badges.
