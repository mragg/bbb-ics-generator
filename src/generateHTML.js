// complete generator script — mit Kalender-Direkt-Links, Share API & Print-CSS
const fs = require('fs');
const path = require('path');

function makeWebcalLink(filename) {
  return `https://mragg.github.io/bbb-ics-generator/${filename}`;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Fehler beim Einlesen von ${filePath}:`, err.message);
    return null;
  }
}

function normalizeId(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
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

  const content = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TV Neunkirchen Baskets – Kalender</title>

<meta name="theme-color" content="#FF6B00">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TVN Baskets">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="Logo.png">

<meta property="og:title" content="TV Neunkirchen Baskets – Kalender">
<meta property="og:description" content="Offizielle, immer aktuelle Spielpläne für alle Teams. Einfach abonnieren.">
<meta property="og:image" content="https://mragg.github.io/bbb-ics-generator/Logo.png">
<meta property="og:url" content="https://mragg.github.io/bbb-ics-generator/">
<meta property="og:type" content="website">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;700&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>
:root {
  --color-primary: #FF6B00;
  --color-primary-hover: #E55A00;
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-border: #E2E8F0;
  --color-gold: #FFD700;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --color-bg: #0F172A; --color-surface: #1E293B; --color-text: #F1F5F9;
  --color-text-muted: #94A3B8; --color-border: #334155;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Inter', sans-serif; background-color: var(--color-bg); color: var(--color-text);
  line-height: 1.5; -webkit-font-smoothing: antialiased; min-height: 100dvh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
  background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: var(--radius-md);
}
@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.skeleton-card { height: 180px; margin-bottom: 1.5rem; }

.header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; padding: 2rem 1.5rem; position: relative; overflow: hidden; }
.header-inner { max-width: 1024px; margin: 0 auto; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.logo { height: 80px; width: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
.header-text { flex: 1; }
.header-text h1 { font-family: 'Oswald', sans-serif; font-size: 2.25rem; font-weight: 700; text-transform: uppercase; }
.header-text p { color: #94A3B8; margin-top: 0.5rem; font-size: 0.95rem; }

.theme-toggle { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.6rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }
.theme-toggle:hover { background: rgba(255,255,255,0.2); }

.container { max-width: 1024px; margin: 0 auto; padding: 2rem 1.5rem; }

.quick-access {
  position: sticky; top: 0; z-index: 100; background: var(--color-surface);
  border-bottom: 1px solid var(--color-border); padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow-sm); display: none; margin-bottom: 2rem;
}
.quick-access.active { display: block; }
.quick-access-inner { max-width: 1024px; margin: 0 auto; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.quick-access-label { font-size: 0.875rem; color: var(--color-text-muted); font-weight: 600; margin-right: 0.5rem; }
.quick-access-pill {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white; padding: 0.5rem 1rem; border-radius: 99px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: var(--transition); border: none; display: flex; align-items: center; gap: 0.375rem;
}
.quick-access-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,107,0,0.3); }
.quick-access-pill i { width: 14px; height: 14px; }

.search-wrapper { margin-bottom: 2rem; position: relative; }
.search-input { width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border: 2px solid var(--color-border); border-radius: var(--radius-md); font-size: 1rem; background: var(--color-surface); color: var(--color-text); transition: var(--transition); }
.search-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15); }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none; }

.instructions { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--color-border); }
.inst-header { display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 500; }
.inst-header i { transition: var(--transition); }
.inst-header.active i { transform: rotate(180deg); }
.inst-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; color: var(--color-text-muted); }
.inst-content.active { max-height: 500px; margin-top: 1rem; }

.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
.team-card { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); transition: var(--transition); overflow: hidden; position: relative; }
.team-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary); }
.team-card.hidden { display: none !important; }
.team-card.favorite { border: 2px solid var(--color-gold); box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
.team-card.keyboard-focus { outline: 3px solid var(--color-primary); outline-offset: 2px; }

.favorite-btn {
  position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10;
  background: rgba(255,255,255,0.9); border: none; border-radius: 50%;
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: var(--transition); box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
[data-theme="dark"] .favorite-btn { background: rgba(30,41,59,0.9); }
.favorite-btn:hover { transform: scale(1.1); }
.favorite-btn i { color: var(--color-text-muted); transition: var(--transition); }
.favorite-btn.active i { color: var(--color-gold); fill: var(--color-gold); }
@keyframes favorite-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
@keyframes favorite-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.favorite-btn.animating { animation: favorite-pulse 0.4s ease, favorite-bounce 0.4s ease; }

.team-card-header { padding: 1.25rem; background: linear-gradient(to right, #FFF7ED, #FFFFFF); border-bottom: 1px solid var(--color-border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding-right: 3.5rem; }
[data-theme="dark"] .team-card-header { background: linear-gradient(to right, #1E293B, #334155); }
.team-name { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; }
.team-badge { background: var(--color-text); color: white; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 99px; }

.team-stats { display: flex; justify-content: space-around; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); background: #FAFAFA; }
[data-theme="dark"] .team-stats { background: #0F172A; }
.stat { text-align: center; transition: var(--transition); cursor: default; }
.stat-val { font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--color-primary); transition: var(--transition); }
.stat-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 4px; transition: var(--transition); }
.team-stats:hover .stat { opacity: 0.4; }
.team-stats .stat:hover { opacity: 1; transform: scale(1.1); }
.team-stats .stat:hover .stat-val { font-size: 1.8rem; }

.team-actions { padding: 1.25rem; display: grid; gap: 0.75rem; opacity: 0; max-height: 0; transition: var(--transition); }
.team-card.expanded .team-actions { opacity: 1; max-height: 600px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: var(--transition); border: none; cursor: pointer; width: 100%; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: var(--color-surface); }
.btn-copy { background: #F1F5F9; color: var(--color-text); font-size: 0.8rem; padding: 0.5rem 0.75rem; width: auto; position: relative; }
[data-theme="dark"] .btn-copy { background: #334155; }
.btn-copy:hover { background: #E2E8F0; }
.btn-copy.loading { pointer-events: none; opacity: 0.7; }
.btn-copy.success { background: #10B981; color: white; }

.calendar-buttons { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.calendar-btn {
  flex: 1; min-width: 60px; padding: 0.5rem; border-radius: var(--radius-sm);
  border: 1px solid var(--color-border); background: var(--color-surface);
  cursor: pointer; transition: var(--transition); display: flex; flex-direction: column;
  align-items: center; gap: 0.25rem; font-size: 0.7rem; font-weight: 600;
  color: var(--color-text-muted); text-decoration: none;
}
.calendar-btn:hover { border-color: var(--color-primary); color: var(--color-primary); transform: translateY(-2px); }
.calendar-btn i { width: 18px; height: 18px; }
.calendar-btn-apple { background: #F5F5F7; }
.calendar-btn-apple:hover { background: #000; color: white; border-color: #000; }
.calendar-btn-google { background: #F8F9FA; }
.calendar-btn-google:hover { background: #4285F4; color: white; border-color: #4285F4; }
.calendar-btn-outlook { background: #F3F2F1; }
.calendar-btn-outlook:hover { background: #0078D4; color: white; border-color: #0078D4; }

.share-btn {
  background: #F1F5F9; color: var(--color-text); padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm); border: none; cursor: pointer;
  transition: var(--transition); display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8rem; font-weight: 600;
}
[data-theme="dark"] .share-btn { background: #334155; }
.share-btn:hover { background: #E2E8F0; transform: translateY(-1px); }
.share-btn i { width: 14px; height: 14px; }

.link-row { display: flex; gap: 0.5rem; align-items: center; }
.link-row .btn { flex: 1; }

.empty-state {
  grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;
  background: var(--color-surface); border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}
.empty-state-icon { width: 64px; height: 64px; color: var(--color-text-muted); margin: 0 auto 1rem; opacity: 0.5; }
.empty-state-title { font-family: 'Oswald', sans-serif; font-size: 1.5rem; color: var(--color-text); margin-bottom: 0.5rem; }
.empty-state-text { color: var(--color-text-muted); font-size: 0.95rem; }

.download-section {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  border-radius: var(--radius-lg); padding: 2.5rem; text-align: center;
  margin-bottom: 3rem; position: relative; overflow: hidden;
}
.download-section::before {
  content: ''; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%); border-radius: 50%;
}
.download-section h2 { font-family: 'Oswald', sans-serif; font-size: 1.75rem; color: white; margin-bottom: 0.5rem; position: relative; }
.download-section p { color: #94A3B8; max-width: 500px; margin: 0 auto 1.5rem; position: relative; }
.download-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; }
.download-btn {
  display: inline-flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem;
  border-radius: var(--radius-md); font-weight: 600; font-size: 1rem; text-decoration: none;
  transition: var(--transition); border: none; cursor: pointer;
}
.download-btn-excel { background: #217346; color: white; }
.download-btn-excel:hover { background: #1a5c38; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(33,115,70,0.3); }
.download-btn-pdf { background: #D32F2F; color: white; }
.download-btn-pdf:hover { background: #b71c1c; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(211,47,47,0.3); }
.download-btn i { width: 20px; height: 20px; }
.download-btn-text { text-align: left; }
.download-btn-label { font-size: 0.75rem; opacity: 0.8; display: block; }
.download-btn-name { font-size: 1rem; font-weight: 700; display: block; }

.toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(100px); background: var(--color-text); color: var(--color-surface); padding: 0.875rem 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; opacity: 0; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.5rem; }
.toast.active { opacity: 1; transform: translateX(-50%) translateY(0); }

#konfetti-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; }

.scroll-top-btn {
  position: fixed; bottom: 2rem; right: 2rem; width: 48px; height: 48px;
  background: var(--color-primary); color: white; border: none; border-radius: 50%;
  cursor: pointer; box-shadow: var(--shadow-lg); z-index: 90;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; visibility: hidden; transition: var(--transition);
}
.scroll-top-btn.active { opacity: 1; visibility: visible; }
.scroll-top-btn:hover { background: var(--color-primary-hover); transform: translateY(-4px); }
.scroll-top-btn i { width: 24px; height: 24px; }

.context-menu {
  position: fixed; background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 0.5rem 0;
  z-index: 200; min-width: 200px; display: none;
}
.context-menu.active { display: block; }
.context-menu-item {
  padding: 0.625rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.9rem; transition: var(--transition);
}
.context-menu-item:hover { background: var(--color-bg); }
.context-menu-item i { width: 16px; height: 16px; color: var(--color-primary); }

.footer { text-align: center; padding: 2rem 1.5rem; color: var(--color-text-muted); font-size: 0.875rem; border-top: 1px solid var(--color-border); }
.footer a { color: var(--color-primary); text-decoration: none; font-weight: 600; }

@media print {
  @page { size: A4; margin: 1.5cm; }
  body { background: white !important; color: black !important; font-size: 10pt; }
  .header, .quick-access, .search-wrapper, .instructions, .download-section,
  .scroll-top-btn, .context-menu, .toast, #konfetti-canvas, #skeleton-loader,
  .theme-toggle, .favorite-btn, .share-btn, .btn-copy, .calendar-buttons,
  .footer { display: none !important; }
  .container { max-width: 100%; padding: 0; margin: 0; }
  .teams-grid { display: block; }
  .team-card {
    break-inside: avoid; page-break-inside: avoid;
    border: 1px solid #ccc; margin-bottom: 1cm; box-shadow: none !important;
  }
  .team-card.expanded .team-actions { opacity: 1 !important; max-height: none !important; }
  .team-card-header { background: #f5f5f5 !important; }
  .btn-primary, .btn-outline {
    background: white !important; color: black !important; border: 1px solid #ccc !important;
    font-size: 9pt; padding: 0.3rem 0.5rem;
  }
  .link-row { display: block; }
  .link-row a { display: block; margin-bottom: 0.3rem; word-break: break-all; }
}

@media (max-width: 640px) {
  .header-inner { flex-direction: column; text-align: center; }
  .logo { height: 60px; }
  .teams-grid { grid-template-columns: 1fr; }
  .link-row { flex-direction: column; }
  .link-row .btn-copy { width: 100%; min-height: 44px; }
  .quick-access-inner { justify-content: center; }
  .scroll-top-btn { bottom: 1rem; right: 1rem; width: 44px; height: 44px; }
  .download-buttons { flex-direction: column; align-items: stretch; }
  .download-btn { justify-content: center; }
  .favorite-btn { width: 44px; height: 44px; }
  .btn-copy { min-height: 44px; }
  .calendar-buttons { flex-direction: column; }
  .calendar-btn { min-width: 100%; }
}
</style>
</head>
<body>

<div id="skeleton-loader">
  <div class="container">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
  </div>
</div>

<canvas id="konfetti-canvas"></canvas>

<header class="header" id="main-header" style="display:none;">
  <div class="header-inner">
    <img src="Logo.png" class="logo" alt="TVN Logo">
    <div class="header-text">
      <h1>TV Neunkirchen Baskets</h1>
      <p>Kalenderübersicht • Stand: ${new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</p>
    </div>
    <button class="theme-toggle" id="theme-toggle" aria-label="Theme wechseln">
      <i data-lucide="moon" id="theme-icon" style="width:20px;height:20px;"></i>
    </button>
  </div>
</header>

<div class="quick-access" id="quick-access">
  <div class="quick-access-inner">
    <span class="quick-access-label">⭐ Deine Favoriten:</span>
    <div id="quick-access-pills"></div>
  </div>
</div>

<main class="container" id="main-content" style="display:none;">
  <div class="instructions">
    <div class="inst-header" id="inst-toggle">
      <span style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="help-circle" style="width:20px;height:20px;color:var(--color-primary)"></i> So abonnierst du den Kalender</span>
      <i data-lucide="chevron-down" style="width:20px;height:20px;"></i>
    </div>
    <div class="inst-content" id="inst-content">
      <p style="padding:0.5rem 0;">1. Wähle dein Team und klicke auf den Button deines Kalender-Programms.<br>2. Bestätige das Hinzufügen des Kalenders.<br>3. Fertig! Der Kalender aktualisiert sich automatisch.</p>
    </div>
  </div>

  <div class="search-wrapper">
    <i data-lucide="search" class="search-icon" style="width:20px;height:20px;"></i>
    <input type="text" class="search-input" id="team-search" placeholder="Team suchen (z.B. U14, Herren, Damen)...">
  </div>

  <div class="teams-grid" id="teams-grid">
    ${teams.map((t, index) => {
      const icsUrl = makeWebcalLink(t.teamId ? t.teamId + '_all.ics' : encodeURIComponent(t.name) + '_all.ics');
      const webcalUrl = icsUrl.replace('https://', 'webcal://');
      
      return '<div class="team-card" data-team-id="' + t.teamId + '" data-team-name="' + t.name.toLowerCase() + ' ' + t.ageGroup.toLowerCase() + '" data-original-index="' + index + '">' +
        '<button class="favorite-btn" aria-label="Als Favorit markieren">' +
          '<i data-lucide="heart" style="width:18px;height:18px;"></i>' +
        '</button>' +
        '<div class="team-card-header">' +
          '<span class="team-name">' + t.name + '</span>' +
          (t.ageGroup ? '<span class="team-badge">' + t.ageGroup + '</span>' : '') +
        '</div>' +
        '<div class="team-stats">' +
          '<div class="stat"><div class="stat-val" data-target="' + t.matchCount + '">0</div><div class="stat-label"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Gesamt</div></div>' +
          '<div class="stat"><div class="stat-val" data-target="' + t.homeMatchCount + '">0</div><div class="stat-label"><i data-lucide="home" style="width:12px;height:12px;"></i> Heim</div></div>' +
          '<div class="stat"><div class="stat-val" data-target="' + t.awayMatchCount + '">0</div><div class="stat-label"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> Auswärts</div></div>' +
        '</div>' +
        '<div class="team-actions">' +
          '<div style="margin-bottom:0.5rem;font-weight:600;font-size:0.9rem;">Alle Spiele:</div>' +
          '<div class="calendar-buttons" data-calendar-type="all" data-team-name="' + t.name + '">' +
            '<a href="' + webcalUrl + '" class="calendar-btn calendar-btn-apple" title="Apple Kalender">' +
              '<i data-lucide="apple"></i>' +
              '<span>Apple</span>' +
            '</a>' +
            '<button class="calendar-btn calendar-btn-google" data-action="google" data-url="' + icsUrl + '" title="Google Calendar">' +
              '<i data-lucide="calendar"></i>' +
              '<span>Google</span>' +
            '</button>' +
            '<button class="calendar-btn calendar-btn-outlook" data-action="outlook" data-url="' + icsUrl + '" title="Outlook">' +
              '<i data-lucide="mail"></i>' +
              '<span>Outlook</span>' +
            '</button>' +
            '<button class="share-btn" data-action="share" data-url="' + icsUrl + '" data-team="' + t.name + '">' +
              '<i data-lucide="share-2"></i>' +
              '<span>Teilen</span>' +
            '</button>' +
          '</div>' +
          '<div class="link-row" style="margin-top:0.5rem;">' +
            '<button class="btn btn-copy copy-btn" data-copy="' + icsUrl + '">' +
              '<i data-lucide="copy" style="width:14px;height:14px;"></i> Link kopieren' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('')}
  </div>

  ${excelExists || pdfExists ? '<div class="download-section"><i data-lucide="download" style="width:40px;height:40px;color:var(--color-primary);margin-bottom:0.5rem;position:relative;"></i><h2>Gesamt-Spielplan herunterladen</h2><p>Alle Spiele aller Mannschaften chronologisch sortiert in einer Datei.</p><div class="download-buttons">' + (excelExists ? '<a href="Gesamt-Spielplan.xlsx" download class="download-btn download-btn-excel"><i data-lucide="table"></i><div class="download-btn-text"><span class="download-btn-label">Excel-Datei</span><span class="download-btn-name">Gesamt-Spielplan.xlsx</span></div></a>' : '') + (pdfExists ? '<a href="Gesamt-Spielplan.pdf" download class="download-btn download-btn-pdf"><i data-lucide="file-text"></i><div class="download-btn-text"><span class="download-btn-label">PDF-Datei</span><span class="download-btn-name">Gesamt-Spielplan.pdf</span></div></a>' : '') + '</div></div>' : ''}
</main>

<footer class="footer" id="main-footer" style="display:none;">
  <p>© ${new Date().getFullYear()} TV Neunkirchen Baskets. <a href="https://www.tvn-baskets.de/teams/">Zurück zur Hauptseite</a></p>
</footer>

<button class="scroll-top-btn" id="scroll-top-btn" aria-label="Nach oben scrollen">
  <i data-lucide="arrow-up"></i>
</button>

<div class="context-menu" id="context-menu">
  <div class="context-menu-item" data-action="expand"><i data-lucide="chevron-down"></i><span>Aufklappen</span></div>
  <div class="context-menu-item" data-action="favorite"><i data-lucide="heart"></i><span>Als Favorit markieren</span></div>
  <div class="context-menu-item" data-action="copy-all"><i data-lucide="copy"></i><span>Link kopieren</span></div>
</div>

<div class="toast" id="toast">
  <i data-lucide="check-circle" style="width:18px;height:18px;"></i>
  <span id="toast-text">Link kopiert!</span>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('skeleton-loader').style.display = 'none';
    document.getElementById('main-header').style.display = 'block';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('main-footer').style.display = 'block';
    lucide.createIcons();
    
    if (!localStorage.getItem('konfetti_shown')) {
      startKonfetti();
      localStorage.setItem('konfetti_shown', 'true');
    }
  }, 400);

  const grid = document.getElementById('teams-grid');
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  let currentKeyboardIndex = -1;

  document.querySelectorAll('.team-card').forEach(card => {
    const teamId = card.getAttribute('data-team-id');
    if (favorites.includes(teamId)) {
      card.classList.add('favorite');
      card.querySelector('.favorite-btn').classList.add('active');
    }
  });
  
  sortCards();
  updateQuickAccess();

  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.team-card');
      const teamId = card.getAttribute('data-team-id');
      btn.classList.add('animating');
      setTimeout(() => btn.classList.remove('animating'), 400);
      card.classList.toggle('favorite');
      btn.classList.toggle('active');
      if (navigator.vibrate) navigator.vibrate(50);
      const currentFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (card.classList.contains('favorite')) {
        if (!currentFavs.includes(teamId)) currentFavs.push(teamId);
      } else {
        const idx = currentFavs.indexOf(teamId);
        if (idx > -1) currentFavs.splice(idx, 1);
      }
      localStorage.setItem('favorites', JSON.stringify(currentFavs));
      sortCards();
      updateQuickAccess();
    });
  });

  function sortCards() {
    const cards = Array.from(grid.querySelectorAll('.team-card'));
    cards.sort((a, b) => {
      const aFav = a.classList.contains('favorite') ? 0 : 1;
      const bFav = b.classList.contains('favorite') ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return parseInt(a.getAttribute('data-original-index')) - parseInt(b.getAttribute('data-original-index'));
    });
    cards.forEach(card => grid.appendChild(card));
  }

  function updateQuickAccess() {
    const quickAccess = document.getElementById('quick-access');
    const pillsContainer = document.getElementById('quick-access-pills');
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favs.length === 0) { quickAccess.classList.remove('active'); return; }
    quickAccess.classList.add('active');
    pillsContainer.innerHTML = '';
    favs.forEach(teamId => {
      const card = grid.querySelector('[data-team-id="' + teamId + '"]');
      if (!card) return;
      const teamName = card.querySelector('.team-name').textContent;
      const pill = document.createElement('button');
      pill.className = 'quick-access-pill';
      pill.innerHTML = '<i data-lucide="basketball"></i> ' + teamName;
      pill.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('expanded');
        setTimeout(() => { document.querySelectorAll('.team-card').forEach(c => { if (c !== card) c.classList.remove('expanded'); }); }, 500);
      });
      pillsContainer.appendChild(pill);
    });
    lucide.createIcons();
  }

  document.addEventListener('keydown', (e) => {
    const cards = Array.from(grid.querySelectorAll('.team-card:not(.hidden)'));
    if (cards.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); currentKeyboardIndex = Math.min(currentKeyboardIndex + 1, cards.length - 1); updateKeyboardFocus(cards); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); currentKeyboardIndex = Math.max(currentKeyboardIndex - 1, 0); updateKeyboardFocus(cards); }
    else if (e.key === 'Enter' && currentKeyboardIndex >= 0) { e.preventDefault(); cards[currentKeyboardIndex].classList.toggle('expanded'); cards[currentKeyboardIndex].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else if (e.key === 'f' && currentKeyboardIndex >= 0) { e.preventDefault(); cards[currentKeyboardIndex].querySelector('.favorite-btn').click(); }
    else if (e.key === 'Escape') { document.querySelectorAll('.team-card').forEach(c => c.classList.remove('expanded', 'keyboard-focus')); currentKeyboardIndex = -1; }
  });

  function updateKeyboardFocus(cards) {
    cards.forEach(c => c.classList.remove('keyboard-focus'));
    if (currentKeyboardIndex >= 0 && currentKeyboardIndex < cards.length) {
      cards[currentKeyboardIndex].classList.add('keyboard-focus');
      cards[currentKeyboardIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const contextMenu = document.getElementById('context-menu');
  let contextCard = null;
  document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault(); contextCard = card;
      contextMenu.style.left = e.clientX + 'px'; contextMenu.style.top = e.clientY + 'px';
      contextMenu.classList.add('active');
      const isExpanded = card.classList.contains('expanded');
      const isFavorite = card.classList.contains('favorite');
      contextMenu.querySelector('[data-action="expand"] span').textContent = isExpanded ? 'Zuklappen' : 'Aufklappen';
      contextMenu.querySelector('[data-action="favorite"] span').textContent = isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren';
      lucide.createIcons();
    });
  });
  document.addEventListener('click', () => contextMenu.classList.remove('active'));
  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation(); if (!contextCard) return;
      const action = item.getAttribute('data-action');
      if (action === 'expand') contextCard.classList.toggle('expanded');
      else if (action === 'favorite') contextCard.querySelector('.favorite-btn').click();
      else if (action === 'copy-all') {
        const btn = contextCard.querySelector('.copy-btn');
        if (btn) btn.click();
      }
      contextMenu.classList.remove('active');
    });
  });

  const scrollTopBtn = document.getElementById('scroll-top-btn');
  window.addEventListener('scroll', () => { scrollTopBtn.classList.toggle('active', window.scrollY > 300); });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  function startKonfetti() {
    const canvas = document.getElementById('konfetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = []; const colors = ['#FF6B00', '#FFD700', '#FFFFFF', '#E55A00'];
    for (let i = 0; i < 150; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2, size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10 });
    }
    let frame = 0;
    function animate() {
      if (frame >= 180) { canvas.style.display = 'none'; return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rotation += p.rotationSpeed; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore(); });
      frame++; requestAnimationFrame(animate);
    }
    animate();
  }

  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); themeIcon.setAttribute('data-lucide', 'sun'); lucide.createIcons(); }
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); localStorage.setItem('theme', next);
    themeIcon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon'); lucide.createIcons();
  });

  document.querySelectorAll('.stat-val').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10); let current = 0; const increment = target / 30;
    const timer = setInterval(() => { current += increment; if (current >= target) { el.textContent = target; clearInterval(timer); } else el.textContent = Math.floor(current); }, 20);
  });

  document.getElementById('team-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    let visibleCount = 0;
    
    document.querySelectorAll('.team-card').forEach(card => {
      const name = card.getAttribute('data-team-name');
      if (name.includes(query)) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    let emptyState = document.getElementById('empty-state');
    if (visibleCount === 0 && query.length > 0) {
      if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.id = 'empty-state';
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<i data-lucide="search-x" class="empty-state-icon"></i><div class="empty-state-title">Keine Teams gefunden</div><div class="empty-state-text">Versuche einen anderen Suchbegriff oder lösche die Suche.</div>';
        grid.appendChild(emptyState);
        lucide.createIcons();
      }
    } else if (emptyState) {
      emptyState.remove();
    }
  });

  document.querySelectorAll('.team-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement; const isExpanded = card.classList.contains('expanded');
      document.querySelectorAll('.team-card').forEach(c => c.classList.remove('expanded'));
      if (!isExpanded) card.classList.add('expanded');
    });
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const icon = btn.querySelector('i');
      const originalIcon = icon.getAttribute('data-lucide');
      
      btn.classList.add('loading');
      icon.setAttribute('data-lucide', 'loader-2');
      icon.style.animation = 'spin 1s linear infinite';
      lucide.createIcons();
      
      try {
        await navigator.clipboard.writeText(btn.getAttribute('data-copy'));
        
        btn.classList.remove('loading');
        btn.classList.add('success');
        icon.setAttribute('data-lucide', 'check');
        icon.style.animation = '';
        lucide.createIcons();
        
        const toast = document.getElementById('toast');
        toast.classList.add('active');
        
        setTimeout(() => {
          btn.classList.remove('success');
          icon.setAttribute('data-lucide', originalIcon);
          lucide.createIcons();
          toast.classList.remove('active');
        }, 1500);
      } catch (err) {
        console.error('Kopieren fehlgeschlagen', err);
        btn.classList.remove('loading');
        icon.setAttribute('data-lucide', originalIcon);
        icon.style.animation = '';
        lucide.createIcons();
      }
    });
  });

  document.querySelectorAll('.calendar-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-action');
      const url = btn.getAttribute('data-url');
      
      if (action === 'google') {
        try {
          await navigator.clipboard.writeText(url);
          window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank');
          showToast('Link kopiert! Füge ihn bei Google Calendar ein.');
        } catch (err) {
          window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank');
          showToast('Kopiere den Link und füge ihn bei Google Calendar ein.');
        }
      } else if (action === 'outlook') {
        try {
          await navigator.clipboard.writeText(url);
          window.open('https://outlook.live.com/calendar/0/addfromweb', '_blank');
          showToast('Link kopiert! Füge ihn bei Outlook ein.');
        } catch (err) {
          window.open('https://outlook.live.com/calendar/0/addfromweb', '_blank');
          showToast('Kopiere den Link und füge ihn bei Outlook ein.');
        }
      }
    });
  });

  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.getAttribute('data-url');
      const team = btn.getAttribute('data-team');
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'TVN Baskets - ' + team,
            text: 'Hier ist der Spielplan für ' + team,
            url: url
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Teilen fehlgeschlagen', err);
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          showToast('Link kopiert!');
        } catch (err) {
          console.error('Kopieren fehlgeschlagen', err);
        }
      }
    });
  });

  function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
  }

  document.getElementById('inst-toggle').addEventListener('click', () => { document.getElementById('inst-toggle').classList.toggle('active'); document.getElementById('inst-content').classList.toggle('active'); });

  if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js').catch(() => {}); }
});
</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
  console.log('✅ index.html mit Kalender-Direkt-Links, Share API & Print-CSS generiert.');

  const manifest = { name: "TV Neunkirchen Baskets – Kalender", short_name: "TVN Baskets", description: "Offizielle Kalenderübersicht für alle Teams", start_url: "/", display: "standalone", background_color: "#F8FAFC", theme_color: "#FF6B00", icons: [{ src: "Logo.png", sizes: "192x192", type: "image/png" }, { src: "Logo.png", sizes: "512x512", type: "image/png" }] };
  fs.writeFileSync(path.resolve(__dirname, '../generated/manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const swContent = `const CACHE_NAME='tvn-baskets-v1';const urlsToCache=['/','/index.html','/Logo.png','/manifest.json'];self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache)))});self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});`;
  fs.writeFileSync(path.resolve(__dirname, '../generated/sw.js'), swContent, 'utf8');
}

genHTML();
