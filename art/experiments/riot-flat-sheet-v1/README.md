# Riot flat-shape sheet, first generation

2026-10-25. Generated with the built-in imagegen tool. Original output preserved as generated.png; exact prompt in prompt.txt. References: Taiko's original flat sheet and docs/mockups/v2/8-characters-taiko-anchor-riot.webp.

Row-major poses: idle0, idle1, punch (rock), block (paper), shove (scissors), hurt, knockout (ko), victory (win), kick.

User approved local integration: P2 uses Riot, P1 remains Taiko. Rebuild with `node tools/art/prepare-riot-sheet.mjs` (sharp or RPS_SHARP_PATH required). Nine subjects are extracted with alpha threshold128 and one shared source scale, nearest sampling, no palette reduction or stretching. Output: 384x384 atlas, 128x128 cells, origin (64,124), idle0 100px, idle1 99px. Kick retains the existing 27px planted-foot offset. Victory is 94px tall including raised arm; kick83px: generated proportions remain imperfect. Native frames, alignment audit and 3x review are in native-192/. Game capture: in-game.png.

Validation: typecheck, production build, focused lint and installed-Chrome full CPU match/rematch smoke test passed; both atlases loaded, no page errors. No frame clipping, zero partially transparent output pixels. Original generation preserved; gameplay rules, timings, damage and synchronized choreography unchanged.

Initial visual review: Riot's costume and compact boxing guard read clearly. Idle frames are subtly different. Punch and kick remain closer to Taiko's silhouettes than requested; kick reads as a straight raised kick rather than the requested twisting roundhouse. Do not treat generation as approved animation or proven pixel-grid art.
