const { createEvent } = require('ics');

function dateToArray(date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

function buildEvent(match, matchInfo) {
  const kickoff = new Date(matchInfo.kickoff);
  const dtstart = new Date(kickoff.getTime() - 60 * 60 * 1000);
  const dtend = new Date(kickoff.getTime() + 2 * 60 * 60 * 1000);

  const isHome = match.homeId === match.teamId;
  const alarmTrigger = isHome ? '-PT30M' : '-PT60M';

  return {
    uid: `${match.matchId}@basketball-bund.net`,
    start: dateToArray(dtstart),
    end: dateToArray(dtend),
    summary: `${match.homeName} vs. ${match.guestName} (Spiel ${match.matchNo})`,
    location: `${matchInfo.location.street}, ${matchInfo.location.postalCode} ${matchInfo.location.city}, Deutschland`,
    geo: matchInfo.location.geo ? { lat: matchInfo.location.geo.lat, lon: matchInfo.location.geo.lon } : undefined,
    alarms: [{
      action: 'display',
      description: 'Spiel beginnt bald',
      trigger: alarmTrigger,
    }],
  };
}

async function createICS(matches, matchDetails) {
  const events = [];

  for (const match of matches) {
    const info = matchDetails[match.matchId];
    if (!info) continue;
    const event = buildEvent(match, info);
    events.push(event);
  }

  const { error, value } = await new Promise(resolve =>
    createEvent(events, (err, val) => resolve({ error: err, value: val }))
  );

  if (error) throw error;

  return value;
}

module.exports = { createICS };
