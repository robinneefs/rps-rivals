# Taiko and Anchor menu breathing

Original 1122×1402 transparent portraits are the rest frames (`taiko.png`, `anchor.png`). Inhale and exhale siblings were edited using built-in image_gen with the prompts saved alongside them, matching Riot's tiny torso breathing approach.

`native/` contains cleaned binary-alpha 192×240 rest/inhale/exhale PNGs and Phaser-compatible 576×240 horizontal atlases. Full-frame registration and nearest-neighbor sampling match Riot's existing preparation. No trimming or automatic recentering.

`breathing-manifest.json` copies Riot's loop: rest 2000ms, inhale 240ms, rest 160ms, exhale 260ms, rest 180ms. `preview.html` shows both animated at 2× and includes pause/play. Open locally or serve this directory. Taiko and Anchor's atlases are also installed in `apps/game/public/assets/menus/action/`; Home randomly chooses one of Riot, Taiko, and Anchor each time it is created, then uses the shared runtime manifest loop. Reduced motion holds the rest frame for all three.

Rebuild with `node tools/art/prepare-portrait-breathing.mjs` (requires sharp or RPS_SHARP_PATH). Generation prompts and original masters are preserved. All source dimensions and native binary alpha are checked by the preparation script.
