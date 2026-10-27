# Chain Shift native studio ident

Master: `docs/brand/logo-chain-shift-white.png`, original1088x570 transparent brand image; visible shape cropped to948x408. Master and full-size purple variant remain unchanged. `legacy-logo.png` preserves the previous production export.

Rebuild with `python tools/art/prepare-studio-logo.py` (Pillow). This exports the native logo and sheen atlas here and into `apps/game/public/assets/`.

- 168x75 native canvas, including a164px-wide silhouette and1px purple bevel/shadow. Binary logo alpha; no doubled pixel blocks or runtime scaling.
- Centered at(12,82) on192x240, giving12px horizontal breathing room.
- 24 native-grid sheen frames, clipped to the original logo silhouette. Levels of translucent cream-white travel diagonally across its surface.
- Intro:180ms initial pause,650ms pop/fade,1400ms hold (sheen starts160ms into hold and lasts900ms),650ms reversed pop/fade. Reuses the menu entrance curve at a slower speed. Existing transition follows.
- Any button/tap skips. Reduced motion retains fades with no movement/sheen. Hidden pages pause the intro. No new sound or music.

Capture actual game frames with `node tools/art/capture-studio-intro.mjs` while the production preview is running on5181. `studio-intro.gif` is a100ms/frame capture of the actual CRT monitor, rather than a source-art animation.

The legacy `tools/make-logo.py` generates the superseded chunky export; use the preparation script above for the current ident.
