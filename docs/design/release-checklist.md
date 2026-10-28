# Revamp release checklist

Consolidated 28 October 2026 from PROJECT_CONTEXT.md, revamp-follow-ups.md, the overhaul checkpoint, visual-direction notes and current implementation. This is the current release agenda; older checkpoints remain historical. An unchecked decision must be settled explicitly before release, rather than silently dropped. Creating this checklist does not authorize deployment.

CRT control panel, effects playground and CRT fine tuning are complete and accepted by the user (28 October). Alternate combat palettes, generated portraits and bird formation variations are also accepted. Gameplay makeover and remaining checklist decisions stay open.

## 1. Gameplay visual makeover — main remaining work

The new fighters, stages and menus are installed. They do not complete the planned combat-screen and match-flow redesign. HudView, ClashView, BannerView and TagView still provide the existing presentation; the original plan calls for a storyboard, implementation and a dedicated pacing page.

- [x] Implement and polish the post-selection versus transition: revised portrait orientation/spacing, YOU/CPU/RIVAL labels, custom centred gold VS, stage-name plate, 420ms closing slam, 2800ms hold, sharp opening, screen/cabinet shake, gold seam sparks and 120ms K.O.-style CRT pulse. Uses actual fighters/stage, shared online readiness, rematches and reduced motion; no black handoff or duplicate VS card. User approved the visual design; requested collision refinements are implemented.
- [ ] Agree the remaining combat storyboard before implementation: round introduction → picking/countdown → lock-in → reveal/clash → hit and damage → recovery → round end/K.O. → next round or existing victory screen. Build on the completed versus transition and give each beat one clear focus.
- [ ] Design the HUD: health bars, character/player identity, round markers, timer, and ready/locked-in states. Keep both sides readable with different maximum HP and in mirror matches.
- [ ] Redesign pick prompts and move presentation: Rock/Paper/Scissors symbols, ownership, hidden opponent pick, auto-pick and move damage where needed. Make keyboard and touch instructions appropriate to the input method.
- [ ] Redesign reveal/result messaging and choreography: what beat what, who hit, clash/no damage, damage numbers and health loss. Make the outcome understandable without several competing messages.
- [ ] Bring ROUND, FIGHT and K.O./round-end graphics, typography and transitions into the approved energetic fighting-game direction. VS and final victory splash are already implemented.
- [ ] Review hit feedback, particles, flashes, shake, sound synchronization and fighter choreography as a coherent whole; tune the rhythm after the visual design is accepted.
- [ ] Add the planned dedicated pacing page to the development tuning panel so the match beats can be reviewed and adjusted together.
- [ ] Approve actual-game captures and motion on desktop and phone, across all five stages, all fighters/mirrors, CRT on/off and reduced motion. Preserve the native 192 × 240 grid and approved fighter proportions.

These are design/review tasks, not approval of particular replacement artwork or new gameplay rules.

## 2. CRT review and effects playground

- [x] Reuse the existing K.O. colour-split effect as a short versus-impact jolt, with cleanup and reduced-motion suppression. This specific requested effect is complete; the broader playground below remains open.

- [x] CRT fine tuning complete and accepted by the user, closing the earlier brightness/readability and filter-tuning request.
- [x] Development Effects Studio provides CRT controls, presets and persisted settings; accepted defaults are saved in tuning.ts.
- [x] Separate effects playground provides real gameplay preview and individually triggerable short-burst CRT effects.
- [x] User confirmed the CRT control panel and fine tuning are done. Any future integration of additional effects into redesigned combat beats belongs to the gameplay makeover.

## 3. Remaining visual and product decisions

- [x] Alternate fighter colours accepted (28 October): fixed material masks for all three nine-pose combat atlases, reference-generated alternate portraits from the installed victory-screen rest frames, and final Taiko headband/wrist speck cleanup. Installed in mirror combat, versus and victory screens; actual-game review completed. Original portraits and breathing shader remain intact.

- [ ] Decide whether How to Play stays, is redesigned or is replaced by in-match guidance. If retained, make it match the revamp and current character-specific rules.
- [ ] Review the installed 1024px marquee downscale at normal size and on high-DPI displays; accept it or agree the needed cleanup.
- [ ] Close the older balance-tool and character-aware CPU proposal explicitly: implement it for this release or agree it is out of scope. Character HP/damage are already user-specified; they are not a claim of tested matchup balance. The dedicated balance tool was not found in the current source inventory.
- [ ] Settle the optional installable web app proposal. Browser is the current target; Android/Play Store work was explicitly parked and is not a release requirement.

## 4. Final verification and release preparation

- [ ] Run a focused readability/game-feel playtest after the gameplay makeover, then check any changed online paths. The user's successful online playtest on 28 October remains valid evidence for the current implementation; do not reopen it merely because older notes still list it.
- [ ] Run formatting, lint, typecheck, unit tests, production build and browser smoke checks against the final candidate. Investigate new failures and review the existing bundle-size advisory for practical loading impact.
- [ ] Update stale browser smoke tests for current Home navigation/entrance behavior, then rerun them. Focused versus CPU/rematch and actual two-client online checks passed; the older full smoke suite is not currently passing.
- [ ] Check phone touch input, browser viewport changes, sound/background behavior, settings persistence, Pixel Perfect mode and reduced motion after the final changes. Record actual-device versus emulated evidence accurately.
- [ ] Refresh README/screenshots and relevant design, architecture, tuning and audio notes to describe the shipped game. In particular, remove stale claims about shared HP/damage, roster/stages and old rendering sizes. Preserve source artwork, prompts and licenses.
- [ ] Assign the release's plain x.y.z version and write its changelog once the candidate is ready.
- [ ] Prepare matching browser/server rollout: the current protocol and character rules require compatible versions. Confirm target and rollback plan, then obtain the user's release instruction before deploying.

## Completed foundations — retain, do not re-plan

- [x] Approved cabinet/control layout, joystick and engraving; Pixel Perfect option implemented.
- [x] Home, Options, Online, Create Room and Join Room restyled; the user approved the remaining menus on 27 October. Older requests for that sign-off are superseded.
- [x] Three selectable, playable fighters with approved combat sheets, character selection and user-specified HP/damage. Alternate palette implementation exists, but its visual review is reopened above.
- [x] Five animated stages and their installed soundtracks: City Rooftop, Storm Field, Sunset Harbor, Lantern Courtyard and Foundry Floor.
- [x] Approved victory splash integrated for all three fighters and mirror-match ownership.
- [x] Online exit/disconnection notices, rematch waiting notification and stale-connection detection implemented. User reported the recommended playtest worked fine on 28 October; individual devices/scenarios were not enumerated.
- [x] Audio-focus backlog and rooftop cloud-scrolling fixes implemented.
- [x] Versus transition and requested collision polish integrated (details above).
- [x] Harbor water wiggle strengthened to 4px ripple displacement with 200ms frames.
- [x] Harbor and rooftop birds made much more frequent: first flock after 1.2s, then every 7s with overlapping crossings.
- [x] Subtle smoke added to distant mountain buildings in Lantern Courtyard; explicitly approved by the user.

## Source reconciliation

- PROJECT_CONTEXT.md: latest handoffs supersede older missing-stage, missing-sheet, equal-stat, unapproved-menu and deferred-palette notes. Alternate-colour review is the user's next task; remaining gameplay/storyboard/pacing work stays open after the completed versus transition.
- docs/design/revamp-follow-ups.md: online items completed; CRT playground and marquee review retained above.
- docs/checkpoints/2026-10-27-overhaul.md: historical validation and exclusions retained; later menu approval, fighter integration and online work supersede its outstanding-status notes.
- docs/mockups/v2/VISUAL-DIRECTION.md: retain the colour/energy and character references, with current runtime dimensions, roster implementation, stats and five-stage lineup taking precedence over its older provisional values.
