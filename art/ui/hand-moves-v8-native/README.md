# Native 28 × 28 hand icons

Requested 29 October 2026 after smooth v7 artwork lost clarity when reduced. This version deliberately draws the white silhouettes and dark outlines at the game's native resolution. Finger channels, thumb contours and limited internal strokes are chosen on the pixel grid rather than sampled from large images.

Source: `apps/game/src/dev/nativeHandIcons.ts`. Exported native PNGs and actual-game captures are alongside this file. This experiment was subsequently rejected: the user requested returning to the simpler v6 pictograms, which are now selected in the round-review preview. The earlier `handStyle=generated` comparison route is no longer active.

Preview only: normal released artwork remains unchanged. Original generated studies and prompts are retained in v1–v7.

Validation: TypeScript, ESLint, all three actual-game review buttons, and browser error check passed. Captures include the current CRT effect.
