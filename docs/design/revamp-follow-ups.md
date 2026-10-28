# Game revamp follow-ups

The consolidated, current agenda is [release-checklist.md](release-checklist.md), including the outstanding gameplay visual makeover. This file retains the original follow-up details.

## Final release requirement

Before the final release of the new game version, review and address every outstanding item noted in this file, `PROJECT_CONTEXT.md`, and the other project planning notes. Consolidate outstanding items into a release checklist and resolve each one before releasing; do not leave previously noted work silently deferred. If an item needs a decision, settle it with the user before the final release.

## Follow-ups

- [x] Alternate colours accepted: three masked combat atlases and three reference-generated alternate rest portraits installed, with final Taiko headband/wrist speck cleanup. Reviewed in actual game scenes. Next chat: CRT shader control panel.
- [x] Versus transition integrated and refined: simplified ownership labels, custom centred VS, protected stage label, longer hold, readable closing slam, screen/cabinet shake, seam sparks and short K.O.-style CRT pulse. CPU/online/rematches and reduced motion covered. Remaining gameplay HUD/reveal/round presentation work stays open in the release checklist.
- [x] Harbor water motion strengthened; harbor and rooftop bird flocks made much more frequent. Four alternating flock formations/directions/paths are implemented and accepted, retaining the seven-second cadence.
- [x] Courtyard distant-building smoke implemented and explicitly approved.

- Completed: online exit/disconnection flow and stale-connection detection implemented. On 2026-10-28 the user reported completing the recommended playtest and that everything seemed to work fine; individual scenarios/devices were not separately enumerated.
- Completed: rematch-screen notification when the online opponent has pressed Rematch and is waiting for acceptance; included in the online-flow work preceding the user's playtest report.
- [x] CRT control panel, fine tuning and effects playground completed and accepted by the user on 28 October. Effects Studio provides real gameplay preview and individually triggerable short-burst CRT effects; accepted CRT defaults are saved in tuning.ts.
- Implemented: approved fighting-game victory splash with all three existing large character portraits, Rematch/Main Menu, darker title shadow, blended portrait edge and prolonged entrance. Enabled for normal CPU/online match results; mirror headers identify the winning player.

## Marquee downscale trial

The cabinet now uses `marquee-v4-1024.webp`: a 1024-pixel-wide Lanczos3 downscale of the existing 1466 × 322 marquee, encoded losslessly to avoid adding compression artifacts. The original remains available. Review the result at normal display size and on high-DPI displays before deciding whether further artwork cleanup is needed.
