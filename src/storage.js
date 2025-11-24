const fs = require('fs');
const path = require('path');

const ICS_DIR = path.resolve(__dirname, '../generated');
if (!fs.existsSync(ICS_DIR)) fs.mkdirSync(ICS_DIR, { recursive: true });

function saveICS(teamId, type, data) {
  fs.writeFileSync(path.join(ICS_DIR, `${teamId}_${type}.ics`), data, 'utf8');
}

function readICS(teamId, type) {
  const file = path.join(ICS_DIR, `${teamId}_${type}.ics`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

module.exports = { ICS_DIR, saveICS, readICS };
