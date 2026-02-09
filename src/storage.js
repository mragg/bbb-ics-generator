const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'generated');
if (!fs.existsSync(ICS_DIR)) fs.mkdirSync(ICS_DIR, { recursive: true });

function saveICS(teamId, type, data) {
  const filepath = path.join(ICS_DIR, `${teamId}_${type}.ics`);
  return filepath;
}

function readICS(teamId, type) {
  const file = path.join(ICS_DIR, `${teamId}_${type}.ics`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

module.exports = { ICS_DIR, saveICS, readICS };
