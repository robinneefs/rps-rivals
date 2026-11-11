# RPS Rivals action-menu asset kit

2026-10-25. Prepared from the approved Riot punch-to-camera mockup. Standalone preview only; production game code remains unchanged. All original imagegen outputs and exact prompts are in source/. Regenerated cutouts approximate the approved illustration rather than claiming a pixel-identical separation.

## Separate native assets

| Asset | Dimensions | Purpose |
|---|---|---|
| native/riot.png |192x240| Transparent, registered character layer; replaceable independently |
| native/logo.png |128x64| Transparent two-row logo, enlarged for readability |
| native/paint-streak.png |192x100| Blank plum/magenta painted menu backplate |
| native/background-base.png |192x240| Warm coral base, independent of speed lines |
| native/speed-lines.png |192x240| Transparent speed-line source at native resolution |
| native/speed-0.png through speed-3.png |192x240 each| Four transparent radial motion phases |
| native/background-0.png through background-3.png |192x240 each| Same phases over opaque coral background |
| native/background-sheet.png + json |768x240| Four-frame named Phaser-compatible atlas |
| native/labels.png + json |176x120| Three independent labels, each normal/selected, in six176x20 cells |
| native/arrow.png |9x11| Independent selection arrow |

Individual label-state PNGs are also supplied. Text, arrow and paint are independent; there are no letters baked into the background/character/menu painting. Text reads PLAY VERSUS CPU, PLAY ONLINE, OPTIONS. The lettering is re-typeset bold italic to remain interactive; it is an approximation of the generated mockup's custom letterforms.

manifest.json contains screen dimensions, layer ordering, positions, labels, character slot and background timing. Character assets have a full192x240 registration canvas; another character can replace the image without replacing the logo/menu/background. No other character artwork or character selection is implemented in this kit.

## Background animation

The four speed-line phases come from ONE generated transparent source. Each phase expands the same forms around native focal point(110,95); no independent AI redrawing between frames. Exported phases0/1/2/3 play0,1,2,3,2,1 at140ms each: a subtle radial pulse, not continuous one-direction scrolling. Background colours stay steady. The foreground character is deliberately static; no AI idle shimmer is introduced. Reduced motion disables playback; hidden pages pause time advancement. Logo and paint are separate and available for future animation, but remain still in this preview.

## Preview

From repository root:

```
npx vite art/menus/action-v1 --host 127.0.0.1 --port 5179 --strictPort
```

Open http://127.0.0.1:5179/preview.html. Layer inspector shows background, character, title, blank paint or painted menu separately. Selection dropdown, arrow keys or canvas clicks change the demonstrated selection; they do not navigate or start matches. Pause and background-frame hold controls are outside the game screen. Native canvas is192x240 with exact integer enlargement and no smoothing.

assembled-192x240.png is the real native composition. assembled-4x.png is exact nearest4x. animated-review.gif is a3x convenience loop; GIF's256-colour palette slightly changes colours, whereas the browser and native PNGs retain the full prepared PNG colours.

## Rebuild

```
node tools/art/prepare-action-menu.mjs
node tools/art/capture-home-kit.mjs --action
python tools/art/make-action-menu-gif.py
```

Preparation requires sharp (or RPS_SHARP_PATH), Python and Pillow (set RPS_PYTHON if needed). Label generation uses the bundled unmodified Jersey 10 font at24px, with native integer stepped italic slant, binary alpha, dark shadow and a yellow-to-orange per-row selection gradient. `tools/art/prepare-action-labels.py` is invoked automatically by the preparation script. Font and SIL OFL1.1 licence are retained in `art/fonts/jersey-10/`; no installed system font is required. Runtime still uses PNGs. Capture requires repository Playwright plus installed Chrome and the preview server. GIF requires Pillow.

Image preparation thresholds alpha128, discards only disconnected tiny generation debris, uses nearest sampling, preserves source framing for the character/speed lines, and crops transparent gutters from title/paint. Native character PNG is never stretched or independently regenerated during animation. Paint is sized to the menu area. No palette reduction on native PNGs. Generated enlarged sources are smooth flat-shape requests, not a claim of a generator-authored pixel grid. The first narrow brush attempt is preserved as paint-streak-narrow.png plus its prompt; the broader replacement is used.

## Validation and remaining scope

validation.json records192x240 native dimensions,576x720 browser display at3x, zero uneven3x3 pixel cells, zero page errors, binary alpha for all native PNGs and distinct background motion frames. All layer views and three selection states were exercised in Chrome. Preparation/capture scripts passed ESLint.

The final assembly differs from the mockup in the newly generated speed-line/paint shapes, isolated illustration, logo proportions and re-typeset lettering. This is a layered art review, not a deployed menu. Production scene routing, input focus, audio, online availability and transitions remain to be implemented after approval. All earlier work and generations are preserved; nothing was pushed or published.
