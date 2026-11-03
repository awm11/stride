# Stride for Android

This folder turns `../index.html` into an Android app with [Capacitor](https://capacitorjs.com), so recording carries on with the screen off. Nothing here is edited by hand on the phone; GitHub builds it.

- `build-android.sh` installs the packages, prepares `www/` (`prepare-www.js`), generates the Android project, adjusts it (`patch-android.js`) and builds a signed `stride.apk`.
- `res/` holds the launcher icons, the recording-notification icon and the launch screen.
- `smoke-test.sh` installs the APK on an emulator, records a short walk with the screen off and checks for errors. A release is only published when this passes and the APK is signed with Stride's key (the `ANDROID_KEYSTORE` repository secret).

Download the latest build: <https://github.com/awm11/stride/releases/latest/download/stride.apk>
