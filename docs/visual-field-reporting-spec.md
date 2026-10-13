# DouValue Visual Field Reporting — Spec

Oct 13, 2026 · @Gi

## Purpose and principles

The Daily Field Report app gains photo and video capture so the reviewer sees the farm's state and the day's work directly, not only the farm manager's written account. The current app stays as it is; media is added inside the forms the manager already uses.

- **One user:** the farm manager, on one phone. No new logins or accounts.
- **Same flow:** same tabs, same fields, same Save day and Extract PDF buttons.
- **One new tab:** Walk-round, for the farm-state photos and videos taken at set times.
- **Media sits on the entry it proves:** a harvest photo lives on its harvest entry, a spray label on its input record.
- **Works offline:** capture and storage need no internet; only sending the day does.

## What stays the same, and the only changes

Everything the manager does today keeps working the same way, so onboarding is a single walk-through of the new parts.

| Area | Today | After |
| --- | --- | --- |
| Tabs | Summary, Harvest, Activities, Plant Welfare, Inputs Applied, Losses, Requisitions, Defects | Same eight, plus Walk-round after Summary |
| Entry forms | Fields, dropdowns, order | Unchanged; a photo/video strip added above the Add button |
| Header totals | Harvest kg, value, labour, flags | Unchanged; "Labour" relabelled "Activity hours" (see Staff and labour) |
| Calculations | Harvest value, duration, PHI safe-from date | Unchanged |
| Save day, date picker | Saves per day on the phone | Unchanged; media saved with the day |
| Extract PDF | Summary + section tables | Same pages, plus photo pages at the end |
| Staff list | Onyinyechi, Godstime, Tossy, Elijah, External Contractor, Other | Updated to the current team (see Staff and labour) |

## Walk-round tab: the farm's state, three times a day

The manager walks the farm three times a day and records each zone in a fixed-angle photo and a short video. This shows the farm's condition independently of any task entry. Times follow the farm's existing watering schedule.

| Round | Window | Photo per zone | Video per zone |
| --- | --- | --- | --- |
| Morning | 06:15–07:00 (before morning watering) | Required | Required, 10–15 s |
| Midday | 12:30–13:30 (peak heat) | Required | Optional |
| Evening | 17:30–18:30 (after evening watering) | Required | Required, 10–15 s |

**Zones on each round:** GH-01 to GH-05, active open-field plots (OF-03 currently), Nursery, Water System, Store. The gate and perimeter are added to the morning and evening rounds.

**How a round works on the phone:**

1. Tap Start round. The app lists the zones in walking order.
2. At each zone, stand at its marked photo post and take the photo. The previous day's photo shows faintly on screen to help line up the same angle.
3. Record the video: a slow pan along the rows.
4. Tap one word for the zone: OK, Watch or Problem.
5. Problem opens the Plant Welfare or Defects form with the zone and the media already attached.
6. The round records its start time, end time and zones covered, for example "9 of 10 zones, 06:22–06:51".

Because each zone is shot from the same post every day, the reviewer can swipe through a zone's days and see whether it is improving or declining.

## Media on existing entries

Each entry form gets a photo/video strip above its Add button; required media must be captured before the entry can be added. The forms themselves do not change.

| Tab | Required | Optional |
| --- | --- | --- |
| Harvest | Crates on the scale with the reading visible | Graded produce |
| Activities | After photo; before photo too for trellising, pruning, weeding, transplanting | 10 s clip of the work |
| Plant Welfare | Close-up of the symptom, wide shot of the affected area, 10–15 s video | — |
| Inputs Applied | Product label, application in the zone | Measuring cup at the mixing rate |
| Losses | The lost produce, on the scale where it can be weighed | — |
| Defects | The defect | Short video |
| Requisitions | — | The item, or current stock level |
| Summary | None (walk-rounds cover the day) | — |

**Open Plant Welfare issues carry forward with a photo slot.** An issue not marked resolved appears at the top of the next day's Plant Welfare tab, asking for today's photo of the same plants. The reviewer then sees the problem's progress day by day, for example the GH-01 wilting on 13 October.

## Capture rules

All media is taken with the app's own camera and stamped, so every picture shows when and where it was taken.

- **Camera inside the app:** photos and videos are captured in the app; picking from the phone gallery is off.
- **Stamp on every photo and video:** date, time, zone, entry type and GPS position where the phone has a fix, drawn onto the image.
- **Photo size:** long edge 1,280 px, compressed to about 150–250 KB.
- **Video:** 480p, 15 s maximum, about 2–4 MB per clip.
- **Storage:** kept on the phone with the day's report; cleared after 14 days once the day has been sent.
- **Phone:** needs at least 2 GB free storage and a working GPS.

| Item per day | Count | Approx. size |
| --- | --- | --- |
| Walk-round photos (10 zones × 3 rounds) | 30 | 6 MB |
| Walk-round videos (10 zones × 2 rounds) | 20 | 40–80 MB |
| Entry photos (typical day) | 20 | 4 MB |
| **Total** |  | **50–90 MB** |

At 360p video the daily total falls to about 30–40 MB, at some loss of detail.

## Staff and labour

Workers move between several jobs in a day, so the same person appearing in overlapping activities within working hours is normal and is not flagged.

- **Staff list updated** to the current team: Onyinyechi, Holi, Prosper, John, Felix, Wisdom, plus External Contractor and Other. Godstime, Tossy and Elijah stay only if still on the team.
- **Tap-to-add names:** the Activities Staff field keeps its text box, with name buttons above it so names are tapped instead of typed. This keeps spelling consistent across days.
- **"Labour" becomes "Activity hours":** the app adds each activity's duration × number of staff, so a person on two overlapping jobs counts twice. The 23.6 hrs on 13 October is activity time, not hours paid. The calculation stays; only the label changes so it isn't read as payroll.

## Output and delivery

The PDF keeps its current pages and gains photo pages; videos travel alongside it as separate files, because a PDF cannot play video.

**PDF additions, after the existing tables:**

1. Walk-round grid: one row per zone, one column per round, thumbnails with time stamps, plus the OK / Watch / Problem word. Missed zones show as empty cells.
2. Entry photos grouped by section, each labelled with its entry, for example "Inputs 4 — Velum Prime, GH-01".
3. Video index: file name, zone, round and time for each clip.

**Delivery options:**

|  | A. WhatsApp bundle | B. Private online review page |
| --- | --- | --- |
| How | Extract sends the PDF plus all videos through the phone's share sheet | App uploads the day; reviewer opens one link and browses zone by zone, photos and videos inline |
| File names | DVF\_2026-10-13\_GH-01\_AM.mp4 | Not needed; organised by day and zone |
| Onboarding | None; uses WhatsApp as today | One upload step each evening |
| Farm internet | Enough to send 50–90 MB | Enough to upload 50–90 MB |
| Review | Scroll the chat | Swipe a zone's days side by side |

Chosen: B, the online review page, with the PDF still generated on the phone as today. The sections below specify it.

## Online review portal: how it works

The phone app uploads each day's report, PDF, photos and videos to a Google Drive folder through a Google Apps Script service, and a portal page reads that folder so the reviewer sees every report and file from one link.

1. **Phone app (the current app, extended):** captures entries and media, saves them on the phone, generates the PDF, and queues everything for upload.
2. **Upload service (Google Apps Script):** receives one file at a time, checks the farm's access key, and files it in Drive.
3. **Google Drive:** stores the files in one folder per day: DouValue Reports / 2026 / 2026-10 / 2026-10-13, with walkround and entries subfolders.
4. **Google Sheet index:** one row per file, recording date, zone, round, entry, type, capture time, GPS, upload time and size. The portal reads this to sort and filter quickly.
5. **Portal (review page):** a private web page that lists days, opens a day's report, shows the media, and offers downloads.

The report itself is uploaded as data each time the day is saved, so the portal shows the day as it is being filled, before any PDF exists.

## Reporting never waits for the internet

Save day and Extract PDF work exactly as today with or without internet; uploading runs separately in the background and never blocks the manager.

- **Phone first:** every entry, photo and video is saved on the phone the moment it is captured.
- **PDF stays local:** Extract PDF builds the PDF on the phone as now and can still be shared on WhatsApp if needed. The PDF is also added to the upload queue.
- **Upload queue:** files upload one at a time whenever there is a connection, retrying automatically after a failure.
- **Sync bar:** a thin bar under the header shows "38 of 52 uploaded", "Waiting for internet" or "All uploaded". Tapping it lists anything stuck.
- **Wi-Fi only switch:** off by default; when on, videos wait for Wi-Fi while photos and the report still go on mobile data.
- **Nothing lost:** a file is removed from the phone only after the server confirms it arrived complete, and never before 14 days.
- **Re-extracted PDFs:** a newer PDF for the same day is kept as version 2 alongside version 1, each with its time.
- **Long outages:** if uploads are stuck for 2 days or the phone drops below 1 GB free, the app shows a warning on opening.

The app must be open for uploads to run on most phones; the manager leaves it open for a few minutes after the evening round, or uploads continue next time it is opened.

## What the portal shows

The portal has three views: a list of days, one day in full, and one zone across days. It works on a phone or laptop.

**Days list (opening screen)**

- One row per day, newest first, with harvest kg, activity hours, open issues and day status.
- Upload state per day: "Complete", "Uploading 38/52" or "PDF not yet extracted".
- A red mark on days with a Problem zone or a serious Plant Welfare issue.
- Filters by month, zone and "days with problems".

**Day view**

1. Header: date, prepared by, weather, the four totals, and a button to open the PDF.
2. Walk-round grid: zones down the side, Morning / Midday / Evening across, a thumbnail and OK / Watch / Problem in each cell. Tapping a cell opens the photo full screen and plays the video.
3. Each report section (Harvest, Activities, Plant Welfare, Inputs, Losses, Requisitions, Defects) with its entries and their photos and videos beside them.
4. Every photo and video shows its stamp: time, zone and GPS.

**Zone timeline**

- Pick a zone, for example GH-01, and swipe through its fixed-angle photos day by day, or compare two dates side by side.
- Open Plant Welfare issues in that zone appear with their daily follow-up photos in order.

## Downloading files

Every file in the portal can be downloaded in its original quality, one at a time or a whole day at once.

| What | How | Notes |
| --- | --- | --- |
| One photo, video or PDF | Download button on the file | Original file, stamp included |
| A day's PDF | Download PDF in the day header | All versions listed if re-extracted |
| A whole day | Open day folder in Drive, then Download | Drive packs the folder into one zip |
| Selected files | Tick files in a day, then Download selected | Saved one by one |
| A date range | Export in the days list: pick start and end | Downloads each day's PDF plus a spreadsheet of all entries |
| The entry data | Open index sheet | The Google Sheet, downloadable as Excel or CSV |

Whole-day downloads go through Drive because a full day of video (50–90 MB) is too large for the upload service to zip reliably.

## Access, storage and data costs

The portal is private to named Google accounts, files live in a farm-owned Google Drive, and storage, not software, is the main running cost.

- **Portal access:** only Google accounts on an allowed list can open it, Gi's only; more accounts can be added later if needed.
- **Upload key:** the phone app holds a farm key entered once at setup. If the phone is lost, the key is changed in the settings sheet and the old phone can no longer upload.
- **Owner account:** Drive, the index sheet and the Apps Script run under support@douvaluefarmsltd.com, the farm's own account, so the records stay with the company.
- **Storage:** 1.5–2.7 GB a month at 480p video, about 1 GB at 360p. The free 15 GB fills in roughly 6–9 months; the portal shows storage used and warns at 80% full, when older days can be downloaded and archived off Drive to free space.
- **Farm data use:** the same 1.5–2.7 GB a month in uploads; Wi-Fi-only mode moves the video part onto Wi-Fi.
- **Reviewer data use:** the portal loads thumbnails first; full photos and videos load only when tapped.
- **Software cost:** none beyond storage; Google Apps Script, Drive and Sheets are included with the Google account.

## Onboarding, rollout and open decisions

The manager needs one 30-minute walk-through of the Walk-round tab and the photo strip; everything else is already familiar.

1. **Set up photo posts:** a numbered stake or painted mark at each zone's fixed photo spot.
2. **Practice days (3 days):** missing media shows a reminder but does not block adding an entry.
3. **Live:** required media must be captured before an entry can be added.
4. **Review after 2 weeks:** adjust round times, zones and video length from real use.

**Open decisions:**

- [ ] Delivery: online review page (B) chosen on 13 October
- [ ] Confirm walk-round times: 06:15, 12:30, 17:30
- [ ] Video quality: 480p (clearer) or 360p (half the data)
- [ ] Which staff are current: Godstime, Tossy, Elijah
- [ ] Which open-field plots are active besides OF-03
- [ ] Manager's phone model and free storage

* [ ] Owner account: support@douvaluefarmsltd.com (decided 13 October)
* [ ] Portal access: Gi only (decided 13 October)
* [ ] Storage: free allowance, no paid plan (decided 13 October)
