// src/generateCustomCalendar.js
const fs = require('fs');
const path = require('path');

const ICS_DIR = path.resolve(__dirname, '../generated');

const teams = [
  { id: "159756", name: "Herren 1" },
  { id: "161199", name: "Herren 2" },
  { id: "161336", name: "Damen 1" },
  { id: "276298", name: "U18m" },
  { id: "276291", name: "U16w" },
  { id: "158729", name: "U16.1m" },
  { id: "319432", name: "U16.2m" },
  { id: "155756", name: "U14.1" },
  { id: "161387", name: "U14.2" },
  { id: "323081", name: "U14.3" },
  { id: "161395", name: "U12.1" },
  { id: "276319", name: "U12.2" },
  { id: "161690", name: "U10.1" },
  { id: "276318", name: "U10.2" }
];

function extractEvents(icsContent) {
  const events = [];
  const lines = icsContent.split(/\r?\n/);
  let inEvent = false;
  let currentEvent = [];

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = [line];
    } else if (line === 'END:VEVENT') {
      currentEvent.push(line);
      events.push(currentEvent.join('\r\n'));
      inEvent = false;
    } else if (inEvent) {
      currentEvent.push(line);
    }
  }

  return events;
}

function main() {
  console.log('🚀 Starte Custom Calendar Generator...');
  
  const allEvents = [];
  const seenUIDs = new Set();

  for (const team of teams) {
    const filePath = path.join(ICS_DIR, team.id + '_all.ics');
    
    if (!fs.existsSync(filePath)) {
      console.log('   ⚠️ ' + team.name + ': Datei nicht gefunden');
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const events = extractEvents(content);
    
    let added = 0;
    for (const event of events) {
      const uidMatch = event.match(/UID:(.+)/);
      const uid = uidMatch ? uidMatch[1].trim() : null;
      
      if (uid && seenUIDs.has(uid)) continue;
      if (uid) seenUIDs.add(uid);
      
      allEvents.push(event);
      added++;
    }
    
    console.log('   ✅ ' + team.name + ': ' + added + ' Spiele hinzugefügt');
  }

  if (allEvents.length === 0) {
    console.log('⚠️ Keine Spiele gefunden.');
    return;
  }

  const combinedICS = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//bbb-ics-generator//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TVN Baskets - Alle Teams',
    'X-WR-TIMEZONE:Europe/Berlin',
    ...allEvents,
    'END:VCALENDAR'
  ].join('\r\n');

  const outputPath = path.join(ICS_DIR, 'all_teams.ics');
  fs.writeFileSync(outputPath, combinedICS, 'utf8');
  console.log('✅ ' + allEvents.length + ' Spiele in all_teams.ics gespeichert.');
}

main();
