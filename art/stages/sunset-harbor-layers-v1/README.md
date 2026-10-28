# Sunset Harbor — separated animation layers

Based on approved sunset-harbor-v3. Built-in imagegen produced a clean background plate with the requested darker-top/lighter-horizon sky, an isolated boat, and an isolated dock. Original generations and exact prompts are preserved in source/. Native export script: tools/art/prepare-harbor-layers.mjs (requires Sharp, optionally RPS_SHARP_PATH).

All eight PNGs in layers/ are aligned full-canvas 192 × 240, origin (0,0), nearest-neighbor sampled, capped at 40 colors per layer without dithering, with binary alpha. Composite bottom-to-top:

1. sky-gradient.png — opaque quiet sunset gradient, darker muted peach at top and light apricot toward horizon.
2. distant-harbor.png — transparent cranes, skyline and cargo ships, with no scenery in rows 0–71.
3. water-base.png — opaque below y133, including water reconstructed behind boat and foreground. Bright extracted reflection pixels are healed with nearby water colors.
4. water-reflections.png — isolated gold reflection patches; suitable for localized pixel movement/alternate frames. Most lower water is hidden by dock.
5. boat.png — transparent near tugboat, reconstructed where foreground ropes/posts occluded it. Re-aligned after generation to native bounds x126,y113,width66,height62. Intended bob ±1px.
6. pennant.png — red cloth extracted from approved source, separate from pole; follows boat offset, with local flutter still to be authored.
7. rope-span.png — one isolated center span, fixed endpoint positions; only its middle should move, at most 1px. Other spans stay fixed on dock.
8. dock-foreground.png — floor, posts, fixed ropes, bollard/coiled rope and crate. Static foreground in front of boat but behind fighters. Fighter standing line remains y220.

layers.json contains placement, order and validation data. assembled-native.png and assembled-3x.png are stack verification exports, not a new concept generation. All layers are nonempty, native-sized and binary-alpha; sources remain intact. The stack was visually inspected, including sky cutout, rope gaps and boat/dock overlap. Cutouts reconstructed by imagegen may differ slightly in detail from the approved flattened mockup.

## Installed stage

Sunset Harbor is installed as the third playable stage, id `sunset-harbor`. Normal seeded match selection includes it, and rematches advance through the three-stage lineup. Force a local review with `?menuReview=stage&stage=sunset-harbor`. Production layers are in apps/game/public/assets/stages/harbor/; HarborStageView.ts owns the effects.

The water now uses a 12-frame native ripple sheet, matching the home screen's discrete pixel-frame approach. Short horizontal bands shift by at most two pixels, advancing every240ms, with no filtering or whole-stage distortion. tools/art/prepare-ground-shadows-and-water.mjs rebuilds the sheet from water/reflection layers. Tiny three-pixel birds first cross after6seconds, then on a36-second cycle with quiet intervals, at native sky rows63–70 below the persistent HUD, shared with City Rooftop via DistantBirds.ts. The boat bobs by at most one pixel on a7.2-second cycle; the pennant's free edge moves one pixel on a2.6-second cycle and follows the boat; the rope's middle flexes one pixel over6.1seconds while endpoints stay pinned. Dock and scenery remain fixed behind fighters. Movement uses integer coordinates, a single scene-clock timer and no gameplay randomness. Reduced motion freezes water on frame0, hides birds and restores neutral boat/flag/rope placement; timer/listener are removed on shutdown. Existing fight music is used.

Fighter shadows across every stage are now black ellipses at50% opacity. Grounded-pose widths/centers come from each approved atlas's bottom eight opaque rows, including a3px margin on either side, shared with alternate palettes and mirrored for p2. The kick retains its planted-foot offset/20px width, and KO hides the shadow. Generated contact spans are in fighterFootprints.ts, rebuilt by the same export script.

Validation: stage/lifecycle tests, typecheck, lint and production build pass. Browser verification (`node tools/art/check-harbor-stage.mjs`, local Vite on port5190) checks all effects, live reduced-motion changes, native bounds, layer order, scene re-entry and both existing stages, with no page/asset errors. Desktop/phone/monitor captures and checks are in review/. Build retains the existing bundle-size advisory.
