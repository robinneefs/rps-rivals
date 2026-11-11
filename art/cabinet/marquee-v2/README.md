# User-supplied marquee, 2026-10-25

## Current smaller presentation

The user requested the image itself be smaller within the unchanged opening. The export script now writes `assets/cabinet/marquee-v3.webp` at1442 ×358, retaining the whole492px-tall illustration strip after removing only its black padding. `CabinetView` uses centered `contain` within the same721 ×157 opening, with4 cabinet units of space above/below and a dark indigo surround. Artwork is approximately17% smaller than the former cover crop, with no illustration cropped away. The previous cover crop removed about12.2% of the illustration height and none of its width. Showing the whole image smaller necessarily leaves side insets because there is no unused horizontal source art beyond the existing edges. The original `marquee-v2.webp` remains as a previous export.

`source.png` is the original supplied illustration, unchanged. No image generation was used.

`tools/art/prepare-marquee.mjs` detects/removes the black horizontal padding, then applies a centered proportional cover crop for the actual cabinet opening. Output: `apps/game/public/assets/cabinet/marquee-v2.webp`, 1442 × 314 pixels (2× cabinet dimensions). Crop metadata is recorded in `export.json`.

The corrected opening is x110,y49,width721,height157 in cabinet coordinates. Its center matches the body's center at x470.5. The old opening extended down over the lower painted trim; the new bottom ends at206. A shared clipped holder confines the image and shading. Top and bottom inset shadows both use a12px soft band at alpha0.75, with the existing seam, side shading, vignette and flicker retained.
