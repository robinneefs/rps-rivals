# Versus motion study

## Integrated version

Latest collision pass:420ms close,260ms5px screen/panel jolt,280ms4px cabinet kick,36 gold-dominant seam sparks with cream/orange/pink, and120ms K.O.-style CRT colour split. Effects fire at contact and are suppressed for reduced motion. Panel movement and handoff timers share the scene clock. Existing2800ms hold and240ms opening retained. See seam-impact-normal.png/reduced.png.

Latest polish: 220ms accelerating close, 2800ms hold, 240ms accelerating opening; decaying3px impact jolt and75ms restrained flash, suppressed for reduced motion. Values live in tuning.versus. Real-game stills: long-hold-cabinet.png and long-hold-monitor.png. The isolated HTML study retains its earlier timing.

The user authorized integration after adjusting both portrait directions and moving each outward by 24px. The real game is available at http://127.0.0.1:5194/. VersusView runs on the persistent transition scene over the selection-to-arena handoff, holds until readiness, and opens on roundIntro; first-round text follows without a duplicate VS card. Rematches use the same sequence. Names, ownership and stage come from the actual match. Disconnect clears the overlay. Further polish is still pending.

Focused checks: `node tools/art/check-versus.mjs` (desktop, phone/reduced motion, CPU match/rematch), `node tools/art/check-versus-online.mjs` (actual local Worker, delayed peer readiness and intro disconnect). Results/captures are retained alongside this file. The older browser smoke suite has stale Home navigation/entrance assumptions; it is not passing in full.

Open `preview.html` through a repository-root local web server. Current preview: http://127.0.0.1:5193/art/menus/versus-v1/preview.html.

An isolated native 192 × 240 canvas study, using existing portrait atlases, combat idle frames, rooftop layers and M6X11. No production match flow or rules changed. Fighter dropdowns, replay, held matchup and timeline scrubbing support review. Optional synthesized impact sound requires interaction; reduced motion fades the panels.

Proposed timeline: 350ms entrance, 1300ms matchup hold, 550ms opening, followed by a sample ROUND 1 overlay. Arena and idle fighters are drawn underneath throughout; no black transition. The background is a composition fixture, not a running match. P1/You and P2/Rival are fixture labels. Online readiness, actual selection handoff, alternate palettes and rematch behavior are not integrated. Portraits reuse existing poses and can be refined after composition approval.

Browser review: desktop screenshots `matchup.png` and `reveal.png`; all nine pairings sampled through entrance/impact/hold/open/reveal at phone viewport, and reduced-motion replay checked without page errors. No new generated artwork or external dependencies.
