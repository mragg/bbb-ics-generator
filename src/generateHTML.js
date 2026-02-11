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
.header-inner{
  display:flex;
  align-items:flex-start;  /* Logo oben ausrichten */
  justify-content:flex-start; /* alles links ausrichten */
  gap:20px;
}

.logo{
  height:140px; /* doppelt so groß wie vorher */
  width:auto;
}

.header-text{
  display:flex;
  flex-direction:column;
  justify-content:center;
}
}
:root{
  --tvn-blue:#003b75;
  --tvn-light-blue:#0057a3;
  --tvn-red:#d72638;
  --tvn-white:#ffffff;
  --tvn-gray:#f2f4f8;
}

*{box-sizing:border-box}

body{
  margin:0;
  font-family:'Inter',sans-serif;
  background:var(--tvn-gray);
  color:#222;
}

header{
  background:linear-gradient(135deg,var(--tvn-blue),var(--tvn-light-blue));
  color:white;
  padding:40px 20px;
  text-align:center;
}

header h1{
  font-family:'Oswald',sans-serif;
  font-size:2.2rem;
  letter-spacing:1px;
  margin:0;
  text-transform:uppercase;
}

header p{
  margin-top:10px;
  font-weight:300;
  opacity:0.9;
}

.container{
  max-width:900px;
  margin:40px auto;
  padding:0 20px;
}

.team{
  background:white;
  padding:25px;
  margin-bottom:25px;
  border-left:6px solid var(--tvn-blue);
  border-radius:8px;
  box-shadow:0 6px 18px rgba(0,0,0,0.08);
  transition:transform 0.2s ease, box-shadow 0.2s ease;
}

.team:hover{
  transform:translateY(-4px);
  box-shadow:0 10px 24px rgba(0,0,0,0.12);
}

.team strong{
  font-family:'Oswald',sans-serif;
  font-size:1.2rem;
  text-transform:uppercase;
}

.team-stats{
  margin-top:8px;
  font-size:0.9rem;
  color:#555;
}

.buttons{
  margin-top:15px;
}

.buttons a{
  display:inline-block;
  padding:10px 18px;
  margin:5px 6px 0 0;
  background:var(--tvn-blue);
  color:white;
  text-decoration:none;
  border-radius:4px;
  font-size:0.85rem;
  font-weight:600;
  transition:background 0.2s ease, transform 0.15s ease;
}

.buttons a:hover{
  background:var(--tvn-red);
  transform:translateY(-2px);
}

.step-box{
  background:white;
  margin-bottom:15px;
  border-radius:6px;
  overflow:hidden;
  box-shadow:0 3px 8px rgba(0,0,0,0.06);
}

.step-header{
  padding:15px 20px;
  cursor:pointer;
  font-weight:600;
  background:var(--tvn-blue);
  color:white;
  font-family:'Oswald',sans-serif;
  letter-spacing:0.5px;
  transition:background 0.2s;
}

.step-header:hover{
  background:var(--tvn-red);
}

.step-content{
  padding:15px 20px;
  display:none;
  font-size:0.9rem;
  line-height:1.5;
  background:#fafafa;
}

footer{
  text-align:center;
  padding:30px 10px;
  font-size:0.8rem;
  color:#777;
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

${teams.map(t => `
<div class="team">
  <strong>${t.teamName}</strong> ${t.ageGroup ? `(${t.ageGroup})` : ''}

  <div class="team-stats">
    ${t.matchCount} Spiele | Heim: ${t.homeMatchCount} | Auswärts: ${t.awayMatchCount}
  </div>

  <div class="buttons">
    <a href="${makeWebcalLink(t.teamId+"_all.ics")}">Alle Spiele</a>
    <a href="${makeWebcalLink(t.teamId+"_home.ics")}">Nur Heimspiele</a>
    <a href="${makeWebcalLink(t.teamId+"_away.ics")}">Nur Auswärts</a>
  </div>
</div>
`).join('')}

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
</script>

</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content);
}

genHTML();
