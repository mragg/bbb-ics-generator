
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function genHTML() {
  const metaPath = path.resolve(__dirname, '../generated/metadata.json');
  const teamsPath = path.resolve(__dirname, '../generated/teams.json');

  const rawMeta = safeReadJson(metaPath) || [];
  const rawTeams = safeReadJson(teamsPath) || [];

  const metadataArray = Array.isArray(rawMeta) ? rawMeta : (rawMeta.teams || rawMeta.data || []);
  const teamsArray = Array.isArray(rawTeams) ? rawTeams : (rawTeams.teams || rawTeams.data || []);

  const sourceArray = metadataArray.length > 0 ? metadataArray : teamsArray;

  const teams = sourceArray.map(m => {
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

<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<style>
:root{
  --bg:#fff7f0;
  --surface:#ffffff;
  --text:#24160f;
  --muted:#6d5a50;
  --orange:#ff7a18;
  --orange-2:#ff9a3d;
  --orange-3:#ff5f1f;
  --line:rgba(255,122,24,.18);
  --shadow:0 18px 40px rgba(67,31,5,.12);
  --shadow-soft:0 8px 22px rgba(67,31,5,.08);
  --radius:18px;
}

*{box-sizing:border-box}
html,body{height:100%}
html{scroll-behavior:smooth}
body{
  margin:0;
  font-family:'Inter',sans-serif;
  background:
    radial-gradient(circle at top left, rgba(255,154,61,.18), transparent 28%),
    radial-gradient(circle at top right, rgba(255,122,24,.14), transparent 24%),
    linear-gradient(180deg, #fffaf6 0%, var(--bg) 100%);
  color:var(--text);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

header{
  background:linear-gradient(135deg, var(--orange-3), var(--orange), var(--orange-2));
  color:#fff;
  padding:20px;
  box-shadow:0 10px 30px rgba(255,122,24,.25);
}
.header-inner{
  display:flex;
  gap:16px;
  align-items:center;
  flex-wrap:wrap;
  max-width:1100px;
  margin:0 auto;
}
.logo{
  height:108px;
  flex-shrink:0;
  filter:drop-shadow(0 8px 16px rgba(0,0,0,.16));
}
.header-text{
  display:flex;
  flex-direction:column;
  justify-content:center;
  flex:1;
  min-width:240px;
}
.header-text h1{
  font-family:'Oswald',sans-serif;
  font-size:clamp(1.8rem, 3vw, 2.6rem);
  margin:0;
  letter-spacing:.5px;
  text-transform:uppercase;
}
.header-text p{
  margin:8px 0 0;
  font-weight:400;
  opacity:0.96;
  font-size:0.98rem;
  line-height:1.45;
}

.container{
  max-width:1100px;
  margin:28px auto 0;
  padding:0 16px 40px;
}
.teams-container{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));
  gap:14px;
  margin-top:16px;
  align-items:start;
}

.team-card{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:var(--radius);
  box-shadow:var(--shadow-soft);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  position:relative;
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.team-card:hover{
  transform:translateY(-3px);
  box-shadow:var(--shadow);
  border-color:rgba(255,122,24,.28);
}
.team-header{
  padding:14px 14px 13px;
  font-weight:700;
  font-family:'Oswald',sans-serif;
  background:linear-gradient(135deg, #2a1a11, #4b2a15);
  color:#fff;
  cursor:pointer;
  user-select:none;
  letter-spacing:.3px;
}
.team-header strong{
  color:#ffd3b0;
  font-weight:700;
}
.team-card .team-content-preview{
  padding:14px 14px 16px;
  color:var(--text);
}
.team-content-preview p{
  margin:10px 0 0;
  color:var(--muted);
}

.team-content{
  position:fixed;
  display:none;
  background:#fff;
  padding:18px;
  border-radius:22px;
  box-shadow:0 24px 60px rgba(0,0,0,0.22);
  z-index:12000;
  max-height:80vh;
  overflow:auto;
  border:1px solid rgba(255,122,24,.14);
}

.team-content .buttons{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:14px;
  align-items:flex-start;
}
.team-content .buttons a,
.back-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:12px 16px;
  background:linear-gradient(135deg, var(--orange), var(--orange-2));
  color:#fff;
  text-decoration:none;
  border-radius:14px;
  font-weight:700;
  font-size:0.95rem;
  border:0;
  transition:transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
  box-shadow:0 10px 20px rgba(255,122,24,.18);
}
.team-content .buttons a:hover,
.back-link:hover{
  filter:brightness(.98);
  transform:translateY(-2px);
  box-shadow:0 14px 24px rgba(255,122,24,.22);
}
.team-content .buttons a:active,
.back-link:active{
  transform:translateY(0);
}

.step-box{
  background:var(--surface);
  margin-bottom:12px;
  border-radius:16px;
  overflow:hidden;
  box-shadow:var(--shadow-soft);
  border:1px solid var(--line);
}
.step-header{
  padding:13px 14px;
  cursor:pointer;
  font-weight:700;
  background:linear-gradient(135deg, #2a1a11, #4b2a15);
  color:#fff;
  font-family:'Oswald',sans-serif;
  position:relative;
  padding-right:42px;
  user-select:none;
  letter-spacing:.2px;
}
.step-header::after{
  content:'▾';
  position:absolute;
  right:12px;
  top:50%;
  transform:translateY(-50%) rotate(0deg);
  transition:transform 0.18s ease, opacity 0.12s;
  opacity:0.95;
  font-size:1.05rem;
  line-height:1;
}
.step-header.open::after{
  transform:translateY(-50%) rotate(180deg);
}
.step-content{
  padding:13px 14px 16px;
  display:none;
  font-size:0.96rem;
  line-height:1.52;
  background:#fffaf5;
  color:var(--text);
}

.guide-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:13px 16px;
  cursor:pointer;
  font-weight:700;
  font-family:'Oswald',sans-serif;
  background:linear-gradient(135deg, var(--orange), var(--orange-2));
  color:#fff;
  border-radius:14px;
  border:none;
  box-shadow:0 12px 24px rgba(255,122,24,.18);
  margin-bottom:16px;
  letter-spacing:.3px;
}
.guide-btn:hover{
  filter:brightness(.98);
  transform:translateY(-1px);
}

#steps-backdrop{
  display:none;
  position:fixed;
  inset:0;
  background:rgba(35,16,5,0.50);
  z-index:14000;
  backdrop-filter:blur(3px);
}
#steps-wrapper{
  display:none;
  position:fixed;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  width:min(90vw, 760px);
  max-height:80vh;
  overflow-y:auto;
  background:#fff;
  padding:20px;
  border-radius:22px;
  box-shadow:0 28px 70px rgba(0,0,0,0.28);
  z-index:15000;
  border:1px solid rgba(255,122,24,.16);
}

.steps-close{
  position:absolute;
  top:12px;
  right:12px;
  background:transparent;
  border:none;
  font-size:1.6rem;
  line-height:1;
  cursor:pointer;
  color:#3b2413;
  padding:6px;
}
.steps-close:hover{
  color:var(--orange-3);
}

.overlay-close{
  display:none;
  position:absolute;
  right:12px;
  top:10px;
  background:transparent;
  border:none;
  font-size:1.6rem;
  cursor:pointer;
  color:#3b2413;
}

.page-bottom{
  max-width:1100px;
  margin:28px auto 0;
  padding:0 16px 40px;
}
.bottom-card{
  background:linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,248,241,.98));
  border:1px solid var(--line);
  border-radius:24px;
  box-shadow:var(--shadow-soft);
  padding:18px;
  display:flex;
  justify-content:center;
  align-items:center;
}

footer{
  padding:18px 16px 28px;
  text-align:center;
  color:var(--muted);
  font-size:0.95rem;
}

@media (max-width: 600px) {
  .container{
    margin-top:20px;
    padding-bottom:24px;
  }

  .teams-container{
    grid-template-columns:1fr 1fr;
    gap:12px;
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
    text-align:center;
  }

  .guide-btn{width:100%}

  #steps-wrapper{
    top:0;
    left:0;
    transform:none;
    width:100vw;
    height:100vh;
    max-height:none;
    border-radius:0;
    padding:48px 18px 18px 18px;
  }

  .steps-close{
    top:12px;
    right:12px;
  }

  .bottom-card{
    padding:16px;
  }

  .back-link{
    width:100%;
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
  <button id="show-steps-btn" class="guide-btn" aria-expanded="false" aria-controls="steps-wrapper">Anleitung anzeigen</button>

  <div id="steps-backdrop" tabindex="-1" aria-hidden="true"></div>

  <div id="steps-template" style="display:none;">
    <div class="step-box">
      <div class="step-header" role="button" tabindex="0" aria-expanded="false">Schritt 1 – URL kopieren</div>
      <div class="step-content">
        <p>Kopieren Sie die URL der gewünschten Kalenderdatei (Endung „.ics“).</p>
        <p>Auf Smartphones oder Tablets geschieht dies durch langes Drücken auf den Link und Auswahl von <strong>„Link kopieren“</strong>.</p>
        <p>Am Computer klicken Sie mit der rechten Maustaste auf den Link und wählen ebenfalls <strong>„Link kopieren“</strong>.</p>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header" role="button" tabindex="0" aria-expanded="false">Schritt 2 – Kalender hinzufügen</div>
      <div class="step-content">
        <p>Öffnen Sie anschließend Ihre <strong>Kalender-Anwendung</strong>.</p>
        <p>Wählen Sie die Option <strong>„Kalender hinzufügen“</strong> und dann <strong>„Aus dem Internet“</strong> bzw. <strong>„Per URL“</strong>.</p>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header" role="button" tabindex="0" aria-expanded="false">Schritt 3 – Link einfügen</div>
      <div class="step-content">
        <p>Fügen Sie den kopierten Link in das vorgesehene Feld ein.</p>
        <p>Bestätigen Sie anschließend das Abonnement.</p>
        <p>Der Kalender wird danach automatisch synchronisiert.</p>
        <p>Änderungen werden selbstständig übernommen, sobald sie auftreten.</p>
      </div>
    </div>
  </div>

  <div id="steps-wrapper" role="dialog" aria-modal="true" aria-hidden="true" style="display:none;"></div>

  <div class="teams-container">
    ${teams.map((t, index) => `
      <div class="team-card">
        <div class="team-header" data-index="${index}">
          ${escapeHtml(t.name)}${t.ageGroup ? ` (<strong>${escapeHtml(t.ageGroup)}</strong>)` : ''}
        </div>

        <div class="team-content" aria-hidden="true">
          <button class="overlay-close" aria-label="Schließen">&times;</button>

          <div class="team-content-preview">
            ${escapeHtml(t.name)}${t.ageGroup ? ` (<strong>${escapeHtml(t.ageGroup)}</strong>)` : ''}
            <p>${escapeHtml(t.matchCount)} Spiele, Heim: ${escapeHtml(t.homeMatchCount)}, Auswärts: ${escapeHtml(t.awayMatchCount)}</p>
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

<div class="page-bottom">
  <div class="bottom-card">
    <a class="back-link" href="https://www.tvn-baskets.de/teams/">Zurück zu den Teams</a>
  </div>
</div>

<footer>
  TVN Baskets – Offizielle Kalenderübersicht
</footer>

<script>
function bindStepHeadersInContainer(container) {
  if (!container) return;

  container.querySelectorAll('.step-header').forEach(h => {
    const newH = h.cloneNode(true);
    if (!newH.hasAttribute('role')) newH.setAttribute('role', 'button');
    if (!newH.hasAttribute('tabindex')) newH.setAttribute('tabindex', '0');
    newH.setAttribute('aria-expanded', 'false');
    h.parentNode.replaceChild(newH, h);
  });

  container.querySelectorAll('.step-header').forEach(h => {
    h.addEventListener('click', (e) => {
      e.stopPropagation();
      const c = h.nextElementSibling;
      if (!c) return;

      const isOpen = window.getComputedStyle(c).display === 'block';

      container.querySelectorAll('.step-content').forEach(cc => {
        if (cc !== c) {
          cc.style.display = 'none';
          const hh = cc.previousElementSibling;
          if (hh && hh.classList) hh.classList.remove('open');
          if (hh && hh.setAttribute) hh.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        c.style.display = 'none';
        h.classList.remove('open');
        h.setAttribute('aria-expanded', 'false');
      } else {
        c.style.display = 'block';
        h.classList.add('open');
        h.setAttribute('aria-expanded', 'true');
      }
    });

    h.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        h.click();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const template = document.getElementById('steps-template');
  const stepsWrapper = document.getElementById('steps-wrapper');
  const backdrop = document.getElementById('steps-backdrop');
  const guideBtn = document.getElementById('show-steps-btn');

  if (template && stepsWrapper) {
    stepsWrapper.innerHTML = template.innerHTML;
    stepsWrapper.insertAdjacentHTML('afterbegin', '<button id="close-steps-btn" class="steps-close" aria-label="Schließen">&times;</button>');
    bindStepHeadersInContainer(stepsWrapper);
  }

  function closeAllOverlays() {
    document.querySelectorAll('.team-content').forEach(c => {
      c.style.display = 'none';
      c.setAttribute('aria-hidden', 'true');
    });
    activeContent = null;
  }

  function openStepsModal() {
    closeAllOverlays();

    stepsWrapper.style.display = 'block';
    stepsWrapper.setAttribute('aria-hidden', 'false');
    backdrop.style.display = 'block';
    backdrop.setAttribute('aria-hidden', 'false');
    guideBtn.setAttribute('aria-expanded', 'true');

    const closeBtn = stepsWrapper.querySelector('#close-steps-btn');
    if (closeBtn && typeof closeBtn.focus === 'function') {
      closeBtn.focus();
    } else {
      const firstHeader = stepsWrapper.querySelector('.step-header');
      if (firstHeader && typeof firstHeader.focus === 'function') firstHeader.focus();
    }

    document.body.style.overflow = 'hidden';
  }

  function closeStepsModal() {
    stepsWrapper.querySelectorAll('.step-content').forEach(c => {
      c.style.display = 'none';
      const hh = c.previousElementSibling;
      if (hh && hh.classList) hh.classList.remove('open');
      if (hh && hh.setAttribute) hh.setAttribute('aria-expanded', 'false');
    });

    stepsWrapper.style.display = 'none';
    stepsWrapper.setAttribute('aria-hidden', 'true');
    backdrop.style.display = 'none';
    backdrop.setAttribute('aria-hidden', 'true');
    guideBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  const modalCloseBtn = document.getElementById('close-steps-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStepsModal();
    });
  }

  guideBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = stepsWrapper.style.display === 'block';
    if (isOpen) closeStepsModal();
    else openStepsModal();
  });

  backdrop.addEventListener('click', () => {
    closeStepsModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (stepsWrapper.style.display === 'block') {
        closeStepsModal();
      } else {
        closeAllOverlays();
        document.body.style.overflow = '';
      }
    }
  });

  const teamHeaders = document.querySelectorAll('.team-header');
  let activeContent = null;

  teamHeaders.forEach((header) => {
    const card = header.closest('.team-card');
    const content = card.querySelector('.team-content');

    if (content) content.addEventListener('click', e => e.stopPropagation());

    if (content) {
      const closeBtn = content.querySelector('.overlay-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', e => {
          e.stopPropagation();
          content.style.display = 'none';
          content.setAttribute('aria-hidden', 'true');
          activeContent = null;
        });
      }
    }

    header.addEventListener('click', e => {
      e.stopPropagation();
      if (!content) return;

      if (stepsWrapper.style.display === 'block') {
        closeStepsModal();
      }

      if (activeContent === content) {
        content.style.display = 'none';
        content.setAttribute('aria-hidden', 'true');
        activeContent = null;
        return;
      }

      closeAllOverlays();

      if (!document.body.contains(content)) document.body.appendChild(content);

      const isMobile = window.innerWidth <= 600;

      if (isMobile) {
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
        activeContent = content;
        return;
      }

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

      content.style.position = 'fixed';
      content.style.display = 'block';
      content.style.zIndex = 12000;
      content.style.width = desiredWidth + 'px';
      content.style.maxHeight = '80vh';
      content.setAttribute('aria-hidden', 'false');

      let topPos = rect.bottom;
      const contentHeight = content.offsetHeight;
      const viewportHeight = window.innerHeight;

      if (topPos + contentHeight > viewportHeight - 20) {
        topPos = rect.top - contentHeight;
      }
      if (topPos < 20) {
        topPos = 20;
      }
      content.style.top = topPos + 'px';
      content.style.left = leftPos + 'px';

      activeContent = content;
    });
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;
    if (target.closest('#steps-wrapper') || target.closest('#steps-backdrop')) {
      return;
    }
    closeAllOverlays();
    if (window.innerWidth <= 600) document.body.style.overflow = '';
  });

  document.addEventListener('click', () => {
    if (window.innerWidth <= 600) {
      const stepsOpen = stepsWrapper.style.display === 'block';
      if (!stepsOpen) document.body.style.overflow = '';
    }
  });

  window.addEventListener('scroll', () => {
    closeAllOverlays();
    if (window.innerWidth <= 600) document.body.style.overflow = '';
  }, { passive: true });

  window.addEventListener('resize', () => {
    closeAllOverlays();
    closeStepsModal();
    document.body.style.overflow = '';
  }, { passive: true });
});
</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content, 'utf8');
}

genHTML();
