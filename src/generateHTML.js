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
<div class="step-box">
  <strong>Schritt 1:</strong>
  <p>
    Kopieren Sie die URL der gewünschten Kalenderdatei (Endung „.ics“). Auf Smartphones oder Tablets
    geschieht dies durch langes Drücken auf den gewünschten Button und Auswahl von <strong>„Link kopieren“</strong>
    Am Computer klicken Sie mit der rechten Maustaste auf den gewünschten Button und wählen ebenfalls
    <strong>„Link kopieren“</strong>
  </p>
</div>

<div class="step-box">
  <strong>Schritt 2:</strong>
  <p>
    Öffnen Sie anschließend Ihre <strong>Kalender-Anwendung</strong> und wählen Sie die Option
    <strong>„Kalender hinzufügen“</strong> und dann <strong>„Aus dem Internet“</strong> bzw.
    <strong>„Per URL“</strong>
  </p>
</div>

<div class="step-box">
  <strong>Schritt 3:</strong>
  <p>Fügen Sie den kopierten Link in das vorgesehene Feld ein.</p>
  <p>Bestätigen Sie anschließend das Abonnement.</p>
  <p>Der Kalender wird danach automatisch synchronisiert.</p>
  <p>Änderungen werden selbstständig übernommen, sobald sie auftreten.</p>
</div>

<style>
.step-box {
  border-left: 4px solid #007acc;
  padding: 1em 1em;
  margin-bottom: 1em;
  background: #f7f9fb;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}
.step-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}
.step-box strong {
  display: block;
  margin-bottom: 0.5em;
  font-size: 1.1em;
}
.step-box p {
  margin: 0.3em 0;
  line-height: 1.5em;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>


  ${teams.map(t => `
    <div class="team">
      <strong>${t.teamName}</strong> (${t.ageGroup})<br/>
      <small>Letztes Update: ${new Date(t.lastUpdate).toLocaleString('de-DE')}</small><br/>
      ${t.matchCount} Spiele, Heim: ${t.homeMatchCount}, Auswärts: ${t.awayMatchCount}<br/>
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
