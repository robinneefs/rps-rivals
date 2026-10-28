# Installed alternate palettes · in-game review

Open `preview.html` while the game dev server is running at http://127.0.0.1:5196. Choose Taiko/Riot/Anchor, then alternate victory, original victory, or combat. The embedded view is the actual game, not a composited mockup. Each view also has a direct link.

All three reviewed combat atlases are installed as `apps/game/public/assets/{id}-alternate.png`, retaining each original atlas's frame registration. BootScene loads these under the existing mirror-match alternate keys, so the old color-guessing generator reuses the installed sheets instead of recoloring them.

The three generated native portraits are installed in `apps/game/public/assets/menus/action/{id}-alternate.png`, each with an atlas containing only the `rest` frame at 192 × 240. Victory and mirror-match versus portraits use those preloaded assets. Originals, original atlas breathing frames, character-selection imagery and Home portraits remain unchanged. The Home breathing shader still uses its existing resting image.

`check-installed-alternates.mjs` checks real mirror combat texture keys and captures original/alternate victories for all characters. The review shortcut now waits for the versus sequence to finish. Screenshots and `checks.json` record browser verification with no page/resource errors. Palette-focused unit/asset tests: 25 passed. Production build and focused lint passed. The existing large-bundle build advisory remains.

To restart the local preview: run `node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5196 --strictPort` from `apps/game`. Review shortcuts are development-only. No deployment or release was performed.
