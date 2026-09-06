// complete generator script — iFrame-kompatibel mit funktionierendem Dropdown, Herz-Fill & Fullscreen-Modals
const fs = require('fs');
const path = require('path');

function makeWebcalLink(filename) {
  return 'https://mragg.github.io/bbb-ics-generator/' + filename;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error('Fehler beim Einlesen von ' + filePath + ':', err.message);
    return null;
  }
}

function normalizeId(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function getAgeGroupColor(teamName) {
  const name = teamName.toLowerCase();
  if (name.includes('u10') || name.includes('u12')) return 'blue';
  if (name.includes('u14') || name.includes('u16')) return 'green';
  if (name.includes('u18')) return 'purple';
  if (name.includes('herren') || name.includes('damen')) return 'orange';
  return 'orange';
}

function genHTML() {
  const metaPath = path.resolve(__dirname, '../generated/metadata.json');
  const teamsPath = path.resolve(__dirname, '../generated/teams.json');

  const rawMeta = safeReadJson(metaPath) || [];
  const rawTeams = safeReadJson(teamsPath) || [];

  const metadataArray = Array.isArray(rawMeta) ? rawMeta : (rawMeta.teams || rawMeta.data || []);
  
  const teams = metadataArray.map(m => ({
    teamId: normalizeId(m.teamId ?? m.id ?? m.idStr ?? m.identifier ?? ''),
    name: m.teamName ?? m.name ?? m.title ?? 'Unbenannt',
    ageGroup: m.ageGroup ?? '',
    matchCount: m.matchCount ?? m.matches ?? 0,
    homeMatchCount: m.homeMatchCount ?? m.homeMatches ?? 0,
    awayMatchCount: m.awayMatchCount ?? m.awayMatches ?? 0
  }));

  const excelExists = fs.existsSync(path.resolve(__dirname, '../generated/Gesamt-Spielplan.xlsx'));
  const pdfExists = fs.existsSync(path.resolve(__dirname, '../generated/Gesamt-Spielplan.pdf'));
  const allTeamsIcsExists = fs.existsSync(path.resolve(__dirname, '../generated/all_teams.ics'));

  let content = '<!DOCTYPE html>\n' +
'<html lang="de">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
'<title>TV Neunkirchen Baskets – Kalender</title>\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n' +
'<script src="https://unpkg.com/lucide@latest"><\/script>\n' +
'<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>\n' +
'<style>\n' +
':root {\n' +
'  --color-primary: #E8A33D;\n' +
'  --color-primary-hover: #C97F1E;\n' +
'  --color-primary-light: rgba(232,163,61,0.12);\n' +
'  --color-bg: #F6F4EF;\n' +
'  --color-surface: #FFFFFF;\n' +
'  --color-text: #171512;\n' +
'  --color-text-muted: #71695C;\n' +
'  --color-border: #E1DCCF;\n' +
'  --color-dark: #10203B;\n' +
'  --color-dark-hover: #182B4D;\n' +
'  --color-gold: #E8A33D;\n' +
'  --color-blue: #3B82F6;\n' +
'  --color-green: #10B981;\n' +
'  --color-purple: #8B5CF6;\n' +
'  --radius-sm: 6px;\n' +
'  --radius-md: 10px;\n' +
'  --radius-lg: 14px;\n' +
'  --shadow-sm: 0 2px 10px rgba(0,0,0,0.04);\n' +
'  --shadow-lg: 0 12px 30px rgba(11,22,38,0.35);\n' +
'  --transition: all 0.2s ease;\n' +
'}\n' +
'[data-theme="dark"] {\n' +
'  --color-bg: #0B1626;\n' +
'  --color-surface: #10203B;\n' +
'  --color-text: #F6F4EF;\n' +
'  --color-text-muted: #9FA9BE;\n' +
'  --color-border: rgba(255,255,255,0.08);\n' +
'}\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'html { scroll-behavior: smooth; }\n' +
'body { font-family: "Inter", system-ui, -apple-system, sans-serif; background-color: var(--color-bg); color: var(--color-text); line-height: 1.6; -webkit-font-smoothing: antialiased; min-height: 100dvh; }\n' +
'.skeleton { background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: var(--radius-md); }\n' +
'@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }\n' +
'.skeleton-card { height: 220px; margin-bottom: 1.5rem; }\n' +
'.container { max-width: 1180px; margin: 0 auto; padding: 0 24px 60px; }\n' +
'.quick-access { position: sticky; top: 0; z-index: 100; background: var(--color-surface); border-bottom: 1px solid var(--color-border); padding: 0.75rem 1rem; box-shadow: var(--shadow-sm); display: none; margin-bottom: 1.5rem; animation: slideDown 0.3s ease; border-radius: var(--radius-md); }\n' +
'.quick-access.active { display: block; }\n' +
'@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n' +
'.quick-access-inner { max-width: 1180px; margin: 0 auto; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }\n' +
'.quick-access-label { font-family: "JetBrains Mono", monospace; font-size: 0.78rem; color: var(--color-text-muted); font-weight: 500; margin-right: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }\n' +
'.quick-access-pill { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 0.5rem; }\n' +
'.quick-access-pill:hover { border-color: var(--color-primary); color: var(--color-primary); transform: translateY(-2px); }\n' +
'.pill-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\n' +
'.pill-icon i { width: 14px; height: 14px; color: white; }\n' +
'.pill-icon.age-blue { background: var(--color-blue); }\n' +
'.pill-icon.age-green { background: var(--color-green); }\n' +
'.pill-icon.age-purple { background: var(--color-purple); }\n' +
'.pill-icon.age-orange { background: var(--color-primary); }\n' +
'.pill-text { display: flex; flex-direction: column; gap: 0.125rem; }\n' +
'.pill-name { font-weight: 700; line-height: 1.2; }\n' +
'.pill-age { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 500; }\n' +
'.my-calendar-btn { background: var(--color-primary); color: var(--color-dark); padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); border: none; display: flex; align-items: center; gap: 0.375rem; margin-left: auto; }\n' +
'.my-calendar-btn:hover { background: #fff; transform: translateY(-1px); }\n' +
'.my-calendar-btn i { width: 16px; height: 16px; }\n' +
'.download-section { background: var(--color-dark); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; margin-bottom: 1.5rem; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }\n' +
'.download-section h2 { font-family: "Oswald", sans-serif; font-size: 1.5rem; color: #fff; margin-bottom: 0.5rem; position: relative; text-transform: uppercase; letter-spacing: 0.01em; }\n' +
'.download-section p { color: #9FA9BE; max-width: 500px; margin: 0 auto 1rem; position: relative; font-size: 0.9rem; }\n' +
'.download-buttons { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; position: relative; }\n' +
'.download-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: var(--transition); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; background: var(--color-dark-hover); color: #fff; }\n' +
'.download-btn:hover { background: #fff; color: var(--color-dark); transform: translateY(-2px); }\n' +
'.download-btn-excel:hover { background: #fff; }\n' +
'.download-btn-pdf:hover { background: #fff; }\n' +
'.download-btn-allteams { background: var(--color-primary); color: var(--color-dark); border: none; }\n' +
'.download-btn-allteams:hover { background: #fff; color: var(--color-dark); }\n' +
'.download-btn i { width: 20px; height: 20px; }\n' +
'.download-btn-text { text-align: left; }\n' +
'.download-btn-label { font-family: "JetBrains Mono", monospace; font-size: 0.7rem; opacity: 0.8; display: block; text-transform: uppercase; }\n' +
'.download-btn-name { font-size: 0.9rem; font-weight: 700; display: block; }\n' +
'.search-wrapper { margin-bottom: 1.5rem; position: relative; }\n' +
'.search-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.95rem; background: var(--color-surface); color: var(--color-text); transition: var(--transition); font-family: "Inter", sans-serif; }\n' +
'.search-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }\n' +
'.search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none; width: 18px; height: 18px; }\n' +
'.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 26px; margin-bottom: 2rem; }\n' +
'.team-card { background: linear-gradient(150deg, var(--color-dark) 0%, #0B1626 100%); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.08); box-shadow: none; transition: transform 0.25s ease, box-shadow 0.25s ease; position: relative; cursor: pointer; scroll-margin-top: 80px; z-index: 1; overflow: visible; min-height: 220px; display: flex; flex-direction: column; }\n' +
'.team-card::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 88% 8%, rgba(232,163,61,0.22), transparent 42%); z-index: 0; pointer-events: none; border-radius: var(--radius-lg); }\n' +
'.team-card.expanded { z-index: 9999; }\n' +
'.team-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }\n' +
'.team-card.hidden { display: none !important; }\n' +
'.team-card.favorite { border: 1px solid var(--color-gold); box-shadow: 0 0 20px rgba(232,163,61,0.2); }\n' +
'.team-card.age-blue { border-left: 4px solid var(--color-blue); }\n' +
'.team-card.age-green { border-left: 4px solid var(--color-green); }\n' +
'.team-card.age-purple { border-left: 4px solid var(--color-purple); }\n' +
'.team-card.age-orange { border-left: 4px solid var(--color-primary); }\n' +
'.favorite-btn { position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); backdrop-filter: blur(4px); }\n' +
'.favorite-btn:hover { transform: scale(1.15); background: rgba(255,255,255,0.2); }\n' +
// FIX: !important hinzugefügt, damit Lucide das fill nicht überschreibt
'.favorite-btn i { color: #9FA9BE; fill: transparent !important; transition: all 0.3s ease; width: 18px; height: 18px; }\n' +
'.favorite-btn.active i { color: var(--color-gold); fill: var(--color-gold) !important; }\n' +
'@keyframes heart-pop { 0% { transform: scale(1); } 30% { transform: scale(1.4); } 60% { transform: scale(0.9); } 100% { transform: scale(1); } }\n' +
'.favorite-btn.animating i { animation: heart-pop 0.5s ease; }\n' +
'.team-card-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; padding-right: 3rem; z-index: 1; position: relative; }\n' +
'.team-name { font-family: "Oswald", sans-serif; font-size: 1.4em; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.01em; margin-top: 0 !important; margin-bottom: 0 !important; }\n' +
'.team-badge { font-family: "JetBrains Mono", monospace; color: var(--color-primary); background: rgba(232,163,61,0.15); padding: 4px 10px; border-radius: 6px; font-size: 0.75em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
'.team-stats { display: flex; justify-content: space-around; padding: 0.75rem 1rem; background: rgba(11,22,38,0.35); border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 1; position: relative; }\n' +
'.stat { text-align: center; transition: var(--transition); cursor: pointer; padding: 0.4rem; border-radius: var(--radius-sm); }\n' +
'.stat:hover { background: rgba(255,255,255,0.05); }\n' +
'.stat.active { background: rgba(232,163,61,0.1); }\n' +
'.stat-val { font-family: "Oswald", sans-serif; font-size: 1.35rem; font-weight: 700; color: #fff; transition: var(--transition); }\n' +
'.stat-label { font-family: "JetBrains Mono", monospace; font-size: 0.7rem; color: #9FA9BE; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 3px; transition: var(--transition); letter-spacing: 0.05em; }\n' +
'.stat.active .stat-label { color: var(--color-primary); font-weight: 600; }\n' +
'.team-actions { padding: 1.25rem; display: grid; gap: 0.75rem; opacity: 0; max-height: 0; transition: opacity 0.3s ease, max-height 0.3s ease; pointer-events: none; z-index: 1; position: relative; background: linear-gradient(180deg, rgba(11,22,38,0.25) 0%, rgba(11,22,38,0.93) 78%); overflow: visible; border-radius: 0 0 var(--radius-lg) var(--radius-lg); }\n' +
'.team-card.expanded .team-actions { opacity: 1; max-height: 600px; pointer-events: auto; }\n' +
'.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: var(--transition); border: none; cursor: pointer; width: 100%; font-family: "Inter", sans-serif; }\n' +
'.btn-primary { background: var(--color-primary); color: var(--color-dark); }\n' +
'.btn-primary:hover { background: #fff; transform: translateY(-1px); }\n' +
'.btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2); }\n' +
'.btn-outline:hover { background: rgba(255,255,255,0.05); border-color: #fff; }\n' +
'.primary-actions { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }\n' +
'.primary-actions .btn { flex: 1; }\n' +
'.more-options-wrapper { position: relative; }\n' +
'.more-options-btn { background: rgba(255,255,255,0.05); color: #fff; padding: 0.65rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; width: 100%; }\n' +
'.more-options-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }\n' +
'.more-options-btn i { width: 16px; height: 16px; }\n' +
'.more-options-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--color-dark); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); display: none; flex-direction: column; gap: 0.25rem; padding: 0.5rem; z-index: 10000; width: 100%; }\n' +
'.more-options-dropdown.active { display: flex; animation: dropdownFadeIn 0.15s ease; }\n' +
'@keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }\n' +
'.more-option-item { padding: 0.65rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 500; border: none; background: transparent; color: #fff; text-align: left; width: 100%; }\n' +
'.more-option-item:hover { background: rgba(255,255,255,0.05); }\n' +
'.more-option-item i { width: 16px; height: 16px; color: var(--color-primary); }\n' +
'.btn-copy { background: rgba(255,255,255,0.05); color: #fff; font-size: 0.8rem; padding: 0.5rem 0.75rem; width: auto; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.btn-copy:hover { background: rgba(255,255,255,0.1); }\n' +
'.btn-copy.loading { pointer-events: none; opacity: 0.7; }\n' +
'.btn-copy.success { background: #10B981; color: white; border-color: #10B981; }\n' +
'@keyframes calendar-flash { 0% { transform: scale(1); box-shadow: 0 0 0 rgba(232,163,61,0); } 50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(232,163,61,0.4); } 100% { transform: scale(1); box-shadow: 0 0 0 rgba(232,163,61,0); } }\n' +
'.btn.flash { animation: calendar-flash 0.4s ease; border-color: var(--color-primary) !important; }\n' +
'.toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%) translateY(100px); background: var(--color-dark); color: #fff; padding: 0.75rem 1.25rem; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 2147483647; opacity: 0; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1); }\n' +
'.toast.active { opacity: 1; transform: translateX(-50%) translateY(0); }\n' +
// FIX: Modals nutzen 100vw/100vh, um aus dem iFrame auszubrechen und den ganzen Bildschirm abzudecken
'.qr-modal, .my-calendar-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(11,22,38,0.85); backdrop-filter: blur(4px); z-index: 2147483647; display: none; align-items: center; justify-content: center; padding: 1rem; }\n' +
'.qr-modal.active, .my-calendar-modal.active { display: flex; }\n' +
'.qr-modal-content, .my-calendar-modal-content { background: var(--color-dark); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-lg); padding: 1.5rem; max-width: 400px; width: 100%; text-align: center; box-shadow: var(--shadow-lg); position: relative; z-index: 2147483648; color: #fff; }\n' +
'.my-calendar-modal-content { max-height: 90vh; overflow-y: auto; text-align: left; }\n' +
'.modal-title { font-family: "Oswald", sans-serif; font-size: 1.25rem; margin-bottom: 0.5rem; text-align: center; text-transform: uppercase; letter-spacing: 0.01em; }\n' +
'.modal-subtitle { color: #9FA9BE; font-size: 0.85rem; margin-bottom: 1rem; text-align: center; }\n' +
'.qr-code-container { background: white; padding: 1rem; border-radius: var(--radius-md); display: inline-block; margin-bottom: 1rem; }\n' +
'.team-checkbox-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }\n' +
'.team-checkbox-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem; border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); background: rgba(255,255,255,0.02); }\n' +
'.team-checkbox-item:hover { background: rgba(255,255,255,0.05); }\n' +
'.team-checkbox-item input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary); }\n' +
'.team-checkbox-item label { flex: 1; cursor: pointer; font-weight: 500; font-size: 0.9rem; color: #fff; }\n' +
'.calendar-type-selector { display: flex; gap: 0.5rem; margin-bottom: 1rem; }\n' +
'.calendar-type-btn { flex: 1; padding: 0.65rem; border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); background: rgba(255,255,255,0.02); cursor: pointer; transition: var(--transition); font-weight: 600; text-align: center; color: #9FA9BE; font-size: 0.85rem; }\n' +
'.calendar-type-btn.active { border-color: var(--color-primary); background: rgba(232,163,61,0.1); color: var(--color-primary); }\n' +
'.modal-actions { display: flex; gap: 0.75rem; }\n' +
'.modal-actions .btn { flex: 1; }\n' +
'.modal-close-btn { background: rgba(255,255,255,0.1); color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; width: 100%; font-size: 0.9rem; transition: var(--transition); }\n' +
'.modal-close-btn:hover { background: rgba(255,255,255,0.2); }\n' +
'@media (max-width: 900px) {\n' +
'  .teams-grid { grid-template-columns: repeat(2, 1fr); }\n' +
'}\n' +
'@media (max-width: 600px) {\n' +
'  .teams-grid { grid-template-columns: 1fr; }\n' +
'  .quick-access-inner { justify-content: center; }\n' +
'  .download-buttons { flex-direction: column; align-items: stretch; }\n' +
'  .download-btn { justify-content: center; }\n' +
'  .primary-actions { flex-direction: column; }\n' +
'  .calendar-type-selector { flex-direction: column; }\n' +
'  .team-card { scroll-margin-top: 120px; }\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="skeleton-loader"><div class="container"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>\n' +
'<div class="quick-access" id="quick-access">\n' +
'  <div class="quick-access-inner">\n' +
'    <span class="quick-access-label">⭐ Favoriten:</span>\n' +
'    <div id="quick-access-pills"></div>\n' +
'    <button class="my-calendar-btn" id="my-calendar-btn"><i data-lucide="calendar-plus"></i><span>Mein Kalender</span></button>\n' +
'  </div>\n' +
'</div>\n' +
'<main class="container" id="main-content" style="display:none;">\n';

  if (excelExists || pdfExists || allTeamsIcsExists) {
    let dlButtons = '';
    if (allTeamsIcsExists) {
      dlButtons += '<a href="all_teams.ics" download class="download-btn download-btn-allteams"><i data-lucide="calendar"></i><div class="download-btn-text"><span class="download-btn-label">Alle Teams</span><span class="download-btn-name">all_teams.ics</span></div></a>';
    }
    if (excelExists) {
      dlButtons += '<a href="Gesamt-Spielplan.xlsx" download class="download-btn download-btn-excel"><i data-lucide="table"></i><div class="download-btn-text"><span class="download-btn-label">Excel</span><span class="download-btn-name">Spielplan.xlsx</span></div></a>';
    }
    if (pdfExists) {
      dlButtons += '<a href="Gesamt-Spielplan.pdf" download class="download-btn download-btn-pdf"><i data-lucide="file-text"></i><div class="download-btn-text"><span class="download-btn-label">PDF</span><span class="download-btn-name">Spielplan.pdf</span></div></a>';
    }
    content += '<div class="download-section"><h2>Gesamt-Spielplan herunterladen</h2><p>Alle Spiele chronologisch sortiert – perfekt zum Ausdrucken oder Abonnieren.</p><div class="download-buttons">' + dlButtons + '</div></div>';
  }

  content += '<div class="search-wrapper"><i data-lucide="search" class="search-icon"></i><input type="text" class="search-input" id="team-search" placeholder="Team suchen (z.B. U14, Herren, Damen)..."></div>\n';
  content += '<div class="teams-grid" id="teams-grid">\n';

  if (teams.length === 0) {
    content += '<p style="text-align:center; padding: 2rem; color: var(--color-text-muted); grid-column: 1 / -1; background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border);">⚠️ Keine Teams gefunden. Bitte stelle sicher, dass das Update-Skript erfolgreich durchgelaufen ist.</p>';
  }

  teams.forEach((t, index) => {
    const ageColor = getAgeGroupColor(t.name);
    content += '<div class="team-card age-' + ageColor + '" data-team-id="' + t.teamId + '" data-team-name="' + t.name.toLowerCase() + ' ' + t.ageGroup.toLowerCase() + '" data-original-index="' + index + '" data-all-url="' + makeWebcalLink(t.teamId + '_all.ics') + '" data-home-url="' + makeWebcalLink(t.teamId + '_home.ics') + '" data-away-url="' + makeWebcalLink(t.teamId + '_away.ics') + '">' +
      '<button class="favorite-btn" aria-label="Als Favorit markieren"><i data-lucide="heart"></i></button>' +
      '<div class="team-card-header"><span class="team-name">' + t.name + '</span>' + (t.ageGroup ? '<span class="team-badge">' + t.ageGroup + '</span>' : '') + '</div>' +
      '<div class="team-stats">' +
        '<div class="stat active" data-type="all"><div class="stat-val" data-target="' + t.matchCount + '">0</div><div class="stat-label"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Gesamt</div></div>' +
        '<div class="stat" data-type="home"><div class="stat-val" data-target="' + t.homeMatchCount + '">0</div><div class="stat-label"><i data-lucide="home" style="width:12px;height:12px;"></i> Heim</div></div>' +
        '<div class="stat" data-type="away"><div class="stat-val" data-target="' + t.awayMatchCount + '">0</div><div class="stat-label"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> Auswärts</div></div>' +
      '</div>' +
      '<div class="team-actions">' +
        '<div class="calendar-type-label" style="margin-bottom:0.5rem;font-weight:600;font-size:0.85rem; color: #9FA9BE; font-family: \'JetBrains Mono\', monospace; text-transform: uppercase; letter-spacing: 0.05em;">Alle Spiele:</div>' +
        '<div class="primary-actions">' +
          '<a href="#" class="btn btn-primary calendar-link" data-platform="apple"><i data-lucide="apple" style="width:16px;height:16px;"></i> Apple</a>' +
          '<button class="btn btn-outline calendar-link" data-platform="google"><i data-lucide="calendar" style="width:16px;height:16px;"></i> Google</button>' +
        '</div>' +
        '<div class="more-options-wrapper">' +
          '<button class="more-options-btn"><i data-lucide="more-horizontal"></i> Mehr Optionen</button>' +
          '<div class="more-options-dropdown">' +
            '<button class="more-option-item calendar-link" data-platform="outlook"><i data-lucide="mail"></i> Outlook</button>' +
            '<button class="more-option-item calendar-link" data-platform="share"><i data-lucide="share-2"></i> Teilen</button>' +
            '<button class="more-option-item qr-btn"><i data-lucide="qr-code"></i> QR-Code</button>' +
            '<button class="more-option-item download-file-btn"><i data-lucide="download"></i> .ics herunterladen</button>' +
            '<button class="more-option-item copy-btn"><i data-lucide="copy"></i> Link kopieren</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>\n';
  });

  content += '</div>\n';
  content += '</main>\n';

  content += '<div class="qr-modal" id="qr-modal"><div class="qr-modal-content"><div class="modal-title">QR-Code scannen</div><div class="modal-subtitle">Öffne die Kamera-App und scanne den Code</div><div class="qr-code-container" id="qr-code-container"></div><button class="modal-close-btn" id="qr-modal-close">Schließen</button></div></div>\n';
  content += '<div class="my-calendar-modal" id="my-calendar-modal"><div class="my-calendar-modal-content"><div class="modal-title">📅 Mein Kalender</div><div class="modal-subtitle">Wähle Teams und Typ für deinen persönlichen Kalender</div><div class="team-checkbox-list" id="team-checkbox-list"></div><div class="calendar-type-selector"><button class="calendar-type-btn active" data-type="all">Alle Spiele</button><button class="calendar-type-btn" data-type="home">Nur Heim</button><button class="calendar-type-btn" data-type="away">Nur Auswärts</button></div><div class="modal-actions"><button class="btn btn-outline" id="my-calendar-cancel" style="color:#fff; border-color:rgba(255,255,255,0.2);">Abbrechen</button><button class="btn btn-primary" id="my-calendar-create">Kalender erstellen</button></div></div></div>\n';
  content += '<div class="toast" id="toast"><i data-lucide="check-circle" style="width:18px;height:18px;"></i><span id="toast-text">Link kopiert!</span></div>\n';

  // JAVASCRIPT MIT IFRAME-KOMPATIBLEN FALLBACKS
  content += '<script>\n';
  
  content += '  function copyToClipboard(text) {\n';
  content += '    return new Promise((resolve, reject) => {\n';
  content += '      if (navigator.clipboard && window.isSecureContext) {\n';
  content += '        navigator.clipboard.writeText(text).then(resolve).catch(() => { fallbackCopy(text).then(resolve).catch(reject); });\n';
  content += '      } else {\n';
  content += '        fallbackCopy(text).then(resolve).catch(reject);\n';
  content += '      }\n';
  content += '    });\n';
  content += '  }\n\n';
  
  content += '  function fallbackCopy(text) {\n';
  content += '    return new Promise((resolve, reject) => {\n';
  content += '      const textArea = document.createElement("textarea");\n';
  content += '      textArea.value = text;\n';
  content += '      textArea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";\n';
  content += '      document.body.appendChild(textArea);\n';
  content += '      textArea.focus();\n';
  content += '      textArea.select();\n';
  content += '      try {\n';
  content += '        const success = document.execCommand("copy");\n';
  content += '        document.body.removeChild(textArea);\n';
  content += '        if (success) resolve(); else reject(new Error("Copy failed"));\n';
  content += '      } catch (err) {\n';
  content += '        document.body.removeChild(textArea);\n';
  content += '        reject(err);\n';
  content += '      }\n';
  content += '    });\n';
  content += '  }\n\n';

  content += 'document.addEventListener("DOMContentLoaded", () => {\n';
  content += '  setTimeout(() => {\n';
  content += '    try {\n';
  content += '      const skeleton = document.getElementById("skeleton-loader");\n';
  content += '      if (skeleton) skeleton.style.display = "none";\n';
  content += '      const mainContent = document.getElementById("main-content");\n';
  content += '      if (mainContent) mainContent.style.display = "block";\n';
  content += '      if (typeof lucide !== "undefined") lucide.createIcons();\n';
  
  content += '      document.querySelectorAll(".stat-val").forEach(el => {\n';
  content += '        const target = parseInt(el.getAttribute("data-target"), 10);\n';
  content += '        if (isNaN(target) || target === 0) return;\n';
  content += '        let current = 0;\n';
  content += '        const increment = target / 30;\n';
  content += '        const timer = setInterval(() => {\n';
  content += '          current += increment;\n';
  content += '          if (current >= target) { el.textContent = target; clearInterval(timer); }\n';
  content += '          else { el.textContent = Math.floor(current); }\n';
  content += '        }, 20);\n';
  content += '      });\n';
  
  content += '      document.querySelectorAll(".team-card").forEach(card => { try { updateCardLinks(card, "all"); } catch (e) { console.error(e); } });\n';
  content += '    } catch (err) {\n';
  content += '      console.error("Fataler Fehler:", err);\n';
  content += '      const mainContent = document.getElementById("main-content");\n';
  content += '      if (mainContent) mainContent.style.display = "block";\n';
  content += '      const skeleton = document.getElementById("skeleton-loader");\n';
  content += '      if (skeleton) skeleton.style.display = "none";\n';
  content += '    }\n';
  content += '  }, 300);\n\n';

  content += '  const grid = document.getElementById("teams-grid");\n';
  content += '  if (!grid) return;\n';
  content += '  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");\n\n';

  content += '  document.querySelectorAll(".team-card").forEach(card => {\n';
  content += '    const teamId = card.getAttribute("data-team-id");\n';
  content += '    if (favorites.includes(teamId)) { card.classList.add("favorite"); card.querySelector(".favorite-btn").classList.add("active"); }\n';
  content += '  });\n';
  content += '  sortCards(); updateQuickAccess();\n\n';

  content += '  function getFirstPositions() {\n';
  content += '    const positions = new Map();\n';
  content += '    grid.querySelectorAll(".team-card").forEach(card => {\n';
  content += '      const rect = card.getBoundingClientRect();\n';
  content += '      positions.set(card, { top: rect.top, left: rect.left });\n';
  content += '    });\n';
  content += '    return positions;\n';
  content += '  }\n\n';

  content += '  function animateWithFLIP(firstPositions, duration) {\n';
  content += '    duration = duration || 400;\n';
  content += '    grid.querySelectorAll(".team-card").forEach(card => {\n';
  content += '      const first = firstPositions.get(card);\n';
  content += '      if (!first) return;\n';
  content += '      const last = card.getBoundingClientRect();\n';
  content += '      const dx = first.left - last.left;\n';
  content += '      const dy = first.top - last.top;\n';
  content += '      if (dx === 0 && dy === 0) return;\n';
  content += '      card.style.transform = "translate(" + dx + "px," + dy + "px)";\n';
  content += '      card.style.transition = "none";\n';
  content += '      requestAnimationFrame(() => {\n';
  content += '        card.style.transition = "transform " + duration + "ms cubic-bezier(0.4, 0, 0.2, 1)";\n';
  content += '        card.style.transform = "";\n';
  content += '      });\n';
  content += '    });\n';
  content += '  }\n\n';

  content += '  document.querySelectorAll(".favorite-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => {\n';
  content += '      e.stopPropagation();\n';
  content += '      const card = btn.closest(".team-card"); \n';
  content += '      const teamId = card.getAttribute("data-team-id");\n';
  content += '      btn.classList.add("animating"); \n';
  content += '      setTimeout(() => btn.classList.remove("animating"), 500);\n';
  content += '      card.classList.toggle("favorite"); \n';
  content += '      btn.classList.toggle("active");\n';
  content += '      if (navigator.vibrate) navigator.vibrate(50);\n';
  content += '      const f = JSON.parse(localStorage.getItem("favorites") || "[]");\n';
  content += '      if (card.classList.contains("favorite")) { if (!f.includes(teamId)) f.push(teamId); } \n';
  content += '      else { const i = f.indexOf(teamId); if (i > -1) f.splice(i, 1); }\n';
  content += '      localStorage.setItem("favorites", JSON.stringify(f));\n';
  content += '      const fp = getFirstPositions();\n';
  content += '      sortCards();\n';
  content += '      animateWithFLIP(fp, 400);\n';
  content += '      updateQuickAccess();\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  function sortCards() {\n';
  content += '    const cards = Array.from(grid.querySelectorAll(".team-card"));\n';
  content += '    cards.sort((a, b) => { \n';
  content += '      const af = a.classList.contains("favorite") ? 0 : 1; \n';
  content += '      const bf = b.classList.contains("favorite") ? 0 : 1; \n';
  content += '      if (af !== bf) return af - bf; \n';
  content += '      return parseInt(a.getAttribute("data-original-index")) - parseInt(b.getAttribute("data-original-index")); \n';
  content += '    });\n';
  content += '    cards.forEach(card => grid.appendChild(card));\n';
  content += '  }\n\n';

  content += '  function updateQuickAccess() {\n';
  content += '    const qa = document.getElementById("quick-access"); \n';
  content += '    const pc = document.getElementById("quick-access-pills");\n';
  content += '    if (!qa || !pc) return;\n';
  content += '    const f = JSON.parse(localStorage.getItem("favorites") || "[]");\n';
  content += '    if (f.length === 0) { qa.classList.remove("active"); return; }\n';
  content += '    qa.classList.add("active"); \n';
  content += '    pc.innerHTML = "";\n';
  content += '    f.forEach(tid => {\n';
  content += '      const card = grid.querySelector(\'[data-team-id="\' + tid + \'"]\'); \n';
  content += '      if (!card) return;\n';
  content += '      const teamName = card.querySelector(".team-name").textContent;\n';
  content += '      const ageGroupEl = card.querySelector(".team-badge");\n';
  content += '      const ageGroup = ageGroupEl ? ageGroupEl.textContent : "";\n';
  content += '      const ageColorMatch = card.className.match(/age-(blue|green|purple|orange)/);\n';
  content += '      const ac = ageColorMatch ? ageColorMatch[1] : "orange";\n';
  content += '      const pill = document.createElement("button"); \n';
  content += '      pill.className = "quick-access-pill";\n';
  content += '      pill.innerHTML = \'<div class="pill-icon age-\' + ac + \'"><i data-lucide="circle-dot"></i></div><div class="pill-text"><span class="pill-name">\' + teamName + \'</span>\' + (ageGroup ? \'<span class="pill-age">\' + ageGroup + \'</span>\' : \'\') + \'</div>\';\n';
  content += '      pill.addEventListener("click", (e) => { \n';
  content += '        e.stopPropagation(); \n';
  content += '        card.scrollIntoView({ behavior: "smooth", block: "center" }); \n';
  content += '        card.classList.add("expanded"); \n';
  content += '      });\n';
  content += '      pc.appendChild(pill);\n';
  content += '    });\n';
  content += '    if (typeof lucide !== "undefined") lucide.createIcons();\n';
  content += '  }\n\n';

  content += '  const searchInput = document.getElementById("team-search");\n';
  content += '  if (searchInput) {\n';
  content += '    searchInput.addEventListener("input", (e) => { \n';
  content += '      const q = e.target.value.toLowerCase(); \n';
  content += '      document.querySelectorAll(".team-card").forEach(card => { \n';
  content += '        const name = card.getAttribute("data-team-name") || "";\n';
  content += '        card.classList.toggle("hidden", !name.includes(q)); \n';
  content += '      }); \n';
  content += '    });\n';
  content += '  }\n\n';

  content += '  document.querySelectorAll(".team-card").forEach(card => {\n';
  content += '    card.addEventListener("click", (e) => {\n';
  content += '      if (e.target.closest("button, a, .stat, .more-option-item, input, label, .more-options-dropdown")) return;\n';
  content += '      const isExpanded = card.classList.contains("expanded");\n';
  content += '      document.querySelectorAll(".team-card").forEach(c => { \n';
  content += '        if (c !== card) { c.classList.remove("expanded"); resetCardToAll(c); } \n';
  content += '      });\n';
  content += '      if (!isExpanded) card.classList.add("expanded"); \n';
  content += '      else { card.classList.remove("expanded"); resetCardToAll(card); }\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  function resetCardToAll(card) {\n';
  content += '    card.querySelectorAll(".stat").forEach(s => s.classList.remove("active"));\n';
  content += '    const a = card.querySelector(\'.stat[data-type="all"]\'); \n';
  content += '    if (a) { a.classList.add("active"); updateCardLinks(card, "all"); }\n';
  content += '  }\n\n';

  content += '  document.querySelectorAll(".stat").forEach(stat => {\n';
  content += '    stat.addEventListener("click", (e) => {\n';
  content += '      e.stopPropagation();\n';
  content += '      const card = stat.closest(".team-card");\n';
  content += '      const type = stat.getAttribute("data-type");\n';
  content += '      document.querySelectorAll(".team-card").forEach(c => { \n';
  content += '        if (c !== card) { c.classList.remove("expanded"); resetCardToAll(c); } \n';
  content += '      });\n';
  content += '      card.classList.add("expanded");\n';
  content += '      card.scrollIntoView({ behavior: "smooth", block: "center" });\n';
  content += '      if (navigator.vibrate) navigator.vibrate(30);\n';
  content += '      card.querySelectorAll(".stat").forEach(s => s.classList.remove("active"));\n';
  content += '      stat.classList.add("active");\n';
  content += '      updateCardLinks(card, type);\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  function updateCardLinks(card, type) {\n';
  content += '    const urls = { all: card.getAttribute("data-all-url"), home: card.getAttribute("data-home-url"), away: card.getAttribute("data-away-url") };\n';
  content += '    const url = urls[type]; \n';
  content += '    if (!url) return;\n';
  content += '    const webcalUrl = url.replace("https://", "webcal://");\n';
  content += '    const labels = { all: "Alle Spiele:", home: "Nur Heimspiele:", away: "Nur Auswärtsspiele:" };\n';
  content += '    const label = card.querySelector(".calendar-type-label"); \n';
  content += '    if (label) label.textContent = labels[type];\n';
  content += '    const al = card.querySelector(\'.calendar-link[data-platform="apple"]\'); \n';
  content += '    if (al) al.href = webcalUrl;\n';
  content += '    card.querySelectorAll(".calendar-link").forEach(l => l.setAttribute("data-url", url));\n';
  content += '    const cb = card.querySelector(".copy-btn"); \n';
  content += '    if (cb) cb.setAttribute("data-copy", url);\n';
  content += '    const db = card.querySelector(".download-file-btn"); \n';
  content += '    if (db) db.setAttribute("href", url);\n';
  content += '    const qb = card.querySelector(".qr-btn"); \n';
  content += '    if (qb) qb.setAttribute("data-url", webcalUrl);\n';
  content += '    card.querySelectorAll(".btn, .more-option-item").forEach(b => { \n';
  content += '      b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash"); \n';
  content += '    });\n';
  content += '    setTimeout(() => card.querySelectorAll(".btn, .more-option-item").forEach(b => b.classList.remove("flash")), 400);\n';
  content += '  }\n\n';

  content += '  function closeAllDropdowns() {\n';
  content += '    document.querySelectorAll(".more-options-dropdown").forEach(d => d.classList.remove("active"));\n';
  content += '  }\n\n';

  content += '  document.querySelectorAll(".more-options-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => {\n';
  content += '      e.stopPropagation();\n';
  content += '      const dropdown = btn.nextElementSibling;\n';
  content += '      const isActive = dropdown.classList.contains("active");\n';
  content += '      closeAllDropdowns();\n';
  content += '      if (!isActive) dropdown.classList.add("active");\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  document.addEventListener("click", (e) => {\n';
  content += '    if (!e.target.closest(".more-options-dropdown") && !e.target.closest(".more-options-btn")) closeAllDropdowns();\n';
  content += '  });\n\n';

  content += '  document.querySelectorAll(".copy-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", async (e) => {\n';
  content += '      e.preventDefault(); e.stopPropagation();\n';
  content += '      const url = btn.getAttribute("data-copy");\n';
  content += '      if (!url) { showToast("Kein Link verfügbar"); return; }\n';
  content += '      const icon = btn.querySelector("i"); \n';
  content += '      const orig = icon ? icon.getAttribute("data-lucide") : "copy";\n';
  content += '      btn.classList.add("loading");\n';
  content += '      if (icon) { icon.setAttribute("data-lucide","loader-2"); icon.style.animation="spin 1s linear infinite"; if (typeof lucide !== "undefined") lucide.createIcons(); }\n';
  content += '      try {\n';
  content += '        await copyToClipboard(url);\n';
  content += '        btn.classList.remove("loading"); btn.classList.add("success");\n';
  content += '        if (icon) { icon.setAttribute("data-lucide","check"); icon.style.animation=""; if (typeof lucide !== "undefined") lucide.createIcons(); }\n';
  content += '        showToast("Link kopiert!");\n';
  content += '        setTimeout(() => { btn.classList.remove("success"); if (icon) { icon.setAttribute("data-lucide",orig); if (typeof lucide !== "undefined") lucide.createIcons(); } }, 1500);\n';
  content += '      } catch(err) { \n';
  content += '        console.error("Copy error:", err);\n';
  content += '        btn.classList.remove("loading"); \n';
  content += '        if (icon) { icon.setAttribute("data-lucide",orig); icon.style.animation=""; if (typeof lucide !== "undefined") lucide.createIcons(); } \n';
  content += '        showToast("Kopieren fehlgeschlagen. Link: " + url); \n';
  content += '      }\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  document.querySelectorAll(".calendar-link").forEach(btn => {\n';
  content += '    btn.addEventListener("click", async (e) => { \n';
  content += '      e.preventDefault(); e.stopPropagation(); \n';
  content += '      const p = btn.getAttribute("data-platform"); \n';
  content += '      const url = btn.getAttribute("data-url"); \n';
  content += '      if (!url) return;\n';
  content += '      closeAllDropdowns();\n';
  content += '      if (p === "apple") { window.location.href = url.replace("https://","webcal://"); }\n';
  content += '      else if (p === "google") { \n';
  content += '        try { await copyToClipboard(url); } catch(err) { console.log("Clipboard fallback needed"); }\n';
  content += '        window.open("https://calendar.google.com/calendar/u/0/r/settings/addbyurl", "_blank");\n';
  content += '        showToast("Link kopiert! Bitte in der Google Calendar Website einfügen.");\n';
  content += '      } else if (p === "outlook") { \n';
  content += '        try { await copyToClipboard(url); } catch(err) { console.log("Clipboard fallback needed"); }\n';
  content += '        window.open("https://outlook.live.com/calendar/0/addfromweb", "_blank"); \n';
  content += '        showToast("Link kopiert! Füge ihn bei Outlook ein."); \n';
  content += '      } else if (p === "share") { \n';
  content += '        const tn = btn.closest(".team-card").querySelector(".team-name").textContent; \n';
  content += '        const shareData = { title: "TVN Baskets - "+tn, text: "Spielplan für "+tn, url: url };\n';
  content += '        if (navigator.share && window.top === window.self) { \n';
  content += '          try { await navigator.share(shareData); } catch(err) { \n';
  content += '            try { await copyToClipboard(url); showToast("Link kopiert: " + url); } catch(e2) { showToast("Teilen nicht möglich. Link: " + url); }\n';
  content += '          }\n';
  content += '        } else { \n';
  content += '          try { await copyToClipboard(url); showToast("Link kopiert: " + url); } catch(err) { showToast("Link: " + url); }\n';
  content += '        }\n';
  content += '      }\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  document.querySelectorAll(".download-file-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => {\n';
  content += '      e.preventDefault(); e.stopPropagation();\n';
  content += '      const url = btn.getAttribute("href");\n';
  content += '      if (!url) { showToast("Kein Download verfügbar"); return; }\n';
  content += '      closeAllDropdowns();\n';
  content += '      window.location.href = url;\n';
  content += '      showToast("Download gestartet!");\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  document.querySelectorAll(".qr-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => { \n';
  content += '      e.stopPropagation(); closeAllDropdowns(); \n';
  content += '      const url = btn.getAttribute("data-url"); \n';
  content += '      const qc = document.getElementById("qr-code-container"); \n';
  content += '      const modal = document.getElementById("qr-modal");\n';
  content += '      if (qc && typeof QRCode !== "undefined") {\n';
  content += '        qc.innerHTML = ""; \n';
  content += '        try {\n';
  content += '          new QRCode(qc, { text: url, width: 200, height: 200, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H }); \n';
  content += '          if (modal) { modal.style.display = "flex"; modal.classList.add("active"); }\n';
  content += '        } catch(err) {\n';
  content += '          console.error("QR Code error:", err);\n';
  content += '          showToast("QR-Code konnte nicht erstellt werden");\n';
  content += '        }\n';
  content += '      } else {\n';
  content += '        showToast("QR-Code-Bibliothek nicht geladen");\n';
  content += '      }\n';
  content += '    });\n';
  content += '  });\n';
  
  content += '  const qrModalClose = document.getElementById("qr-modal-close");\n';
  content += '  if (qrModalClose) qrModalClose.addEventListener("click", () => { const m = document.getElementById("qr-modal"); if (m) { m.classList.remove("active"); m.style.display = "none"; } });\n';
  
  content += '  const qrModal = document.getElementById("qr-modal");\n';
  content += '  if (qrModal) qrModal.addEventListener("click", (e) => { if (e.target.id === "qr-modal") { qrModal.classList.remove("active"); qrModal.style.display = "none"; } });\n\n';

  content += '  const mcBtn = document.getElementById("my-calendar-btn");\n';
  content += '  const mcModal = document.getElementById("my-calendar-modal");\n';
  content += '  const mcList = document.getElementById("team-checkbox-list");\n';
  content += '  let mcType = "all";\n\n';

  content += '  if (mcBtn) {\n';
  content += '    mcBtn.addEventListener("click", () => {\n';
  content += '      if (!mcList) return;\n';
  content += '      mcList.innerHTML = "";\n';
  content += '      const f = JSON.parse(localStorage.getItem("favorites") || "[]");\n';
  content += '      if (f.length === 0) { showToast("Bitte markiere zuerst Teams als Favoriten!"); return; }\n';
  content += '      f.forEach(tid => {\n';
  content += '        const card = grid.querySelector(\'[data-team-id="\' + tid + \'"]\'); \n';
  content += '        if (!card) return;\n';
  content += '        const tn = card.querySelector(".team-name").textContent;\n';
  content += '        const item = document.createElement("div"); \n';
  content += '        item.className = "team-checkbox-item";\n';
  content += '        item.innerHTML = \'<input type="checkbox" id="mc-\' + tid + \'" value="\' + tid + \'" checked><label for="mc-\' + tid + \'">\' + tn + \'</label>\';\n';
  content += '        mcList.appendChild(item);\n';
  content += '      });\n';
  content += '      if (mcModal) mcModal.classList.add("active");\n';
  content += '    });\n';
  content += '  }\n\n';

  content += '  document.querySelectorAll(".calendar-type-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", () => { \n';
  content += '      document.querySelectorAll(".calendar-type-btn").forEach(b => b.classList.remove("active")); \n';
  content += '      btn.classList.add("active"); \n';
  content += '      mcType = btn.getAttribute("data-type"); \n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  const mcCancel = document.getElementById("my-calendar-cancel");\n';
  content += '  if (mcCancel) mcCancel.addEventListener("click", () => { if (mcModal) mcModal.classList.remove("active"); });\n';
  
  content += '  if (mcModal) mcModal.addEventListener("click", (e) => { if (e.target.id === "my-calendar-modal") mcModal.classList.remove("active"); });\n\n';

  content += '  const mcCreate = document.getElementById("my-calendar-create");\n';
  content += '  if (mcCreate) {\n';
  content += '    mcCreate.addEventListener("click", async () => {\n';
  content += '      if (!mcList) return;\n';
  content += '      const selected = Array.from(mcList.querySelectorAll("input:checked")).map(cb => cb.value);\n';
  content += '      if (selected.length === 0) { showToast("Bitte wähle mindestens ein Team!"); return; }\n';
  content += '      showToast("Kalender wird erstellt...");\n';
  content += '      if (mcModal) mcModal.classList.remove("active");\n\n';
  content += '      try {\n';
  content += '        let allEvents = [];\n';
  content += '        const seenUIDs = new Set();\n';
  content += '        for (const tid of selected) {\n';
  content += '          const card = grid.querySelector(\'[data-team-id="\' + tid + \'"]\');\n';
  content += '          const url = card ? card.getAttribute("data-" + mcType + "-url") : "";\n';
  content += '          if (!url) continue;\n';
  content += '          const res = await fetch(url);\n';
  content += '          if (!res.ok) continue;\n';
  content += '          const text = await res.text();\n';
  content += '          const lines = text.split(/\\r?\\n/);\n';
  content += '          let inEvent = false; let ev = [];\n';
  content += '          for (const line of lines) {\n';
  content += '            if (line === "BEGIN:VEVENT") { inEvent = true; ev = [line]; }\n';
  content += '            else if (line === "END:VEVENT") { \n';
  content += '              ev.push(line); \n';
  content += '              const uid = ev.join("\\n").match(/UID:(.+)/); \n';
  content += '              if (!uid || !seenUIDs.has(uid[1])) { allEvents.push(ev.join("\\r\\n")); if (uid) seenUIDs.add(uid[1]); } \n';
  content += '              inEvent = false; \n';
  content += '            }\n';
  content += '            else if (inEvent) ev.push(line);\n';
  content += '          }\n';
  content += '        }\n';
  content += '        if (allEvents.length === 0) { showToast("Keine Spiele gefunden!"); return; }\n';
  content += '        const ics = "BEGIN:VCALENDAR\\r\\nVERSION:2.0\\r\\nPRODID:-//TVN Baskets//DE\\r\\nCALSCALE:GREGORIAN\\r\\nMETHOD:PUBLISH\\r\\nX-WR-CALNAME:Mein TVN Kalender\\r\\nX-WR-TIMEZONE:Europe/Berlin\\r\\n" + allEvents.join("\\r\\n") + "\\r\\nEND:VCALENDAR";\n';
  content += '        const blob = new Blob([ics], { type: "text/calendar" });\n';
  content += '        const a = document.createElement("a"); \n';
  content += '        a.href = URL.createObjectURL(blob); \n';
  content += '        a.download = "mein_tvn_kalender.ics"; \n';
  content += '        document.body.appendChild(a); \n';
  content += '        a.click(); \n';
  content += '        document.body.removeChild(a); \n';
  content += '        URL.revokeObjectURL(a.href);\n';
  content += '        showToast("Kalender heruntergeladen! Importiere ihn in deine Kalender-App.");\n';
  content += '      } catch(err) { console.error(err); showToast("Fehler beim Erstellen des Kalenders."); }\n';
  content += '    });\n';
  content += '  }\n\n';

  content += '  function showToast(msg) { \n';
  content += '    const t = document.getElementById("toast"); \n';
  content += '    const txt = document.getElementById("toast-text");\n';
  content += '    if (t && txt) {\n';
  content += '      txt.textContent = msg; \n';
  content += '      t.classList.add("active"); \n';
  content += '      setTimeout(() => t.classList.remove("active"), 4000); \n';
  content += '    }\n';
  content += '  }\n';
  
  content += '});\n';
  content += '<\/script>\n';
  content += '<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.contentWindow.min.js"><\/script>\n';
  content += '</body>\n</html>';

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
  console.log('✅ index.html mit Herz-Fill & Fullscreen-Modals generiert.');
}

genHTML();
