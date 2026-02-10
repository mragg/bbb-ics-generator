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
<ul>
  <li>
    <strong>Schritt 1:</strong>
    Kopieren Sie die URL der gewünschten Kalenderdatei (Endung „.ics“).
  </li>
  <li>
    <strong>Schritt 2:</strong>
    Auf Smartphones oder Tablets durch langes Drücken auf den Link und Auswahl von
    <strong>„Link kopieren“</strong>.
    Am Computer per Rechtsklick auf den Link und Auswahl von
    <strong>„Link kopieren“</strong>.
  </li>
  <li>
    <strong>Schritt 3:</strong>
    Öffnen Sie anschließend Ihre Kalender-Anwendung, wählen Sie die Option
    <strong>„Kalender hinzufügen“</strong> und dann
    <strong>„Aus dem Internet“</strong> bzw. <strong>„Per URL“</strong>.
  </li>
  <li>
    <strong>Schritt 4:</strong>
    Fügen Sie den kopierten Link in das vorgesehene Feld ein und bestätigen Sie das Abonnement.
    Der Kalender wird danach automatisch synchronisiert und aktualisiert sich selbst,
    sobald Änderungen vorgenommen werden.
  </li>
</ul>

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
