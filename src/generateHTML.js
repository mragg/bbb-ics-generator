// complete generator script — ersetzt deine alte Datei komplett
const fs = require('fs');
const path = require('path');

function makeWebcalLink(filename) {
  const baseUrl = 'https://mragg.github.io/bbb-ics-generator/';
  return baseUrl + filename;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Fehler beim Einlesen/Parsen von ${filePath}:`, err.message);
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
  const teamsArray = Array.isArray(rawTeams) ? rawTeams : (rawTeams.teams || rawTeams.data || []);

  // Finales, sauberes Team-Array für das Template (ohne Liga)
  const teams = metadataArray.map(m => {
    const id = normalizeId(m.teamId ?? m.id ?? m.idStr ?? m.identifier ?? '');

    return {
      teamId: id,
      name: m.teamName ?? m.name ?? m.title ?? 'Unbenannt',
      ageGroup: m.ageGroup ?? '',
      matchCount: m.matchCount ?? m.matches ?? 0,
      homeMatchCount: m.homeMatchCount ?? m.homeMatches ?? 0,
      awayMatchCount: m.awayMatchCount ?? m.awayMatches ?? 0,
    };
  });

  const content = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TV Neunkirchen Baskets – Kalender Übersicht</title>

<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

<style>
:root{
  --tvn-blue:#003b75;
  --tvn-light-blue:#0057a3;
  --tvn-red:#d72638;
  --tvn-white:#ffffff;
  --tvn-gray:#f2f4f8;
}

/* Reset / global */
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family:'Inter',sans-serif;
  background:var(--tvn-gray);
  color:#222;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* Header */
header{
  background:linear-gradient(135deg,var(--tvn-blue),var(--tvn-light-blue));
  color:var(--tvn-white);
  padding:18px 20px;
}
.header-inner{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.logo{height:120px;flex-shrink:0}
.header-text{display:flex;flex-direction:column;justify-content:center;flex:1}
.header-text h1{font-family:'Oswald',sans-serif;font-size:1.9rem;margin:0;text-transform:uppercase}
.header-text p{margin-top:6px;font-weight:300;opacity:0.95;font-size:0.95rem}

/* Layout */
.container{max-width:960px;margin:28px auto;padding:0 16px}
.teams-container{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  margin-top:14px;
  align-items:flex-start;
  transition: transform 320ms ease, opacity 320ms ease;
}

/* Dim / shift states */
.teams-container.dimmed { opacity:0.28; transform: translateX(12%) scale(0.98); pointer-events:none; }
.teams-container.shifted-down { transform: translateY(20px); opacity:0.96; }

/* Team card */
.team-card{
  background:var(--tvn-white);
  border-radius:8px;
  box-shadow:0 4px 12px rgba(0,0,0,0.08);
  flex:1 1 220px;
  min-width:220px;
  display:flex;
  flex-direction:column;
  position:relative;
  transition: transform 220ms ease, opacity 220ms ease;
}
.team-header{
  padding:12px 14px;
  font-weight:600;
  font-family:'Oswald',sans-serif;
  background:var(--tvn-blue);
  color:var(--tvn-white);
  border-radius:8px;
  cursor:pointer;
}
.team-card .team-content-preview{
  padding:12px 14px;
}

/* Focused card when popup opens */
.team-card.focused { transform: translateX(-4%) scale(1.02); z-index:11000; }

/* Overlay (team-content) */
.team-content{
  position:fixed;
  display:none;
  background:#fff;
  padding:18px;
  border-radius:10px;
  box-shadow:0 18px 40px rgba(0,0,0,0.25);
  z-index:12000;
  max-height:80vh;
  overflow:auto;
  box-sizing:border-box;
}

/* Buttons area */
.team-content .buttons{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:12px;
  align-items:flex-start;
}
.team-content .buttons a{
  display:inline-block;
  padding:10px 16px;
  background:var(--tvn-blue);
  color:var(--tvn-white);
  text-decoration:none;
  border-radius:6px;
  font-weight:600;
  font-size:0.9rem;
  transition:transform 0.12s, background 0.12s;
}
.team-content .buttons a:hover{background:var(--tvn-red);transform:translateY(-2px)}

/* Info button & popup */
.info-block{display:flex;align-items:flex-start;gap:8px}
.info-btn{
  background:var(--tvn-gray);
  border:none;border-radius:50%;
  width:30px;height:30px;display:flex;align-items:center;justify-content:center;
  font-weight:700;cursor:pointer;font-size:0.95rem;
}
.info-popup{
  display:none;
  position:relative;
  background:#fff;padding:10px;border-radius:8px;
  box-shadow:0 10px 30px rgba(0,0,0,0.12);
  width:320px;max-width:calc(100vw - 60px);
  margin-top:6px;
  z-index:13000;
}

/* close button for mobile overlay */
.overlay-close{
  display:none;
  position:absolute;right:12px;top:10px;background:transparent;border:none;font-size:1.6rem;cursor:pointer;
}

/* Steps */
.step-box{background:var(--tvn-white);margin-bottom:12px;border-radius:8px;overflow:hidden;box-shadow:0 3px 8px rgba(0,0,0,0.06)}
.step-header{padding:12px 14px;cursor:pointer;font-weight:600;background:var(--tvn-blue);color:var(--tvn-white);font-family:'Oswald',sans-serif}
.step-content{padding:12px 14px;display:none;font-size:0.95rem;line-height:1.45;background:#fafafa}

/* Anleitung button — styled like step-header */
.guide-btn{
  display:inline-block;
  padding:12px 14px;
  cursor:pointer;
  font-weight:600;
  font-family:'Oswald',sans-serif;
  background:var(--tvn-blue);
  color:var(--tvn-white);
  border-radius:8px;
  border:none;
  text-transform:none;
  margin-bottom:12px;
}

/* Footer */
footer{text-align:center;padding:24px 10px;font-size:0.85rem;color:#666}

/* MOBILE specific: full-screen overlay, stacked buttons, 2-column grid for teams */
@media (max-width: 600px) {

  /* Teams 2 per row */
  .teams-container{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px;
    padding-bottom:24px;
  }
  .team-card{min-width:0}

  /* Overlay becomes full-screen modal / bottom-sheet style */
  .team-content{
    left:0 !important;
    top:0 !important;
    width:100vw !important;
    height:100vh !important;
    max-height:none !important;
    border-radius:0 !important;
    padding:18px;
    overflow-y:auto;
    box-shadow:0 30px 60px rgba(0,0,0,0.35);
  }

  .overlay-close{display:block}

  .team-content .buttons{
    flex-direction:column;
    align-items:stretch;
  }
  .team-content .buttons a{
    width:100%;
    margin:8px 0;
    text-align:center;
  }

  .info-popup{
    width:100%;
    max-width:none;
    position:relative;
    margin-top:10px;
  }

  .guide-btn{width:100%}
}
</style>

</head>
<body>

<header>
  <div class="header-inner">
    <img src="Logo.png" class="logo" alt="TVN Logo">
    <div class="header-text">
      <h1>TV Neunkirchen Baskets</h1>
      <p>Kalender Übersicht – automatisch aktualisiert<br>
      Stand: ${new Date().toLocaleString('de-DE')}</p>
    </div>
  </div>
</header>

<div class="container">

<!-- Anleitung-Button -->
<button id="show-steps-btn" class="guide-btn" aria-expanded="false" aria-controls="steps-wrapper">Anleitung anzeigen</button>

<!-- Template: Inhalt der Anleitung (wird kopiert) -->
<div id="steps-template" style="display:none;">
  <div class="step-box">
    <div class="step-header">Schritt 1 – URL kopieren</div>
    <div class="step-content">
       <p>Kopieren Sie die URL der gewünschten Kalenderdatei (Endung „.ics“).</p>
      <p>Auf Smartphones oder Tablets geschieht dies durch langes Drücken auf den Link und Auswahl von <strong>„Link kopieren“</strong>.</p>
      <p>Am Computer klicken Sie mit der rechten Maustaste auf den Link und wählen ebenfalls <strong>„Link kopieren“</strong>.</p>
    </div>
  </div>

  <div class="step-box">
    <div class="step-header">Schritt 2 – Kalender hinzufügen</div>
    <div class="step-content">
       <p>Öffnen Sie anschließend Ihre <strong>Kalender-Anwendung</strong>.</p>
      <p>Wählen Sie die Option <strong>„Kalender hinzufügen“</strong> und dann <strong>„Aus dem Internet“</strong> bzw. <strong>„Per URL“</strong>.</p>
    </div>
  </div>

  <div class="step-box">
    <div class="step-header">Schritt 3 – Link einfügen</div>
    <div class="step-content">
       <p>Fügen Sie den kopierten Link in das vorgesehene Feld ein.</p>
      <p>Bestätigen Sie anschließend das Abonnement.</p>
      <p>Der Kalender wird danach automatisch synchronisiert.</p>
      <p>Änderungen werden selbstständig übernommen, sobald sie auftreten.</p>
    </div>
  </div>
</div>

<!-- Steps wrapper: wird per JS befüllt -->
<div id="steps-wrapper" style="display:none;"></div>

<div class="teams-container" id="teams-container">
  ${teams.map((t, index) => `
    <div class="team-card" data-team-index="${index}">
      <div class="team-header" data-index="${index}">
        ${t.name}${t.ageGroup ? ` (<strong>${t.ageGroup}</strong>)` : ''}
      </div>

      <div class="team-content" aria-hidden="true">
        <button class="overlay-close" aria-label="Schließen">&times;</button>

        <div class="team-content-preview">
          ${t.name}${t.ageGroup ? ` (<strong>${t.ageGroup}</strong>)` : ''}
          <p>${t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}</p>
        </div>

        <div class="info-block">
          <button class="info-btn" aria-expanded="false" aria-controls="info-${index}">?</button>
          <div id="info-${index}" class="info-popup" role="dialog" aria-hidden="true"></div>
        </div>

        <div class="buttons">
          <a href="${makeWebcalLink(t.teamId ? (t.teamId + '_all.ics') : (encodeURIComponent(t.name) + '_all.ics'))}">Alle Spiele abonnieren</a>
          <a href="${makeWebcalLink(t.teamId ? (t.teamId + '_home.ics') : (encodeURIComponent(t.name) + '_home.ics'))}">Nur Heimspiele abonnieren</a>
          <a href="${makeWebcalLink(t.teamId ? (t.teamId + '_away.ics') : (encodeURIComponent(t.name) + '_away.ics'))}">Nur Auswärts abonnieren</a>
        </div>
      </div>
    </div>
  `).join('')}
</div>

</div>

<footer>
TVN Baskets – Offizielle Kalenderübersicht
</footer>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const template = document.getElementById('steps-template');
  const stepsWrapper = document.getElementById('steps-wrapper');
  const guideBtn = document.getElementById('show-steps-btn');
  const teamsContainer = document.getElementById('teams-container');

  if (!template || !stepsWrapper || !guideBtn || !teamsContainer) return;

  // Kopiere Template in Steps-Wrapper
  stepsWrapper.innerHTML = template.innerHTML;

  // Accordion: schliesst andere Schritte in demselben Container
  function enableAccordion(container) {
    if (!container) return;
    const headers = container.querySelectorAll('.step-header');
    headers.forEach(h => {
      // remove duplicate listeners guard
      h.replaceWith(h.cloneNode(true));
    });
    // re-query after clone
    const freshHeaders = container.querySelectorAll('.step-header');
    freshHeaders.forEach(h => {
      h.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const content = h.nextElementSibling;
        if (!content) return;
        // close siblings
        container.querySelectorAll('.step-content').forEach(c => {
          if (c !== content && c.style.display === 'block') c.style.display = 'none';
        });
        // toggle clicked
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      });
    });
  }

  // initial accordion on main guide
  enableAccordion(stepsWrapper);

  // fill info-popups with same content and enable accordion inside them
  document.querySelectorAll('.info-popup').forEach(popup => {
    popup.innerHTML = template.innerHTML;
    enableAccordion(popup);
  });

  // helper: compute and apply shift when main guide is open
  function applyGuideShift() {
    const open = stepsWrapper.style.display === 'block';
    if (!open) {
      teamsContainer.classList.remove('shifted-down');
      teamsContainer.style.transform = '';
      teamsContainer.style.opacity = '';
      return;
    }
    // compute wrapper height and shift teams down (with padding)
    const rect = stepsWrapper.getBoundingClientRect();
    const shift = Math.min(window.innerHeight * 0.45, Math.ceil(rect.height) + 20);
    teamsContainer.classList.add('shifted-down');
    teamsContainer.style.transform = \`translateY(\${shift}px)\`;
    teamsContainer.style.opacity = '0.96';
  }

  // guide button toggle
  guideBtn.addEventListener('click', (e) => {
    const open = stepsWrapper.style.display === 'block';
    if (open) {
      stepsWrapper.style.display = 'none';
      guideBtn.setAttribute('aria-expanded', 'false');
      guideBtn.textContent = 'Anleitung anzeigen';
    } else {
      stepsWrapper.style.display = 'block';
      // close any open step-content by default
      stepsWrapper.querySelectorAll('.step-content').forEach(c => c.style.display = 'none');
      enableAccordion(stepsWrapper);
      guideBtn.setAttribute('aria-expanded', 'true');
      guideBtn.textContent = 'Anleitung verbergen';
      // small delay to allow layout → then compute shift
      requestAnimationFrame(applyGuideShift);
    }
  });

  // Overlay logic for team popups
  const teamHeaders = document.querySelectorAll('.team-header');
  let activeOverlay = null;
  function closeOverlays() {
    document.querySelectorAll('.team-content').forEach(c => {
      c.style.display = 'none';
      c.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.team-card.focused').forEach(card => card.classList.remove('focused'));
    teamsContainer.classList.remove('dimmed');
    teamsContainer.style.pointerEvents = '';
    activeOverlay = null;
  }

  teamHeaders.forEach(header => {
    const card = header.closest('.team-card');
    const content = card.querySelector('.team-content');

    if (content) content.addEventListener('click', e => e.stopPropagation());

    const closeBtn = content.querySelector('.overlay-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeOverlays();
      });
    }

    header.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!content) return;
      // toggle
      if (activeOverlay === content) {
        closeOverlays();
        return;
      }
      closeOverlays();
      // show
      const isMobile = window.innerWidth <= 600;
      if (isMobile) {
        content.style.position = 'fixed';
        content.style.left = '0';
        content.style.top = '0';
        content.style.width = '100vw';
        content.style.height = '100vh';
        content.style.maxHeight = 'none';
        content.style.display = 'block';
        content.setAttribute('aria-hidden', 'false');
        // move teams far down and dim
        teamsContainer.style.transform = 'translateY(110vh)';
        teamsContainer.style.opacity = '0.12';
        teamsContainer.style.pointerEvents = 'none';
        card.classList.add('focused');
        activeOverlay = content;
        return;
      }
      // desktop: position near header
      const rect = header.getBoundingClientRect();
      const desiredWidth = Math.min(Math.max(rect.width * 2.2, 360), window.innerWidth * 0.95);
      const margin = 28;
      let left = rect.left;
      if (left + desiredWidth > window.innerWidth - margin) left = window.innerWidth - desiredWidth - margin;
      if (left < margin) left = margin;

      content.style.position = 'fixed';
      content.style.width = desiredWidth + 'px';
      content.style.maxHeight = '80vh';
      content.style.display = 'block';
      content.setAttribute('aria-hidden', 'false');

      let top = rect.bottom;
      const ch = content.offsetHeight;
      const vh = window.innerHeight;
      if (top + ch > vh - 20) top = rect.top - ch;
      if (top < 20) top = 20;
      content.style.top = top + 'px';
      content.style.left = left + 'px';

      // dim / shift others and highlight card
      teamsContainer.classList.add('dimmed');
      teamsContainer.style.pointerEvents = 'none';
      card.classList.add('focused');
      activeOverlay = content;
    });
  });

  // info buttons open small popup that contains the same guide template (accordion inside)
  document.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const card = btn.closest('.team-card');
      const popup = card.querySelector('.info-popup');
      if (!popup) return;
      const open = popup.style.display === 'block';
      // close all other popups
      document.querySelectorAll('.info-popup').forEach(p => {
        if (p !== popup) { p.style.display = 'none'; p.setAttribute('aria-hidden','true'); }
      });
      if (open) {
        popup.style.display = 'none';
        popup.setAttribute('aria-hidden','true');
        teamsContainer.classList.remove('dimmed');
        card.classList.remove('focused');
        return;
      }
      // show popup (mobile: full width block)
      const mobile = window.innerWidth <= 600;
      if (mobile) {
        popup.style.position = 'relative';
        popup.style.display = 'block';
        popup.setAttribute('aria-hidden','false');
        teamsContainer.style.transform = 'translateY(110vh)';
        teamsContainer.style.opacity = '0.12';
        teamsContainer.style.pointerEvents = 'none';
        card.classList.add('focused');
        return;
      }
      // desktop: inject template (already injected initially)
      popup.style.display = 'block';
      popup.setAttribute('aria-hidden','false');
      enableAccordion(popup);
      teamsContainer.classList.add('dimmed');
      card.classList.add('focused');
    });
  });

  // clicking outside closes overlays and info-popups, but leaves main guide as-is unless click outside guide
  document.addEventListener('click', (e) => {
    // if click outside the steps and not on the guide button, leave guide but close overlays/popups
    if (stepsWrapper.contains(e.target) || guideBtn.contains(e.target)) {
      // click inside guide area — ignore here
    } else {
      // close info popups and overlays
      document.querySelectorAll('.info-popup').forEach(p => { p.style.display = 'none'; p.setAttribute('aria-hidden','true'); });
      closeOverlays();
    }
  });

  // close on scroll (for mobile usability) and reset dims
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.info-popup').forEach(p => { p.style.display = 'none'; p.setAttribute('aria-hidden','true'); });
    closeOverlays();
  }, { passive: true });

  // recompute guide shift on resize
  window.addEventListener('resize', () => {
    applyGuideShift();
    closeOverlays();
  }, { passive: true });
});
</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
}

genHTML();
