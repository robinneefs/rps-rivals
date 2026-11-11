# Lantern Courtyard — animation layers

Approved courtyard-v2 composition, exported at native192×240. Built-in imagegen edited a clean background plate and generated transparent lantern cutouts; exact prompts and original generations are preserved in source/. Only small healed lantern footprints are taken from the clean plate; other scene pixels come from the approved original. Lantern cutouts are trimmed and re-aligned to the original native bounds because generation enlarged/repositioned them. Some small shape/detail differences are unavoidable in the reconstructed cutouts.

layers/ contains nine full-canvas aligned PNGs and one small petal sheet:

- sky-gradient.png — opaque quiet plum sky, lighter near horizon.
- scenery-clean.png — roofs, posts, blossoms, mountains, distant temples and stone balustrade with lanterns removed and gaps filled. Original approved roof tips near row60 are retained.
- stone-floor.png — static paving and settled petals from row175 down. Standing line remains y220.
- lantern-left.png, lantern-right.png, lantern-far-right.png — isolated bodies, short hanging strings and tassels.
- glow-left.png, glow-right.png, glow-far-right.png — localized illuminated centers, intended as subtle additive overlays following each lantern; no full-scene glow or flash.
- petals.png — four8×8 native petal cells in a32×8 horizontal sheet, extracted from the existing pink floor-petal colors/shapes. Keep drifting instances sparse and below native row72.

All scene layers use binary alpha, nearest-neighbor sampling and a palette capped at40colors without dithering. Petal sheet uses12colors. layers.json records order, pivots, bounds and nonempty/dimension/alpha validation. Every full-canvas layer is192×240. Suggested motion: one-pixel lantern sway with the hanging pivot fixed, slightly out of phase; glow modulation over several seconds at low additive opacity; occasional1–3petals with quiet intervals. Respect reduced motion.

assembled-native.png and assembled-3x.png verify alignment and stack order; glow overlays are excluded from the neutral stack because they are optional additive effects. Sources retained. Reproduce using `node tools/art/prepare-courtyard-layers.mjs` with Sharp installed or RPS_SHARP_PATH set. Layers have been visually checked, including restored scenery behind lanterns, body/tassel alignment and glow masks.

## Installed stage

Lantern Courtyard is now the fourth stage in normal seeded match/rematch rotation, id `lantern-courtyard`. Static preview registration was replaced with the production layered stage. Production files: apps/game/public/assets/stages/courtyard/. Force a review via `?menuReview=stage&stage=lantern-courtyard`. Current existing fight music is retained pending a separate courtyard theme.

CourtyardStageView.ts animates each lantern in horizontal native strips: the top3pixel string stays pinned, the body/tassel sway at most1pixel on independent6.8/7.7/8.6second cycles. Glow overlays follow exactly the same strips and vary gently at low additive alpha. At most3native petals drift behind fighters in occasional groups, starting after5seconds with quiet intervals on a24second cycle. Sky, roofs, mountains, floor and settled petals stay fixed. Reduced motion immediately centers lanterns, holds glow at0.08 and hides drifting petals. One100ms scene timer drives effects, with its media listener removed on shutdown; re-entry starts fresh. No combat randomness or gameplay changes.

### Revised motion

User requested a more satisfying sway, stronger lantern glow and more frequent petals. The old horizontal strips are replaced by whole-lantern pendulum frames:15native nearest-sampled angles from−7°to+7°, pivoted at each hanging point. Bodies and glows use identically transformed frames. Sine timing eases at turning points over5.6/6.25/6.9seconds. Export with tools/art/prepare-courtyard-sway.mjs; sway.json documents geometry. No runtime rotation or filtered scaling is used. This supersedes the strip animation described above.

Glow now breathes between0.16and0.44 additive alpha, settling at0.3 with reduced motion. Up to6petals are released850ms apart starting1.2seconds into a match; each drifts for8.5seconds with a12second repeat period. Petals remain behind fighters and below the persistent HUD. Reduced motion uses neutral lantern frame7, steady glow and no flying petals.

Validation: 169tests, lint, typecheck and production build passed (existing bundle-size advisory retained). Browser check tools/art/check-courtyard-stage.mjs covers actual sway/glow/petals, layer order, live reduced-motion changes, scene re-entry and all four stages without page/asset errors. Captures and checks are in review/.
