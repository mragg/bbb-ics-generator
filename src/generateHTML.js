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
  <p>Um einen Kalender per ICS-Link zu abonnieren, kopieren Sie zunächst die URL der gewünschten Kalenderdatei (Endung „.ics“). Auf Smartphones oder Tablets geschieht dies durch langes Drücken auf den Link und Auswahl von „Link kopieren“. Am Computer klicken Sie mit der rechten Maustaste auf den Link und wählen ebenfalls „Link kopieren“. Öffnen Sie anschließend Ihre Kalender-Anwendung, wählen Sie die Option „Kalender hinzufügen“ und danach „Aus dem Internet“ bzw. „Per URL“. Fügen Sie den kopierten Link in das vorgesehene Feld ein und bestätigen Sie das Abonnement. Der Kalender wird anschließend automatisch synchronisiert und aktualisiert sich selbst, sobald Änderungen vorgenommen werden.</p>
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
