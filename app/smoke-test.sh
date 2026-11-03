#!/usr/bin/env bash
# End-to-end check of the built APK on an Android emulator: the app starts without script errors,
# Start launches the background location service, and GPS keeps recording with the screen off.
# Screenshots, screen text and logs go to $SMOKE_DIR. Exits non-zero if a check fails.
set -uo pipefail
PKG=com.alexmoorephysics.stride
D="${SMOKE_DIR:?}"; mkdir -p "$D"
exec > >(tee -a "$D/../smoke.log") 2>&1
FAILED=0
ok(){ echo "SMOKE ok - $*"; }
bad(){ echo "SMOKE FAIL - $*"; FAILED=1; }
shot(){ adb exec-out screencap -p > "$D/$1.png"; }
dump(){ adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml "$D/$1.xml" >/dev/null 2>&1; python3 app/smoke-tap.py "$D/$1.xml" texts > "$D/$1.txt" 2>/dev/null || true; }
tap(){ dump "tap-$2"; local xy; xy=$(python3 app/smoke-tap.py "$D/tap-$2.xml" tap "$1") || { bad "couldn't find \"$1\" on screen"; return 1; }; adb shell input tap $xy; }
LAT=51.50000; LNG=-0.10000
fix(){ adb emu geo fix "$LNG" "$LAT" 30 >/dev/null; }

adb install -r app/stride.apk && ok "installed" || { bad "install failed"; exit 1; }
for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION POST_NOTIFICATIONS; do adb shell pm grant $PKG android.permission.$p 2>/dev/null; done
adb shell pm resolve-activity -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "$PKG://signin" | grep -q MainActivity && ok "sign-in link opens the app" || bad "sign-in link not handled"
adb logcat -c
for i in 1 2 3; do fix; sleep 1; done
adb shell am start -W -n $PKG/.MainActivity >/dev/null
sleep 25
shot 1-launch; dump 1-launch
grep -qx "Stride" "$D/1-launch.txt" && ok "app shows the sign-in screen" || bad "sign-in screen not found"
tap "Not now" gate && sleep 3
shot 2-record; dump 2-record
grep -q "GPS ±" "$D/2-record.txt" && ok "GPS fix shown" || bad "no GPS fix shown"
tap "Start" start && sleep 6
adb shell dumpsys activity services $PKG > "$D/services.txt"
grep -q BackgroundGeolocationService "$D/services.txt" && ok "background location service running" || bad "background location service not running"
adb shell dumpsys notification --noredact > "$D/notification.txt" 2>&1
grep -q "$PKG" "$D/notification.txt" && ok "recording notification shown" || bad "no recording notification"
shot 3-recording
# screen off, then walk ~200 m north
adb shell input keyevent KEYCODE_SLEEP; sleep 3
adb shell dumpsys power | grep -E "mWakefulness=|Display Power" > "$D/power.txt"
for i in $(seq 1 30); do LAT=$(python3 -c "print(f'{$LAT + 0.00006:.6f}')"); fix; sleep 2; done
adb shell input keyevent KEYCODE_WAKEUP; sleep 2; adb shell wm dismiss-keyguard; sleep 4
shot 4-after-screen-off; dump 4-after
DIST=$(grep -E '^[0-9]+\.[0-9]{2}$' "$D/4-after.txt" | head -1)
echo "distance on screen after screen-off walk: ${DIST:-none}"
python3 -c "import sys; sys.exit(0 if float('${DIST:-0}') >= 0.12 else 1)" && ok "recorded ${DIST} km with the screen off" || bad "distance after screen-off walk was ${DIST:-unknown} km (expected about 0.2)"
grep -q "GPS was lost" "$D/4-after.txt" && bad "app reported a GPS gap" || ok "no GPS gap"
# a bad sign-in link must not crash the app
adb shell am start -W -a android.intent.action.VIEW -d "$PKG://signin#id_token=not-a-real-token" $PKG >/dev/null; sleep 6
adb shell pidof $PKG >/dev/null && ok "app still running after a bad sign-in link" || bad "app died after sign-in link"
shot 5-after-link
adb logcat -d > "$D/logcat.txt"
grep -E "Capacitor/Console|chromium" "$D/logcat.txt" > "$D/console.txt" || true
if grep -E "Uncaught|TypeError|ReferenceError|SyntaxError" "$D/console.txt" | grep -v "favicon" > "$D/js-errors.txt"; then bad "script errors (see js-errors.txt)"; else ok "no script errors"; fi
grep -E "FATAL EXCEPTION" "$D/logcat.txt" > "$D/crashes.txt" && bad "app crashed (see crashes.txt)" || ok "no crashes"
[ "$FAILED" = 0 ] && echo "SMOKE PASSED" || echo "SMOKE FAILED"
exit $FAILED
