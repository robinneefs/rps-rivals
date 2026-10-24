# Before the v2 release: make the web app installable to the Android home screen (no app store)

> Note saved 2026-10-24 to look at before releasing the big new version of the game.

Goal: the user wants a home-screen icon on Android that opens this web app full-screen without
browser UI. It must NOT be a native Android app or a Play Store install. Do this by making the
site a basic Progressive Web App (PWA).

## What to do
1. Add `manifest.webmanifest` at the site root (served at `/manifest.webmanifest`):
   - `name`, `short_name`
   - `start_url`: `"/"` (or the app's entry route)
   - `display`: `"standalone"` (hides the address bar, keeps the status bar).
     Use `"fullscreen"` only if the user wants the status bar hidden too, e.g. for games.
   - `background_color`, `theme_color`: match the app's main colours
   - `icons`: PNGs at 192x192 and 512x512 (add a `"purpose": "maskable"` variant if possible)
2. In the HTML `<head>` of every page (or the shared layout), add:
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="theme-color" content="...">`
3. Create the icon files, or ask the user for artwork if none exists.
4. A service worker is optional. Add a minimal one only if the user wants offline support or
   Chrome's automatic install prompt. The standalone icon works without one.

## Constraints
- The site must be served over HTTPS for Chrome to treat it as installable (`localhost` is the
  only exception). For phone testing, use free static hosting (GitHub Pages, Netlify,
  Cloudflare Pages) or a tunnel (cloudflared, ngrok). Ask the user which they prefer if the
  app isn't hosted yet.
- Don't add a native wrapper (TWA, Capacitor, Cordova, APK). The user ruled that out.

## How the user installs it (include in your summary to them)
Open the site in Chrome on Android → ⋮ menu → "Add to Home screen" / "Install app".
Chrome may create a lightweight WebAPK behind the scenes. It is still just the website and
nothing comes from the Play Store.

## Done when
- Chrome DevTools → Application → Manifest shows no errors and lists the icons.
- After "Add to Home screen" on Android, the icon launches the app without an address bar.

## Things to check in this repo first (added when the note was saved)
- The game is not at a domain root: live is `https://robinneefs.github.io/rps-rivals/` and staging
  is `.../rps-rivals/staging/`. Root paths like `/manifest.webmanifest` and `start_url: "/"` would
  point at `robinneefs.github.io` itself, so use relative paths (`manifest.webmanifest`, `./`) or
  Vite's base, and give staging and live their own `id`/`scope` so both can be installed.
- The manifest and icons would go in `apps/game/public/`, the link and theme-color in
  `apps/game/index.html`. `tools/make-icons.mjs` already makes the favicon and apple-touch-icon
  (the Rock button) and the Android launcher icons, so the 192/512/maskable PNGs can come from there.
- The game already hides browser bars itself via the cabinet fit (`visualViewport`, safe-area
  insets); `display: "fullscreen"` fits a game, but confirm with the user.
- "No native wrapper" applies to this home-screen route. The Capacitor app in `apps/android`
  (Play Store track) already exists; this note doesn't change it.
