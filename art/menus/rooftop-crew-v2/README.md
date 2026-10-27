# Rooftop Crew correction pass

2026-10-25. Review only; game files unchanged. Version1 remains intact for comparison.

## What was wrong

- V1 used a flat solid sky instead of the approved mockup's darker-top/lighter-bottom blue gradient.
- Standing character soles were at185 while the environment had a tall brick face and its low floor at about218. There was no standing surface under their feet. Riot also needed the right vent under her raised shoe.
- Native export matched combat (single shared character scale, nearest sampling, binary alpha), but source generation was inconsistent. Taiko/Riot used flat-shape prompts; the background explicitly requested pixel clusters and Anchor inherited pixel-like detail from the mockup. Reducing already pixel-like high-res detail creates uneven tiny clusters. Combat's smoother source technique is the intended approach.
- V1's canvas CSS width included a2px border under border-box sizing: the content area was572x716 instead of576x720. This caused fractional browser enlargement even though the PNG was on a genuine192x240 grid.

## Changes

- New smooth flat-shape environment, Anchor sheet and clouds. Original outputs and exact prompts saved in source/. Taiko/Riot/logo retained from v1. No claim that generation itself followed a native grid.
- native/sky.png is a deterministic192x240 opaque gradient, one RGB value per row, from #0067ff at top to #41c7ff by row150. It is behind the moving clouds and transparent-sky environment.
- New environment has two ledges: rear seat near152 and front standing surface around190. Standing character soles are now row189, meeting surface190. Riot's seated layer is lowered7px relative to v1, with raised shoe meeting right vent near171. Fine pose variations remain approximate; this is visual registration, not automatic skeletal rigging.
- Browser preview now uses an outline outside the content box and explicit integer1x/2x/3x enlargement. No fractional responsive canvas resizing. Native canvas remains192x240 and image smoothing stays off.
- Cloud strip has16 transparent pixels of padding at each end for spacing across repeats.

## Review and rebuild

```
node tools/art/prepare-home-kit.mjs --v2
npx vite art/menus/rooftop-crew-v2 --host 127.0.0.1 --port 5178 --strictPort
node tools/art/capture-home-kit.mjs --v2
```

Requires sharp or RPS_SHARP_PATH, repository Playwright, installed Chrome. Browser preview: http://127.0.0.1:5178/preview.html. It supports assembled/layer views and pause. Layer ordering, positions and timing are in manifest.json. Atlas cell contract remains112x160, origin(56,156), four Taiko/Anchor poses and two complete Riot poses; original incomplete Riot alternatives remain excluded. Menu is separately drawn with game glyphs.

assembled-192x240.png is the real native composition; assembled-4x.png is an exact4x nearest enlargement. review-frames/ contains80 native preview captures. validation.json records native dimensions, actual browser screenshot size576x720, scale3, zero broken enlarged cells, and no browser page errors. Character frame alpha is binary. Every3x3 block was checked for uniform RGBA.

Frame-to-frame AI detail and silhouette changes still produce some animation shimmer. Flat-source regeneration and true-grid output do not promise hand-cleaned pixel animation. No palette quantization or per-pose stretching was used. No production menu integration or publication in this pass.
