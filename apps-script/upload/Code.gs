/**
 * DouValue upload service.
 *
 * Receives the phone app's report data and files (one per request), checks the farm key,
 * files them in Drive under DouValue Reports / YYYY / YYYY-MM / YYYY-MM-DD / {walkround, entries, thumbs}
 * and records one row per file in the index sheet.
 *
 * Runs under support@douvaluefarmsltd.com. Deploy as a web app:
 *   Execute as: Me   ·   Who has access: Anyone
 * The farm key in the Settings sheet is what keeps strangers out; change it there to lock out a lost phone.
 */
const ROOT_NAME = 'DouValue Reports';
const INDEX_HEAD = ['id','date','zone','round','section','entryId','role','type','name','label','capturedAt','lat','lng','accuracy',
  'duration','size','sha256','mime','version','fileId','thumbId','uploadedAt'];
const DAYS_HEAD = ['date','updatedAt','preparedBy','weather','status','harvestKg','harvestValue','activityHours','flags','openIssues',
  'problem','zonesFlagged','expectedIds','reportFileId','folderId'];
const P = PropertiesService.getScriptProperties();

/** Run once from the editor. Creates the folder, the index sheet and a farm key (see Logs / the Settings tab). */
function setup() {
  let root;
  const rootId = P.getProperty('ROOT_FOLDER_ID');
  if (rootId) root = DriveApp.getFolderById(rootId);
  else {
    const it = DriveApp.getFoldersByName(ROOT_NAME);
    root = it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_NAME);
    P.setProperty('ROOT_FOLDER_ID', root.getId());
  }
  let ss;
  const ssId = P.getProperty('SHEET_ID');
  if (ssId) ss = SpreadsheetApp.openById(ssId);
  else {
    ss = SpreadsheetApp.create('DouValue Reports Index');
    DriveApp.getFileById(ss.getId()).moveTo(root);
    P.setProperty('SHEET_ID', ss.getId());
  }
  ensureSheet_(ss, 'Index', INDEX_HEAD);
  ensureSheet_(ss, 'Days', DAYS_HEAD);
  let st = ss.getSheetByName('Settings');
  if (!st) {
    st = ss.insertSheet('Settings');
    st.getRange(1, 1, 7, 2).setValues([
      ['Setting', 'Value'],
      ['Farm upload key', newKey_()],
      ['Allowed reviewers', ''],
      ['Storage used (bytes)', 0],
      ['Storage limit (bytes)', 0],
      ['Storage checked at', ''],
      ['Reports folder', root.getUrl()]
    ]);
    st.getRange('A1:B1').setFontWeight('bold');
    st.setColumnWidth(1, 200); st.setColumnWidth(2, 460);
  }
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  updateStorage_(ss, true);
  Logger.log('Reports folder: %s', root.getUrl());
  Logger.log('Index sheet:    %s', ss.getUrl());
  Logger.log('SHEET_ID (copy into the portal project): %s', ss.getId());
  Logger.log('Farm upload key (enter on the phone):     %s', setting_(ss, 'Farm upload key'));
}

/** Run after adding emails to "Allowed reviewers": gives them view access to the folder and index sheet. */
function shareWithReviewers() {
  const ss = SpreadsheetApp.openById(P.getProperty('SHEET_ID'));
  const root = DriveApp.getFolderById(P.getProperty('ROOT_FOLDER_ID'));
  reviewers_(ss).forEach(function (email) {
    root.addViewer(email);
    DriveApp.getFileById(ss.getId()).addViewer(email);
    Logger.log('Shared with %s', email);
  });
}

/** Run if the phone is lost: makes a new key, so the old phone can no longer upload. */
function rotateFarmKey() {
  const ss = SpreadsheetApp.openById(P.getProperty('SHEET_ID'));
  const key = newKey_();
  setSetting_(ss, 'Farm upload key', key);
  Logger.log('New farm key: %s', key);
}

function doGet() {
  return ContentService.createTextOutput('DouValue upload service is running.');
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Bad request' }); }
  try {
    const ss = SpreadsheetApp.openById(P.getProperty('SHEET_ID'));
    const key = String(setting_(ss, 'Farm upload key') || '');
    if (!key || body.key !== key) return out_({ ok: false, error: 'Wrong farm key — check Settings on the phone' });
    switch (body.action) {
      case 'ping': return out_({ ok: true, message: 'Connected to DouValue upload service' });
      case 'report': return out_(saveReport_(ss, body));
      case 'file': return out_(saveFile_(ss, body));
    }
    return out_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ---------- report data: saved as JSON in the day folder, summarised as one row in Days ---------- */
function saveReport_(ss, body) {
  const d = String(body.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'Bad date' };
  const day = body.day || {};
  const lock = LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const folder = folder_(dayParts_(d));
    const sh = ss.getSheetByName('Days');
    const row = findRow_(sh, d);
    let rec = row ? obj_(DAYS_HEAD, sh.getRange(row, 1, 1, DAYS_HEAD.length).getValues()[0]) : {};
    const json = JSON.stringify(body.report || {});
    let file = null;
    if (rec.reportFileId) { try { file = DriveApp.getFileById(rec.reportFileId); if (file.isTrashed()) file = null; } catch (e) { file = null; } }
    if (file) file.setContent(json);
    else file = folder.createFile('DVF_' + d + '_report.json', json, 'application/json');
    ['preparedBy','weather','status','harvestKg','harvestValue','activityHours','flags','openIssues','problem','zonesFlagged']
      .forEach(function (k) { if (day[k] !== undefined) rec[k] = day[k]; });
    rec.date = d;
    rec.updatedAt = new Date().toISOString();
    rec.expectedIds = (day.expectedIds || []).join(',');
    rec.reportFileId = file.getId();
    rec.folderId = folder.getId();
    const vals = DAYS_HEAD.map(function (h) { return rec[h] == null ? '' : String(rec[h]); });
    if (row) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/* ---------- one file: checked against the phone's size and SHA-256 before it counts as arrived ---------- */
function saveFile_(ss, body) {
  const m = body.meta || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || '')) return { ok: false, error: 'Bad date' };
  if (!/^[\w.-]{1,100}$/.test(m.id || '')) return { ok: false, error: 'Bad id' };
  const bytes = Utilities.base64Decode(body.data || '');
  const sha = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes));
  if (m.size && Number(m.size) !== bytes.length) return { ok: false, error: 'File arrived incomplete — will retry' };
  if (m.sha256 && m.sha256 !== sha) return { ok: false, error: 'File arrived damaged — will retry' };
  const lock = LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const sh = ss.getSheetByName('Index');
    const row = findRow_(sh, m.id);
    if (row) {
      const prev = obj_(INDEX_HEAD, sh.getRange(row, 1, 1, INDEX_HEAD.length).getValues()[0]);
      if (prev.sha256 === sha) return { ok: true, duplicate: true, id: m.id, size: bytes.length, sha256: sha, fileId: prev.fileId };
    }
    const parts = dayParts_(m.date);
    const sub = m.type === 'pdf' ? null : (m.section === 'walkround' ? 'walkround' : 'entries');
    const folder = folder_(sub ? parts.concat(sub) : parts);
    const name = safeName_(m.name || m.id);
    const file = folder.createFile(Utilities.newBlob(bytes, m.mime || 'application/octet-stream', name));
    const gps = (m.lat !== '' && m.lat != null) ? 'GPS ' + m.lat + ', ' + m.lng + ' ±' + m.accuracy + ' m' : '';
    file.setDescription([m.label, m.capturedAt, m.zone, gps].filter(String).join(' · '));
    let thumbId = '';
    if (body.thumb) {
      const tf = folder_(parts.concat('thumbs')).createFile(
        Utilities.newBlob(Utilities.base64Decode(body.thumb), 'image/jpeg', name.replace(/\.\w+$/, '') + '_thumb.jpg'));
      thumbId = tf.getId();
    }
    const rec = {};
    INDEX_HEAD.forEach(function (h) { rec[h] = m[h]; });
    rec.name = name; rec.size = bytes.length; rec.sha256 = sha; rec.fileId = file.getId(); rec.thumbId = thumbId;
    rec.uploadedAt = new Date().toISOString();
    const vals = INDEX_HEAD.map(function (h) { return rec[h] == null ? '' : String(rec[h]); });
    if (row) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
    updateStorage_(ss, false);
    return { ok: true, id: m.id, size: bytes.length, sha256: sha, fileId: file.getId() };
  } finally { lock.releaseLock(); }
}

/* ---------- helpers ---------- */
function dayParts_(date) { return [date.slice(0, 4), date.slice(0, 7), date]; }

/** Gets or creates ROOT/parts..., caching folder ids so each upload doesn't walk the tree. */
function folder_(parts) {
  const k = 'F:' + parts.join('/');
  const cached = P.getProperty(k);
  if (cached) { try { const f = DriveApp.getFolderById(cached); if (!f.isTrashed()) return f; } catch (e) {} }
  const parent = parts.length > 1 ? folder_(parts.slice(0, -1)) : DriveApp.getFolderById(P.getProperty('ROOT_FOLDER_ID'));
  const name = parts[parts.length - 1];
  const it = parent.getFoldersByName(name);
  const f = it.hasNext() ? it.next() : parent.createFolder(name);
  P.setProperty(k, f.getId());
  return f;
}

function ensureSheet_(ss, name, head) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.getRange(1, 1, sh.getMaxRows(), head.length).setNumberFormat('@'); // keep dates and ids as plain text
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function findRow_(sh, id) {
  const f = sh.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}

function obj_(head, vals) { const o = {}; head.forEach(function (h, i) { o[h] = vals[i]; }); return o; }

function setting_(ss, name) {
  const v = ss.getSheetByName('Settings').getDataRange().getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]).trim() === name) return v[i][1];
  return '';
}
function setSetting_(ss, name, value) {
  const sh = ss.getSheetByName('Settings'), v = sh.getDataRange().getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]).trim() === name) { sh.getRange(i + 1, 2).setValue(value); return; }
  sh.appendRow([name, value]);
}
function reviewers_(ss) {
  return String(setting_(ss, 'Allowed reviewers') || '').toLowerCase().split(/[\s,;]+/).filter(String);
}

/** Records the owner account's Drive usage so the portal can show it and warn at 80%. At most every 10 minutes. */
function updateStorage_(ss, force) {
  const last = Number(P.getProperty('STORAGE_AT') || 0);
  if (!force && Date.now() - last < 10 * 60 * 1000) return;
  setSetting_(ss, 'Storage used (bytes)', DriveApp.getStorageUsed());
  setSetting_(ss, 'Storage limit (bytes)', DriveApp.getStorageLimit());
  setSetting_(ss, 'Storage checked at', new Date().toISOString());
  P.setProperty('STORAGE_AT', String(Date.now()));
}

function newKey_() { return 'dvf-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16); }
function safeName_(s) { return String(s).replace(/[^\w.&-]+/g, '_').slice(0, 120); }
function hex_(bytes) { return bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join(''); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
