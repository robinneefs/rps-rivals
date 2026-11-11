# RPS Rivals for Android

The Android app is the same web game (`apps/game`) wrapped in a native app with [Capacitor](https://capacitorjs.com).
The native Android Studio project is in `android/`. App id: `com.chainshift.rpsrivals` (it can never change once the app is on Google Play).

## Run it on your phone

1. Once: install [Android Studio](https://developer.android.com/studio), and on the phone turn on Developer options and USB debugging.
2. From the repository root: `npm install`, then `npm run android`. This builds the game, copies it into the Android project and opens Android Studio.
3. In Android Studio, wait for Gradle to finish syncing (the first time takes a while), plug in the phone, pick it at the top and press Run (the green triangle).

After changing the game, run `npm run android:build` and press Run again.

The app plays online against the live server (`apps/game/src/config/online.ts`). It is locked to portrait, hides the phone's status and navigation bars, buzzes with the screen shake (Options > VIBRATION) and the phone's back button backs out of menus and leaves the app from the home screen.

## Version

The app's version is the game's (`apps/game/package.json`). Google Play's version code is made from it: 1.1.0 becomes 10100. Every upload needs a higher version, so bump it as usual.

## Make a release for Google Play

1. Once: make your upload key in Android Studio: Build > Generate Signed App Bundle or APK > Android App Bundle > Create new. Save the `.jks` file **outside** the repository (for example next to it, as `rps-rivals-upload.jks`), with the alias `upload`. Back it up and keep the passwords safe: losing it means asking Google to reset it.
2. Once: copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the path and passwords. It is never committed.
3. `npm run android:build`, then in Android Studio: Build > Generate Signed App Bundle or APK > Android App Bundle > release. The `.aab` file lands in `android/app/release/`.
4. Upload the `.aab` in Play Console. Let Google Play manage the app signing key (Play App Signing).

## Store listing art

Everything for the Play Store page (icon, feature graphic, screenshots, descriptions, form answers) is in `play-store/` at the repository root. The icon and feature graphic are made from the game's art, like the launcher icons and splash screens, by `python tools/art/prepare-brand-icons.py --install`.
