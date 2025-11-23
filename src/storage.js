// Einfache Dateipersistenz für Spielfeld-Daten und generierte ICS-Dateien

const fs = require('fs');
const path = require('path');

const ICS_DIR = path.resolve(__dirname, '../public/ics');

if (!fs.existsSync(ICS_DIR)) fs.mkdirSync(ICS_DIR, { recursive: true });

function saveICS(teamId, type, content) {
  const filename = path.join(ICS_DIR, `${teamId}_${type}.ics`);
  fs.writeFileSync(filename, content, 'utf8');
}

function readICS(teamId, type) {
  const filename = path.join(ICS_DIR, `${teamId}_${type}.ics`);
  if (!fs.existsSync(filename)) return null;
  return fs.readFileSync(filename, 'utf8');
}

module.exports = { saveICS, readICS, ICS_DIR };
