# Stride

A phone app for recording runs, rides and walks with GPS. It shows your route on a map, live distance, time, pace or speed, climb and elevation, then saves each activity with splits, an elevation profile, a pace chart and your fastest efforts. It installs from the browser, works offline, and can back everything up to your Google account.

Everything it uses is free: OpenStreetMap and OpenTopoMap for maps, Leaflet for drawing them, Open-Meteo for terrain elevation, and Firebase's free plan for sign-in and sync.

## Put it online with GitHub Pages

1. Upload everything in this folder to a repository, keeping the `icons` folder.
2. In the repository, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
3. After a minute it's live at `https://<your-username>.github.io/<repo-name>/` (or under your custom domain).

## Install it on your phone

- **Android (Chrome):** open the address, tap **⋮**, then **Install app**.
- **iPhone (Safari):** open the address, tap **Share**, then **Add to Home Screen**.

The first time you press Start, allow location access.

## Training plan

The **Plan** tab builds a 31-week plan for an Olympic-distance triathlon (1500 m swim, 40 km bike, 10 km run) around you. Enter your race date to start.

- **Your starting point:** choose a level for each sport (for example "Can run 5 km") and the time you have each week (3–5, 5–7 or 7–9 hours). Sessions get longer and the advice changes to match.
- **Your days:** pick the day for each weekly session (two swims, two rides, two runs), or switch one off. The brick run follows the long ride, and tests land on your chosen days.
- **Day to day:** open any session to move it to another day or date, change its length, skip it, mark it done or remove it. Tap **+** on any day to add your own session, once or every week. Or choose **Blank: build my own** to plan everything yourself.
- **Goal times:** set targets for the swim, bike, run and transitions. Race-pace sessions then show your target pace, and a progress card estimates your race-day times from your fastest swim (300 m+), ride (8 km+) and run (3 km+) and compares them with your goals. **Suggest from my training** fills in goals from your fastest sessions.
- **Phases:** Foundation (weeks 1–8), Base (9–18), Build (19–26), Peak (27–29) and Taper (30–31), with a lighter week every fourth week and test weeks at 1, 8, 18 and 26.
- Sessions tick themselves off when you record or log the same sport that day. Logging by hand (**+** on Activities) covers pool swims, turbo rides and treadmill runs.
- **On a computer:** open the same address and sign in with Google; everything syncs, and the week shows in seven columns.

## The Android app

Phones stop giving web pages GPS when the screen turns off, so for recording with your phone in your pocket there's an Android version of the same app. It uses a free background-location service and shows a notification while it records.

- **Install:** on your phone, open <https://github.com/awm11/stride/releases/latest/download/stride.apk>, then open the downloaded file. If Android asks, allow your browser to install apps.
- **Sign in:** tap Sign in with Google. A browser tab opens, you sign in there, then tap **Return to the Stride app**.
- **Updates:** the app tells you on the You tab when a newer build is ready; install it over the old one and your activities stay.
- **How it's built:** `app/` wraps `index.html` with [Capacitor](https://capacitorjs.com). Every push to `main` that touches the app runs `.github/workflows/android.yml`, which builds a signed APK and publishes it as a release. The signing key lives in the `ANDROID_KEYSTORE` repository secret; keep a copy somewhere safe, because updates only install when they're signed with the same key.

## Recording tips

- In the browser version, phones only give GPS while Stride is on screen, so keep it open (the screen stays on by default). The Android app records with the screen off. Any stretch without GPS is drawn dashed.
- Tap the padlock to lock the buttons so a pocket tap can't pause you; press and hold to unlock.
- If the app is closed mid-recording, reopening it carries on where it left off (the closed stretch is skipped).
- Spoken updates give your time and pace at each kilometre or mile.
- Elevation is corrected with terrain data when you have a signal, because phone GPS heights are often tens of metres out.

## Your data

- Every change is saved on the phone straight away.
- Signed in with Google, activities sync to Firestore under `users/<your uid>/stride/…`; only you can read or write them.
- On first sign-in on a phone, its activities are combined with the cloud's: changes not yet synced on the phone win, and anything only the cloud has is kept.
- **You → Save backup** downloads a JSON file with every activity and route; **Restore** reads one back.
- Each activity can be exported as a GPX file for other apps, and GPX files can be imported.

## Updating

Replace the files in the repository and bump `APP_CACHE` in `sw.js`. Phones pick up the new version the next time the app is opened with a signal.
