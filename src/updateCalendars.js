const { fetchTeamMatches, fetchMatchInfo } = require('./apiClient');
const { createICS } = require('./icsGenerator');
const { saveICS } = require('./storage');

async function updateTeamCalendars(teamId) {
  console.log(`Updating calendars for team ${teamId}`);
  try {
    const matches = await fetchTeamMatches(teamId);

    const matchDetails = {};
    for (const match of matches) {
      const info = await fetchMatchInfo(match.matchId);
      matchDetails[match.matchId] = info;
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
  } catch (e) {
    console.error('Fehler beim Aktualisieren der Kalender:', e);
  }
}

// Beispiel: TeamID statisch definieren oder aus Env lesen
const teamId = process.env.TEAM_ID || '123';

updateTeamCalendars(teamId);
