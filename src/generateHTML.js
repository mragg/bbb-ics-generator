// complete generator script — mit allen Premium-Features
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
  const gamesPath = path.resolve(__dirname, '../generated/games.json');

  const rawMeta = safeReadJson(metaPath) || [];
  const rawTeams = safeReadJson(teamsPath) || [];
  const rawGames = safeReadJson(gamesPath) || [];

  const metadataArray = Array.isArray(rawMeta) ? rawMeta : (rawMeta.teams || rawMeta.data || []);
  const gamesArray = Array.isArray(rawGames) ? rawGames : (rawGames.games || rawGames.data || []);
  
  const teams = metadataArray.map(m => ({
    teamId: normalizeId(m.teamId ?? m.id ?? m.idStr ?? m.identifier ?? ''),
    name: m.teamName ?? m.name ?? m.title ?? 'Unbenannt',
    ageGroup: m.ageGroup ?? '',
    matchCount: m.matchCount ?? m.matches ?? 0,
    homeMatchCount: m.homeMatchCount ?? m.homeMatches ?? 0,
    awayMatchCount: m.awayMatchCount ?? m.awayMatches ?? 0
  }));

  const gamesByTeam = {};
  gamesArray.forEach(g => {
    const teamId = normalizeId(g.teamId ?? g.id ?? g.team ?? '');
    if (!teamId) return;
    if (!gamesByTeam[teamId]) gamesByTeam[teamId] = [];
    
    const opponent = g.opponent || g.awayTeam || g.guestTeam || g.gegner || 'Gegner';
    const isHome = g.isHome !== undefined ? g.isHome : (g.venue === 'home' || g.location === 'Heim' || g.home === true);
    const gameDate = g.date || g.start || g.tipoff || g.datetime;
    
    gamesByTeam[teamId].push({
      id: normalizeId(g.gameId ?? g.id ?? g.matchId ?? ''),
      date: gameDate,
      opponent: opponent,
      isHome: isHome
    });
  });

  Object.keys(gamesByTeam).forEach(teamId => {
    gamesByTeam[teamId].sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  const content = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TV Neunkirchen Baskets – Kalender</title>

<!-- Open Graph Tags für Social Sharing -->
<meta property="og:title" content="TV Neunkirchen Baskets – Kalender">
<meta property="og:description" content="Offizielle Kalenderübersicht für alle Teams. Automatisch aktualisiert.">
<meta property="og:image" content="https://mragg.github.io/bbb-ics-generator/Logo.png">
<meta property="og:url" content="https://mragg.github.io/bbb-ics-generator/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">

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
  --color-success: #10B981;
  --color-error: #EF4444;
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* DARK MODE */
[data-theme="dark"] {
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-text: #F1F5F9;
  --color-text-muted: #94A3B8;
  --color-border: #334155;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Inter', sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.hp-field {
  position: absolute !important; width: 1px !important; height: 1px !important;
  padding: 0 !important; margin: -1px !important; overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important;
}

/* SKELETON LOADING */
.skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-card { height: 200px; margin-bottom: 1.5rem; }

/* HEADER */
.header {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: white;
  padding: 2rem 1.5rem;
  position: relative;
  overflow: hidden;
}
[data-theme="dark"] .header {
  background: linear-gradient(135deg, #020617 0%, #0F172A 100%);
}
.header::before {
  content: ''; position: absolute; top: -50%; right: -10%; width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%);
  border-radius: 50%;
}
.header-inner {
  max-width: 1024px; margin: 0 auto; display: flex; align-items: center; gap: 1.5rem;
  position: relative; z-index: 1; flex-wrap: wrap;
}
.logo { height: 80px; width: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
.header-text { flex: 1; }
.header-text h1 {
  font-family: 'Oswald', sans-serif; font-size: 2.25rem; font-weight: 700;
  letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.1;
}
.header-text p { color: #94A3B8; margin-top: 0.5rem; font-size: 0.95rem; }

/* DARK MODE TOGGLE */
.theme-toggle {
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: white; padding: 0.5rem; border-radius: var(--radius-sm); cursor: pointer;
  transition: var(--transition); display: flex; align-items: center; justify-content: center;
}
.theme-toggle:hover { background: rgba(255,255,255,0.2); }

.container { max-width: 1024px; margin: 0 auto; padding: 2rem 1.5rem; }

/* LIVE SEARCH */
.search-wrapper {
  margin-bottom: 2rem; position: relative;
}
.search-input {
  width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border: 2px solid var(--color-border);
  border-radius: var(--radius-md); font-size: 1rem; background: var(--color-surface);
  color: var(--color-text); transition: var(--transition);
}
.search-input:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15);
}
.search-icon {
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted); pointer-events: none;
}

.instructions {
  background: var(--color-surface); border-radius: var(--radius-lg);
  padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
.inst-header {
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none; font-family: 'Oswald', sans-serif;
  font-size: 1.1rem; font-weight: 500; color: var(--color-text);
}
.inst-header:hover { color: var(--color-primary); }
.inst-header i { transition: var(--transition); }
.inst-header.active i { transform: rotate(180deg); }
.inst-content {
  max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out;
  color: var(--color-text-muted); font-size: 0.95rem;
}
.inst-content.active { max-height: 500px; margin-top: 1rem; }
.inst-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;
}
.inst-step { display: flex; gap: 0.75rem; align-items: flex-start; }
.inst-step-num {
  background: var(--color-primary); color: white; width: 24px; height: 24px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; flex-shrink: 0; margin-top: 2px;
}

.teams-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem; margin-bottom: 3rem;
}
.team-card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);
  transition: var(--transition); overflow: hidden; display: flex; flex-direction: column;
}
.team-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary); }
.team-card.hidden { display: none; }
.team-card-header {
  padding: 1.25rem; background: linear-gradient(to right, #FFF7ED, #FFFFFF);
  border-bottom: 1px solid var(--color-border); cursor: pointer;
  display: flex; justify-content: space-between; align-items: center;
}
[data-theme="dark"] .team-card-header {
  background: linear-gradient(to right, #1E293B, #334155);
}
.team-name { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; color: var(--color-text); }
.team-badge {
  background: var(--color-text); color: white; font-size: 0.75rem; font-weight: 600;
  padding: 0.25rem 0.6rem; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em;
}
.team-stats {
  display: flex; justify-content: space-around; padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border); background: #FAFAFA;
}
[data-theme="dark"] .team-stats { background: #0F172A; }
.stat { text-align: center; }
.stat-val { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: center; gap: 4px; }
.team-actions {
  padding: 1.25rem; display: grid; gap: 0.75rem;
  opacity: 0; max-height: 0; transition: var(--transition);
}
.team-card.expanded .team-actions { opacity: 1; max-height: 400px; padding-bottom: 1.25rem; }

/* BUTTONS */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-weight: 600;
  font-size: 0.9rem; text-decoration: none; transition: var(--transition); border: none; cursor: pointer; width: 100%;
}
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: var(--color-surface); border-color: #CBD5E1; }
.btn-copy {
  background: #F1F5F9; color: var(--color-text); font-size: 0.8rem; padding: 0.5rem 0.75rem;
}
[data-theme="dark"] .btn-copy { background: #334155; }
.btn-copy:hover { background: #E2E8F0; }
[data-theme="dark"] .btn-copy:hover { background: #475569; }

/* LINK ROW */
.link-row {
  display: flex; gap: 0.5rem; align-items: center;
}
.link-row .btn { flex: 1; }

.report-section {
  background: linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%);
  border: 1px solid #FFEDD5; border-radius: var(--radius-lg);
  padding: 2rem; text-align: center; margin-bottom: 3rem;
}
[data-theme="dark"] .report-section {
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  border-color: #475569;
}
.report-section h2 { font-family: 'Oswald', sans-serif; font-size: 1.75rem; margin-bottom: 0.5rem; }
.report-section p { color: var(--color-text-muted); max-width: 500px; margin: 0 auto 1.5rem; }

/* MODALS */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px); z-index: 50; opacity: 0; visibility: hidden;
  transition: var(--transition);
}
.modal-backdrop.active { opacity: 1; visibility: visible; }
.modal {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95);
  background: var(--color-surface); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl); z-index: 51; width: 90%; max-width: 600px;
  max-height: 90dvh; overflow-y: auto; opacity: 0; visibility: hidden;
  transition: var(--transition); border: 1px solid var(--color-border);
}
.modal.active { opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1); }
.modal-header {
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
  display: flex; justify-content: space-between; align-items: center;
  position: sticky; top: 0; background: var(--color-surface); z-index: 10;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.modal-title { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; }
.modal-close {
  background: transparent; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 0.5rem; border-radius: var(--radius-sm); transition: var(--transition);
}
.modal-close:hover { background: #F1F5F9; color: var(--color-text); }
[data-theme="dark"] .modal-close:hover { background: #334155; }
.modal-body { padding: 1.5rem; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group.full { grid-column: 1 / -1; }
.form-label {
  display: block; font-size: 0.875rem; font-weight: 600; color: var(--color-text);
  margin-bottom: 0.375rem;
}
.form-label .optional { font-weight: 400; color: var(--color-text-muted); font-size: 0.8rem; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-family: inherit; font-size: 0.95rem;
  background: var(--color-surface); color: var(--color-text); transition: var(--transition);
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15);
}
.form-textarea { min-height: 120px; resize: vertical; }
.form-hint { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.375rem; }
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
.btn-secondary { background: #F1F5F9; color: var(--color-text); }
[data-theme="dark"] .btn-secondary { background: #334155; }
.btn-secondary:hover { background: #E2E8F0; }
[data-theme="dark"] .btn-secondary:hover { background: #475569; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

.alert {
  padding: 0.875rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem;
  margin-top: 1rem; display: none; align-items: center; gap: 0.5rem;
}
.alert-error { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
.alert-success { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
.alert.active { display: flex; }

/* TOAST */
.toast {
  position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(100px);
  background: var(--color-text); color: var(--color-surface); padding: 0.875rem 1.5rem;
  border-radius: var(--radius-md); box-shadow: var(--shadow-xl); z-index: 100;
  opacity: 0; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.5rem;
}
.toast.active { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ANALYTICS PANEL */
.analytics-panel {
  display: none; background: var(--color-surface); border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg); padding: 2rem; margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);
}
.analytics-panel.active { display: block; }
.analytics-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--color-border);
}
.analytics-title { font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 700; }
.analytics-close {
  background: transparent; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 0.5rem; border-radius: var(--radius-sm);
}
.analytics-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;
  margin-bottom: 1.5rem;
}
.analytics-stat {
  background: var(--color-bg); padding: 1.25rem; border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}
.analytics-stat-label { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
.analytics-stat-value { font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; color: var(--color-primary); }
.analytics-list { margin-top: 1.5rem; }
.analytics-list-title { font-weight: 600; margin-bottom: 0.75rem; }
.analytics-item {
  display: flex; justify-content: space-between; padding: 0.75rem;
  background: var(--color-bg); border-radius: var(--radius-sm); margin-bottom: 0.5rem;
}

.footer { text-align: center; padding: 2rem 1.5rem; color: var(--color-text-muted); font-size: 0.875rem; border-top: 1px solid var(--color-border); }
.footer a { color: var(--color-primary); text-decoration: none; font-weight: 600; }
.footer a:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .header-inner { flex-direction: column; text-align: center; }
  .logo { height: 60px; }
  .teams-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .modal {
    width: 100%; max-width: 100%; height: 100dvh; max-height: 100dvh;
    border-radius: 0; transform: translate(0, 0) translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .modal.active { transform: translate(0, 0) translateY(0); }
  .form-actions { flex-direction: column-reverse; }
  .btn { width: 100%; }
  .link-row { flex-direction: column; }
  .link-row .btn-copy { width: 100%; }
}
</style>
</head>
<body>

<!-- SKELETON LOADING (wird nach JS-Init ausgeblendet) -->
<div id="skeleton-loader">
  <div class="container">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
  </div>
</div>

<header class="header" id="main-header" style="display:none;">
  <div class="header-inner">
    <img src="Logo.png" class="logo" alt="TVN Logo">
    <div class="header-text">
      <h1>TV Neunkirchen Baskets</h1>
      <p>Offizielle Kalenderübersicht • Zuletzt aktualisiert: ${new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</p>
    </div>
    <button class="theme-toggle" id="theme-toggle" aria-label="Theme wechseln">
      <i data-lucide="moon" id="theme-icon" style="width:20px;height:20px;"></i>
    </button>
  </div>
</header>

<main class="container" id="main-content" style="display:none;">
  
  <!-- ANALYTICS PANEL (nur für Admin sichtbar) -->
  <div class="analytics-panel" id="analytics-panel">
    <div class="analytics-header">
      <div class="analytics-title">📊 Analytics Dashboard</div>
      <button class="analytics-close" id="analytics-close" aria-label="Schließen">
        <i data-lucide="x" style="width:20px;height:20px;"></i>
      </button>
    </div>
    <div class="analytics-grid">
      <div class="analytics-stat">
        <div class="analytics-stat-label">Gesamte Klicks</div>
        <div class="analytics-stat-value" id="analytics-total">0</div>
      </div>
      <div class="analytics-stat">
        <div class="analytics-stat-label">Beliebtestes Team</div>
        <div class="analytics-stat-value" id="analytics-top-team" style="font-size:1.25rem;">-</div>
      </div>
      <div class="analytics-stat">
        <div class="analytics-stat-label">Heute</div>
        <div class="analytics-stat-value" id="analytics-today">0</div>
      </div>
    </div>
    <div class="analytics-list">
      <div class="analytics-list-title">Team-Klicks im Detail:</div>
      <div id="analytics-team-list"></div>
    </div>
  </div>

  <div class="instructions">
    <div class="inst-header" id="inst-toggle">
      <span style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="help-circle" style="width:20px;height:20px;color:var(--color-primary)"></i> So abonnierst du den Kalender</span>
      <i data-lucide="chevron-down" style="width:20px;height:20px;"></i>
    </div>
    <div class="inst-content" id="inst-content">
      <div class="inst-grid">
        <div class="inst-step">
          <div class="inst-step-num">1</div>
          <div><strong>Link kopieren:</strong> Wähle unten dein Team und kopiere den Link des gewünschten Kalenders.</div>
        </div>
        <div class="inst-step">
          <div class="inst-step-num">2</div>
          <div><strong>Kalender öffnen:</strong> Gehe in deine Kalender-App und wähle "Kalender hinzufügen" > "Aus dem Internet".</div>
        </div>
        <div class="inst-step">
          <div class="inst-step-num">3</div>
          <div><strong>Einfügen & Fertig:</strong> Füge den Link ein. Der Kalender aktualisiert sich automatisch.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- LIVE SEARCH -->
  <div class="search-wrapper">
    <i data-lucide="search" class="search-icon" style="width:20px;height:20px;"></i>
    <input type="text" class="search-input" id="team-search" placeholder="Team suchen (z.B. U14, Herren, Damen)...">
  </div>

  <div class="teams-grid" id="teams-grid">
    ${teams.map(t => `
      <div class="team-card" data-team-id="${t.teamId}" data-team-name="${t.name.toLowerCase()} ${t.ageGroup.toLowerCase()}">
        <div class="team-card-header">
          <span class="team-name">${t.name}</span>
          ${t.ageGroup ? `<span class="team-badge">${t.ageGroup}</span>` : ''}
        </div>
        <div class="team-stats">
          <div class="stat">
            <div class="stat-val" data-target="${t.matchCount}">0</div>
            <div class="stat-label"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Gesamt</div>
          </div>
          <div class="stat">
            <div class="stat-val" data-target="${t.homeMatchCount}">0</div>
            <div class="stat-label"><i data-lucide="home" style="width:12px;height:12px;"></i> Heim</div>
          </div>
          <div class="stat">
            <div class="stat-val" data-target="${t.awayMatchCount}">0</div>
            <div class="stat-label"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> Auswärts</div>
          </div>
        </div>
        <div class="team-actions">
          <div class="link-row">
            <a href="${makeWebcalLink(t.teamId ? t.teamId + '_all.ics' : encodeURIComponent(t.name) + '_all.ics')}" class="btn btn-primary">
              <i data-lucide="calendar-plus" style="width:16px;height:16px;"></i> Alle Spiele
            </a>
            <button class="btn btn-copy" data-copy="${makeWebcalLink(t.teamId ? t.teamId + '_all.ics' : encodeURIComponent(t.name) + '_all.ics')}">
              <i data-lucide="copy" style="width:14px;height:14px;"></i>
            </button>
          </div>
          <div class="link-row">
            <a href="${makeWebcalLink(t.teamId ? t.teamId + '_home.ics' : encodeURIComponent(t.name) + '_home.ics')}" class="btn btn-outline">
              <i data-lucide="home" style="width:16px;height:16px;"></i> Heimspiele
            </a>
            <button class="btn btn-copy" data-copy="${makeWebcalLink(t.teamId ? t.teamId + '_home.ics' : encodeURIComponent(t.name) + '_home.ics')}">
              <i data-lucide="copy" style="width:14px;height:14px;"></i>
            </button>
          </div>
          <div class="link-row">
            <a href="${makeWebcalLink(t.teamId ? t.teamId + '_away.ics' : encodeURIComponent(t.name) + '_away.ics')}" class="btn btn-outline">
              <i data-lucide="map-pin" style="width:16px;height:16px;"></i> Auswärtsspiele
            </a>
            <button class="btn btn-copy" data-copy="${makeWebcalLink(t.teamId ? t.teamId + '_away.ics' : encodeURIComponent(t.name) + '_away.ics')}">
              <i data-lucide="copy" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="report-section">
    <i data-lucide="bug" style="width:32px;height:32px;color:var(--color-primary);margin-bottom:0.5rem;"></i>
    <h2>Stimmt etwas nicht?</h2>
    <p>Hilf uns, die Kalender zu verbessern. Melde falsche Anpfiffzeiten, abgesagte Spiele oder andere Fehler.</p>
    <button id="open-report-btn" class="btn btn-primary" style="width:auto; padding: 0.75rem 2rem;">
      <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Fehler melden
    </button>
  </div>
</main>

<footer class="footer" id="main-footer" style="display:none;">
  <p>© ${new Date().getFullYear()} TV Neunkirchen Baskets. <a href="https://www.tvn-baskets.de/teams/">Zurück zur Hauptseite</a></p>
</footer>

<!-- TOAST -->
<div class="toast" id="toast">
  <i data-lucide="check-circle" style="width:18px;height:18px;"></i>
  <span id="toast-text">Link kopiert!</span>
</div>

<!-- REPORT MODAL -->
<div class="modal-backdrop" id="report-backdrop"></div>
<div class="modal" id="report-modal" role="dialog" aria-modal="true">
  <div class="modal-header">
    <h3 class="modal-title">Fehler melden</h3>
    <button class="modal-close" id="close-report-btn" aria-label="Schließen"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
  </div>
  <div class="modal-body">
    <form id="report-form">
      <input type="text" name="website_url" id="hp-website" class="hp-field" tabindex="-1" autocomplete="off">
      <input type="hidden" name="form_started" id="form-started" value="">

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label" for="report-team">Team <span class="optional">(optional)</span></label>
          <select id="report-team" class="form-select">
            <option value="" selected>Bitte wählen...</option>
            ${teams.map(t => `<option value="${t.teamId}">${t.name}${t.ageGroup ? ` (${t.ageGroup})` : ''}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="report-calendar">Kalender <span class="optional">(optional)</span></label>
          <select id="report-calendar" class="form-select">
            <option value="" selected>Bitte wählen...</option>
            <option value="Alle Spiele">Alle Spiele</option>
            <option value="Nur Heimspiele">Nur Heimspiele</option>
            <option value="Nur Auswärtsspiele">Nur Auswärtsspiele</option>
          </select>
        </div>
        <div class="form-group full">
          <label class="form-label" for="report-game">Betroffenes Spiel <span class="optional">(optional)</span></label>
          <select id="report-game" class="form-select" disabled>
            <option value="" selected>Wähle zuerst ein Team aus</option>
          </select>
          <div class="form-hint">Die Spiele werden automatisch geladen, sobald ein Team ausgewählt wird.</div>
        </div>
        <div class="form-group full">
          <label class="form-label" for="report-title">Titel der Meldung *</label>
          <input type="text" id="report-title" class="form-input" maxlength="120" placeholder="z.B. Falsche Anpfiffzeit am 12.10." required>
        </div>
        <div class="form-group full">
          <label class="form-label" for="report-description">Detaillierte Beschreibung *</label>
          <textarea id="report-description" class="form-textarea" maxlength="2000" placeholder="Beschreibe den Fehler so genau wie möglich..." required></textarea>
        </div>
      </div>

      <div id="report-error" class="alert alert-error">
        <i data-lucide="alert-circle" style="width:16px;height:16px;flex-shrink:0;"></i>
        <span id="error-text"></span>
      </div>
      <div id="report-success" class="alert alert-success">
        <i data-lucide="check-circle" style="width:16px;height:16px;flex-shrink:0;"></i>
        <span>Vielen Dank! Die Meldung wurde erfolgreich übermittelt.</span>
      </div>

      <div class="form-actions">
        <button type="button" id="cancel-report-btn" class="btn btn-secondary">Abbrechen</button>
        <button type="submit" id="submit-report-btn" class="btn btn-primary">
          <i data-lucide="send" style="width:16px;height:16px;"></i> Meldung senden
        </button>
      </div>
    </form>
  </div>
</div>

<script>
// --- ECHTE SPIELDATEN ---
window.GAMES_BY_TEAM = ${JSON.stringify(gamesByTeam)};

// --- ANALYTICS SECRET ---
// ÄNDERE DIESEN CODE ZU DEINEM GEHEIMEN TOKEN!
const ANALYTICS_SECRET = 'tvn-stats-2024-secret';

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  // Skeleton ausblenden, Content einblenden
  document.getElementById('skeleton-loader').style.display = 'none';
  document.getElementById('main-header').style.display = 'block';
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('main-footer').style.display = 'block';

  lucide.createIcons();

  // --- ANALYTICS CHECK ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('stats') === ANALYTICS_SECRET) {
    document.getElementById('analytics-panel').classList.add('active');
    updateAnalytics();
  }

  // --- DARK MODE ---
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.setAttribute('data-lucide', 'sun');
    lucide.createIcons();
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    themeIcon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
  });

  // --- ANIMATED COUNTERS ---
  function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'), 10);
    const duration = 800;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  // --- TEAM CARDS ---
  document.querySelectorAll('.team-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const isExp
