# Handoff: round-loop UI review, 29 October 2026

## Resume here

The user is reviewing the combat loop one UI beat at a time. Continue in the actual-game review harness, following their lead; do not redesign all remaining beats without them. Current page: http://127.0.0.1:5300/?roundReview&beat=3 (step 4, your move locked). Step numbers in the UI are one-based; `beat` in the URL is zero-based. The most recent adjustment moved the question mark two native pixels right of its original centering. No further task was agreed before this handoff.

Run the preview from `apps/game`: `npx vite --host 127.0.0.1 --port 5300 --strictPort`. It may already be running. On this Windows setup, a server started in the restricted shell was inaccessible from the user's browser; the working server was started with approved elevated execution. Check the existing server before starting another.

## Working tree and release state

- Working branch: `codex/edits`; last commit `2bb8943` (completed CRT Effects Studio), already pushed to `origin/main` at the user's request earlier in this chat.
- Subsequent round-loop/UI/hand-art/Anchor changes are uncommitted. Preserve them and every generated study. This request was for documentation and a handoff, not a new push, version bump or deployment.
- CRT controls and fine tuning were explicitly accepted as complete. Do not reopen that task. The broader gameplay makeover is still in progress; see the release checklist.

## Current presentation

### HUD

`HudView.ts` now uses compact rounded charcoal character-name backings, gold life bars, a simple central KO/countdown and the original small square round counters. The user rejected both a heavy angular panel design and a return to the unadorned original. The YOU/CPU labels have bright faces with player-coloured offset lettering/shadows, not underlines. Green backgrounds were explicitly rejected.

### Round intro and FIGHT

- No extra YOU-versus-CPU card inside the round intro. The already approved pre-match versus transition remains.
- Only the local fighter gets YOU and an arrow: P1 red, P2 cyan-blue. YOU stays visible; only the arrow and two stripes flicker rapidly. Reduced-motion mode keeps the marker steady. It disappears at FIGHT.
- Marker coordinates in `TagView.ts`: YOU y=88; arrow/stripes y=98, plus the existing integer bob. Triangle width matches YOU, stripes are three pixels thick, with a one-pixel black outline. All are rendered into the native 192 × 240 raster.
- ROUND/FINAL ROUND use the actual menu m6x11 font with gold face, dark outline/shadow, at y=54. FIGHT uses custom wide slanted lettering in `fightLettering.ts`, with white/lavender face and brand-purple inner edge, at y=62. K.O. retains its separate original placement/art.
- FIGHT now occurs within `roundIntro`, not after the picking clock starts. Its 180ms slam + 350ms hold is followed by a 250ms clear pause before the picking phase. The normal three-second picking allowance is preserved. Controls live in `tuning.banner`.

### Picking prompt

PICK YOUR MOVE uses the same menu font and gold treatment as ROUND. Numbered Rock/Paper/Scissors instructions are removed. Three outlined downward triangles in move colours bounce in a staggered wave. Text flickers slowly (1600ms cycle, visible 75% of the cycle). Prompt and triangles disappear immediately after the local player chooses. Motion/flicker is suppressed under reduced motion.

The triangle/text animation uses the game loop clock so it continues while the review harness holds the scene. Other match animation is held. Replays still show entrances and transitions.

### Move coins and chosen hand icons

- Both coins are behind fighters/foreground, near the outer edges: centres (28,105) and (164,105), radius 25. The user accepted the smaller, higher, outward placement. A 280ms overshooting pop and brief rim flash occur on entry, with reduced-motion suppression.
- A submitted move colours its whole coin: Rock red, Paper yellow/gold, Scissors cyan-blue. Thick bevelled rim, shaded face, recessed inner ring and dark two-pixel outer outline. The hand has a coloured raised/embossed treatment, with upper-left highlight and lower-right shadow.
- Hidden coins stay dark regardless of ready state. Question mark is a solid m6x11 menu glyph, 2× integer scale plus a one-pixel bold overprint, on a 24 × 24 texture. Waiting tint `0x888890`; ready tint `0xe4e4ea`. Glyph pixels shifted two pixels right. It remains a question mark after opponent lock-in; no secret pick leaks.
- **Current hand source is v6**: `art/ui/hand-moves-v6-pictograms/{rock,paper,scissors}-generated.png`. The user explicitly chose the first very simple pictogram set after rejecting the more detailed and hand-drawn native experiments. Native hand footprint is 24 pixels, centred in a 32-pixel transparent texture.
- The source images, prompts and review captures for all studies are retained under `art/ui/`. v7 adds anatomy and v8 is a hand-drawn 28-pixel alternative; neither is currently selected. Do not silently switch back to them.
- New hand textures and embossing are loaded **only by the dev round-review harness**. Normal gameplay currently uses the existing placeholder move symbols. The shared HUD/coins/director changes do affect normal gameplay. Installing final hand artwork into production loading and revising the later reveal badges are still outstanding.

## Review harness

`apps/game/src/dev/roundReview.ts` builds 19 selectable beats using actual FightScene/FightDirector/views and a scripted MatchSession fixture. Previous/Next/Replay and Try Rock/Paper/Scissors controls are in a separate panel. Try buttons open step 4 with the selected hand; step 5 also shows the rival ready. This is a visual fixture, not a real referee match or a complete pacing editor.

Step 1 holds at 600ms so the intro marker is visible; step 2 holds during FIGHT. Static intro holds explicitly show the visible half of arrow flicker; use Replay to inspect motion. The fixture currently uses Taiko versus Riot. Its AUTO beat is not evidence of Anchor's actual referee behavior. Normal full-match timing, P2 ownership, mobile and online presentation still need final visual verification. Existing later reveal/clash/KO beats are not redesigned just because they can be previewed.

## Anchor timeout rule

User requested Anchor always auto-pick Rock when its player submits nothing before timeout. Implemented in shared core, not presentation:

- Optional `RulesConfig.autoPickBySide`.
- `rulesForFighters` binds Rock for Anchor sides, leaving other sides absent/random.
- `Referee.reveal` uses that override only for missing picks; AUTO reporting and manual choices remain intact.
- Both LocalSession and authoritative MatchRoom already use `rulesForFighters`, so the rule works in local and updated online server code, including mirrors. CPU choices submitted normally are not replaced by the timeout rule.
- No deployment happened. The live server must receive the updated code before deployed online games gain this behavior.

## Validation and useful cautions

- Latest full unit run: **186 tests passed**. New tests cover Anchor on both sides, random fallback for others, manual/mirror choices, local CPU play and two OnlineSession clients round-tripping through MatchRoom.
- Full lint/typecheck and production build passed after the rule change. Later question-mark/marker adjustments passed lint/typecheck and focused real-browser rendering checks. The usual production bundle-size advisory remains.
- Recent browser captures are in the relevant `art/ui/*` study folders. They include the actual current CRT renderer. Full release browser suite/mobile/P2/online presentation acceptance is still open.
- Vitest in the restricted Windows environment initially fails to import temporary transformed files. Successful command uses project-local temp: `$env:TEMP = Join-Path (Get-Location) '.tmp'; $env:TMP = $env:TEMP; npm test`. `.tmp/` is ignored; its helper scripts are disposable, not durable project dependencies.
- A blank question mark was fixed by sampling the bitmap font's `__BASE` texture frame rather than its first auto-generated glyph frame. Preserve that fix. Current texture cache key is `move-question-menu-bold-v4`.

## Continue next

Resume the user's point-by-point review at the current coin/locked-pick beat. Keep the chosen v6 hands and current coin treatment unless they ask to change them. Next unreviewed work includes AUTO presentation, reveal/badge flight/collision, damage/verdict, recovery and round-end choreography. Obtain final artwork/UI acceptance before treating the visual makeover as finished, then finish production hand integration, broader verification, documentation/screenshots and coordinated release preparation.
