const { fetchTeamMatches, fetchMatchInfo } = require('./apiClient');
const { createICS } = require('./icsGenerator');
const { saveICS } = require('./storage');
const fs = require('fs');
const path = require('path');

async function updateTeamCalendars(teamId) {
  console.log(`Updating calendars for team ${teamId}`);
  try {
    const matches = await fetchTeamMatches(teamId);
    
    if (!matches || matches.length === 0) {
      console.log('Keine Spiele gefunden für Team:', teamId);
      return null;
    }

    const matchDetails = {};
    for (const match of matches) {
      try {
        const info = await fetchMatchInfo(match.matchId);
        matchDetails[match.matchId] = info;
      } catch (e) {
        console.error(`Fehler beim Laden von Match ${match.matchId}:`, e.message);
      }
    }

    const allICS = await createICS(matches, matchDetails);
    saveICS(teamId, 'all', allICS);

    const homeMatches = matches.filter(m => m.homeId === teamId);
    const awayMatches = matches.filter(m => m.homeId !== teamId);

    const homeICS = await createICS(homeMatches, matchDetails);
    saveICS(teamId, 'home', homeICS);

    const awayICS = await createICS(awayMatches, matchDetails);
    saveICS(teamId, 'away', awayICS);

    console.log(`Calendars updated for team ${teamId}`);
    
    // Metadata zurückgeben für HTML-Generierung
    return {
      teamId,
      teamName: matches[0]?.homeName || matches[0]?.guestName || 'Unbekannt',
      ageGroup: extractAgeGroup(matches[0]?.homeName || matches[0]?.guestName || ''),
      lastUpdate: new Date().toISOString(),
      matchCount: matches.length,
      homeMatchCount: homeMatches.length,
      awayMatchCount: awayMatches.length
    };
  } catch (e) {
    console.error('Fehler beim Aktualisieren der Kalender:', e);
    throw e;
  }
}

function extractAgeGroup(teamName) {
  const ageGroupMatch = teamName.match(/U\d+|Herren|Damen|Senioren/i);
  return ageGroupMatch ? ageGroupMatch[0] : 'Unbekannt';
}

// Teams-Array (später erweiterbar)
const teams = [
  process.env.TEAM_ID || '1162774'
];

async function updateAllTeams() {
  const results = [];
  
  for (const teamId of teams) {
    try {
      const result = await updateTeamCalendars(teamId);
      if (result) results.push(result);
    } catch (e) {
      console.error(`Fehler bei Team ${teamId}:`, e.message);
    }
  }
  
  // Metadata speichern für HTML-Generierung
  const metadataPath = path.resolve(__dirname, '../public/metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2));
  
  return results;
}

updateAllTeams();