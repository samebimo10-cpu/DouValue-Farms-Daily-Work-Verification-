/**
 * DouValue review portal.
 *
 * A private page that lists the days, opens a day's report with its photos and videos,
 * shows one zone across days, and offers downloads.
 *
 * Deploy as a web app:  Execute as: User accessing the web app  ·  Who has access: Anyone with a Google account.
 * Two locks keep it private: the viewer's Google account must be in "Allowed reviewers" on the Settings tab,
 * and the Reports folder and index sheet must be shared with them (run shareWithReviewers() in the upload project).
 *
 * Script property needed: SHEET_ID (logged by setup() in the upload project).
 */
const INDEX_HEAD = ['id','date','zone','round','section','entryId','role','type','name','label','capturedAt','lat','lng','accuracy',
  'duration','size','sha256','mime','version','fileId','thumbId','uploadedAt'];
const DAYS_HEAD = ['date','updatedAt','preparedBy','weather','status','harvestKg','harvestValue','activityHours','flags','openIssues',
  'problem','zonesFlagged','expectedIds','reportFileId','folderId'];
const MAX_ZIP_BYTES = 45 * 1024 * 1024;

function doGet() {
  try { ctx_(); }
  catch (e) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px;line-height:1.5">' +
      String(e.message).replace(/</g, '&lt;') + '</p>').setTitle('DouValue Field Reports');
  }
  return HtmlService.createTemplateFromFile('Portal').evaluate()
    .setTitle('DouValue Field Reports')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- access ---------- */
function ctx_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Portal not set up: add the SHEET_ID script property.');
  const me = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  let ss;
  try { ss = SpreadsheetApp.openById(id); }
  catch (e) { throw new Error('This Google account (' + (me || 'unknown') + ') does not have access to the DouValue reports.'); }
  const allowed = String(settings_(ss)['Allowed reviewers'] || '').toLowerCase().split(/[\s,;]+/).filter(String);
  if (!me || allowed.indexOf(me) < 0) throw new Error('This Google account (' + (me || 'unknown') + ') is not on the allowed reviewer list.');
  return { ss: ss, me: me };
}

/* ---------- views ---------- */
function apiDays() {
  const c = ctx_();
  const days = table_(c.ss.getSheetByName('Days'), DAYS_HEAD);
  const byDate = {};
  table_(c.ss.getSheetByName('Index'), INDEX_HEAD).forEach(function (r) {
    const b = byDate[r.date] || (byDate[r.date] = { ids: {}, pdf: 0 });
    b.ids[r.id] = 1; if (r.type === 'pdf') b.pdf++;
  });
  const out = days.map(function (d) {
    const exp = String(d.expectedIds || '').split(',').filter(String);
    const got = byDate[d.date] || { ids: {}, pdf: 0 };
    return {
      date: d.date, preparedBy: d.preparedBy, weather: d.weather, status: d.status,
      harvestKg: num_(d.harvestKg), harvestValue: num_(d.harvestValue), activityHours: num_(d.activityHours),
      flags: num_(d.flags), openIssues: num_(d.openIssues), problem: String(d.problem) === 'true',
      zonesFlagged: String(d.zonesFlagged || ''), expected: exp.length,
      uploaded: exp.filter(function (id) { return got.ids[id]; }).length, hasPdf: got.pdf > 0, updatedAt: d.updatedAt
    };
  }).sort(function (a, b) { return b.date < a.date ? -1 : 1; });
  return { days: out, storage: storage_(c.ss), sheetUrl: c.ss.getUrl(), me: c.me };
}

function apiDay(date) {
  const c = ctx_();
  checkDate_(date);
  const d = table_(c.ss.getSheetByName('Days'), DAYS_HEAD).filter(function (r) { return r.date === date; })[0];
  if (!d) throw new Error('No report uploaded for ' + date);
  let report = null;
  try { report = JSON.parse(DriveApp.getFileById(d.reportFileId).getBlob().getDataAsString()); } catch (e) {}
  const files = {};
  table_(c.ss.getSheetByName('Index'), INDEX_HEAD).forEach(function (r) { if (r.date === date) files[r.id] = file_(r); });
  return { date: date, report: report, files: files,
    folderUrl: d.folderId ? 'https://drive.google.com/drive/folders/' + d.folderId : '' };
}

/** One zone across days: its walk-round photos and videos, and Plant Welfare issues there with their follow-ups. */
function apiZone(zone) {
  const c = ctx_();
  const idx = table_(c.ss.getSheetByName('Index'), INDEX_HEAD);
  const zones = {};
  idx.forEach(function (r) { if (r.section === 'walkround' && r.zone) zones[r.zone] = 1; });
  const walk = idx.filter(function (r) { return r.section === 'walkround' && r.zone === zone; }).map(file_)
    .sort(function (a, b) { return (a.date + a.round) < (b.date + b.round) ? -1 : 1; });
  const issues = {};
  idx.forEach(function (r) {
    if ((r.section !== 'welfare' && r.section !== 'carried') || !r.entryId) return;
    if (String(r.zone).split(/\s*,\s*/).indexOf(zone) < 0) return;
    (issues[r.entryId] = issues[r.entryId] || []).push(file_(r));
  });
  const list = Object.keys(issues).map(function (k) {
    const items = issues[k].sort(function (a, b) { return a.capturedAt < b.capturedAt ? -1 : 1; });
    return { issueId: k, label: (items.filter(function (i) { return i.section === 'welfare'; })[0] || items[0]).label, items: items };
  });
  return { zone: zone, zones: Object.keys(zones).sort(), walk: walk, issues: list };
}

/* ---------- media ---------- */
function apiThumbs(ids) {
  ctx_();
  const out = {};
  (ids || []).slice(0, 40).forEach(function (id) {
    try { out[id] = 'data:image/jpeg;base64,' + Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()); }
    catch (e) { out[id] = ''; }
  });
  return out;
}

function apiPhoto(fileId) {
  const c = ctx_();
  if (!indexed_(c.ss, fileId)) throw new Error('Unknown file');
  const b = DriveApp.getFileById(fileId).getBlob();
  return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
}

/* ---------- downloads ---------- */
/** Ticked files in a day, zipped into the reviewer's own Drive. */
function apiZipSelected(fileIds, label) {
  const c = ctx_();
  const known = {};
  table_(c.ss.getSheetByName('Index'), INDEX_HEAD).forEach(function (r) { known[r.fileId] = r; });
  let total = 0;
  const blobs = (fileIds || []).filter(function (id) { return known[id]; }).map(function (id) {
    total += num_(known[id].size);
    return DriveApp.getFileById(id).getBlob().setName(known[id].name);
  });
  if (!blobs.length) throw new Error('Nothing selected');
  if (total > MAX_ZIP_BYTES) throw new Error('Too large to zip here (' + Math.round(total / 1048576) + ' MB). Use "Open day folder in Drive" and download the folder instead.');
  return saveExport_(Utilities.zip(blobs, 'DVF_' + safe_(label || 'selected') + '.zip'));
}

/** A date range: each day's latest PDF plus a spreadsheet (CSV) of every entry. */
function apiExport(start, end) {
  const c = ctx_();
  checkDate_(start); checkDate_(end);
  const days = table_(c.ss.getSheetByName('Days'), DAYS_HEAD)
    .filter(function (d) { return d.date >= start && d.date <= end; })
    .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  if (!days.length) throw new Error('No reports between ' + start + ' and ' + end);
  const pdfs = {};
  table_(c.ss.getSheetByName('Index'), INDEX_HEAD).forEach(function (r) {
    if (r.type === 'pdf' && r.date >= start && r.date <= end && (!pdfs[r.date] || num_(r.version) > num_(pdfs[r.date].version))) pdfs[r.date] = r;
  });
  const blobs = [];
  const rows = [['date','section','no','round','zone','status','time'].concat(FIELDS)];
  days.forEach(function (d) {
    if (pdfs[d.date]) blobs.push(DriveApp.getFileById(pdfs[d.date].fileId).getBlob().setName(pdfs[d.date].name));
    let r = null;
    try { r = JSON.parse(DriveApp.getFileById(d.reportFileId).getBlob().getDataAsString()); } catch (e) { return; }
    const s = r.summary || {};
    rows.push([d.date, 'summary', '', '', '', s.status || '', ''].concat(FIELDS.map(function (f) { return SUMMARY_MAP[f] ? s[SUMMARY_MAP[f]] || '' : ''; })));
    (r._rounds || []).forEach(function (rd) {
      const st = (r.walkround || {})[rd.k]; if (!st || !st.start) return;
      rd.zones.forEach(function (z) {
        const zd = (st.zones || {})[z] || {};
        rows.push([d.date, 'walkround', '', rd.label, z, zd.status || 'missed', zd.at || ''].concat(FIELDS.map(function () { return ''; })));
      });
    });
    SECTIONS.forEach(function (sec) {
      (r[sec] || []).forEach(function (e, i) {
        rows.push([d.date, sec, i + 1, '', e.location || e.locations || '', e.status || (e.resolved ? 'resolved' : ''), e.start || '']
          .concat(FIELDS.map(function (f) { return e[f] == null ? '' : e[f]; })));
      });
    });
  });
  const csv = '﻿' + rows.map(function (row) {
    return row.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
  }).join('\r\n');
  blobs.push(Utilities.newBlob(csv, 'text/csv', 'DVF_entries_' + start + '_to_' + end + '.csv'));
  const res = saveExport_(Utilities.zip(blobs, 'DVF_' + start + '_to_' + end + '.zip'));
  res.pdfCount = Object.keys(pdfs).length; res.dayCount = days.length;
  return res;
}
const SECTIONS = ['harvest','activity','welfare','inputs','losses','requisitions','defects'];
const FIELDS = ['type','crop','grade','qty','price','pickedBy','desc','staff','end','stage','vigor','pest','severity','action','followup',
  'product','ai','rate','volume','phi','appliedBy','cause','value','reportedBy','requestedBy','item','unit','reason','priority','neededBy',
  'cost','impact','assigned','target','notes'];
const SUMMARY_MAP = { desc: 'wins', notes: 'issues', reportedBy: 'preparedBy' };

/** Exports go into a "DouValue exports" folder in the reviewer's own Drive. */
function saveExport_(blob) {
  const it = DriveApp.getFoldersByName('DouValue exports');
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder('DouValue exports');
  const f = folder.createFile(blob);
  return { name: f.getName(), url: 'https://drive.google.com/uc?export=download&id=' + f.getId(), viewUrl: f.getUrl(),
    size: f.getSize() };
}

/* ---------- helpers ---------- */
function table_(sh, head) {
  const v = sh.getDataRange().getValues(); v.shift();
  return v.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    const o = {}; head.forEach(function (h, i) { o[h] = r[i] instanceof Date ? Utilities.formatDate(r[i], 'Africa/Lagos', 'yyyy-MM-dd') : r[i]; });
    return o;
  });
}
function file_(r) {
  return { id: r.id, date: r.date, fileId: r.fileId, thumbId: r.thumbId, type: r.type, name: r.name, label: r.label,
    zone: r.zone, round: r.round, section: r.section, entryId: r.entryId, role: r.role, capturedAt: r.capturedAt,
    lat: r.lat, lng: r.lng, accuracy: r.accuracy, duration: r.duration, size: num_(r.size), mime: r.mime, version: r.version };
}
function settings_(ss) {
  const o = {};
  ss.getSheetByName('Settings').getDataRange().getValues().forEach(function (r) { o[String(r[0]).trim()] = r[1]; });
  return o;
}
function storage_(ss) {
  const s = settings_(ss);
  return { used: num_(s['Storage used (bytes)']), limit: num_(s['Storage limit (bytes)']), checkedAt: s['Storage checked at'] || '' };
}
function indexed_(ss, fileId) {
  return !!ss.getSheetByName('Index').getRange('T:T').createTextFinder(String(fileId)).matchEntireCell(true).findNext();
}
function checkDate_(d) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) throw new Error('Bad date'); }
function num_(v) { return Number(v) || 0; }
function safe_(s) { return String(s).replace(/[^\w.-]+/g, '_').slice(0, 80); }
