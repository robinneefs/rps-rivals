# Taiko portrait material-mask trial

Isolated experiment using the **currently installed** Taiko atlas's first 192 × 240 rest frame. Production textures and recoloring remain unchanged. The game animates this resting image using `portraitBreathing.ts`; extra breathing frames are unnecessary for this technique.

Open `preview.html` for original, alternate, and material overlay. `comparison.png` contains the same panels at 3× native size.

- Cyan: tunic → warm ivory.
- Pink: wraps → crimson.
- Green: headband and tails → crimson.
- Gold: stitching and belt → charcoal.

Contours are explicitly traced at native resolution. Color-assisted selections inside those contours exclude skin/ink and separate the tiny gold stitches. This is an initial assisted mask, **not a claim of a fully hand-painted, final mask**. `taiko-material-mask.png` records the resulting explicit selection and can be retouched pixel by pixel. `regions.json` and `contours.svg` preserve authoring geometry. No AI image regeneration is involved.

The recolor uses separate nonlinear multi-stop ramps per material and retains near-black linework. `audit.json` checks unchanged alpha and byte-identical pixels outside the mask. Those checks establish containment, not semantic correctness: remaining edge pixels still need artistic review, especially the rear wrap edge, tiny headband details and sash hem. The chosen crimson highlights may also need darkening after visual feedback.

Reproduce from the repository root with `node tools/art/prepare-portrait-mask-study.mjs` (requires `sharp`, or set `RPS_SHARP_PATH` to its package). Re-running regenerates all outputs, including the PNG mask; save manual retouches separately before regenerating.

Next integration step, after visual review: consume the approved fixed mask or baked alternate image, preserve the atlas frame registration, and let the existing breathing shader deform the recolored image. Do not reintroduce hue-based material inference at runtime.
