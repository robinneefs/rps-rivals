# Game revamp follow-ups

## Final release requirement

Before the final release of the new game version, review and address every outstanding item noted in this file, `PROJECT_CONTEXT.md`, and the other project planning notes. Consolidate outstanding items into a release checklist and resolve each one before releasing; do not leave previously noted work silently deferred. If an item needs a decision, settle it with the user before the final release.

## Follow-ups

- Before finishing the revamp, review the player experience when someone leaves an online match and clean up the exit/disconnection flow.
- As part of that online-flow review, notify a player on the rematch screen when their online opponent has pressed Rematch and is waiting for them to accept.
- When building the CRT experiment/control panel, add a separate effects panel with a selection of proposed intense, short-burst CRT effects for possible use in the game. Provide a preview of the main gameplay screen where each effect can be triggered and tested before choosing which to use.
- Implemented: approved fighting-game victory splash with all three existing large character portraits, Rematch/Main Menu, darker title shadow, blended portrait edge and prolonged entrance. Enabled for normal CPU/online match results; mirror headers identify the winning player.

## Marquee downscale trial

The cabinet now uses `marquee-v4-1024.webp`: a 1024-pixel-wide Lanczos3 downscale of the existing 1466 × 322 marquee, encoded losslessly to avoid adding compression artifacts. The original remains available. Review the result at normal display size and on high-DPI displays before deciding whether further artwork cleanup is needed.
