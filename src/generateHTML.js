// complete generator script — mit Animationen, Schnellzugriff, Tastatur-Navigation & mehr
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

/* FEATURE 5: SCHNELLZUGRIFF-LEISTE */
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

/* FEATURE 3: FAVORIT-ANIMATION */
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

/* FEATURE 4: STATISTIK-HOVER-EFFEKT */
.team-stats:hover .stat { opacity: 0.4; }
.team-stats .stat:hover { opacity: 1; transform: scale(1.1); }
.team-stats .stat:hover .stat-val { font-size: 1.8rem; }

.team-actions { padding: 1.25rem; display: grid; gap: 0.75rem; opacity: 0; max-height: 0; transition: var(--transition); }
.team-card.expanded .team-actions { opacity: 1; max-height: 400px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: var(--transition); border: none; cursor: pointer; width: 100%; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: var(--color-surface); }
.btn-copy { background: #F1F5F9; color: var(--color-text); font-size: 0.8rem; padding: 0.5rem 0.75rem; width: auto; }
[data-theme="dark"] .btn-copy { background: #334155; }
.btn-copy:hover { background: #E2E8F0; }
.link-row { display: flex; gap: 0.5rem; align-items: center; }
.link-row .btn { flex: 1; }

.toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(100px); background: var(--color-text); color: var(--color-surface); padding: 0.875rem 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; opacity: 0; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.5rem; }
.toast.active { opacity: 1; transform: translateX(-50%) translateY(0); }

#konfetti-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; }

/* FEATURE 8: ZURÜCK-NACH-OBEN-BUTTON */
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

/* FEATURE 7: KONTEXT-MENÜ */
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

@media (max-width: 640px) {
  .header-inner { flex-direction: column; text-align: center; }
  .logo { height: 60px; }
  .teams-grid { grid-template-columns: 1fr; }
  .link-row { flex-direction: column; }
  .link-row .btn-copy { width: 100%; }
  .quick-access-inner { justify-content: center; }
  .scroll-top-btn { bottom: 1rem; right: 1rem; width: 44px; height: 44px; }
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

<!-- FEATURE 5: SCHNELLZUGRIFF-LEISTE -->
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
      <p style="padding:0.5rem 0;">1. Wähle dein Team und kopiere den Link.<br>2. Öffne deine Kalender-App > "Kalender hinzufügen" > "Aus dem Internet".<br>3. Link einfügen und fertig.</p>
    </div>
  </div>

  <div class="search-wrapper">
    <i data-lucide="search" class="search-icon" style="width:20px;height:20px;"></i>
    <input type="text" class="search-input" id="team-search" placeholder="Team suchen (z.B. U14, Herren, Damen)...">
  </div>

  <div class="teams-grid" id="teams-grid">
    ${teams.map((t, index) => {
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
          '<div class="link-row">' +
            '<a href="' + makeWebcalLink(t.teamId ? t.teamId + '_all.ics' : encodeURIComponent(t.name) + '_all.ics') + '" class="btn btn-primary">' +
              '<i data-lucide="calendar-plus" style="width:16px;height:16px;"></i> Alle Spiele' +
            '</a>' +
            '<button class="btn btn-copy copy-btn" data-copy="' + makeWebcalLink(t.teamId ? t.teamId + '_all.ics' : encodeURIComponent(t.name) + '_all.ics') + '">' +
              '<i data-lucide="copy" style="width:14px;height:14px;"></i>' +
            '</button>' +
          '</div>' +
          '<div class="link-row">' +
            '<a href="' + makeWebcalLink(t.teamId ? t.teamId + '_home.ics' : encodeURIComponent(t.name) + '_home.ics') + '" class="btn btn-outline">' +
              '<i data-lucide="home" style="width:16px;height:16px;"></i> Heimspiele' +
            '</a>' +
            '<button class="btn btn-copy copy-btn" data-copy="' + makeWebcalLink(t.teamId ? t.teamId + '_home.ics' : encodeURIComponent(t.name) + '_home.ics') + '">' +
              '<i data-lucide="copy" style="width:14px;height:14px;"></i>' +
            '</button>' +
          '</div>' +
          '<div class="link-row">' +
            '<a href="' + makeWebcalLink(t.teamId ? t.teamId + '_away.ics' : encodeURIComponent(t.name) + '_away.ics') + '" class="btn btn-outline">' +
              '<i data-lucide="map-pin" style="width:16px;height:16px;"></i> Auswärts' +
            '</a>' +
            '<button class="btn btn-copy copy-btn" data-copy="' + makeWebcalLink(t.teamId ? t.teamId + '_away.ics' : encodeURIComponent(t.name) + '_away.ics') + '">' +
              '<i data-lucide="copy" style="width:14px;height:14px;"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('')}
  </div>
</main>

<footer class="footer" id="main-footer" style="display:none;">
  <p>© ${new Date().getFullYear()} TV Neunkirchen Baskets. <a href="https://www.tvn-baskets.de/teams/">Zurück zur Hauptseite</a></p>
</footer>

<!-- FEATURE 8: ZURÜCK-NACH-OBEN-BUTTON -->
<button class="scroll-top-btn" id="scroll-top-btn" aria-label="Nach oben scrollen">
  <i data-lucide="arrow-up"></i>
</button>

<!-- FEATURE 7: KONTEXT-MENÜ -->
<div class="context-menu" id="context-menu">
  <div class="context-menu-item" data-action="expand">
    <i data-lucide="chevron-down"></i>
    <span>Aufklappen</span>
  </div>
  <div class="context-menu-item" data-action="favorite">
    <i data-lucide="heart"></i>
    <span>Als Favorit markieren</span>
  </div>
  <div class="context-menu-item" data-action="copy-all">
    <i data-lucide="copy"></i>
    <span>Alle Spiele Link kopieren</span>
  </div>
  <div class="context-menu-item" data-action="copy-home">
    <i data-lucide="home"></i>
    <span>Heimspiele Link kopieren</span>
  </div>
  <div class="context-menu-item" data-action="copy-away">
    <i data-lucide="map-pin"></i>
    <span>Auswärts Link kopieren</span>
  </div>
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

  // ========================================
  // FAVORITEN-SYSTEM MIT ANIMATION & VIBRATION
  // ========================================
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
      
      // FEATURE 3: Animation
      btn.classList.add('animating');
      setTimeout(() => btn.classList.remove('animating'), 400);
      
      card.classList.toggle('favorite');
      btn.classList.toggle('active');
      
      // FEATURE 10: Vibration
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
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
      const aIdx = parseInt(a.getAttribute('data-original-index'));
      const bIdx = parseInt(b.getAttribute('data-original-index'));
      return aIdx - bIdx;
    });
    cards.forEach(card => grid.appendChild(card));
  }

  // ========================================
  // FEATURE 5: SCHNELLZUGRIFF-LEISTE
  // ========================================
  function updateQuickAccess() {
    const quickAccess = document.getElementById('quick-access');
    const pillsContainer = document.getElementById('quick-access-pills');
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (favs.length === 0) {
      quickAccess.classList.remove('active');
      return;
    }
    
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
        setTimeout(() => {
          document.querySelectorAll('.team-card').forEach(c => {
            if (c !== card) c.classList.remove('expanded');
          });
        }, 500);
      });
      pillsContainer.appendChild(pill);
    });
    
    lucide.createIcons();
  }

  // ========================================
  // FEATURE 6: TASTATUR-NAVIGATION
  // ========================================
  document.addEventListener('keydown', (e) => {
    const cards = Array.from(grid.querySelectorAll('.team-card:not(.hidden)'));
    if (cards.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentKeyboardIndex = Math.min(currentKeyboardIndex + 1, cards.length - 1);
      updateKeyboardFocus(cards);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentKeyboardIndex = Math.max(currentKeyboardIndex - 1, 0);
      updateKeyboardFocus(cards);
    } else if (e.key === 'Enter' && currentKeyboardIndex >= 0) {
      e.preventDefault();
      const card = cards[currentKeyboardIndex];
      card.classList.toggle('expanded');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (e.key === 'f' && currentKeyboardIndex >= 0) {
      e.preventDefault();
      const card = cards[currentKeyboardIndex];
      const btn = card.querySelector('.favorite-btn');
      btn.click();
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.team-card').forEach(c => c.classList.remove('expanded', 'keyboard-focus'));
      currentKeyboardIndex = -1;
    }
  });

  function updateKeyboardFocus(cards) {
    cards.forEach(c => c.classList.remove('keyboard-focus'));
    if (currentKeyboardIndex >= 0 && currentKeyboardIndex < cards.length) {
      cards[currentKeyboardIndex].classList.add('keyboard-focus');
      cards[currentKeyboardIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ========================================
  // FEATURE 7: KONTEXT-MENÜ
  // ========================================
  const contextMenu = document.getElementById('context-menu');
  let contextCard = null;

  document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      contextCard = card;
      
      const x = e.clientX;
      const y = e.clientY;
      
      contextMenu.style.left = x + 'px';
      contextMenu.style.top = y + 'px';
      contextMenu.classList.add('active');
      
      // Menü-Texte anpassen
      const isExpanded = card.classList.contains('expanded');
      const isFavorite = card.classList.contains('favorite');
      contextMenu.querySelector('[data-action="expand"] span').textContent = isExpanded ? 'Zuklappen' : 'Aufklappen';
      contextMenu.querySelector('[data-action="favorite"] span').textContent = isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren';
      
      lucide.createIcons();
    });
  });

  document.addEventListener('click', () => {
    contextMenu.classList.remove('active');
  });

  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!contextCard) return;
      
      const action = item.getAttribute('data-action');
      
      if (action === 'expand') {
        contextCard.classList.toggle('expanded');
      } else if (action === 'favorite') {
        contextCard.querySelector('.favorite-btn').click();
      } else if (action === 'copy-all' || action === 'copy-home' || action === 'copy-away') {
        const btns = contextCard.querySelectorAll('.copy-btn');
        let btn;
        if (action === 'copy-all') btn = btns[0];
        else if (action === 'copy-home') btn = btns[1];
        else if (action === 'copy-away') btn = btns[2];
        if (btn) btn.click();
      }
      
      contextMenu.classList.remove('active');
    });
  });

  // ========================================
  // FEATURE 8: ZURÜCK-NACH-OBEN-BUTTON
  // ========================================
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('active');
    } else {
      scrollTopBtn.classList.remove('active');
    }
  });
  
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ========================================
  // KONFETTI-ANIMATION
  // ========================================
  function startKonfetti() {
    const canvas = document.getElementById('konfetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#FF6B00', '#FFD700', '#FFFFFF', '#E55A00'];
    
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    let frame = 0;
    const maxFrames = 180;
    
    function animate() {
      if (frame >= maxFrames) {
        canvas.style.display = 'none';
        return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      
      frame++;
      requestAnimationFrame(animate);
    }
    
    animate();
  }

  // ========================================
  // RESTLICHE FUNKTIONALITÄT
  // ========================================
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.setAttribute('data-lucide', 'sun');
    lucide.createIcons();
  }
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeIcon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
  });

  document.querySelectorAll('.stat-val').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    let current = 0;
    const increment = target / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { el.textContent = target; clearInterval(timer); }
      else { el.textContent = Math.floor(current); }
    }, 20);
  });

  document.getElementById('team-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.team-card').forEach(card => {
      const name = card.getAttribute('data-team-name');
      if (name.includes(query)) card.classList.remove('hidden');
      else card.classList.add('hidden');
    });
  });

  document.querySelectorAll('.team-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const isExpanded = card.classList.contains('expanded');
      document.querySelectorAll('.team-card').forEach(c => c.classList.remove('expanded'));
      if (!isExpanded) card.classList.add('expanded');
    });
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(url);
        const toast = document.getElementById('toast');
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 2000);
      } catch (err) {
        console.error('Kopieren fehlgeschlagen', err);
      }
    });
  });

  document.getElementById('inst-toggle').addEventListener('click', () => {
    document.getElementById('inst-toggle').classList.toggle('active');
    document.getElementById('inst-content').classList.toggle('active');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      console.log('Service Worker registriert:', reg.scope);
    }).catch(err => {
      console.error('Service Worker Fehler:', err);
    });
  }
});
</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
  console.log('✅ index.html mit allen neuen Features generiert.');

  const manifest = {
    name: "TV Neunkirchen Baskets – Kalender",
    short_name: "TVN Baskets",
    description: "Offizielle Kalenderübersicht für alle Teams",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#FF6B00",
    icons: [
      {
        src: "Logo.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "Logo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../generated/manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log('✅ manifest.json für PWA generiert.');

  const swContent = `
const CACHE_NAME = 'tvn-baskets-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/Logo.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;700&display=swap',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;

  fs.writeFileSync(
    path.resolve(__dirname, '../generated/sw.js'),
    swContent,
    'utf8'
  );
  console.log('✅ sw.js (Service Worker) für PWA generiert.');
}

genHTML();
