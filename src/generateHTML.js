const fs = require('fs');
const path = require('path');
function makeWebcalLink(filename) {
  const baseUrl = 'https://mragg.github.io/bbb-ics-generator/';
  const icsUrl = baseUrl + filename;
  return icsUrl;
}

function genHTML() {
  const metaPath = path.resolve(__dirname, '../generated/metadata.json');
  const teams = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath)) : [];

  const content = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"><title>Neunkirchen Baskets Kalender Übersicht</title>
  <style>
    body{max-width:700px;margin:30px auto;font-family:sans-serif}
    .team{background:#fff;padding:20px;margin:15px 0;border-radius:6px;box-shadow:0 2px 10px #ddd}
    .buttons a {display:inline-block;padding:10px 16px;margin:2px 6px;background:#e74c3c;color:#fff;text-decoration:none;border-radius:3px;}
  </style>
</head>
<body>
  <h1>Neunkirchen Baskets Kalender – Übersicht</h1>
  <p>Kalender werden automatisch alle 2-6h aktualisiert. Stand: ${new Date().toLocaleString('de-DE')}</p>
<style>
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
  display: none; /* standardmäßig eingeklappt */
  line-height: 1.5em;
}

.step-content p {
  margin: 0.3em 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>

<div class="step-box">
  <div class="step-header">Schritt 1: URL kopieren</div>
  <div class="step-content">
    <p>Kopieren Sie die URL der gewünschten Kalenderdatei (Endung „.ics“).</p>
    <p>Auf Smartphones oder Tablets geschieht dies durch langes Drücken auf den Link und Auswahl von <strong>„Link kopieren“</strong>.</p>
    <p>Am Computer klicken Sie mit der rechten Maustaste auf den Link und wählen ebenfalls <strong>„Link kopieren“</strong>.</p>
  </div>
</div>

<div class="step-box">
  <div class="step-header">Schritt 2: Kalender hinzufügen</div>
  <div class="step-content">
    <p>Öffnen Sie anschließend Ihre <strong>Kalender-Anwendung</strong>.</p>
    <p>Wählen Sie die Option <strong>„Kalender hinzufügen“</strong> und dann <strong>„Aus dem Internet“</strong> bzw. <strong>„Per URL“</strong>.</p>
  </div>
</div>

<div class="step-box">
  <div class="step-header">Schritt 3: Link einfügen & Abonnement bestätigen</div>
  <div class="step-content">
    <p>Fügen Sie den kopierten Link in das vorgesehene Feld ein.</p>
    <p>Bestätigen Sie anschließend das Abonnement.</p>
    <p>Der Kalender wird danach automatisch synchronisiert.</p>
    <p>Änderungen werden selbstständig übernommen, sobald sie auftreten.</p>
  </div>
</div>

<script>
document.querySelectorAll('.step-header').forEach(header => {
  header.addEventListener('click', () => {
    const content = header.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});
</script>


  ${teams.map(t => `
    <div class="team">
     <strong>${t.teamName}</strong>${t.ageGroup ? ` (<strong>${t.ageGroup}</strong>)` : ''}

      ${ t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}<br/>
      <div class="buttons">
        <a href="${makeWebcalLink(t.teamId+"_all.ics")}">Alle Spiele abonnieren</a>
        <a href="${makeWebcalLink(t.teamId+"_home.ics")}">Nur Heimspiele abonieren</a>
        <a href="${makeWebcalLink(t.teamId+"_away.ics")}">Nur Auswärts abonieren</a>
      </div>
    </div>
  `).join('')}
</body>
</html>`;
  fs.writeFileSync(path.resolve(__dirname, '../generated/index.html'), content);
}

genHTML();
