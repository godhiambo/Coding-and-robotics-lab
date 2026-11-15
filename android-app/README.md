# Robotics Lab: Android app

The Android wrapper (Capacitor) for the web app in `../site`. It opens full screen, has its own icon, works offline after
first load, and can use the camera, microphone and tilt sensors. There is one source of truth: the web app. This folder only
packages it.

## Build the APK
1. Install Android Studio (developer.android.com/studio) and let it install the Android SDK.
2. From the repo root, build the web app: `python3 build.py`
3. In this folder: `npm install`, then `npm run sync` (copies `../site` into the Android project).
4. `npm run open` opens the project in Android Studio. Wait for Gradle sync, then plug in a phone and press Run,
   or use **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   Result: `android/app/build/outputs/apk/debug/app-debug.apk`.
   Command line (needs the Android SDK and Java 17+): `npm run apk`.

## Publish on Google Play
Build > Generate Signed Bundle / APK > Android App Bundle. Create a keystore and keep it safe, and never commit it
(`*.keystore` and `*.jks` are git-ignored). Package name: `org.milestoneminds.roboticslab`. Bump `versionCode` and
`versionName` in `android/app/build.gradle` for every update.

## Update the app
Change the web app in `../src`, run `python3 build.py`, then `npm run sync` here and rebuild.

## What works in the app
Missions, builder, circuits, blocks, Python (full Python needs internet the first time), teacher tools, hand driving
(stick, tilt, controller), camera light sensor, echo sonar, and saving/sharing files through the Android share sheet.

## What does not work in the app
- Web Serial / Web Bluetooth link to a real Arduino (Android WebView has no USB or Bluetooth web access). Use the website in
  desktop Chrome for that.
- AI "Ask Mila to code it" works only inside claude.ai; the app uses the keyword fallback.
