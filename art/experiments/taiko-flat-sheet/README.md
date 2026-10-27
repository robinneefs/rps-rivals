# Taiko flat-shapes nine-pose sheet

## True-grid renderer update

Both test scenes now use PreviewGrid.ts to capture EVERY layer into a real low-resolution framebuffer before enlarging. This corrects the earlier preview's background half-grid detail. Grid selector:96x120 /144x180 /192x240 /216x270 /288x360. Existing144x180 composition is resampled as a whole for resolution comparisons; glyphs/assets are not reauthored by changing the preset. Canvas dimensions are selected grid dimensions times an integer enlargement; nearest texture filtering and pixelated CSS apply. Defaults and CSS are restored on scene shutdown. Check pixel grid snapshots the actual rendered framebuffer, checks its dimensions, nonblank colours, and every enlarged cell for uniform RGBA. All five presets verified PASS with zero broken cells; base comparison scene also verified144/216. Normal game uses its previous renderer. grid-144-in-game.png captures the verified default.

2026-10-25, codex/edits. Built-in image generation using the approved C flat-shapes image as reference. generated.png retains the original output, 1254 x 1254.

## Prompt

Create a complete production sprite sheet for the EXACT Taiko character in the reference, preserving its clean flat-shape style, proportions, costume, face, hair, orange headband, goatee, red kung-fu clothes, gold sash, ivory wraps and black sandals. NOT pixel-art imitation; bold flat-colour angular shapes, thick continuous navy outline, simple large shadow shapes, minimal tiny detail. Actual transparent background. Layout: a precise THREE COLUMNS by THREE ROWS grid, exactly NINE equally sized cells. Square total canvas; each cell has large transparent gutters so nothing crosses into its neighbours. NO labels, text, cell borders, floor lines, shadows or effects. Every cell contains the same ONE character at the SAME physical scale, facing RIGHT. Never independently zoom or resize a pose. Idle standing height about 75% of a cell; feet baseline at 90% of each cell height. Body/hip home position consistent across cells. Leave clear space to the right for attacks and clear margins above raised fists. Entire hands, headband tails and feet must remain inside each cell.
Read cells in row-major order:
ROW 1 COL 1: idle0, the referenced relaxed fighting guard, knees bent, fists up.
ROW 1 COL 2: idle1, same guard with a SMALL breathing dip and slightly lowered shoulders; same feet positions, not a new stance.
ROW 1 COL 3: rock, strong straight right-facing punch fully extended horizontally, other fist guards face, legs planted.
ROW 2 COL 1: paper, defensive block, both wrapped forearms held high crossed in front of face, torso slightly leaned back, same foot baseline.
ROW 2 COL 2: scissors, two-handed forward shove/grab with both open hands reaching right at chest height; visually distinct from the punch.
ROW 2 COL 3: hurt, recoils backwards LEFT from a hit, head back and shoulders twisted, knees bent, still on feet.
ROW 3 COL 1: ko, knocked out lying flat sideways along the floor baseline, head LEFT and feet RIGHT. Same body size as other cells, do NOT enlarge the lying figure to fill the height.
ROW 3 COL 2: win, standing victory with one fist raised overhead and proud grin. Same limb lengths and body size, raised hand stays in cell.
ROW 3 COL 3: kick, a powerful side kick extending one leg fully horizontally RIGHT at waist height; standing leg stays on floor baseline, fists guard, torso leans left. Show both feet fully, no clipping. This is a separate attack pose, not a punch.
One coherent nine-pose character sheet, flat simple shapes exactly matching the reference look.

## Frame contract

Runtime: apps/game/public/assets/experiments/taiko-flat-sheet.png and taiko-flat-sheet.json (named Phaser atlas). PNG 288x288, 3x3 cells, each 96x96. Shared foot anchor (48,93). Ordered names: idle0, idle1, rock, paper, scissors, hurt, ko, win, kick. Idle0 is 75px tall, idle1 71px (breathing dip), win 79px including raised fist, ko18px lying down. Each uses ONE source scale 75/386; none is independently normalized to 75px. Wider/taller frame allows kick/punch/raised-fist headroom. Cropping, alpha threshold128, nearest resampling, no colour quantization. Runtime sprite scale1.

## Preparation and validation

node tools/art/prepare-taiko-sheet.mjs (sharp or RPS_SHARP_PATH). Detects 9 large connected subjects at alpha>=128 rather than blindly cutting grid cells: the source KO crosses its nominal cell border. The nine subjects are assigned row-major, cropped, then scaled uniformly. Bottom-foot spans determine horizontal anchors; kick's standing foot is aligned with the rear resting foot. Floor baseline is common, frame bounds checked to reject clipping. alignment.json records all source bounds and final placements. Individual named 96x96 PNGs in frames/. sheet-3x.png is a nearest enlarged review copy.

## Review

npm run dev, open /?art=taiko-sheet. Pose selector holds any of the nine named frames. Playback has idle loop, all poses, hold. Two fighters toggles the mirror test. Cabinet keys1/2/3 preview rock/paper/scissors; K previews kick. No new combat rule has been added. The eight established frame names remain available; kick is an additional asset in this experimental atlas, not a fourth RPS move. An art-comparison link opens it from /?art=taiko. Source sheet generated once as a coherent multi-pose asset; game-size output remains resampled artwork, not guaranteed source-aligned pixel art. AI pose consistency still needs user approval before normal combat integration.

Browser visually verified idle, kick, KO, win; no atlas clipping. The bottom UI overlays feet/KO as previously requested; this is intentional layer order. kick-in-game.png captures the running scene. Normal gameplay, shared core, network protocol and production deployment unchanged.

