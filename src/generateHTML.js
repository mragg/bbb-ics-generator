const fs = require('fs');
const path = require('path');

function makeWebcalLink(filename) {
  const baseUrl = 'https://mragg.github.io/bbb-ics-generator/';
  return baseUrl + filename;
}

function genHTML() {
  const metaPath = path.resolve(__dirname, '../generated/metadata.json');
  const teams = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath))
    : [];

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
.teams-container{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;align-items:flex-start}

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

<div class="teams-container">
  ${teams.map((t, index) => `
    <div class="team-card">
      <div class="team-header" data-index="${index}">
        ${t.teamName}${t.ageGroup ? ` (<strong>${t.ageGroup}</strong>)` : ''}
      </div>

      <div class="team-content" aria-hidden="true">
        <button class="overlay-close" aria-label="Schließen">&times;</button>
        <div class="team-content-preview">
          <p><strong>${t.teamName}</strong></p>
          <p>${t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}</p>
        </div>

        <div class="info-block">
          <button class="info-btn" aria-expanded="false" aria-controls="info-${index}">?</button>
          <div id="info-${index}" class="info-popup" role="dialog" aria-hidden="true">
            <p>📱 <strong>Smartphone/Tablet:</strong> Link lang drücken → <em>„Link kopieren“</em> → Kalender-App öffnen → <em>„Aus URL hinzufügen“</em></p>
            <p>💻 <strong>Computer:</strong> Rechtsklick auf Link → <em>„Link kopieren“</em> → Kalender-App öffnen → <em>„Aus Internet hinzufügen“</em></p>
          </div>
        </div>

        <div class="buttons">
          <a href="${makeWebcalLink(t.teamId+"_all.ics")}">Alle Spiele abonnieren</a>
          <a href="${makeWebcalLink(t.teamId+"_home.ics")}">Nur Heimspiele abonnieren</a>
          <a href="${makeWebcalLink(t.teamId+"_away.ics")}">Nur Auswärts abonnieren</a>
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
/* Step toggles */
document.querySelectorAll('.step-header').forEach(h => {
  h.addEventListener('click', () => {
    const c = h.nextElementSibling;
    c.style.display = c.style.display === 'block' ? 'none' : 'block';
  });
});

/* Overlay logic */
const teamHeaders = document.querySelectorAll('.team-header');
let activeContent = null;

function closeAllOverlays() {
  document.querySelectorAll('.team-content').forEach(c => {
    c.style.display = 'none';
    c.setAttribute('aria-hidden', 'true');
  });
  activeContent = null;
}

teamHeaders.forEach((header, idx) => {
  const card = header.closest('.team-card');
  const content = card.querySelector('.team-content');

  // prevent clicks inside overlay from bubbling up (so document click doesn't close)
  content.addEventListener('click', e => e.stopPropagation());

  // close button (mobile)
  const closeBtn = content.querySelector('.overlay-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      content.style.display = 'none';
      content.setAttribute('aria-hidden', 'true');
      activeContent = null;
    });
  }

  header.addEventListener('click', e => {
    e.stopPropagation();

    // toggle
    if (activeContent === content) {
      content.style.display = 'none';
      content.setAttribute('aria-hidden', 'true');
      activeContent = null;
      return;
    }

    // close others
    closeAllOverlays();

    // ensure content is appended to body to avoid clipping by parents
    if (!document.body.contains(content)) document.body.appendChild(content);

    const isMobile = window.innerWidth <= 600;

    if (isMobile) {
      // Mobile: let CSS make it full-screen. just show it.
      content.style.position = 'fixed';
      content.style.left = '0px';
      content.style.top = '0px';
      content.style.width = '100vw';
      content.style.height = '100vh';
      content.style.maxHeight = 'none';
      content.style.display = 'block';
      content.style.zIndex = 12000;
      content.setAttribute('aria-hidden', 'false');
      // reset scroll to top of overlay
      content.scrollTop = 0;
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
    content.style.top = (rect.bottom) + 'px';
    content.style.left = leftPos + 'px';
    content.style.width = desiredWidth + 'px';
    content.style.display = 'block';
    content.style.zIndex = 12000;
    content.style.maxHeight = '80vh';
    content.setAttribute('aria-hidden', 'false');

    // ensure focusable close behavior if needed
    activeContent = content;
  });
});

// close overlays when clicking outside
document.addEventListener('click', () => {
  closeAllOverlays();
  // also close info popups
  document.querySelectorAll('.info-popup').forEach(p => {
    p.style.display = 'none';
    p.setAttribute('aria-hidden','true');
  });
});

// Info popup toggles
document.querySelectorAll('.info-btn').forEach((btn, idx) => {
  // target popup inside the same card/content
  const card = btn.closest('.team-card');
  const popup = card.querySelector('.info-popup');

  if (popup) {
    // prevent clicks inside popup from closing overlays
    popup.addEventListener('click', e => e.stopPropagation());
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    // close other popups
    document.querySelectorAll('.info-popup').forEach(p => {
      if (p !== popup) {
        p.style.display = 'none';
        p.setAttribute('aria-hidden','true');
      }
    });
    if (!popup) return;
    const isOpen = popup.style.display === 'block';
    popup.style.display = isOpen ? 'none' : 'block';
    popup.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
  });
});

// Close popups on scroll for better UX on mobile/desktop
window.addEventListener('scroll', () => {
  document.querySelectorAll('.info-popup').forEach(p => {
    p.style.display = 'none';
    p.setAttribute('aria-hidden','true');
  });
}, { passive: true });

// ensure overlays close on resize to avoid misplacement
window.addEventListener('resize', () => {
  closeAllOverlays();
  document.querySelectorAll('.info-popup').forEach(p => {
    p.style.display = 'none';
    p.setAttribute('aria-hidden','true');
  });
}, { passive: true });

</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content);
}

genHTML();
