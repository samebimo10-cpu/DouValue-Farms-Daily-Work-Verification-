# DouValue Farms — Daily Field Report

The farm manager's daily report app, extended with photo and video capture and an online review portal.
The spec it implements is in [`docs/visual-field-reporting-spec.md`](docs/visual-field-reporting-spec.md).

| Part | Where | Runs on |
| --- | --- | --- |
| Phone app | `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg` | The manager's phone (Chrome), as a home-screen app |
| Upload service | `apps-script/upload/` | Google Apps Script under support@douvaluefarmsltd.com |
| Review portal | `apps-script/portal/` | Google Apps Script, opened by allowed reviewers |

## What changed in the phone app

Everything the manager did before works the same way. The new parts:

- **Walk-round tab** (after Summary): Morning 06:15–07:00, Midday 12:30–13:30 and Evening 17:30–18:30 rounds.
  Zones are listed in walking order: Gate & Perimeter (morning and evening only), GH-01 to GH-05, the active open-field plots,
  Nursery, Water System and Store. For each zone the manager takes a photo (yesterday's photo shows faintly to line up the angle),
  records a 10–15 s video (required morning and evening), and taps OK, Watch or Problem. Problem opens Plant Welfare or Defects
  with the zone and media already attached. Each round records something like "9 of 10 zones, 06:22–06:51".
- **Photo/video strip above every Add button**, with the required and optional shots from the spec.
  For the first 3 days missing media only shows a reminder. After that, required media must be taken before Add works.
  You can change this in ⚙ Settings.
- **Open Plant Welfare issues carry forward.** An issue not marked resolved appears at the top of the next day's Plant Welfare tab,
  with a slot for today's photo of the same plants.
- **In-app camera only.** The gallery can't be used. Every photo and video has the date, time, zone, entry type and GPS position
  drawn onto it. Photos are 1,280 px on the long edge (about 150–250 KB). Videos are 480p (or 360p in Settings), 15 s maximum.
- **Staff list** updated (Onyinyechi, Holi, Prosper, John, Felix, Wisdom, External Contractor, Other; editable in Settings),
  with tap-to-add name buttons on the Activities Staff field. **"Labour" is now "Activity hours"**; the calculation is unchanged.
- **PDF** keeps its pages and adds a walk-round grid, entry photos by section, and a video index.
  Each Extract is kept as a new version (v1, v2…).
- **Uploads run in the background** and never block Save day or Extract PDF. The sync bar under the header shows progress.
  Tap it for details or to retry. A file is only counted as uploaded once the server confirms the same size and SHA-256 checksum,
  and nothing is cleared from the phone before 14 days. Optional: Wi-Fi only for videos.

## Setup

### 1. Upload service (once, as support@douvaluefarmsltd.com)

1. Go to [script.google.com](https://script.google.com) → New project, and name it "DouValue Upload".
2. Paste `apps-script/upload/Code.gs` into `Code.gs`. Under Project Settings, tick "Show appsscript.json"
   and replace it with `apps-script/upload/appsscript.json`.
3. Run `setup` and approve the permissions. The log shows the Reports folder, the index sheet, the **SHEET_ID** and the **farm key**.
4. Deploy → New deployment → Web app. Execute as: **Me**. Who has access: **Anyone**. Copy the web app URL (ending `/exec`).
5. In the index sheet's **Settings** tab, put Gi's Google account email in "Allowed reviewers". Then run `shareWithReviewers`.

If the phone is lost, run `rotateFarmKey` (or edit the key in the Settings tab). The old phone can then no longer upload.

### 2. Portal (once)

1. New Apps Script project, named "DouValue Portal". Add `Code.gs` and an HTML file named `Portal`
   from `apps-script/portal/`, and replace `appsscript.json` as above.
2. Project Settings → Script properties → add `SHEET_ID` with the value from step 1.3.
3. Deploy → Web app. Execute as: **User accessing the web app**. Who has access: **Anyone with a Google account**.
   Send Gi the URL. On first open, Gi approves the permissions; Google shows an "unverified app" notice because this is the farm's own script.

Only accounts listed in "Allowed reviewers" that also have the folder shared with them can see anything.

### 3. Phone app

The camera only works when the app is served over HTTPS. The simplest way is GitHub Pages for this repository
(Settings → Pages → deploy from the default branch, root folder). Then on the phone:

1. Open the Pages URL in Chrome → menu → **Add to Home screen**.
2. Open it once while online, so it keeps working offline.
3. ⚙ Settings → paste the upload link and farm key → **Test upload connection** → Save.
4. Allow camera, microphone and location when asked.

Reports saved in the old copy of the app stay in that copy. The new address starts with an empty history.

## Running costs and limits

- Storage is roughly 1.5–2.7 GB a month at 480p, about 1 GB at 360p. The portal shows usage and warns at 80% of the 15 GB free allowance.
- Apps Script, Drive and Sheets are included with the Google account.
- On most phones the app must be open for uploads to run. Leave it open for a few minutes after the evening round.

## Open decisions (from the spec)

Round times, video quality, the active open-field plots and the staff list can all be changed in ⚙ Settings or in `ROUNDS` in `index.html`.
