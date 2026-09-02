// complete generator script — mit klickbarer Team-Karte Fix & Mein Kalender Feature
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

  const content = '<!DOCTYPE html>\n' +
'<html lang="de">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
'<title>TV Neunkirchen Baskets – Kalender</title>\n' +
'<meta name="theme-color" content="#FF6B00">\n' +
'<meta name="apple-mobile-web-app-capable" content="yes">\n' +
'<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
'<meta name="apple-mobile-web-app-title" content="TVN Baskets">\n' +
'<link rel="manifest" href="manifest.json">\n' +
'<link rel="apple-touch-icon" href="Logo.png">\n' +
'<meta property="og:title" content="TV Neunkirchen Baskets – Kalender">\n' +
'<meta property="og:description" content="Offizielle, immer aktuelle Spielpläne für alle Teams.">\n' +
'<meta property="og:image" content="https://mragg.github.io/bbb-ics-generator/Logo.png">\n' +
'<meta property="og:url" content="https://mragg.github.io/bbb-ics-generator/">\n' +
'<meta property="og:type" content="website">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;700&display=swap" rel="stylesheet">\n' +
'<script src="https://unpkg.com/lucide@latest"><\/script>\n' +
'<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>\n' +
'<style>\n' +
':root {\n' +
'  --color-primary: #FF6B00; --color-primary-hover: #E55A00;\n' +
'  --color-bg: #F8FAFC; --color-surface: #FFFFFF; --color-text: #0F172A;\n' +
'  --color-text-muted: #64748B; --color-border: #E2E8F0; --color-gold: #FFD700;\n' +
'  --color-blue: #3B82F6; --color-green: #10B981; --color-purple: #8B5CF6;\n' +
'  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;\n' +
'  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);\n' +
'  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);\n' +
'  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n' +
'}\n' +
'[data-theme="dark"] {\n' +
'  --color-bg: #0F172A; --color-surface: #1E293B; --color-text: #F1F5F9;\n' +
'  --color-text-muted: #94A3B8; --color-border: #334155;\n' +
'}\n' +
'* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'html { scroll-behavior: smooth; }\n' +
'body { font-family: "Inter", sans-serif; background-color: var(--color-bg); color: var(--color-text); line-height: 1.5; -webkit-font-smoothing: antialiased; min-height: 100dvh; transition: background-color 0.3s ease, color 0.3s ease; }\n' +
'.skeleton { background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: var(--radius-md); }\n' +
'@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }\n' +
'.skeleton-card { height: 180px; margin-bottom: 1.5rem; }\n' +
'.header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; padding: 2rem 1.5rem; position: relative; overflow: hidden; }\n' +
'.header-inner { max-width: 1024px; margin: 0 auto; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }\n' +
'.logo { height: 80px; width: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }\n' +
'.header-text { flex: 1; }\n' +
'.header-text h1 { font-family: "Oswald", sans-serif; font-size: 2.25rem; font-weight: 700; text-transform: uppercase; }\n' +
'.header-text p { color: #94A3B8; margin-top: 0.5rem; font-size: 0.95rem; }\n' +
'.theme-toggle { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.6rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }\n' +
'.theme-toggle:hover { background: rgba(255,255,255,0.2); }\n' +
'.container { max-width: 1024px; margin: 0 auto; padding: 2rem 1.5rem; }\n' +
'.quick-access { position: sticky; top: 0; z-index: 100; background: var(--color-surface); border-bottom: 1px solid var(--color-border); padding: 0.75rem 1.5rem; box-shadow: var(--shadow-sm); display: none; margin-bottom: 2rem; }\n' +
'.quick-access.active { display: block; }\n' +
'.quick-access-inner { max-width: 1024px; margin: 0 auto; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }\n' +
'.quick-access-label { font-size: 0.875rem; color: var(--color-text-muted); font-weight: 600; margin-right: 0.5rem; }\n' +
'.quick-access-pill { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover)); color: white; padding: 0.5rem 1rem; border-radius: 99px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition); border: none; display: flex; align-items: center; gap: 0.375rem; }\n' +
'.quick-access-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,107,0,0.3); }\n' +
'.quick-access-pill i { width: 14px; height: 14px; }\n' +
'.my-calendar-btn { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 0.5rem 1rem; border-radius: 99px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition); border: none; display: flex; align-items: center; gap: 0.375rem; }\n' +
'.my-calendar-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }\n' +
'.my-calendar-btn i { width: 14px; height: 14px; }\n' +
'.download-section { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%); border-radius: var(--radius-lg); padding: 2rem; text-align: center; margin-bottom: 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(255,107,0,0.2); }\n' +
'.download-section::before { content: ""; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); border-radius: 50%; }\n' +
'.download-section h2 { font-family: "Oswald", sans-serif; font-size: 1.75rem; color: white; margin-bottom: 0.5rem; position: relative; }\n' +
'.download-section p { color: rgba(255,255,255,0.9); max-width: 500px; margin: 0 auto 1.5rem; position: relative; font-size: 1rem; }\n' +
'.download-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; }\n' +
'.download-btn { display: inline-flex; align-items: center; gap: 0.75rem; padding: 1rem 1.75rem; border-radius: var(--radius-md); font-weight: 600; font-size: 1rem; text-decoration: none; transition: var(--transition); border: none; cursor: pointer; background: white; color: var(--color-text); }\n' +
'.download-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }\n' +
'.download-btn-excel:hover { background: #217346; color: white; }\n' +
'.download-btn-pdf:hover { background: #D32F2F; color: white; }\n' +
'.download-btn i { width: 24px; height: 24px; }\n' +
'.download-btn-text { text-align: left; }\n' +
'.download-btn-label { font-size: 0.75rem; opacity: 0.7; display: block; }\n' +
'.download-btn-name { font-size: 1rem; font-weight: 700; display: block; }\n' +
'.search-wrapper { margin-bottom: 2rem; position: relative; }\n' +
'.search-input { width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border: 2px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; background: var(--color-surface); color: var(--color-text); transition: var(--transition); }\n' +
'.search-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15); }\n' +
'.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none; }\n' +
'.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }\n' +
'.team-card { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); transition: var(--transition); overflow: hidden; position: relative; cursor: pointer; }\n' +
'.team-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary); }\n' +
'.team-card.hidden { display: none !important; }\n' +
'.team-card.favorite { border: 2px solid var(--color-gold); box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }\n' +
'.team-card.keyboard-focus { outline: 3px solid var(--color-primary); outline-offset: 2px; }\n' +
'.team-card.age-blue { border-left: 4px solid var(--color-blue); }\n' +
'.team-card.age-blue .team-badge { background: var(--color-blue); }\n' +
'.team-card.age-green { border-left: 4px solid var(--color-green); }\n' +
'.team-card.age-green .team-badge { background: var(--color-green); }\n' +
'.team-card.age-purple { border-left: 4px solid var(--color-purple); }\n' +
'.team-card.age-purple .team-badge { background: var(--color-purple); }\n' +
'.team-card.age-orange { border-left: 4px solid var(--color-primary); }\n' +
'.team-card.age-orange .team-badge { background: var(--color-primary); }\n' +
'.favorite-btn { position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\n' +
'[data-theme="dark"] .favorite-btn { background: rgba(30,41,59,0.9); }\n' +
'.favorite-btn:hover { transform: scale(1.1); }\n' +
'.favorite-btn i { color: var(--color-text-muted); transition: var(--transition); }\n' +
'.favorite-btn.active i { color: var(--color-gold); fill: var(--color-gold); }\n' +
'@keyframes favorite-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }\n' +
'@keyframes favorite-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }\n' +
'.favorite-btn.animating { animation: favorite-pulse 0.4s ease, favorite-bounce 0.4s ease; }\n' +
'.team-card-header { padding: 1.25rem; background: linear-gradient(to right, #FFF7ED, #FFFFFF); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; padding-right: 3.5rem; }\n' +
'[data-theme="dark"] .team-card-header { background: linear-gradient(to right, #1E293B, #334155); }\n' +
'.team-name { font-family: "Oswald", sans-serif; font-size: 1.25rem; font-weight: 600; }\n' +
'.team-badge { color: white; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 99px; }\n' +
'.team-stats { display: flex; justify-content: space-around; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); background: #FAFAFA; }\n' +
'[data-theme="dark"] .team-stats { background: #0F172A; }\n' +
'.stat { text-align: center; transition: var(--transition); cursor: pointer; padding: 0.5rem; border-radius: var(--radius-sm); }\n' +
'.stat:hover { background: rgba(255,107,0,0.1); }\n' +
'.stat.active { background: rgba(255,107,0,0.15); }\n' +
'.stat-val { font-family: "Oswald", sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--color-primary); transition: var(--transition); }\n' +
'.stat-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 4px; transition: var(--transition); }\n' +
'.stat.active .stat-label { color: var(--color-primary); font-weight: 600; }\n' +
'.team-actions { padding: 1.25rem; display: grid; gap: 0.75rem; opacity: 0; max-height: 0; transition: var(--transition); pointer-events: none; }\n' +
'.team-card.expanded .team-actions { opacity: 1; max-height: 700px; pointer-events: auto; }\n' +
'.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: var(--transition); border: none; cursor: pointer; width: 100%; }\n' +
'.btn-primary { background: var(--color-primary); color: white; }\n' +
'.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }\n' +
'.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }\n' +
'.btn-outline:hover { background: var(--color-surface); }\n' +
'.primary-actions { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }\n' +
'.primary-actions .btn { flex: 1; }\n' +
'.more-options-wrapper { position: relative; }\n' +
'.more-options-btn { background: #F1F5F9; color: var(--color-text); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border); cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 600; width: 100%; }\n' +
'[data-theme="dark"] .more-options-btn { background: #334155; }\n' +
'.more-options-btn:hover { background: #E2E8F0; }\n' +
'.more-options-btn i { width: 16px; height: 16px; }\n' +
'.more-options-dropdown { position: absolute; bottom: 100%; left: 0; right: 0; margin-bottom: 0.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); display: none; flex-direction: column; gap: 0.25rem; padding: 0.5rem; z-index: 20; }\n' +
'.more-options-dropdown.active { display: flex; }\n' +
'.more-option-item { padding: 0.625rem 0.75rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 500; border: none; background: transparent; color: var(--color-text); text-align: left; width: 100%; }\n' +
'.more-option-item:hover { background: var(--color-bg); }\n' +
'.more-option-item i { width: 16px; height: 16px; color: var(--color-primary); }\n' +
'.btn-copy { background: #F1F5F9; color: var(--color-text); font-size: 0.8rem; padding: 0.5rem 0.75rem; width: auto; }\n' +
'[data-theme="dark"] .btn-copy { background: #334155; }\n' +
'.btn-copy:hover { background: #E2E8F0; }\n' +
'.btn-copy.loading { pointer-events: none; opacity: 0.7; }\n' +
'.btn-copy.success { background: #10B981; color: white; }\n' +
'@keyframes calendar-flash { 0% { transform: scale(1); box-shadow: 0 0 0 rgba(255,107,0,0); } 50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,107,0,0.4); } 100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,107,0,0); } }\n' +
'.btn.flash { animation: calendar-flash 0.4s ease; border-color: var(--color-primary) !important; }\n' +
'.toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(100px); background: var(--color-text); color: var(--color-surface); padding: 0.875rem 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; opacity: 0; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.5rem; }\n' +
'.toast.active { opacity: 1; transform: translateX(-50%) translateY(0); }\n' +
'#konfetti-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; }\n' +
'.scroll-top-btn { position: fixed; bottom: 2rem; right: 2rem; width: 48px; height: 48px; background: var(--color-primary); color: white; border: none; border-radius: 50%; cursor: pointer; box-shadow: var(--shadow-lg); z-index: 90; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: var(--transition); }\n' +
'.scroll-top-btn.active { opacity: 1; visibility: visible; }\n' +
'.scroll-top-btn:hover { background: var(--color-primary-hover); transform: translateY(-4px); }\n' +
'.scroll-top-btn i { width: 24px; height: 24px; }\n' +
'.qr-modal, .my-calendar-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 1rem; }\n' +
'.qr-modal.active, .my-calendar-modal.active { display: flex; }\n' +
'.qr-modal-content, .my-calendar-modal-content { background: var(--color-surface); border-radius: var(--radius-lg); padding: 2rem; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }\n' +
'.my-calendar-modal-content { max-height: 90vh; overflow-y: auto; text-align: left; }\n' +
'.modal-title { font-family: "Oswald", sans-serif; font-size: 1.5rem; margin-bottom: 0.5rem; text-align: center; }\n' +
'.modal-subtitle { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; text-align: center; }\n' +
'.qr-code-container { background: white; padding: 1.5rem; border-radius: var(--radius-md); display: inline-block; margin-bottom: 1.5rem; }\n' +
'.team-checkbox-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }\n' +
'.team-checkbox-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }\n' +
'.team-checkbox-item:hover { background: var(--color-bg); }\n' +
'.team-checkbox-item input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: var(--color-primary); }\n' +
'.team-checkbox-item label { flex: 1; cursor: pointer; font-weight: 500; }\n' +
'.calendar-type-selector { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }\n' +
'.calendar-type-btn { flex: 1; padding: 0.75rem; border: 2px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); cursor: pointer; transition: var(--transition); font-weight: 600; text-align: center; color: var(--color-text); }\n' +
'.calendar-type-btn.active { border-color: var(--color-primary); background: rgba(255,107,0,0.1); color: var(--color-primary); }\n' +
'.modal-actions { display: flex; gap: 0.75rem; }\n' +
'.modal-actions .btn { flex: 1; }\n' +
'.modal-close-btn { background: var(--color-primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; width: 100%; }\n' +
'.modal-close-btn:hover { background: var(--color-primary-hover); }\n' +
'.footer { text-align: center; padding: 2rem 1.5rem; color: var(--color-text-muted); font-size: 0.875rem; border-top: 1px solid var(--color-border); }\n' +
'.footer a { color: var(--color-primary); text-decoration: none; font-weight: 600; }\n' +
'@media (max-width: 640px) {\n' +
'  .header-inner { flex-direction: column; text-align: center; }\n' +
'  .logo { height: 60px; }\n' +
'  .teams-grid { grid-template-columns: 1fr; }\n' +
'  .quick-access-inner { justify-content: center; }\n' +
'  .scroll-top-btn { bottom: 1rem; right: 1rem; width: 44px; height: 44px; }\n' +
'  .download-buttons { flex-direction: column; align-items: stretch; }\n' +
'  .download-btn { justify-content: center; }\n' +
'  .favorite-btn { width: 44px; height: 44px; }\n' +
'  .primary-actions { flex-direction: column; }\n' +
'  .calendar-type-selector { flex-direction: column; }\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="skeleton-loader"><div class="container"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>\n' +
'<canvas id="konfetti-canvas"></canvas>\n' +
'<header class="header" id="main-header" style="display:none;">\n' +
'  <div class="header-inner">\n' +
'    <img src="Logo.png" class="logo" alt="TVN Logo">\n' +
'    <div class="header-text">\n' +
'      <h1>TV Neunkirchen Baskets</h1>\n' +
'      <p>Kalenderübersicht • Stand: ' + new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr</p>\n' +
'    </div>\n' +
'    <button class="theme-toggle" id="theme-toggle" aria-label="Theme wechseln"><i data-lucide="moon" id="theme-icon" style="width:20px;height:20px;"></i></button>\n' +
'  </div>\n' +
'</header>\n' +
'<div class="quick-access" id="quick-access">\n' +
'  <div class="quick-access-inner">\n' +
'    <span class="quick-access-label">⭐ Deine Favoriten:</span>\n' +
'    <div id="quick-access-pills"></div>\n' +
'    <button class="my-calendar-btn" id="my-calendar-btn"><i data-lucide="calendar-plus"></i><span>Mein Kalender</span></button>\n' +
'  </div>\n' +
'</div>\n' +
'<main class="container" id="main-content" style="display:none;">\n';

  // Download-Sektion
  if (excelExists || pdfExists || allTeamsIcsExists) {
    let dlButtons = '';
    if (allTeamsIcsExists) {
      dlButtons += '<a href="all_teams.ics" download class="download-btn" style="background:#FF6B00;color:white;"><i data-lucide="calendar"></i><div class="download-btn-text"><span class="download-btn-label">Alle Teams</span><span class="download-btn-name">all_teams.ics</span></div></a>';
    }
    if (excelExists) {
      dlButtons += '<a href="Gesamt-Spielplan.xlsx" download class="download-btn download-btn-excel"><i data-lucide="table"></i><div class="download-btn-text"><span class="download-btn-label">Excel</span><span class="download-btn-name">Spielplan.xlsx</span></div></a>';
    }
    if (pdfExists) {
      dlButtons += '<a href="Gesamt-Spielplan.pdf" download class="download-btn download-btn-pdf"><i data-lucide="file-text"></i><div class="download-btn-text"><span class="download-btn-label">PDF</span><span class="download-btn-name">Spielplan.pdf</span></div></a>';
    }
    content += '<div class="download-section"><i data-lucide="download" style="width:48px;height:48px;color:white;margin-bottom:1rem;position:relative;"></i><h2>Gesamt-Spielplan herunterladen</h2><p>Alle Spiele chronologisch sortiert – perfekt zum Ausdrucken oder Abonnieren.</p><div class="download-buttons">' + dlButtons + '</div></div>';
  }

  content += '<div class="search-wrapper"><i data-lucide="search" class="search-icon" style="width:20px;height:20px;"></i><input type="text" class="search-input" id="team-search" placeholder="Team suchen (z.B. U14, Herren, Damen)..."></div>\n';
  content += '<div class="teams-grid" id="teams-grid">\n';

  teams.forEach((t, index) => {
    const ageColor = getAgeGroupColor(t.name);
    content += '<div class="team-card age-' + ageColor + '" data-team-id="' + t.teamId + '" data-team-name="' + t.name.toLowerCase() + ' ' + t.ageGroup.toLowerCase() + '" data-original-index="' + index + '" data-all-url="' + makeWebcalLink(t.teamId + '_all.ics') + '" data-home-url="' + makeWebcalLink(t.teamId + '_home.ics') + '" data-away-url="' + makeWebcalLink(t.teamId + '_away.ics') + '">' +
      '<button class="favorite-btn" aria-label="Als Favorit markieren"><i data-lucide="heart" style="width:18px;height:18px;"></i></button>' +
      '<div class="team-card-header"><span class="team-name">' + t.name + '</span>' + (t.ageGroup ? '<span class="team-badge">' + t.ageGroup + '</span>' : '') + '</div>' +
      '<div class="team-stats">' +
        '<div class="stat active" data-type="all"><div class="stat-val" data-target="' + t.matchCount + '">0</div><div class="stat-label"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Gesamt</div></div>' +
        '<div class="stat" data-type="home"><div class="stat-val" data-target="' + t.homeMatchCount + '">0</div><div class="stat-label"><i data-lucide="home" style="width:12px;height:12px;"></i> Heim</div></div>' +
        '<div class="stat" data-type="away"><div class="stat-val" data-target="' + t.awayMatchCount + '">0</div><div class="stat-label"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> Auswärts</div></div>' +
      '</div>' +
      '<div class="team-actions">' +
        '<div class="calendar-type-label" style="margin-bottom:0.5rem;font-weight:600;font-size:0.9rem;">Alle Spiele:</div>' +
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
            '<button class="more-option-item download-file-btn" download><i data-lucide="download"></i> .ics herunterladen</button>' +
            '<button class="more-option-item copy-btn"><i data-lucide="copy"></i> Link kopieren</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>\n';
  });

  content += '</div></main>\n';
  content += '<footer class="footer" id="main-footer" style="display:none;"><p>© ' + new Date().getFullYear() + ' TV Neunkirchen Baskets. <a href="https://www.tvn-baskets.de/teams/">Zurück zur Hauptseite</a></p></footer>\n';
  content += '<button class="scroll-top-btn" id="scroll-top-btn" aria-label="Nach oben scrollen"><i data-lucide="arrow-up"></i></button>\n';

  // QR Modal
  content += '<div class="qr-modal" id="qr-modal"><div class="qr-modal-content"><div class="modal-title">QR-Code scannen</div><div class="modal-subtitle">Öffne die Kamera-App und scanne den Code</div><div class="qr-code-container" id="qr-code-container"></div><button class="modal-close-btn" id="qr-modal-close">Schließen</button></div></div>\n';

  // Mein Kalender Modal
  content += '<div class="my-calendar-modal" id="my-calendar-modal"><div class="my-calendar-modal-content"><div class="modal-title">📅 Mein Kalender</div><div class="modal-subtitle">Wähle Teams und Typ für deinen persönlichen Kalender</div><div class="team-checkbox-list" id="team-checkbox-list"></div><div class="calendar-type-selector"><button class="calendar-type-btn active" data-type="all">Alle Spiele</button><button class="calendar-type-btn" data-type="home">Nur Heim</button><button class="calendar-type-btn" data-type="away">Nur Auswärts</button></div><div class="modal-actions"><button class="btn btn-outline" id="my-calendar-cancel">Abbrechen</button><button class="btn btn-primary" id="my-calendar-create">Kalender erstellen</button></div></div></div>\n';

  content += '<div class="toast" id="toast"><i data-lucide="check-circle" style="width:18px;height:18px;"></i><span id="toast-text">Link kopiert!</span></div>\n';

  // JAVASCRIPT
  content += '<script>\n';
  content += 'document.addEventListener("DOMContentLoaded", () => {\n';
  content += '  setTimeout(() => {\n';
  content += '    document.getElementById("skeleton-loader").style.display = "none";\n';
  content += '    document.getElementById("main-header").style.display = "block";\n';
  content += '    document.getElementById("main-content").style.display = "block";\n';
  content += '    document.getElementById("main-footer").style.display = "block";\n';
  content += '    lucide.createIcons();\n';
  content += '    if (!localStorage.getItem("konfetti_shown")) { startKonfetti(); localStorage.setItem("konfetti_shown", "true"); }\n';
  content += '    document.querySelectorAll(".team-card").forEach(card => updateCardLinks(card, "all"));\n';
  content += '  }, 400);\n\n';

  content += '  const grid = document.getElementById("teams-grid");\n';
  content += '  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");\n\n';

  content += '  document.querySelectorAll(".team-card").forEach(card => {\n';
  content += '    const teamId = card.getAttribute("data-team-id");\n';
  content += '    if (favorites.includes(teamId)) { card.classList.add("favorite"); card.querySelector(".favorite-btn").classList.add("active"); }\n';
  content += '  });\n';
  content += '  sortCards(); updateQuickAccess();\n\n';

  // Favorite buttons
  content += '  document.querySelectorAll(".favorite-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => {\n';
  content += '      e.stopPropagation();\n';
  content += '      const card = btn.closest(".team-card"); const teamId = card.getAttribute("data-team-id");\n';
  content += '      btn.classList.add("animating"); setTimeout(() => btn.classList.remove("animating"), 400);\n';
  content += '      card.classList.toggle("favorite"); btn.classList.toggle("active");\n';
  content += '      if (navigator.vibrate) navigator.vibrate(50);\n';
  content += '      const f = JSON.parse(localStorage.getItem("favorites") || "[]");\n';
  content += '      if (card.classList.contains("favorite")) { if (!f.includes(teamId)) f.push(teamId); }\n';
  content += '      else { const i = f.indexOf(teamId); if (i > -1) f.splice(i, 1); }\n';
  content += '      localStorage.setItem("favorites", JSON.stringify(f));\n';
  content += '      sortCards(); updateQuickAccess();\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  function sortCards() {\n';
  content += '    const cards = Array.from(grid.querySelectorAll(".team-card"));\n';
  content += '    cards.sort((a, b) => { const af = a.classList.contains("favorite") ? 0 : 1; const bf = b.classList.contains("favorite") ? 0 : 1; if (af !== bf) return af - bf; return parseInt(a.getAttribute("data-original-index")) - parseInt(b.getAttribute("data-original-index")); });\n';
  content += '    cards.forEach(card => grid.appendChild(card));\n';
  content += '  }\n\n';

  content += '  function updateQuickAccess() {\n';
  content += '    const qa = document.getElementById("quick-access"); const pc = document.getElementById("quick-access-pills");\n';
  content += '    const f = JSON.parse(localStorage.getItem("favorites") || "[]");\n';
  content += '    if (f.length === 0) { qa.classList.remove("active"); return; }\n';
  content += '    qa.classList.add("active"); pc.innerHTML = "";\n';
  content += '    f.forEach(tid => {\n';
  content += '      const card = grid.querySelector(\'[data-team-id="\' + tid + \'"]\'); if (!card) return;\n';
  content += '      const pill = document.createElement("button"); pill.className = "quick-access-pill";\n';
  content += '      pill.innerHTML = \'<i data-lucide="basketball"></i> \' + card.querySelector(".team-name").textContent;\n';
  content += '      pill.addEventListener("click", (e) => { e.stopPropagation(); card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("expanded"); });\n';
  content += '      pc.appendChild(pill);\n';
  content += '    });\n';
  content += '    lucide.createIcons();\n';
  content += '  }\n\n';

  // Scroll top
  content += '  const stb = document.getElementById("scroll-top-btn");\n';
  content += '  window.addEventListener("scroll", () => stb.classList.toggle("active", window.scrollY > 300));\n';
  content += '  stb.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));\n\n';

  // Konfetti
  content += '  function startKonfetti() {\n';
  content += '    const c = document.getElementById("konfetti-canvas"); const ctx = c.getContext("2d");\n';
  content += '    c.width = window.innerWidth; c.height = window.innerHeight;\n';
  content += '    const p = []; const cols = ["#FF6B00","#FFD700","#FFFFFF","#E55A00"];\n';
  content += '    for (let i = 0; i < 150; i++) p.push({ x: Math.random()*c.width, y: Math.random()*c.height-c.height, vx: (Math.random()-0.5)*4, vy: Math.random()*3+2, s: Math.random()*8+4, c: cols[Math.floor(Math.random()*cols.length)], r: Math.random()*360, rs: (Math.random()-0.5)*10 });\n';
  content += '    let f = 0;\n';
  content += '    function a() { if (f >= 180) { c.style.display = "none"; return; } ctx.clearRect(0,0,c.width,c.height); p.forEach(x => { x.x+=x.vx; x.y+=x.vy; x.vy+=0.1; x.r+=x.rs; ctx.save(); ctx.translate(x.x,x.y); ctx.rotate(x.r*Math.PI/180); ctx.fillStyle=x.c; ctx.fillRect(-x.s/2,-x.s/2,x.s,x.s); ctx.restore(); }); f++; requestAnimationFrame(a); }\n';
  content += '    a();\n';
  content += '  }\n\n';

  // Theme
  content += '  const tt = document.getElementById("theme-toggle"); const ti = document.getElementById("theme-icon");\n';
  content += '  if (localStorage.getItem("theme") === "dark") { document.documentElement.setAttribute("data-theme","dark"); ti.setAttribute("data-lucide","sun"); lucide.createIcons(); }\n';
  content += '  tt.addEventListener("click", () => { const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme",n); localStorage.setItem("theme",n); ti.setAttribute("data-lucide", n==="dark"?"sun":"moon"); lucide.createIcons(); });\n\n';

  // Counter animation
  content += '  document.querySelectorAll(".stat-val").forEach(el => { const t = parseInt(el.getAttribute("data-target"),10); let c = 0; const inc = t/30; const timer = setInterval(() => { c+=inc; if (c>=t) { el.textContent=t; clearInterval(timer); } else el.textContent=Math.floor(c); }, 20); });\n\n';

  // Search
  content += '  document.getElementById("team-search").addEventListener("input", (e) => { const q = e.target.value.toLowerCase(); document.querySelectorAll(".team-card").forEach(card => { card.classList.toggle("hidden", !card.getAttribute("data-team-name").includes(q)); }); });\n\n';

  // TEAM-KARTE KLICKBAR - FIX: Klick auf gesamte Karte
  content += '  document.querySelectorAll(".team-card").forEach(card => {\n';
  content += '    card.addEventListener("click", (e) => {\n';
  content += '      if (e.target.closest("button, a, .stat, .more-option-item, input, label, .more-options-dropdown")) return;\n';
  content += '      const isExpanded = card.classList.contains("expanded");\n';
  content += '      document.querySelectorAll(".team-card").forEach(c => { if (c !== card) { c.classList.remove("expanded"); resetCardToAll(c); } });\n';
  content += '      if (!isExpanded) card.classList.add("expanded"); else { card.classList.remove("expanded"); resetCardToAll(card); }\n';
  content += '    });\n';
  content += '  });\n\n';

  content += '  function resetCardToAll(card) {\n';
  content += '    card.querySelectorAll(".stat").forEach(s => s.classList.remove("active"));\n';
  content += '    const a = card.querySelector(\'.stat[data-type="all"]\'); if (a) { a.classList.add("active"); updateCardLinks(card, "all"); }\n';
  content += '  }\n\n';

  // Stat click
  content += '  document.querySelectorAll(".stat").forEach(stat => {\n';
  content += '    stat.addEventListener("click", (e) => {\n';
  content += '      e.stopPropagation(); const card = stat.closest(".team-card"); const type = stat.getAttribute("data-type");\n';
  content += '      if (navigator.vibrate) navigator.vibrate(30);\n';
  content += '      card.querySelectorAll(".stat").forEach(s => s.classList.remove("active")); stat.classList.add("active");\n';
  content += '      updateCardLinks(card, type);\n';
  content += '    });\n';
  content += '  });\n\n';

  // Update links
  content += '  function updateCardLinks(card, type) {\n';
  content += '    const urls = { all: card.getAttribute("data-all-url"), home: card.getAttribute("data-home-url"), away: card.getAttribute("data-away-url") };\n';
  content += '    const url = urls[type]; const webcalUrl = url.replace("https://", "webcal://");\n';
  content += '    const labels = { all: "Alle Spiele:", home: "Nur Heimspiele:", away: "Nur Auswärtsspiele:" };\n';
  content += '    const label = card.querySelector(".calendar-type-label"); if (label) label.textContent = labels[type];\n';
  content += '    const al = card.querySelector(\'.calendar-link[data-platform="apple"]\'); if (al) al.href = webcalUrl;\n';
  content += '    card.querySelectorAll(".calendar-link").forEach(l => l.setAttribute("data-url", url));\n';
  content += '    const cb = card.querySelector(".copy-btn"); if (cb) cb.setAttribute("data-copy", url);\n';
  content += '    const db = card.querySelector(".download-file-btn"); if (db) db.href = url;\n';
  content += '    const qb = card.querySelector(".qr-btn"); if (qb) qb.setAttribute("data-url", webcalUrl);\n';
  content += '    card.querySelectorAll(".btn, .more-option-item").forEach(b => { b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash"); });\n';
  content += '    setTimeout(() => card.querySelectorAll(".btn, .more-option-item").forEach(b => b.classList.remove("flash")), 400);\n';
  content += '  }\n\n';

  // More options dropdown
  content += '  document.querySelectorAll(".more-options-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => { e.stopPropagation(); const d = btn.nextElementSibling; document.querySelectorAll(".more-options-dropdown").forEach(x => { if (x !== d) x.classList.remove("active"); }); d.classList.toggle("active"); });\n';
  content += '  });\n';
  content += '  document.addEventListener("click", () => document.querySelectorAll(".more-options-dropdown").forEach(d => d.classList.remove("active")));\n\n';

  // Copy buttons
  content += '  document.querySelectorAll(".copy-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", async (e) => { e.stopPropagation(); const icon = btn.querySelector("i"); const orig = icon.getAttribute("data-lucide");\n';
  content += '      btn.classList.add("loading"); icon.setAttribute("data-lucide","loader-2"); icon.style.animation="spin 1s linear infinite"; lucide.createIcons();\n';
  content += '      try { await navigator.clipboard.writeText(btn.getAttribute("data-copy")); btn.classList.remove("loading"); btn.classList.add("success"); icon.setAttribute("data-lucide","check"); icon.style.animation=""; lucide.createIcons(); showToast("Link kopiert!"); setTimeout(() => { btn.classList.remove("success"); icon.setAttribute("data-lucide",orig); lucide.createIcons(); }, 1500); }\n';
  content += '      catch(err) { btn.classList.remove("loading"); icon.setAttribute("data-lucide",orig); icon.style.animation=""; lucide.createIcons(); }\n';
  content += '    });\n';
  content += '  });\n\n';

  // Calendar buttons
  content += '  document.querySelectorAll(".calendar-link").forEach(btn => {\n';
  content += '    btn.addEventListener("click", async (e) => { e.preventDefault(); e.stopPropagation(); const p = btn.getAttribute("data-platform"); const url = btn.getAttribute("data-url"); if (!url) return;\n';
  content += '      document.querySelectorAll(".more-options-dropdown").forEach(d => d.classList.remove("active"));\n';
  content += '      if (p === "apple") { window.location.href = url.replace("https://","webcal://"); }\n';
  content += '      else if (p === "google") { try { await navigator.clipboard.writeText(url); } catch(err) {} window.open("https://calendar.google.com/calendar/r/settings/addbyurl","_blank"); showToast("Link kopiert! Füge ihn bei Google Calendar ein."); }\n';
  content += '      else if (p === "outlook") { try { await navigator.clipboard.writeText(url); window.open("https://outlook.live.com/calendar/0/addfromweb","_blank"); showToast("Link kopiert! Füge ihn bei Outlook ein."); } catch(err) { window.open("https://outlook.live.com/calendar/0/addfromweb","_blank"); } }\n';
  content += '      else if (p === "share") { const tn = btn.closest(".team-card").querySelector(".team-name").textContent; if (navigator.share) { try { await navigator.share({ title: "TVN Baskets - "+tn, text: "Spielplan für "+tn, url: url }); } catch(err) {} } else { try { await navigator.clipboard.writeText(url); showToast("Link kopiert!"); } catch(err) {} } }\n';
  content += '    });\n';
  content += '  });\n\n';

  // QR Code
  content += '  document.querySelectorAll(".qr-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", (e) => { e.stopPropagation(); const url = btn.getAttribute("data-url"); const qc = document.getElementById("qr-code-container"); qc.innerHTML = ""; new QRCode(qc, { text: url, width: 256, height: 256, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H }); document.getElementById("qr-modal").classList.add("active"); document.querySelectorAll(".more-options-dropdown").forEach(d => d.classList.remove("active")); });\n';
  content += '  });\n';
  content += '  document.getElementById("qr-modal-close").addEventListener("click", () => document.getElementById("qr-modal").classList.remove("active"));\n';
  content += '  document.getElementById("qr-modal").addEventListener("click", (e) => { if (e.target.id === "qr-modal") document.getElementById("qr-modal").classList.remove("active"); });\n\n';

  // MEIN KALENDER - ICS kombinieren im Browser
  content += '  const mcBtn = document.getElementById("my-calendar-btn");\n';
  content += '  const mcModal = document.getElementById("my-calendar-modal");\n';
  content += '  const mcList = document.getElementById("team-checkbox-list");\n';
  content += '  let mcType = "all";\n\n';

  content += '  mcBtn.addEventListener("click", () => {\n';
  content += '    mcList.innerHTML = "";\n';
  content += '    const f = JSON.parse(localStorage.getItem("favorites") || "[]");\n';
  content += '    if (f.length === 0) { showToast("Bitte markiere zuerst Teams als Favoriten!"); return; }\n';
  content += '    f.forEach(tid => {\n';
  content += '      const card = grid.querySelector(\'[data-team-id="\' + tid + \'"]\'); if (!card) return;\n';
  content += '      const tn = card.querySelector(".team-name").textContent;\n';
  content += '      const item = document.createElement("div"); item.className = "team-checkbox-item";\n';
  content += '      item.innerHTML = \'<input type="checkbox" id="mc-\' + tid + \'" value="\' + tid + \'" checked><label for="mc-\' + tid + \'">\' + tn + \'</label>\';\n';
  content += '      mcList.appendChild(item);\n';
  content += '    });\n';
  content += '    mcModal.classList.add("active");\n';
  content += '  });\n\n';

  content += '  document.querySelectorAll(".calendar-type-btn").forEach(btn => {\n';
  content += '    btn.addEventListener("click", () => { document.querySelectorAll(".calendar-type-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); mcType = btn.getAttribute("data-type"); });\n';
  content += '  });\n\n';

  content += '  document.getElementById("my-calendar-cancel").addEventListener("click", () => mcModal.classList.remove("active"));\n';
  content += '  mcModal.addEventListener("click", (e) => { if (e.target.id === "my-calendar-modal") mcModal.classList.remove("active"); });\n\n';

  // ICS kombinieren
  content += '  document.getElementById("my-calendar-create").addEventListener("click", async () => {\n';
  content += '    const selected = Array.from(mcList.querySelectorAll("input:checked")).map(cb => cb.value);\n';
  content += '    if (selected.length === 0) { showToast("Bitte wähle mindestens ein Team!"); return; }\n';
  content += '    showToast("Kalender wird erstellt...");\n';
  content += '    mcModal.classList.remove("active");\n\n';

  content += '    try {\n';
  content += '      let allEvents = [];\n';
  content += '      const seenUIDs = new Set();\n';
  content += '      for (const tid of selected) {\n';
  content += '        const card = grid.querySelector(\'[data-team-id="\' + tid + \'"]\');\n';
  content += '        const url = card ? card.getAttribute("data-" + mcType + "-url") : "";\n';
  content += '        if (!url) continue;\n';
  content += '        const res = await fetch(url);\n';
  content += '        if (!res.ok) continue;\n';
  content += '        const text = await res.text();\n';
  content += '        const lines = text.split(/\\r?\\n/);\n';
  content += '        let inEvent = false; let ev = [];\n';
  content += '        for (const line of lines) {\n';
  content += '          if (line === "BEGIN:VEVENT") { inEvent = true; ev = [line]; }\n';
  content += '          else if (line === "END:VEVENT") { ev.push(line); const uid = ev.join("\\n").match(/UID:(.+)/); if (!uid || !seenUIDs.has(uid[1])) { allEvents.push(ev.join("\\r\\n")); if (uid) seenUIDs.add(uid[1]); } inEvent = false; }\n';
  content += '          else if (inEvent) ev.push(line);\n';
  content += '        }\n';
  content += '      }\n';
  content += '      if (allEvents.length === 0) { showToast("Keine Spiele gefunden!"); return; }\n';
  content += '      const ics = "BEGIN:VCALENDAR\\r\\nVERSION:2.0\\r\\nPRODID:-//TVN Baskets//DE\\r\\nCALSCALE:GREGORIAN\\r\\nMETHOD:PUBLISH\\r\\nX-WR-CALNAME:Mein TVN Kalender\\r\\nX-WR-TIMEZONE:Europe/Berlin\\r\\n" + allEvents.join("\\r\\n") + "\\r\\nEND:VCALENDAR";\n';
  content += '      const blob = new Blob([ics], { type: "text/calendar" });\n';
  content += '      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mein_tvn_kalender.ics"; a.click(); URL.revokeObjectURL(a.href);\n';
  content += '      showToast("Kalender heruntergeladen! Importiere ihn in deine Kalender-App.");\n';
  content += '    } catch(err) { console.error(err); showToast("Fehler beim Erstellen des Kalenders."); }\n';
  content += '  });\n\n';

  content += '  function showToast(msg) { const t = document.getElementById("toast"); document.getElementById("toast-text").textContent = msg; t.classList.add("active"); setTimeout(() => t.classList.remove("active"), 3000); }\n';
  content += '});\n';
  content += '<\/script>\n</body>\n</html>';

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
  console.log('✅ index.html generiert.');

  const manifest = { name: "TV Neunkirchen Baskets – Kalender", short_name: "TVN Baskets", description: "Offizielle Kalenderübersicht", start_url: "/", display: "standalone", background_color: "#F8FAFC", theme_color: "#FF6B00", icons: [{ src: "Logo.png", sizes: "192x192", type: "image/png" }, { src: "Logo.png", sizes: "512x512", type: "image/png" }] };
  fs.writeFileSync(path.resolve(__dirname, '../generated/manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  const sw = "const C='v1';const U=['/','/index.html','/Logo.png','/manifest.json'];self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(U)))});self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});";
  fs.writeFileSync(path.resolve(__dirname, '../generated/sw.js'), sw, 'utf8');
}

genHTML();
