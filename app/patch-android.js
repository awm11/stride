// Adjusts the Android project that `npx cap add android` generates: name, version, icons, launch screen,
// sign-in link, recording-notification look, and release signing. Safe to run more than once.
const fs = require('fs'), path = require('path');
const build = parseInt(process.argv[2], 10);
if (!(build > 0)) throw new Error('usage: node patch-android.js <build number>');
const A = path.join(__dirname, 'android', 'app'), MAIN = path.join(A, 'src', 'main'), RES = path.join(MAIN, 'res');
const edit = (file, fn) => { const p = path.join(file); const before = fs.readFileSync(p, 'utf8'); const after = fn(before); if (after !== before) fs.writeFileSync(p, after); };
const must = (s, re, what) => { if (!re.test(s)) throw new Error('patch-android: could not find ' + what); return s; };
const VERSION = (fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/const VERSION = '([^']+)'/) || [])[1] || '1.0';

// 1. Sign-in hand-off link: com.alexmoorephysics.stride://signin#id_token=…
edit(path.join(MAIN, 'AndroidManifest.xml'), s => {
  if (s.includes('android:host="signin"')) return s;
  must(s, /android:name="\.MainActivity"[\s\S]*?<\/activity>/, 'MainActivity');
  return s.replace(/(android:name="\.MainActivity"[\s\S]*?)(\s*<\/activity>)/, `$1
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.alexmoorephysics.stride" android:host="signin" />
            </intent-filter>
$2`);
});

// 2. Names and the recording notification (channel name, icon, colour).
edit(path.join(RES, 'values', 'strings.xml'), s => {
  s = s.replace(/<string name="app_name">[^<]*<\/string>/, '<string name="app_name">Stride</string>')
       .replace(/<string name="title_activity_main">[^<]*<\/string>/, '<string name="title_activity_main">Stride</string>');
  if (!s.includes('capacitor_background_geolocation_notification_icon')) s = s.replace('</resources>', `    <string name="capacitor_background_geolocation_notification_channel_name">Recording</string>
    <string name="capacitor_background_geolocation_notification_icon">drawable/ic_stat_stride</string>
    <string name="capacitor_background_geolocation_notification_color">#E8487F</string>
</resources>`);
  return s;
});

// 3. Launch screen: Stride's background and icon instead of Capacitor's.
edit(path.join(RES, 'values', 'styles.xml'), s => {
  if (!s.includes('@drawable/stride_splash')) s = must(s, /@drawable\/splash</, 'splash style').replace('@drawable/splash<', '@drawable/stride_splash<');
  if (!s.includes('windowSplashScreenBackground')) s = s.replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/, `$1
        <item name="windowSplashScreenBackground">#0E1418</item>`);
  return s;
});

// 4. Icons, notification icon and launch drawable.
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive:true }); for (const f of fs.readdirSync(a)){ const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };
copyDir(path.join(__dirname, 'res'), RES);
fs.rmSync(path.join(RES, 'drawable-v24', 'ic_launcher_foreground.xml'), { force:true });   // template's vector would shadow our PNG
fs.rmSync(path.join(RES, 'drawable', 'ic_launcher_background.xml'), { force:true });

// 5. Version and release signing (key file from STRIDE_KEYSTORE_FILE).
edit(path.join(A, 'build.gradle'), s => {
  s = must(s, /versionCode\s*=?\s*\d+/, 'versionCode').replace(/versionCode(\s*=?\s*)\d+/, `versionCode$1${build}`);
  s = must(s, /versionName\s*=?\s*"[^"]*"/, 'versionName').replace(/versionName(\s*=?\s*)"[^"]*"/, `versionName$1"${VERSION} (${build})"`);
  if (!s.includes('signingConfigs')){
    s = must(s, /\n(\s*)buildTypes\s*\{/, 'buildTypes').replace(/\n(\s*)buildTypes\s*\{/, `
$1signingConfigs {
$1    release {
$1        storeFile file(System.getenv('STRIDE_KEYSTORE_FILE') ?: 'missing-keystore.p12')
$1        storePassword 'stride-android'
$1        keyAlias 'stride'
$1        keyPassword 'stride-android'
$1    }
$1}
$1buildTypes {`);
    s = must(s, /buildTypes\s*\{\s*release\s*\{/, 'release build type').replace(/(buildTypes\s*\{\s*release\s*\{)/, `$1
            signingConfig signingConfigs.release`);
  }
  return s;
});
console.log(`android project patched for build ${build} (${VERSION})`);
