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
:root {
  --tvn-blue: #003b75;
  --tvn-light-blue: #0057a3;
  --tvn-red: #d72638;
  --tvn-white: #ffffff;
  --tvn-gray: #f2f4f8;
}

/* BODY & GLOBAL */
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background: var(--tvn-gray);
  color: #222;
}

/* HEADER */
header {
  background: linear-gradient(135deg, var(--tvn-blue), var(--tvn-light-blue));
  color: var(--tvn-white);
  padding: 20px 30px;
}

.header-inner {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.logo {
  height: 140px;
  width: auto;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.header-text h1 {
  font-family: 'Oswald', sans-serif;
  font-size: 2.2rem;
  letter-spacing: 1px;
  margin: 0;
  text-transform: uppercase;
}

.header-text p {
  margin-top: 8px;
  font-weight: 300;
  opacity: 0.9;
}

/* CONTAINER & BOXEN */
.container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}

.teams-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 20px;
  position: relative;
}
.team-content {
  position: absolute;        /* über allem positioniert */
  background: #fff;
  padding: 15px 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
  border-radius: 8px;
  z-index: 9999;             /* ganz vorne */
  display: none;
}


.team-card {
  background: var(--tvn-white);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  flex: 1 1 200px;
  cursor: pointer;
  position: relative; /* für absolute Team-Content */
  display: flex;
  flex-direction: column;
  z-index: 1; /* Grundzustand */
}

.team-card:hover {
  transform: translateY(-2px);
}

.team-header {
  padding: 15px 20px;
  font-weight: 600;
  font-family: 'Oswald', sans-serif;
  background: var(--tvn-blue);
  color: var(--tvn-white);
  border-radius: 8px;
  position: relative;
  z-index: 2;
}



.team-content .buttons a {
  display: inline-block;
  padding: 8px 16px;
  margin: 5px 6px 0 0;
  background: var(--tvn-blue);
  color: var(--tvn-white);
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.15s ease;
}

.team-content .buttons a:hover {
  background: var(--tvn-red);
  transform: translateY(-2px);
}


/* STEP BOXEN */
.step-box {
  background: var(--tvn-white);
  margin-bottom: 15px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
}

.step-header {
  padding: 15px 20px;
  cursor: pointer;
  font-weight: 600;
  background: var(--tvn-blue);
  color: var(--tvn-white);
  font-family: 'Oswald', sans-serif;
  letter-spacing: 0.5px;
  transition: background 0.2s;
}

.step-header:hover {
  background: var(--tvn-red);
}

.step-content {
  padding: 15px 20px;
  display: none;
  font-size: 0.9rem;
  line-height: 1.5;
  background: #fafafa;
}

/* FOOTER */
footer {
  text-align: center;
  padding: 30px 10px;
  font-size: 0.8rem;
  color: #777;
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
      <div class="team-content">
        <p>${t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}</p>
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
document.querySelectorAll('.step-header').forEach(header => {
  header.addEventListener('click', () => {
    const content = header.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});
>
  const teamHeaders = document.querySelectorAll('.team-header');
  let activeContent = null;

  teamHeaders.forEach(header => {
    header.addEventListener('click', e => {
      e.stopPropagation();
      const content = header.nextElementSibling;

      // Panel schließen, wenn es schon offen ist
      if(activeContent === content){
        content.style.display = 'none';
        activeContent = null;
        return;
      }

      // Alle anderen Panels schließen
      document.querySelectorAll('.team-content').forEach(c => c.style.display = 'none');

      // Panel nach vorne positionieren
      const rect = header.getBoundingClientRect();
      const containerRect = document.querySelector('.teams-container').getBoundingClientRect();
      content.style.position = 'absolute';
      content.style.top = (rect.bottom - containerRect.top) + 'px';
      content.style.left = (rect.left - containerRect.left) + 'px';
      content.style.width = rect.width + 'px';
      content.style.display = 'block';
      content.style.zIndex = 9999;

      activeContent = content;
    });
  });

  // Klick irgendwo außerhalb → alle Panels schließen
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

