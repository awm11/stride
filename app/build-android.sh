#!/usr/bin/env bash
# Builds app/stride.apk from the web app. Usage: app/build-android.sh <build number>
# Needs Node 22+, JDK 21, the Android SDK, and STRIDE_KEYSTORE_FILE pointing at the signing key.
set -euo pipefail
BUILD="${1:?build number}"
cd "$(dirname "$0")"
echo "== npm install"; npm install --no-audit --no-fund --loglevel=error
echo "== versions"; npm ls --depth=0 || true
echo "== web files"; node prepare-www.js "$BUILD"
if [ ! -d android ]; then echo "== cap add android"; npx cap add android; fi
echo "== patch"; node patch-android.js "$BUILD"
echo "== cap sync"; npx cap sync android
echo "== gradle"; cd android && chmod +x gradlew && ./gradlew --no-daemon --stacktrace --warning-mode=summary assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../stride.apk
echo "== done: $(ls -l ../stride.apk)"
