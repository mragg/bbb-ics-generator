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

/* GLOBAL */
*{box-sizing:border-box}
body{
  margin:0;
  font-family:'Inter',sans-serif;
  background:var(--tvn-gray);
  color:#222;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* HEADER */
header{
  background:linear-gradient(135deg,var(--tvn-blue),var(--tvn-light-blue));
  color:var(--tvn-white);
  padding:20px 30px;
}
.header-inner{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start}
.logo{height:140px;flex-shrink:0}
.header-text{display:flex;flex-direction:column;justify-content:center;flex:1}
.header-text h1{font-family:'Oswald',sans-serif;font-size:2.2rem;margin:0;text-transform:uppercase}
.header-text p{margin-top:8px;font-weight:300;opacity:0.9}

/* LAYOUT */
.container{max-width:900px;margin:40px auto;padding:0 20px}
.teams-container{display:flex;flex-wrap:wrap;gap:15px;margin-top:20px}

/* TEAM CARD */
.team-card{
  background:var(--tvn-white);
  border-radius:8px;
  box-shadow:0 4px 12px rgba(0,0,0,0.08);
  flex:1 1 200px;
  min-width:200px;
  display:flex;
  flex-direction:column;
  position:relative;
}
.team-header{
  padding:15px 20px;
  font-weight:600;
  font-family:'Oswald',sans-serif;
  background:var(--tvn-blue);
  color:var(--tvn-white);
  border-radius:8px;
}
.team-card:hover{transform:translateY(-2px)}

/* TEAM CONTENT / OVERLAY (default fixed, doesn't affect layout) */
.team-content{
  position:fixed;
  background:#fff;
  padding:18px 20px;
  box-shadow:0 12px 36px rgba(0,0,0,0.2);
  border-radius:8px;
  z-index:9999;
  display:none;
  max-height:80vh;
  overflow:auto;
  box-sizing:border-box;
}

/* Buttons inside overlay */
.team-content .buttons{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:10px;
  align-items:flex-start;
}
.team-content .buttons a{
  display:inline-block;
  padding:8px 16px;
  margin:5px 6px 0 0;
  background:var(--tvn-blue);
  color:var(--tvn-white);
  text-decoration:none;
  border-radius:4px;
  font-size:0.85rem;
  font-weight:600;
  transition:background 0.15s,transform 0.12s;
}
.team-content .buttons a:hover{background:var(--tvn-red);transform:translateY(-2px)}

/* Info button & popup */
.info-btn{
  background:var(--tvn-gray);
  border:none;
  border-radius:50%;
  width:28px;height:28px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-weight:700;font-size:0.9rem;flex:0 0 auto;
}
.info-popup{
  display:none;
  position:absolute;
  top:40px;
  left:0;
  background:#fff;
  padding:10px;border-radius:6px;
  box-shadow:0 6px 18px rgba(0,0,0,0.15);
  width:300px;font-size:0.9rem;z-index:10000;
}

/* Close button for mobile overlay */
.overlay-close{
  display:none;
  position:absolute;
  right:14px;
  top:12px;
  background:transparent;
  border:none;
  font-size:1.4rem;
  cursor:pointer;
}

/* STEP BOXEN */
.step-box{background:var(--tvn-white);margin-bottom:15px;border-radius:6px;overflow:hidden;box-shadow:0 3px 8px rgba(0,0,0,0.06)}
.step-header{padding:15px 20px;cursor:pointer;font-weight:600;background:var(--tvn-blue);color:var(--tvn-white);font-family:'Oswald',sans-serif}
.step-header:hover{background:var(--tvn-red)}
.step-content{padding:15px 20px;display:none;font-size:0.9rem;line-height:1.5;background:#fafafa}

/* FOOTER */
footer{text-align:center;padding:30px 10px;font-size:0.8rem;color:#777}

/* MOBILE: full-screen overlay + stacked buttons + grid for teams */
@media (max-width: 600px){
  /* Teams layout: two per row (or one per row if you prefer) */
  .teams-container{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px;
    padding-bottom:30px;
  }
  .team-card{min-width:0}

  /* Make overlay use most of the screen (bottom-sheet / full modal) */
  .team-content{
    left:0 !important;
    top:0 !important;
    width:100vw !important;
    height:100vh !important;
    max-height:none !important;
    border-radius:0 !important;
    padding:20px;
    box-shadow:0 30px 60px rgba(0,0,0,0.35);
    overflow-y:auto;
  }

  /* Show a close button in the overlay */
  .overlay-close{display:block}

  /* Buttons stack vertically for mobile */
  .team-content .buttons{flex-direction:column;align-items:stretch}
  .team-content .buttons a{width:100%;margin:8px 0;text-align:center}

  /* Info-popup full width near top of overlay */
  .info-popup{position:relative;top:0;left:0;width:calc(100% - 40px);margin-bottom:12px}
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
        <p>${t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}</p>

        <div class="info-block" style="margin-bottom:8px;">
          <button class="info-btn">?</button>
          <div class="info-popup" role="dialog" aria-hidden="true">
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
document.querySelectorAll('.step-header').forEach(h=>{
  h.addEventListener('click',()=> {
    const c = h.nextElementSibling;
    c.style.display = c.style.display === 'block' ? 'none' : 'block';
  });
});

/* Overlay behaviour */
const teamHeaders = document.querySelectorAll('.team-header');
let activeContent = null;

teamHeaders.forEach(header => {
  const content = header.nextElementSibling; // team-content in same team-card

  // prevent overlay click closing
  content.addEventListener('click', e => e.stopPropagation());

  // close button inside overlay (mobile)
  const closeBtn = content.querySelector('.overlay-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      content.style.display = 'none';
      content.setAttribute('aria-hidden','true');
      activeContent = null;
    });
  }

  header.addEventListener('click', e => {
    e.stopPropagation();

    // toggle same content
    if (activeContent === content) {
      content.style.display = 'none';
      content.setAttribute('aria-hidden','true');
      activeContent = null;
      return;
    }

    // close others
    document.querySelectorAll('.team-content').forEach(c => {
      c.style.display = 'none';
      c.setAttribute('aria-hidden','true');
    });

    // append to body so no parent overflow clips it
    if (!document.body.contains(content)) document.body.appendChild(content);

    // compute rect and desired width
    const rect = header.getBoundingClientRect();
    let newWidth = Math.max(rect.width * 2.2, 300);

    // limit to 95% viewport width
    const maxWidth = window.innerWidth * 0.95;
    if (newWidth > maxWidth) newWidth = maxWidth;

    // margin (px) from screen edge
    const margin = 35;

    // place left, but keep within viewport
    let leftPos = rect.left;
    if (leftPos + newWidth > window.innerWidth - margin) {
      leftPos = window.innerWidth - newWidth - margin;
    }
    if (leftPos < margin) leftPos = margin;

    // Desktop / general positioning: fixed
    content.style.position = 'fixed';
    content.style.top = (rect.bottom) + 'px';
    content.style.left = leftPos + 'px';
    content.style.width = newWidth + 'px';
    content.style.display = 'block';
    content.setAttribute('aria-hidden','false');
    content.style.zIndex = 9999;

    // if on mobile viewport, use mobile full-screen rules: override via CSS but ensure aria and display set
    if (window.innerWidth <= 600) {
      // Make sure overlay scroll starts at top
      content.scrollTop = 0;
    }

    activeContent = content;
  });
});

// Click anywhere closes overlays
document.addEventListener('click', () => {
  document.querySelectorAll('.team-content').forEach(c => {
    c.style.display = 'none';
    c.setAttribute('aria-hidden','true');
  });
  activeContent = null;
});

/* Info popup buttons */
document.querySelectorAll('.info-btn').forEach(btn => {
  const popup = btn.parentElement.querySelector('.info-popup');
  if (popup) popup.addEventListener('click', e => e.stopPropagation()); // clicking inside popup doesn't close overlay
  btn.addEventListener('click', e => {
    e.stopPropagation();
    // close other popups
    document.querySelectorAll('.info-popup').forEach(p => {
      if (p !== popup) p.style.display = 'none';
    });
    if (popup) {
      popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
      popup.setAttribute('aria-hidden', popup.style.display === 'none' ? 'true' : 'false');
    }
  });
});

// Close popups when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.info-popup').forEach(p => {
    p.style.display = 'none';
    p.setAttribute('aria-hidden','true');
  });
});

// Close popups on scroll (mobile UX)
window.addEventListener('scroll', () => {
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
