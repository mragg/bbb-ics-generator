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

  // Falls metadataArray leer ist, fallback auf teamsArray (sicherstellen, dass teams nicht leer)
  const sourceArray = metadataArray.length ? metadataArray : teamsArray;

  // Finales Team-Array
  const teams = Array.isArray(sourceArray) ? sourceArray.map((m) => {
    const id = normalizeId(m.teamId ?? m.id ?? m.idStr ?? m.identifier ?? '');
    return {
      teamId: id,
      name: m.teamName ?? m.name ?? m.title ?? 'Unbenannt',
      ageGroup: m.ageGroup ?? '',
      matchCount: m.matchCount ?? m.matches ?? 0,
      homeMatchCount: m.homeMatchCount ?? m.homeMatches ?? 0,
      awayMatchCount: m.awayMatchCount ?? m.awayMatches ?? 0,
    };
  }) : [];

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
  transition: transform 320ms cubic-bezier(.2,.9,.2,1), opacity 320ms ease;
}

/* Verschiebungs-/Dimmzustände */
.teams-container.shifted-down { transform: translateY(20px); opacity:0.98; }
.teams-container.dimmed { transform: translateX(12%) scale(0.98); opacity:0.28; pointer-events:none; }

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

/* Fokus-Hervorhebung */
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

/* Anleitung-Button */
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

/* MOBILE specific */
@media (max-width: 600px) {
  .teams-container{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px;
    padding-bottom:24px;
  }
  .team-card{min-width:0}

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
  <button id="guide-btn" class="guide-btn" aria-expanded="false" aria-controls="guide-steps">Anleitung anzeigen</button>

  <!-- zentrale Vorlage für die Schritte (versteckt) -->
  <template id="steps-template">
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
  </template>

  <!-- hier wird die Anleitung dynamisch eingefügt -->
  <div id="guide-steps" style="display:none;"></div>

  <div id="teams-container" class="teams-container">
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
/* --- Hilfsfunktionen --- */
function qsAll(selector, root=document) { return Array.from(root.querySelectorAll(selector)); }
function qs(selector, root=document) { return root.querySelector(selector); }

/* Accordion: innerhalb eines Containers immer nur ein offener Schritt */
function enableAccordion(container) {
  if (!container) return;
  // entferne alte Listener, indem wir Header neu ersetzen (sicher gegen doppelte Listener)
  qsAll('.step-header', container).forEach(h => {
    const clone = h.cloneNode(true);
    h.parentNode.replaceChild(clone, h);
  });
  // neu binden
  qsAll('.step-header', container).forEach(header => {
    header.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const content = header.nextElementSibling;
      if (!content) return;
      // schließe alle anderen step-content im selben container
      qsAll('.step-content', container).forEach(c => {
        if (c !== content) c.style.display = 'none';
      });
      // toggle den angeklickten
      content.style.display = (content.style.display === 'block') ? 'none' : 'block';
    });
  });
}

/* --- Initialisierung nach DOM ready --- */
document.addEventListener('DOMContentLoaded', () => {
  const template = qs('#steps-template');
  const guideSteps = qs('#guide-steps');
  const guideBtn = qs('#guide-btn');
  const teamsContainer = qs('#teams-container');

  if (!template || !guideSteps || !guideBtn || !teamsContainer) return;

  // Fülle Hauptanleitung aus Template (cloneNode um IDs im Template zu verhindern)
  guideSteps.appendChild(template.content.cloneNode(true));
  enableAccordion(guideSteps);

  // Fülle jede info-popup mit derselben Vorlage (clone für Unabhängigkeit)
  qsAll('.info-popup').forEach(popup => {
    const clone = template.content.cloneNode(true);
    popup.appendChild(clone);
    enableAccordion(popup);
  });

  /* --- Guide-Button Verhalten --- */
  function applyGuideShift() {
    const open = guideSteps.style.display === 'block';
    if (!open) {
      teamsContainer.classList.remove('shifted-down');
      teamsContainer.style.transform = '';
      teamsContainer.style.opacity = '';
      return;
    }
    // Messung: sichtbare Höhe der Anleitung (nach render)
    const rect = guideSteps.getBoundingClientRect();
    const shift = Math.min(window.innerHeight * 0.5, Math.ceil(rect.height) + 18);
    teamsContainer.classList.add('shifted-down');
    teamsContainer.style.transform = \`translateY(\${shift}px)\`;
    teamsContainer.style.opacity = '0.98';
  }

  guideBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = guideSteps.style.display === 'block';
    if (open) {
      guideSteps.style.display = 'none';
      guideBtn.setAttribute('aria-expanded','false');
      guideBtn.textContent = 'Anleitung anzeigen';
      applyGuideShift();
    } else {
      // schließe alle offenen Schritte zunächst
      guideSteps.querySelectorAll('.step-content').forEach(c => c.style.display = 'none');
      guideSteps.style.display = 'block';
      guideBtn.setAttribute('aria-expanded','true');
      guideBtn.textContent = 'Anleitung verbergen';
      // sicherstellen, dass Accordion gebunden ist
      enableAccordion(guideSteps);
      // shift nach Layout-stabilisierung
      requestAnimationFrame(applyGuideShift);
    }
  });

  /* --- Team Overlay (bei Klick auf Team-Header) --- */
  let activeOverlay = null;
  function closeOverlays() {
    qsAll('.team-content').forEach(c => {
      c.style.display = 'none';
      c.setAttribute('aria-hidden','true');
      // falls es per DOM aus dem body verschoben wurde, keine Rückverschiebung nötig (es bleibt im DOM)
    });
    qsAll('.team-card.focused').forEach(card => card.classList.remove('focused'));
    teamsContainer.classList.remove('dimmed');
    teamsContainer.style.pointerEvents = '';
    activeOverlay = null;
  }

  qsAll('.team-header').forEach(header => {
    const card = header.closest('.team-card');
    const content = qs('.team-content', card);

    if (content) {
      // clicks inside overlay shouldn't bubble to document
      content.addEventListener('click', e => e.stopPropagation());
      // close button (mobile)
      const closeBtn = qs('.overlay-close', content);
      if (closeBtn) {
        closeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          closeOverlays();
        });
      }
    }

    header.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!content) return;

      // toggle
      if (activeOverlay === content) {
        closeOverlays();
        return;
      }

      closeOverlays(); // schließe andere Overlays

      // füge content optional ins body (verhindert clipping)
      if (!document.body.contains(content)) document.body.appendChild(content);

      const isMobile = window.innerWidth <= 600;
      if (isMobile) {
        // full-screen modal
        Object.assign(content.style, {
          position: 'fixed',
          left: '0px',
          top: '0px',
          width: '100vw',
          height: '100vh',
          maxHeight: 'none',
          display: 'block',
          zIndex: 12000
        });
        content.setAttribute('aria-hidden','false');
        // teams aus dem Blick schieben
        teamsContainer.style.transform = 'translateY(110vh)';
        teamsContainer.style.opacity = '0.12';
        teamsContainer.style.pointerEvents = 'none';
        card.classList.add('focused');
        activeOverlay = content;
        return;
      }

      // Desktop: positioniere neben Header
      // zuerst anzeigen, sonst offsetHeight = 0
      content.style.display = 'block';
      content.style.position = 'fixed';
      content.style.zIndex = 12000;
      content.setAttribute('aria-hidden','false');

      const rect = header.getBoundingClientRect();
      let desiredWidth = Math.max(rect.width * 2.2, 360);
      const maxWidth = window.innerWidth * 0.95;
      if (desiredWidth > maxWidth) desiredWidth = maxWidth;
      const margin = 28;

      let leftPos = rect.left;
      if (leftPos + desiredWidth > window.innerWidth - margin) {
        leftPos = window.innerWidth - desiredWidth - margin;
      }
      if (leftPos < margin) leftPos = margin;

      // Messung der Höhe nach Anzeige
      const contentHeight = content.offsetHeight;
      let topPos = rect.bottom;
      const viewportHeight = window.innerHeight;
      if (topPos + contentHeight > viewportHeight - 20) {
        topPos = rect.top - contentHeight;
      }
      if (topPos < 20) topPos = 20;

      content.style.width = desiredWidth + 'px';
      content.style.maxHeight = '80vh';
      content.style.left = leftPos + 'px';
      content.style.top = topPos + 'px';

      // dimme und verschiebe übrige Inhalte, hebe Karte hervor
      teamsContainer.classList.add('dimmed');
      teamsContainer.style.pointerEvents = 'none';
      card.classList.add('focused');
      activeOverlay = content;
    });
  });

  /* --- Info-Button ( ? ) Verhalten: zeigt dieselbe Anleitung in Popup --- */
  qsAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const card = btn.closest('.team-card');
      const popup = qs('.info-popup', card);
      if (!popup) return;
      const isOpen = popup.style.display === 'block';

      // schließe alle anderen popups
      qsAll('.info-popup').forEach(p => {
        if (p !== popup) { p.style.display = 'none'; p.setAttribute('aria-hidden','true'); }
      });

      if (isOpen) {
        popup.style.display = 'none';
        popup.setAttribute('aria-hidden','true');
        teamsContainer.classList.remove('dimmed');
        card.classList.remove('focused');
        return;
      }

      // mobile: full-width block
      const isMobile = window.innerWidth <= 600;
      if (isMobile) {
        popup.style.display = 'block';
        popup.style.position = 'relative';
        popup.style.maxHeight = 'none';
        popup.setAttribute('aria-hidden','false');
        // teams aus dem Blick schieben
        teamsContainer.style.transform = 'translateY(110vh)';
        teamsContainer.style.opacity = '0.12';
        teamsContainer.style.pointerEvents = 'none';
        card.classList.add('focused');
        return;
      }

      // desktop: ensure popup has the template content (wurde bei DOMContentLoaded eingefügt)
      popup.style.display = 'block';
      popup.setAttribute('aria-hidden','false');
      enableAccordion(popup);

      // dimme übrige Inhalte und hebe Kartei hervor
      teamsContainer.classList.add('dimmed');
      card.classList.add('focused');
    });
  });

  /* Klick außerhalb schließt Overlays und Popups (Hauptanleitung bleibt offen wenn sie offen ist) */
  document.addEventListener('click', (e) => {
    // wenn Klick innerhalb der Anleitung, nichts tun
    if (guideSteps.contains(e.target) || guideBtn.contains(e.target)) return;

    // sonst: schließe team overlays & info popups
    closeOverlays();
    qsAll('.info-popup').forEach(p => { p.style.display = 'none'; p.setAttribute('aria-hidden','true'); });
  });

  /* scroll/responsive cleanup */
  window.addEventListener('scroll', () => {
    // für bessere mobile UX: schließen
    qsAll('.info-popup').forEach(p => { p.style.display = 'none'; p.setAttribute('aria-hidden','true'); });
    closeOverlays();
  }, { passive: true });

  window.addEventListener('resize', () => {
    // recompute guide shift und close overlays
    if (guideSteps.style.display === 'block') {
      requestAnimationFrame(() => {
        const rect = guideSteps.getBoundingClientRect();
        const shift = Math.min(window.innerHeight * 0.5, Math.ceil(rect.height) + 18);
        teamsContainer.style.transform = \`translateY(\${shift}px)\`;
      });
    }
    closeOverlays();
  }, { passive: true });

}); // DOMContentLoaded end
</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
}

genHTML();
