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

  console.log("TEAMS.JSON:");
  console.log(JSON.stringify(teamsArray[0], null, 2));

  console.log("METADATA.JSON:");
  console.log(JSON.stringify(metadataArray[0], null, 2));

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
  transition: transform 280ms ease, opacity 280ms ease;
}

/* shifted states (durch Anleitung / Popups) */
.teams-container.shifted-down { transform: translateY(18px); } /* minimal visual nudge while measuring */
.teams-container.shifted-by-guide { transition: transform 320ms ease, opacity 320ms ease; opacity:0.9; }
.teams-container.shifted-by-popup { transform: translateX(18%) scale(0.98); opacity:0.35; pointer-events:none; }

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
.team-card.focused { transform: translateX(-6%) scale(1.02); z-index:11000; }

/* Overlay (team-content) - default fixed, doesn't affect layout */
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

  /* Info-popup inside overlay becomes full width block on mobile */
  .info-popup{
    width:100%;
    max-width:none;
    position:relative;
    margin-top:10px;
  }

  /* guide button full width on small screens */
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

<!-- Anleitung-Button: erst klicken, dann zeigen sich die drei Schritte -->
<button id="show-steps-btn" class="guide-btn" aria-expanded="false" aria-controls="steps-wrapper">Anleitung anzeigen</button>

<!-- Hidden template: zentraler Inhalt für die Anleitung. Wird für die Haupt-Anleitung und für alle ?-Popups wiederverwendet -->
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

<!-- Steps wrapper: wird per JS mit dem Inhalt der Vorlage gefüllt -->
<div id="steps-wrapper" style="display:none;"></div>

<div class="teams-container">
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
          <!-- Leeres Popup: wird per JS mit der kompletten Anleitung gefüllt (gleicher Inhalt wie steps-wrapper) -->
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
/*
  Verhalten:
  - Accordion: Wenn ein Schritt geöffnet ist und ein anderer Schritt angeklickt wird, wird der vorherige geschlossen.
    Gilt für die Haupt-Anleitung (steps-wrapper) und für alle ?-Popups (info-popup).
  - Wenn die Anleitung (Haupt-Guide) angezeigt wird, verschiebt sie die restlichen Inhalte (teams/downloads) sichtbar aus dem Blickfeld
    durch eine dynamische translateY auf .teams-container (weiche Animation).
  - Wenn ein ?-Popup geöffnet wird, dimmen/verschieben wir die übrigen Inhalte und heben die dazugehörige Karte leicht hervor.
*/

document.addEventListener('DOMContentLoaded', () => {
  const template = document.getElementById('steps-template');
  const stepsWrapper = document.getElementById('steps-wrapper');
  const guideBtn = document.getElementById('show-steps-btn');
  const teamsContainer = document.querySelector('.teams-container');

  /* Hilfsfunktion: setze Accordion-Verhalten innerhalb eines Containers */
  function enableAccordion(container) {
    if (!container) return;
    const headers = container.querySelectorAll('.step-header');
    headers.forEach(h => {
      h.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const targetContent = h.nextElementSibling;
        if (!targetContent) return;

        // Close other open step-content within same container
        container.querySelectorAll('.step-content').forEach(c => {
          if (c !== targetContent && c.style.display === 'block') {
            c.style.display = 'none';
          }
        });

        // Toggle clicked one
        targetContent.style.display = targetContent.style.display === 'block' ? 'none' : 'block';

        // After toggling, if this container is the main stepsWrapper, re-evaluate teamsContainer shift
        if (container === stepsWrapper) {
          applyGuideShiftIfOpen();
        }
      });
    });
  }

  /* Populate steps-wrapper and all info-popups from the hidden template */
  if (template && stepsWrapper) {
    stepsWrapper.innerHTML = template.innerHTML;
    enableAccordion(stepsWrapper);
  }

  // Fill each info-popup with the same content and enable accordion inside each popup
  document.querySelectorAll('.info-popup').forEach(popup => {
    popup.innerHTML = template.innerHTML;
    enableAccordion(popup);
  });

  /* Funktion: wenn die Haupt-Anleitung offen ist → verschiebe teams-container um Höhe der Anleitung (mit etwas Padding) */
  function applyGuideShiftIfOpen() {
    const isOpen = stepsWrapper.style.display === 'block';
    if (!teamsContainer) return;

    if (isOpen) {
      // berechne Höhe der sichtbaren Anleitung (inkl. geöffneter Schritt-Contents)
      const rect = stepsWrapper.getBoundingClientRect();
      const height = Math.ceil(rect.height);
      // ein wenig Abstand addieren
      const shift = height + 24;
      teamsContainer.classList.add('shifted-by-guide');
      teamsContainer.style.transform = 'translateY(' + shift + 'px)';
      teamsContainer.style.opacity = '0.95';
    } else {
      teamsContainer.classList.remove('shifted-by-guide');
      teamsContainer.style.transform = '';
      teamsContainer.style.opacity = '';
    }
  }

  /* Anleitung-Button: zeigt/versteckt den steps-wrapper */
  guideBtn.addEventListener('click', (e) => {
    const isOpen = stepsWrapper.style.display === 'block';
    if (isOpen) {
      stepsWrapper.style.display = 'none';
      guideBtn.setAttribute('aria-expanded', 'false');
      guideBtn.textContent = 'Anleitung anzeigen';
      // clean shift
      applyGuideShiftIfOpen();
    } else {
      stepsWrapper.style.display = 'block';
      guideBtn.setAttribute('aria-expanded', 'true');
      guideBtn.textContent = 'Anleitung verbergen';
      // wait for layout to stabilize then shift
      requestAnimationFrame(() => {
        // open none of the internal steps by default, but keep their event handlers active
        stepsWrapper.querySelectorAll('.step-content').forEach(c => c.style.display = 'none');
        enableAccordion(stepsWrapper); // ensure accordion bound
        applyGuideShiftIfOpen();

        // On small screens scroll the steps into view
        if (window.innerWidth <= 600) {
          stepsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  });

  /* Overlay / team popups logic with shifting of other content */
  const teamHeaders = document.querySelectorAll('.team-header');
  let activeContent = null;
  let activeFocusedCard = null;

  function closeAllOverlays() {
    document.querySelectorAll('.team-content').forEach(c => {
      c.style.display = 'none';
      c.setAttribute('aria-hidden', 'true');
    });
    // remove any focused card highlight
    document.querySelectorAll('.team-card.focused').forEach(card => card.classList.remove('focused'));
    // clear teams container shifting caused by popup
    if (teamsContainer) {
      teamsContainer.classList.remove('shifted-by-popup');
      teamsContainer.style.transform = teamsContainer.style.transform || '';
      teamsContainer.style.opacity = '';
      teamsContainer.style.pointerEvents = '';
    }
    activeContent = null;
    activeFocusedCard = null;
  }

  teamHeaders.forEach((header) => {
    const card = header.closest('.team-card');
    const content = card.querySelector('.team-content');

    // prevent clicks inside overlay from bubbling up (so document click doesn't close)
    if (content) content.addEventListener('click', e => e.stopPropagation());

    // close button (mobile)
    if (content) {
      const closeBtn = content.querySelector('.overlay-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', e => {
          e.stopPropagation();
          content.style.display = 'none';
          content.setAttribute('aria-hidden', 'true');
          closeAllOverlays();
        });
      }
    }

    header.addEventListener('click', e => {
      e.stopPropagation();
      if (!content) return;

      // toggle
      if (activeContent === content) {
        content.style.display = 'none';
        content.setAttribute('aria-hidden', 'true');
        closeAllOverlays();
        return;
      }

      // close others
      closeAllOverlays();

      // ensure content is appended to body to avoid clipping by parents
      if (!document.body.contains(content)) document.body.appendChild(content);

      const isMobile = window.innerWidth <= 600;

      // visual: highlight the clicked card
      if (card) {
        card.classList.add('focused');
        activeFocusedCard = card;
      }

      if (isMobile) {
        // Mobile: full-screen modal
        content.style.position = 'fixed';
        content.style.left = '0px';
        content.style.top = '0px';
        content.style.width = '100vw';
        content.style.height = '100vh';
        content.style.maxHeight = 'none';
        content.style.display = 'block';
        content.style.zIndex = 12000;
        content.setAttribute('aria-hidden', 'false');
        content.scrollTop = 0;

        // hide/shift teams container so the overlay is the focus (mobile)
        if (teamsContainer) {
          teamsContainer.style.transition = 'transform 280ms ease, opacity 280ms ease';
          teamsContainer.style.transform = 'translateY(110vh)';
          teamsContainer.style.opacity = '0.15';
          teamsContainer.style.pointerEvents = 'none';
        }

        activeContent = content;
        return;
      }

      // Desktop / larger screens: position near header with width handling
      const rect = header.getBoundingClientRect();

      // Desired width factor
      let desiredWidth = Math.max(rect.width * 2.2, 360);
      // cap to 95% of viewport width
      const maxWidth = window.innerWidth * 0.95;
      if (desiredWidth > maxWidth) desiredWidth = maxWidth;

      // margin from screen edges
      const margin = 28; // px

      // compute left position
      let leftPos = rect.left;
      if (leftPos + desiredWidth > window.innerWidth - margin) {
        leftPos = window.innerWidth - desiredWidth - margin;
      }
      if (leftPos < margin) leftPos = margin;

      // set styles
      content.style.position = 'fixed';
      content.style.display = 'block';
      content.style.zIndex = 12000;
      content.style.width = desiredWidth + 'px';
      content.style.maxHeight = '80vh';
      content.setAttribute('aria-hidden', 'false');

      // Erst unten platzieren
      let topPos = rect.bottom;

      // Prüfen ob es unten rausläuft
      const contentHeight = content.offsetHeight;
      const viewportHeight = window.innerHeight;

      if (topPos + contentHeight > viewportHeight - 20) {
        // dann über dem Header anzeigen
        topPos = rect.top - contentHeight;
      }

      // Falls es oben rausläuft → minimaler Abstand
      if (topPos < 20) {
        topPos = 20;
      }

      content.style.top = topPos + 'px';
      content.style.left = leftPos + 'px';

      // Shift other content a bit to the side and dim
      if (teamsContainer) {
        teamsContainer.classList.add('shifted-by-popup');
        teamsContainer.style.transform = 'translateX(18%) scale(0.98)';
        teamsContainer.style.opacity = '0.28';
        teamsContainer.style.pointerEvents = 'none'; // avoid accidental clicks while popup is open
      }

      activeContent = content;
    });
  });

  // close overlays when clicking outside
  document.addEventListener('click', () => {
    // if main steps are open, keep them unless click outside was intended to close them as well
    // We'll close overlays and info popups, but not the main guide unless click target was outside guide button and steps
    closeAllOverlays();

    // also close info popups
    document.querySelectorAll('.info-popup').forEach(p => {
      p.style.display = 'none';
      p.setAttribute('aria-hidden','true');
    });
  });

  // Info popup toggles: clicking ? opens the same full guide content; also cause the shift
  document.querySelectorAll('.info-btn').forEach((btn) => {
    const card = btn.closest('.team-card');
    const popup = card ? card.querySelector('.info-popup') : null;

    if (popup) {
      // prevent clicks inside popup from closing overlays
      popup.addEventListener('click', e => e.stopPropagation());
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();

      // close any other info popups
      document.querySelectorAll('.info-popup').forEach(p => {
        if (p !== popup) {
          p.style.display = 'none';
          p.setAttribute('aria-hidden','true');
        }
      });

      if (!popup) return;
      const isOpen = popup.style.display === 'block';

      if (isOpen) {
        popup.style.display = 'none';
        popup.setAttribute('aria-hidden', 'true');
        // reset teams container
        if (teamsContainer) {
          teamsContainer.classList.remove('shifted-by-popup');
          teamsContainer.style.transform = '';
          teamsContainer.style.opacity = '';
          teamsContainer.style.pointerEvents = '';
        }
        if (card) card.classList.remove('focused');
        return;
      }

      // show popup (desktop: small relative popup inside card; mobile: collapsible full width)
      if (window.innerWidth <= 600) {
        // on mobile, show full-screen style by adding a class to the card's popup element
        popup.style.display = 'block';
        popup.style.position = 'relative';
        popup.style.maxHeight = 'none';
        popup.setAttribute('aria-hidden', 'false');

        // shift teams container off viewport
        if (teamsContainer) {
          teamsContainer.style.transform = 'translateY(110vh)';
          teamsContainer.style.opacity = '0.12';
          teamsContainer.style.pointerEvents = 'none';
        }
        if (card) card.classList.add('focused');
        return;
      }

      // Desktop: inject the template content into popup (already done at DOMContentLoaded)
      popup.style.display = 'block';
      popup.setAttribute('aria-hidden', 'false');

      // ensure only one step open inside popup at a time (accordion behavior)
      enableAccordion(popup);

      // shift/dim other content and highlight the card
      if (teamsContainer) {
        teamsContainer.classList.add('shifted-by-popup');
        teamsContainer.style.transform = 'translateX(18%) scale(0.98)';
        teamsContainer.style.opacity = '0.28';
        teamsContainer.style.pointerEvents = 'none';
      }
      if (card) card.classList.add('focused');
    });
  });

  // Close popups on scroll for better UX on mobile/desktop
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.info-popup').forEach(p => {
      p.style.display = 'none';
      p.setAttribute('aria-hidden','true');
    });
    // reset styles applied by popups
    closeAllOverlays();
  }, { passive: true });

  // ensure overlays close on resize to avoid misplacement and reset shifts
  window.addEventListener('resize', () => {
    closeAllOverlays();
    document.querySelectorAll('.info-popup').forEach(p => {
      p.style.display = 'none';
      p.setAttribute('aria-hidden','true');
    });
    // also update guide shift if its open (recompute)
    applyGuideShiftIfOpen();
  }, { passive: true });

});
</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
}

genHTML();
