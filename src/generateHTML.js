const fs = require('fs');
const path = require('path');

function makeWebcalLink(filename) {
  const baseUrl = 'https://mragg.github.io/bbb-ics-generator/';
  return baseUrl + filename;
}

function genHTML() {
  const metaPath = path.resolve(__dirname, '../generated/metadata.json');
  const teams = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath)) : [];

  const content = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Neunkirchen Baskets Kalender Übersicht</title>
<style>
  body {
    max-width: 900px;
    margin: 30px auto;
    font-family: sans-serif;
    background: #f4f4f4;
    color: #111;
  }

  h1 {
    text-align: center;
    color: #e74c3c;
  }

  /* Header + Logo */
  .header-inner {
    display: flex;
    align-items: center;
    gap: 20px;
    justify-content: flex-start;
    margin-bottom: 20px;
  }

  .Logo {
    height: 140px; /* doppelt so groß */
    width: auto;
  }

  /* Steps */
  .step-box {
    border-left: 4px solid #007acc;
    margin-bottom: 1em;
    border-radius: 4px;
    background: #f7f9fb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .step-header {
    padding: 1em;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.1em;
    background: #e1f0ff;
    transition: background 0.2s;
  }

  .step-header:hover {
    background: #cce4ff;
  }

  .step-content {
    padding: 0 1em 1em 1em;
    display: none;
    line-height: 1.5em;
  }

  /* Teams Overlay Accordion */
  .teams-container {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 20px;
    position: relative;
  }

  .team-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    flex: 1 1 200px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .team-header {
    padding: 15px 20px;
    font-weight: 600;
    font-family: 'Oswald', sans-serif;
    background: #e74c3c;
    color: #fff;
    border-radius: 8px;
    position: relative;
    z-index: 2;
  }

  .team-card:hover {
    transform: translateY(-2px);
  }

  .team-content {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: #fff;
    padding: 15px 20px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.15);
    z-index: 9999;
  }

  .buttons a {
    display: inline-block;
    padding: 10px 16px;
    margin: 2px 6px;
    background: #e74c3c;
    color: #fff;
    text-decoration: none;
    border-radius: 3px;
  }
</style>
</head>
<body>

<div class="header-inner">
  <img src="../Logo.png" alt="TVN Logo" class="Logo">
  <h1>Neunkirchen Baskets Kalender – Übersicht</h1>
</div>

<p>Kalender werden automatisch alle 2-6h aktualisiert. Stand: ${new Date().toLocaleString('de-DE')}</p>

<div class="step-box">
  <div class="step-header">Schritt 1: URL kopieren</div>
  <div class="step-content">
    <p>Kopieren Sie die URL der gewünschten Kalenderdatei (Endung „.ics“).</p>
  </div>
</div>
<div class="step-box">
  <div class="step-header">Schritt 2: Kalender hinzufügen</div>
  <div class="step-content">
    <p>Öffnen Sie Ihre Kalender-Anwendung und fügen Sie die URL ein.</p>
  </div>
</div>

<div class="teams-container">
${teams.map((t, i) => `
  <div class="team-card">
    <div class="team-header" data-index="${i}">${t.teamName}${t.ageGroup ? ` (${t.ageGroup})` : ''}</div>
    <div class="team-content">
      ${ t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}<br/>
      <div class="buttons">
        <a href="${makeWebcalLink(t.teamId+"_all.ics")}">Alle Spiele abonnieren</a>
        <a href="${makeWebcalLink(t.teamId+"_home.ics")}">Nur Heimspiele abonnieren</a>
        <a href="${makeWebcalLink(t.teamId+"_away.ics")}">Nur Auswärts abonnieren</a>
      </div>
    </div>
  </div>
`).join('')}
</div>

<script>
  // Step Box Toggle
  document.querySelectorAll('.step-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
    });
  });

  // Teams Overlay Accordion
  const teamHeaders = document.querySelectorAll('.team-header');
  let activeContent = null;

  teamHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = header.nextElementSibling;

      if(activeContent === content){
        content.style.display = 'none';
        activeContent = null;
        return;
      }

      document.querySelectorAll('.team-content').forEach(c => c.style.display = 'none');
      content.style.display = 'block';
      activeContent = content;
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.team-content').forEach(c => c.style.display = 'none');
    activeContent = null;
  });
</script>

</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content);
}

genHTML();
