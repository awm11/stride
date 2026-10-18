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

## Recording tips

- Phones only give web apps GPS while they're on screen, so keep Stride open while you record. The screen stays on by default (You → Keep screen on).
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
