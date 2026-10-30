# Google Play kit

Everything needed for the RPS Rivals store page on Google Play, in one place.

| File | What it's for | Where it goes in Play Console |
|---|---|---|
| `listing.md` | App name, short and full description, release notes, category | Store presence > Main store listing, and the release notes of each release |
| `forms.md` | Answers for every "Set up your app" form (content rating, data safety, ads, target audience...) | Policy > App content |
| `icon-512.png` | App icon, 512x512 | Main store listing > App icon |
| `feature-graphic.png` | Banner, 1024x500 | Main store listing > Feature graphic |
| `screenshots/` | Six phone screenshots, 1080x1920, in the order to upload them. **Still from the 1.x game**: retake them before submitting (the Android release is parked; `sources/play-store/capture.mjs` needs the same update as `sources/screenshots/capture.mjs`) | Main store listing > Phone screenshots |

The privacy policy is a page of the game itself (`apps/game/public/privacy.html`), live at
`https://robinneefs.github.io/rps-rivals/privacy.html`.

## Order of work

1. Create the app (answers in `forms.md` > Create app).
2. Fill in every item under Policy > App content with `forms.md`.
3. Fill in the Main store listing with `listing.md`, the icon, the feature graphic and the screenshots.
4. Testing > Closed testing: create a track, add at least 12 testers (an email list), upload the `.aab` (see `apps/android/README.md`), paste the release notes from `listing.md`, and roll out.
5. After 14 days with 12 testers opted in, apply for production access from the dashboard.

## Remaking the art

- Icon and feature graphic: `node tools/make-icons.mjs` (also makes the app's launcher icons and splash screens).
- Screenshots: `node sources/play-store/capture.mjs`. It plays a seeded match against the CPU the way the Android app shows it and saves the shots here.
