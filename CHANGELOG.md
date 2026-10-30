# Changelog

Every build that goes online gets a new version number (in `apps/game/package.json`, shown small on the home screen) and an entry here. Version numbers follow semver: a new feature bumps the middle number (1.0.0 → 1.1.0), a fix-only build bumps the last (1.0.0 → 1.0.1). Each version that goes live is tagged `vX.Y.Z` with a GitHub release, made automatically from its entry here when it reaches the `production` branch.

## Unreleased — staging update (2026-10-30)

- Integrated approved v6 embossed hand pictograms and generated K.O. lettering into normal gameplay. Preserved all studies and the 19-beat development review harness.
- Revised the gold HUD, larger countdown dial, synchronized coin ticks, persistent countdown audio, picking prompt and local-player marker. Round openings now last 2.8 seconds with red-highlighted FIGHT lettering and a 350ms clear pause; picking still allows three full seconds.
- Attack coins pull back, rotate inward and arc into an accelerating collision with intense trails, sparks and shockwaves. They return to their round shape at impact. Ties trigger a one-shot CRT burst; redundant attack text is removed.
- Raised damage numbers use larger menu lettering with a gold gradient and a short downward fade. Results identify YOU, CPU or RIVAL instead of the fighter's name.
- Anchor always auto-picks Rock on timeout; manual picks and other fighters' random fallbacks are preserved. The shared server rules are included.
- Confirmed fresh-install defaults: CRT on, pixel perfect off, haptics on, sound on. Saved player preferences remain respected.
- Polish review: installed the approved 733 × 161 marquee with inward-facing Riot and tied-back Anchor hair; retained natural proportions. Increased K.O. colour split, brightened CRT midtones/glow while retaining edge shading, concealed the screen-opening hairline and removed the unused How to Play screen. Current random CPU retained by user decision.
- Validation: 186 unit tests, all 16 browser checks using installed Chrome, lint, typecheck, formatting and production build pass. Updated stale navigation/rendering expectations and isolated random fixtures. Generated art studies/exported metadata excluded from source formatting. Final two-player online playtest remains pending; the existing bundle-size advisory remains.

## 2.2.0 (2026-10-25)

- **New marquee.** Fresh marquee art with Taiko, Anchor and Riot beside the flame-lettered RPS RIVALS title. It now fills the whole marquee window: before, the art was a little too short, so a strip of the cabinet's empty marquee showed underneath it.
- **The marquee sits in the cabinet.** A soft shadow under the top edge, shading round the sides and darker corners make it look set into the machine instead of pasted on top.

## 2.1.0 (2026-10-24)

- **New joystick.** A new red ball-top joystick, drawn in all 8 directions; the right-hand directions mirror the left ones, so both sides look the same. The stick is drawn in front of everything else on the cabinet, the screen and the buttons included.
- **No accidental diagonals.** Dragging the joystick with a finger or the mouse needs a clear push before it moves, and a swipe that is mostly up, down, left or right stays exactly that. Only a clearly diagonal drag tilts it diagonally.

## 2.0.0 (2026-10-24)

The first build of the big overhaul: a new arcade cabinet, made for phones. (A work in progress on staging: the fighters, the other screens and the characters are still to come.)

- **A new cabinet.** The pixel cabinet is replaced by a painted, glossy 90s cabinet: navy body with red, yellow and blue stripes, a flame-lettered RPS RIVALS marquee that still flickers, a red ball joystick, and big pink, yellow and cyan ROCK, PAPER and SCISSORS buttons. Behind it, a neon arcade room. Only the game on the screen is pixel art now.
- **Fits your phone.** The cabinet fills the width of an upright phone, even with the browser's address and tool bars showing, keeps clear of the notch and home bar, and refits when the bars slide in or out. On a computer it stands in the middle of the arcade room.
- **Big touch controls.** The buttons and joystick are much bigger, and each reacts to its whole part of the control panel, so a thumb that lands next to a button still presses it. The buttons press in, your pick glows and the others dim. Drag the joystick in any of 8 directions; it flicks back when you let go.
- **A bigger, taller screen.** The game screen is now 288 x 360 pixels (was 216 x 216), drawn so every pixel stays sharp and the same size on any screen. The CRT scanlines and glow are still there.
- **A new stage.** Fights take place on a sunny city rooftop. The old Night Street, Sunny Field and Castle Roof stages are gone for now (they were made for the old screen).
- **SCALING is gone** from Options: the new cabinet always sizes itself.

## 1.3.0 (2026-10-17)

- **CPU is CPU again.** In a match against the computer it's called CPU everywhere again: the tags over the fighters, the VS card, "CPU HITS!", the HUD, "CPU WINS" and START GAME, VS CPU on the home menu. RIVAL is now only for online matches, and the ONLINE menu item now says VS RIVAL instead of VS FRIEND.
- **Menus follow the mouse.** Hovering a menu item with the mouse now selects it, just like moving to it with the joystick, with the same blip. (On a phone a tap still just picks the item.)
- **How to Play shows the circle.** The three moves are now drawn in a triangle with arrows going round: rock → scissors → paper → rock, each move beating the one its arrow points at. The cryptic "PAPER BEATS ROCK TOO" line is gone.
- **Steadier sound.** The sound effects came out of the generator up to 7 dB apart (the whoosh and K.O. loud, the menu blips quiet), so the volume jumped from one sound to the next. Every effect now peaks at about the same level (the K.O. a touch louder). The effects sit closer to the music: they used to be about 14 dB above it and are now about 9. A limiter on the output stops overlapping sounds from clipping into a loud crackle.
- **Even CRT scanlines.** The scanlines are now drawn at the screen's own resolution, one equally thick line under each pixel row, placed exactly where the browser draws that row. Before, at the default Fill height scaling, the lines came out uneven and drifted against the rows.

## 1.2.0 (2026-10-17)

New players often couldn't tell which fighter was theirs or what had just happened. The fight now spells it out:

- **YOU VS RIVAL.** Before round 1, the two names slide in from their sides with a big VS between them, then ROUND 1 slams in.
- **A tag over each fighter.** Through round 1 a bobbing **YOU** or **RIVAL** tag with an arrow points down at each fighter. At the start of round 2 the tags blink out.
- **Each side has its own colour.** Your names, health bar frames and round boxes are now red for the left fighter (red shirt) and teal for the right one (teal top), so each bar matches its fighter.
- **Your pick shows over your head.** While picking, your move appears over your fighter, and a **?** hangs over your rival's head (dim until they lock in, bright once they have). The pick stays hidden until the reveal.
- **A bigger prompt.** PICK YOUR MOVE is bigger and sits under the fighters. For the first three picks of a match, **▼ PRESS A BUTTON ▼** points down at the buttons. The prompt goes away once you've picked.
- **The reveal says who hit whom.** Each badge carries its owner's name (YOU / RIVAL) until the badges collide. Then the rule appears (**SCISSORS BEATS PAPER**), followed by **YOU HIT!** or **RIVAL HITS!**, both in the winner's colour. A tie shows **CLASH!** and **NO DAMAGE**.
- **The hit lands on the right bar.** The damage number now pops off the loser's head in red, and the loser's health bar flashes white.
- **The CPU is called RIVAL.** RIVAL now appears everywhere the game used to say CPU: the HUD, the result screen (RIVAL WINS) and the home menu (START GAME, VS RIVAL). Online works the same way, with P1 / P2 in front of each name on the HUD.
- At low health the bar frame now flashes white instead of red (red is the left side's colour now).
- All of it works the same online, from either seat. New tuning values (`identity`, `prompt`, the verdict and bar flash values under `reveal` and `hud`) are in the dev tuning panel.

## 1.1.1 (2026-10-13)

- **Privacy policy page.** The game's site now has a privacy policy at `privacy.html` (needed for Google Play): no accounts, no ads, no analytics, settings stay on your device, and the online server only passes moves between the two players without saving anything.
- **Google Play kit.** Everything for the store page is in the new `play-store/` folder: the store description, answers for every Play Console form, the icon, the feature graphic and six phone screenshots (`node sources/play-store/capture.mjs` remakes them).

## 1.1.0 (2026-10-12)

- **Vibration on phones.** The phone now buzzes along with every screen shake: a short tap on a clash, a firmer buzz the harder the hit (paper, rock, scissors), a double rumble on a K.O., and a tap when the timer runs out. Buzzes are kept short (40 ms at most) so they never get harsh. Works in phone browsers that support vibration (Android Chrome and Firefox; iPhone Safari does not) and is ready for the Android app, where it can also buzz softer or harder. Tune it under `haptics` in the dev tuning panel.
- **VIBRATION in Options.** On by default; select it to turn it off (turning it back on gives a short buzz so you feel it). It is only listed on a device that can vibrate.
- **An Android app (first build, not on Google Play yet).** The game now also comes as an Android app, built with Capacitor from the same code: run `npm run android` to open it in Android Studio and play it on a phone. It fills the whole screen in portrait, plays online against the live server, buzzes through the phone's own haptics, and the phone's back button backs out of menus (and leaves the app from the home screen). Launcher icon (the Rock button), splash screen and Play Store art are made from the game's art. How to build, sign and upload: `apps/android/README.md`.
- **App only: no SCALING, a QUIT button, and a pause in the background.** The app always fills the screen, so Options leaves SCALING out. The home menu has QUIT at the bottom. When you switch to another app or go to the home screen, the game pauses: the music and sounds stop, and a match against the CPU waits for you (an online match can't wait, since your rival plays on).
- **REMATCH.** The button after a match now says REMATCH instead of RETRY.

## 1.0.0 (2026-10-12)

The first public release, live at https://robinneefs.github.io/rps-rivals/. Everything since 0.5.4 (the build that was live until now) is listed in the entries below; in short:

- **Play a friend online.** One player creates a room and reads out its 4-letter code, the other joins with it. Matches run on a server, so neither player can see the other's pick early. Rematch from the result screen.
- **The full arcade look.** A wood-grain cabinet with a flickering marquee, shaded buttons that glint, a clicking joystick, a CRT screen with off/on transitions between screens, three stages picked at random, and new fighters.
- **A punchier fight.** Picks clash in the middle of the screen, then hit pause, sparks, shake, a K.O. slow motion with big K.O. letters, and chiptune music and sound.
- **How to Play.** A short card on the home menu with the rules and each move's damage.
- **Steady for release.** The fixes from the 0.11.1 bug hunt, a proper browser tab and link preview, and a new README.

## 0.11.1 (2026-10-12)

Fixes from a bug hunt before 1.0.

- **No more freeze when keys are pressed while the game loads.** Pressing a button or a key before the studio logo had finished starting up could leave the screen black for good. Now the game just skips ahead.
- **Online: no more dead RETRY when the rival leaves at the K.O.** If the other player left in the moment between the final K.O. and the result screen, the result screen still opened and RETRY waited for a rival who was gone. Now you see RIVAL LEFT and go back to the menu, as at any other moment. The RIVAL LEFT banner also no longer shows through behind the result screen.
- **A CPU match waits while the tab is hidden.** Switching to another tab or app mid-match used to let the match play on unseen, with picks made for you, so you came back to a lost round. Now the timer and the CPU wait until you're back. Online matches can't wait, since your rival is still playing.
- **Lobby buttons no longer cover the hint text.** The BACK and CANCEL buttons on the join and new-room screens sat on top of the hint at the bottom; they're moved up.

## 0.11.0 (2026-10-11)

- **Polished cabinet buttons.** Each button now sits in a chrome collar, has a rounded side lit from the left, a cap with a raised rim that catches the light at the back, a sharp glint, and an embossed icon. Buttons brighten when the mouse is over them, look pushed into shadow when pressed, and every few seconds a glint sweeps across all three, left to right. Tune the glint under `buttons` in the dev tuning panel.
- **A more frequent marquee flicker.** The marquee light now flickers every 1.5 to 4.5 seconds (was 4 to 11), sometimes dipping a little and sometimes nearly blacking out. The pink neon tube round the art goes out with it, and the art flashes a little brighter as the tube strikes back. There are six flicker patterns now (was three). Tune it under `marquee` in the dev tuning panel.
- **New K.O. letters.** The K.O. banner is now big, chunky letters leaning forward, filled pale yellow to gold to orange to red, with a white shine on top, a dark red and black outline and a drop shadow, like a '90s arcade fighter.
- **Joystick juice.** The joystick clicks every time it snaps into a new direction (spin it round and it keeps clicking) and when you let go, and the stick wobbles past the centre and back before it settles. Tune it under `joystick` in the dev tuning panel.
- **CRT screen transitions.** Changing screens now switches the monitor off and on like an old tube: the picture closes to a bright line, shrinks to a dot and goes black, then opens back up on the new screen. Tune it under `transitions`.
- **How to Play.** A new HOW TO PLAY item on the home menu opens a short card: rock beats scissors, scissors beats paper, paper beats rock, how much damage a winning hit does with each (rock 15, scissors 20, paper 10), and the few rules (pick with buttons 1 2 3 before the timer runs out, a pick is made for you if you don't, the same move is a clash, win 2 rounds). Any button goes back.
- **A wood-grain cabinet.** The cabinet body has a subtle wood grain (down the sides, along the front face), and a bit of wear: light scratches on the front of the control panel and the sides, and the pink trim on the front lip rubbed paler where hands rest.
- **A proper browser tab and link preview.** The tab now reads "RPS Rivals: Rock Paper Scissors Fighter" with a pixel-art Rock button as its icon (also used when the game is added to a phone's home screen), and links shared on social sites and chat apps show the marquee and the three buttons with "PLAY FREE IN YOUR BROWSER". Made from the game's own art by `tools/make-icons.mjs`.
- **New README and screenshots.** A big PLAY button, a description of the game, fresh screenshots of every screen (including How to Play and the K.O.), the technologies used, an architecture diagram, and a full list of where every asset comes from.

## 0.10.0 (2026-10-11)

- **New fighters.** Player 1 (left) is now a strong brawler in blue jeans, brown boots and an open red shirt over a white undershirt. Player 2 (right) is a martial artist with a high ponytail, a teal wrap top with white trim, a gold sash, navy pants, white boots and wrapped hands. Both are still drawn in code at 64 px tall, with every pose (idle, rock, paper, scissors, hurt, K.O., win) redrawn; the real sprite sheets can replace them later under the same names.

## 0.9.1 (2026-10-11)

- **Online: fixed sides for both players.** The player who creates the room (the host) is always Player 1 on the left, and the player who joins is always Player 2 on the right, the same on both screens. Before, each player saw themselves on the left. The name tags now read "P1 YOU" and "P2 RIVAL" (or the other way round for the guest), and the result screen shows the score as P1's rounds - P2's rounds. Both players need this version.

## 0.9.0 (2026-10-11)

- **Flat white move icons.** The cabinet buttons and the move badges on the reveal now show big, clear white icons (a boulder, a sheet of paper, open scissors) with a dark outline, in the style picked from the round 3 mock-ups.
- **Punchier buttons.** The buttons have a dark rim and go deeper when pressed. Locking in a move flashes its button white twice while a ring pops out round it; it then stays down and lit, and the other two dim.
- New tuning values for the lock-in flash and ring (`buttons` in the dev tuning panel).
- **The control panel has depth.** Its top now looks slanted: lit at the back and darker towards you, with bevelled sides, corner bolts, button wells with a lit rim, and a raised front lip with a pink trim strip over a shadowed front face.
- **A big, juiced timer.** The pick timer is big and outlined so it stands out against the sky. Each new second is one size bigger than the last and sits a little lower, moving towards the middle of the screen, and pops in white. It is gold at 3, then red at 2 and 1, shaking and tilting from side to side (harder at 1). When time runs out a big red 0 slams down. All of this can be tuned under `hud` in the dev tuning panel.
- **Thicker health bars.** The bars are 12 pixels tall (was 8) and look like lit tubes: a shine along the top, darker bands underneath, a bright leading edge, notches every tenth, and a gold frame.
- **Fixed: a short loud burst of music on every screen change**, even with sound off. A new music track started at full volume for a moment before fading to its real level; it now starts silent and fades in.
- **Faster, shorter fights.** You now have 3 seconds to pick instead of 5, and each fighter starts a round with 50 health instead of 100, so a round takes about 3 or 4 exchanges. The health bars turn red below 15 health (was 30). Online, both players need this version.
- **A new reveal: the moves collide.** The falling move coins are gone. When both picks are in, a bigger move badge with a gold starburst pops in beside each fighter (with AUTO over it if the timer picked for that player). Both badges fly to the middle and collide with a white flash. The winning badge stays in the middle and the losing one is knocked away off the screen, turning as it goes. "ROCK WINS", "PAPER WINS" or "SCISSORS WINS" slams in above in the winning move's colour; a tie bounces both badges back and says "CLASH!". It works the same in online matches. Tune it under `reveal` in the dev tuning panel.
- **Three fight stages, picked at random.** Each match is fought on one of them, and Retry moves on to the next, so you never get the same stage twice in a row. Online, both players always see the same stage.
  - **Night Street:** brick buildings with lit windows and pink BAR and cyan RPS neon signs, a skyline and a crescent moon, street lamps, and a wet road that reflects the neon.
  - **Sunny Field:** blue sky with a sun and puffy clouds, rolling hills, a big tree on each side, a wooden fence, and grass with flowers around a worn dirt patch.
  - **Castle Roof** (a nod to the '90s arcade fighters): a sunset sky with a big moon, mountains and pines, a tiered castle, red banners, and a plank floor.
  - The menus keep the sunset backdrop. Stages are listed in `apps/game/src/config/stages.ts`, so adding or removing one is one line plus its painter. Add `?stage=field` (or `street`, `castle`) to the address to try a stage.
- **A new menu backdrop.** The home, options and online screens drop the '80s sunset for a '90s arcade select-screen look: deep purple with a soft glow behind the menu, a pink diagonal slash, halftone dots in two corners, big faint move symbols, and thin stripes drifting slowly across.
- **Evened-out sound levels.** The menu blips, the ROUND sting and the win and lose jingles were much louder than the fight sounds (most noticeable after a match, when choosing Retry or Main menu). They now play at about the same level as the rest.
- **The cabinet shakes.** The whole arcade machine rattles against the room: hard on a K.O., a little on a 20-damage hit, and once when the pick timer runs out.
- **K.O. slow motion.** The finishing hit freezes on a white flash, then plays in slow motion for a moment before the K.O. banner.
- **Hit sparks and dust.** Sparks in the winning move's colours fly off the hurt fighter (more for bigger hits), and dust kicks up behind a fighter's back foot as they lunge.
- **Low health pulse.** At 15 health or less, a health bar pulses brighter and its frame flashes red.
- **A flickering marquee.** Every few seconds the marquee's backlight flickers like an old tube, on its own, whatever is happening in the game.
- All of these are tunable in the dev panel (`cabinet`, `ko`, `sparks`, `dust`, `marquee`, and `lowPulseMs` under `hud`).
- **CRT screen.** The game screen now looks like an arcade tube: fine scanlines, a soft glow around bright colours, darker edges, rounded corners and a faint band rolling down. It is a WebGL shader on the monitor plus a scanline layer in the page; the cabinet around it stays crisp. Turn it off with the new CRT SCREEN option (on by default). Tune it under `crt` in the dev panel.
- **Impact shader effects.** On a K.O. the screen's colours split apart (red and blue pulled sideways) and settle back, and a 20-damage hit makes the screen's rows wobble for a moment. They play even with the CRT look turned off (WebGL only). Tune them under `crt` in the dev panel.
- **Falling damage numbers.** When a hit lands, the damage (like "-15") hops up next to the hurt fighter's head in the winning move's colour, then falls away.

## 0.8.0 (2026-10-11)

- **Sound and music.** 90s arcade chiptune throughout: menu blips, a tick for each of the last 3 seconds of the timer (higher each second) and a slam when it runs out, a lock-in chime when you pick, a whoosh as the icons drop, a different hit for each winning move (a heavy thud for Rock, a slap for Paper, a metal slash for Scissors, each with three variations), a clang for a tie, a big K.O., ROUND and FIGHT! stings, and win and lose jingles.
- **Music.** A menu loop on the home, options and lobby screens (and the result screen after the jingle), and a faster fight loop during matches. Browsers only allow sound after your first tap or key press, so the music starts then.
- **Options: SOUND, MUSIC and EFFECTS.** Turn all sound off, or set the music and effects volumes separately (stick left and right, from OFF to 10). They are remembered.
- Every sound is made from scratch by `tools/audio/make-audio.mjs` (`npm run audio`), so the game owns all of it. Sound list, licences and how to change a sound: `docs/audio/AUDIO.md`.

## 0.7.0 (2026-10-11)

- **The moves are Rock, Paper and Scissors again.** Rock (was Attack) beats Scissors for 15 damage, Scissors (was Throw) beats Paper for 20, and Paper (was Block) beats Rock for 10. The damage and balance are unchanged. Keys 1, 2 and 3 pick Rock, Paper and Scissors, and the cabinet buttons are red, yellow and cyan with new boulder, paper sheet and scissors icons.
- **RPS Rivals branding.** The screen is now square (216 x 216), and the space above it holds a taller marquee with the RPS Rivals logo art inside a bezel. The old "RPS FIGHTER" title on the home screen is gone, and the browser tab says RPS Rivals. Saved settings carry over.
- Online: both players need this version, since the moves have new names.

## 0.6.2 (2026-10-11)

- NEW ROOM can now be cancelled without a keyboard: a CANCEL button on the screen (tap or click it), and any cabinet button or Enter cancels too. Before, only Esc worked, so on a phone there was no way back.
- JOIN ROOM has a BACK button on the screen as well, for the same reason.

## 0.6.1 (2026-10-11)

- JOIN ROOM: typed letters now follow your keyboard layout. On an AZERTY (or any non-QWERTY) keyboard, the M key types M; before, the game read the key's position, so you had to press where M sits on a QWERTY keyboard.
- JOIN ROOM on phones: tapping the code boxes now opens the on-screen keyboard. The boxes are backed by a real (invisible) text field, which also lets you paste a code. The stick still picks letters too.

## 0.6.0 (2026-10-11)

- **Online play, first version.** ONLINE on the home menu opens a lobby: CREATE ROOM shows a four-letter room code and waits; your friend picks JOIN ROOM on their own device and enters the code (stick up and down picks letters, or type them). Then you fight a normal best of three. The match runs on a small server (a Cloudflare Worker with one room per code) using the game's own referee, so neither player can see the other's pick before the reveal, and the countdown can't be stretched by a slow connection.
- Online, you always appear on the left, your opponent shows as RIVAL, and RETRY waits until both players want a rematch ("WAITING FOR RIVAL", "RIVAL WANTS A REMATCH"). If the other player leaves or the connection drops, the screen says so and goes back to the main menu.
- Both players must be on the same version of the game to share a room.
- New publishing setup. The game now publishes itself from this repository: the `production` branch is the live game at https://robinneefs.github.io/rps-rivals/, and `main` is a staging copy at https://robinneefs.github.io/rps-rivals/staging/ for testing new builds first. Each has its own online match server. Going live means merging main into production; version tags and releases are now made at that point. The old address, robinneefs.github.io/RPS-Fighter/, will forward to the new one.
- ONLINE stays greyed out in published builds until the Cloudflare setup is done; in `npm run dev` it connects to a local server (`npm run dev:server`). Setup and deploy notes: `apps/server/README.md`.

## 0.5.4 (2026-10-11)

- The architecture doc is rewritten to match the code as it is now: real file names, types, events, phase timings and tuning values, the scenes and shared services, the lint rules and the tests, with planned parts marked. Its seven diagrams are redrawn with the current values, and two are new: a code map of every folder, and the free ways to host online matches.
- New `docs/architecture/ONLINE-OPTIONS.md`: since GitHub Pages only serves files, online matches need something live in between. It compares free options (a Cloudflare Durable Object, peer-to-peer with PeerJS, Colyseus on a free host) and recommends a Cloudflare Durable Object running the game's own referee. The architecture doc also lists what the code already gets right for online play and what still has to change.
- Nothing changes in the game itself.

## 0.5.3 (2026-10-11)

- The architecture doc now spells out what the pixel-perfect setup does and doesn't do for imported images: everything is forced onto the native pixel grid and never blurs, but a smooth image is not turned into pixel art, so art has to be made at native size in palette colours first. Nothing changes in the game itself.

## 0.5.2 (2026-10-11)

- The README now says up front, in a centered banner with badges, that RPS Rivals is an AI-developed project run by Claude. Nothing changes in the game itself.

## 0.5.1 (2026-10-11)

- The game is now called **RPS Rivals**. The README, project context, architecture doc, design docs and mock-up sources use the new name. The game itself still shows the old title until the asset rebrand.

## 0.5.0 (2026-10-11)

- Dev tuning panel for the game-feel pass. When the game runs with `npm run dev`, a panel in the top-right corner lists every feel value (reveal timing, hit-pause, shake, flash, health bar drain, buttons, menus, banners and more) plus the rules (start health, damage, rounds to win) and phase timings (countdown length and the rest). Feel values change live while you play; rules and timings apply from the next match, and RESTART MATCH starts one at once. Edits are remembered on reload, COPY CHANGES puts a list of what changed on the clipboard to paste back into the code, and RESET ALL goes back to the defaults. The backquote key (`) hides and shows it. The online build does not include the panel. How to use it and how it's set up: `docs/tuning/TUNING-PANEL.md`, linked from the README.
- The fight screen's health bars and round pips now follow the rules of the match being played.

## 0.4.2 (2026-10-11)

- Added four redesign mock-ups (two of game screens, two of fighter character styles) in `docs/mockups/redesign/`, kept for the upcoming redesign. Nothing changes in the game itself.

## 0.4.1 (2026-10-10)

- Tidier project folder: the shared TypeScript settings and the unit test setup moved from the root into a new `config/` folder, and the Prettier settings moved into `package.json`. Nothing changes in the game itself.

## 0.4.0 (2026-10-10)

- The startup intro now shows the Chain Shift studio logo, redrawn as purple pixel art in the style of the game's title (chunky pixels, light top edge, drop shadow, dark outline), replacing the placeholder logo.

## 0.3.0 (2026-10-10)

- FILL HEIGHT is now the default scaling the first time someone opens the game, so the cabinet fills the screen. PIXEL PERFECT is still in Options, and a choice already made is kept.

## 0.2.0 (2026-10-10)

- New OPTIONS item on the home menu, opening an Options screen.
- Scaling setting: PIXEL PERFECT (default, whole-number scaling, sharpest) or FILL HEIGHT (the cabinet fills the screen; pixels can be slightly uneven). Remembered between visits.
- The version number is shown small in the corner of the home screen.
- Fixed the browser smoke test so it runs reliably in CI.

## 0.1.0 (2026-10-10)

First playable version.

- Placeholder logo intro (skippable), home menu with START GAME (VS CPU) and a greyed-out ONLINE slot.
- Best-of-three match against a random CPU: 5 second countdown with a random pick if time runs out, move icons, fighter poses, hit flash, screen shake, health bars, K.O. and round banners.
- Result screen with RETRY and MAIN MENU.
- Keys 1/2/3 or the cabinet buttons to pick; arrows or the joystick in menus. Works in a desktop browser and on a phone.
- Placeholder art drawn in code; no sound yet.
