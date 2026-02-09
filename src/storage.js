const fs = require('fs');
const path = require('path');

// Wir nutzen process.cwd(), damit 'generated' immer im Hauptordner landet
const ICS_DIR = path.join(process.cwd(), 'generated');

// Falls der Ordner nicht existiert, erstellen wir ihn
if (!fs.existsSync(ICS_DIR)) {
    fs.mkdirSync(ICS_DIR, { recursive: true });
}

/**
 * Speichert den ICS String in eine Datei
 */
function saveICS(teamId, type, content) {
    const filename = `${teamId}_${type}.ics`;
    const filePath = path.join(ICS_DIR, filename);
    
    fs.writeFileSync(filePath, content);
    console.log(`[DEBUG] ICS gespeichert: ${filename} in ${filePath}`);
    return filename;
}

module.exports = { saveICS, ICS_DIR };
