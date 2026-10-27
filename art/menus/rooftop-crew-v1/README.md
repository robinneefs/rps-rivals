# Rooftop Crew home-screen asset kit

2026-10-25. Standalone preparation/review only; no production game files changed. All original built-in imagegen outputs and exact prompts are preserved in source/. Based on the approved middle menu concept and its revised three-label layout.

## Prepared parts

| Asset | Native dimensions | Use |
|---|---|---|
| Solid sky |192x240| Fill #0874ff in code; no image needed |
| native/clouds.png |384x64| Drifting strip, behind environment, whole-pixel step every240ms |
| native/background.png |192x240| City, parapet and foreground; sky transparent |
| native/taiko.png + json |224x320| Four112x160 frames: arms-folded rest, inhale/headband, blink, exhale |
| native/anchor.png + json |224x320| Four112x160 frames: hands-on-hips rest, inhale, blink, exhale |
| native/riot.png + json |224x160| Two112x160 frames: seated rest and shoulder/hair variation |
| native/logo.png |176x44| Transparent standalone title |
| Panel, arrow, menu labels | runtime shapes/text | Keep separate, using existing5x7 glyphs; no baked buttons |

The native/ folder also contains individual character frames and a JSON copy of the game's uppercase glyphs for the standalone preview. PNGs use binary alpha and nearest sampling. No palette reduction is applied to native PNGs. Character atlas origin is(56,156), not the combat atlas origin: these are separate home-screen assets, not combat replacements. One shared source scale per character; no per-frame size normalization. Positions, draw order and animation schedules are in manifest.json. Source bounds/placements in alignment.json.

## Review

Run the preview from the repository root:

```
npx vite art/menus/rooftop-crew-v1 --host 127.0.0.1 --port 5177 --strictPort
```

Open http://127.0.0.1:5177/preview.html. It offers assembled/individual layer views, pause, and menu selection preview. The actual canvas is192x240, enlarged with nearest sampling. Respects reduced-motion preference and stops time advancement while hidden. Menu labels are PLAY VERSUS CPU, PLAY ONLINE, OPTIONS; no control hint or How to Play entry.

assembled-192x240.png is a native composed still; assembled-4x.png is an exact nearest4x enlargement. animated-review.gif is a3x convenience preview (GIF's256-colour limit alters colours slightly); the browser/PNGs retain the native PNG colours. review-frames/ contains80 native captures at100ms intervals. validation.json records browser page errors and frame differences.

## Rebuild

```
node tools/art/prepare-home-kit.mjs
node tools/art/capture-home-kit.mjs
```

Requires sharp (or set RPS_SHARP_PATH) and installed Chrome for capture. Preparation discards disconnected generation debris, thresholds alpha at128, extracts subjects, applies shared scale and floor alignment, checks frame bounds, and emits named Phaser-compatible atlases. Capture requires the standalone preview server above and the repository's Playwright dependency. Source prompts are saved next to every generation. Source references: docs/mockups/v2/main-menu-rooftop-v2/generated.png, character lineup, Taiko/Riot flat combat sheet references.

## Known limitations

- Generated sheets contain small silhouette/detail changes beyond ideal breathing motion; these can shimmer at native resolution. They need animation art review before production approval. This is resampled generated artwork, not a claim that the generator used a native pixel grid.
- Riot's first output clipped hanging shoes. A repair improved only the upper two poses. Both original outputs are retained; the repair's bottom two incomplete poses are deliberately NOT exported. Riot therefore has two usable frames and no blink frame yet.
- Clouds/environment are separated for safe cloud drift. Skyline and parapet remain one static environment layer; there is no independent building parallax layer. No background redraw is required for this restrained motion.
- Character sheets are home-screen illustrations with their own proportions; they do not replace gameplay sprites. The composition is a faithful new assembly, not a pixel-identical extraction of the approved mockup.
- Native PNG frame bounds and alpha, asset loading, canvas dimensions and absence of browser page errors were checked. Standalone menu preview only; game menu behaviour, routing, audio and online state have not been integrated or tested against these assets.
