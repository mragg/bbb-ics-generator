const { createEvents } = require('ics');

// Basketball ICS Generator
// Version: mit Ausfall-Erkennung + Nachtfilter (22:00–05:00)

function dateToArr(d) {
  return [
    Number(d.getFullYear()),
    Number(d.getMonth() + 1),
    Number(d.getDate()),
    Number(d.getHours()),
    Number(d.getMinutes()),
  ];
}

function kickoffToArr(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    throw new Error(`Ungültige Spieldaten: ${dateStr} ${timeStr}`);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  return [year, month, day, hour, minute];
}

function formatKickoff(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(day)}.${pad(month)}.${year}, ${pad(hour)}:${pad(minute)}`;
}

function getTeamNameForSummary(teamObj) {
  return teamObj?.teamnameSmall || teamObj?.teamname || 'Unbekannt';
}

function getTeamNameForDescription(teamObj) {
  return teamObj?.teamname || 'Unbekannt';
}

function icsEscape(text) {
  if (!text) return '';

  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}

// Erkennt ausgefallene oder abgesagte Spiele
function isCancelledMatch(match, matchInfo) {
  const data = { ...match, ...matchInfo };

  const values = [
    data.status,
    data.statusName,
    data.matchStatus,
    data.matchStatusName,
    data.gameStatus,
    data.gameStatusName,
    data.resultStatus,
    data.resultStatusName,
    data.cancelled,
    data.canceled,
    data.isCancelled,
    data.isCanceled,
  ];

  return values.some((value) => {
    if (typeof value === 'boolean') return value;

    if (typeof value === 'string') {
      const v = value.toLowerCase().trim();

      return [
        'ausgefallen',
        'abgesagt',
        'entfallen',
        'cancelled',
        'canceled',
        'abgebrochen',
      ].includes(v);
    }

    return false;
  });
}

function createHtmlDescription(descriptionLines, feld) {
  const html = `<!DOCTYPE HTML>
<HTML>
<HEAD><META CHARSET="UTF-8"></HEAD>
<BODY>
<p><strong>${descriptionLines[0]}</strong></p>
${descriptionLines.slice(1).map(line => `<p>${line}</p>`).join('')}
${feld.bezeichnung ? `<p><strong>Halle:</strong> ${feld.bezeichnung}</p>` : ''}
${feld.strasse && feld.ort ? `<p><strong>Adresse:</strong> ${feld.strasse}, ${feld.plz} ${feld.ort}</p>` : ''}
</BODY>
</HTML>`;

  return icsEscape(html.replace(/\r?\n/g, ''));
}

async function buildEvent(match, matchInfo, teamId, calendarType = 'all') {
  const homeTeamObj = matchInfo?.homeTeam || match?.homeTeam || {};
  const guestTeamObj = matchInfo?.guestTeam || match?.guestTeam || {};

  const homeTeamId = Number(homeTeamObj.teamPermanentId);
  const guestTeamId = Number(guestTeamObj.teamPermanentId);
  const ownTeamId = Number(teamId);

  const isHome = homeTeamId === ownTeamId;
  const isAway = guestTeamId === ownTeamId;

  const homeNameSummary = getTeamNameForSummary(homeTeamObj);
  const guestNameSummary = getTeamNameForSummary(guestTeamObj);

  const homeNameDesc = getTeamNameForDescription(homeTeamObj);
  const guestNameDesc = getTeamNameForDescription(guestTeamObj);

  let prefix = '';

  if (calendarType === 'all') {
    prefix = isHome ? 'HEIM: ' : isAway ? 'AUSWÄRTS: ' : '';
  }

  const cancelled = isCancelledMatch(match, matchInfo);

  const normalSummary = `${prefix}${homeNameSummary} vs. ${guestNameSummary}`;

  const summary = cancelled
    ? `❌ AUSGEFALLEN ❌ ${normalSummary}`
    : normalSummary;

  const cleanSummary = (text) =>
    typeof text === 'string'
      ? text.replace(/[\r\n]+/g, ' ').trim()
      : 'Untitled event';

  const summaryClean = cleanSummary(summary);

  const dateStr = matchInfo?.kickoffDate || match?.kickoffDate;
  const timeStr = matchInfo?.kickoffTime || match?.kickoffTime;

  // Nachtfilter (22:00–04:59)
  if (timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;

    if (timeInMinutes >= 22 * 60 || timeInMinutes < 5 * 60) {
      console.log(`[SKIP] ${dateStr} ${timeStr} Match ${match?.matchId}`);
      return null;
    }
  }

  console.log(`[TIME DEBUG] ${summaryClean}: ${dateStr} ${timeStr}`);

  const start = kickoffToArr(dateStr, timeStr);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const kickoffForEnd = new Date(year, month - 1, day, hour, minute);
  const end = dateToArr(new Date(kickoffForEnd.getTime() + 2.5 * 60 * 60 * 1000));

  const feld = matchInfo?.matchInfo?.spielfeld || match?.spielfeld || {};

  const location =
    feld.strasse && feld.plz && feld.ort
      ? `${feld.strasse}, ${feld.plz} ${feld.ort}, Deutschland`
      : 'Ort unbekannt';

  const descriptionLines = [
    ...(cancelled ? ['❌ DIESES SPIEL WURDE ABGESAGT / IST AUSGEFALLEN.'] : []),
    `Wettbewerb: ${matchInfo?.ligaData?.liganame || match?.ligaData?.liganame || 'Unbekannt'}`,
    `Saison: ${matchInfo?.ligaData?.seasonName || match?.ligaData?.seasonName || 'Unbekannt'}`,
    `Heim: ${homeNameDesc}`,
    `Gast: ${guestNameDesc}`,
    `Anpfiff: ${formatKickoff(dateStr, timeStr)}`,
    `Update: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
  ];

  const description = descriptionLines.join('\n');
  const htmlDescription = createHtmlDescription(descriptionLines, feld);

  return {
    uid: `${match?.matchId || matchInfo?.matchId}@basketball-bund.net`,
    title: summaryClean,
    description,
    htmlDescription,
    start,
    startInputType: 'local',
    startOutputType: 'local',
    end,
    endInputType: 'local',
    endOutputType: 'local',
    location,
    busyStatus: 'BUSY',
    alarms: [
      {
        action: 'display',
        description: 'Spiel beginnt bald',
        trigger: {
          minutes: isHome ? 30 : 60,
          before: true,
        },
      },
    ],
  };
}

async function generateICS(matches, details, teamId, type = 'all') {
  const events = [];

  for (const match of matches) {
    const matchInfo = details[match.matchId];

    console.log('[STATUS DEBUG]', match.matchId, {
      status: match.status,
      statusName: match.statusName,
      matchStatus: match.matchStatus,
      gameStatus: match.gameStatus,
      cancelled: match.cancelled,
      matchInfoStatus: matchInfo?.status,
      matchInfoStatusName: matchInfo?.statusName,
    });

    const event = await buildEvent(match, matchInfo, teamId, type);

    if (event) events.push(event);
  }

  if (!events.length) return null;

  const teams = require('../teams.json');
  const team = teams.find((t) => Number(t.id) === Number(teamId));

  const calendarName = `${team?.name || 'Basketball Team'}${
    type === 'home' ? ' - Heimspiele' : type === 'away' ? ' - Auswärtsspiele' : ''
  }`;

  const htmlDescriptions = events.map((e) => e.htmlDescription);
  events.forEach((e) => delete e.htmlDescription);

  return new Promise((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) return reject(error);

      const lines = value.split('\r\n');
      const modifiedLines = [];

      let eventIndex = -1;
      let inEvent = false;
      let inAlarm = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line === 'BEGIN:VCALENDAR') {
          modifiedLines.push(line);
          modifiedLines.push('VERSION:2.0');
          modifiedLines.push('PRODID:-//bbb-ics-generator//DE');
          modifiedLines.push('CALSCALE:GREGORIAN');
          modifiedLines.push('METHOD:PUBLISH');
          modifiedLines.push('X-WR-CALNAME:' + icsEscape(calendarName));
          modifiedLines.push('X-WR-TIMEZONE:Europe/Berlin');
          modifiedLines.push('X-WR-CALDESC:Basketball-Spielplan');
          continue;
        }

        if (
          line.startsWith('VERSION:') ||
          line.startsWith('PRODID:') ||
          line.startsWith('CALSCALE:') ||
          line.startsWith('METHOD:')
        ) {
          continue;
        }

        if (line === 'BEGIN:VEVENT') {
          inEvent = true;
          eventIndex++;
        }

        if (line === 'END:VEVENT') inEvent = false;
        if (line === 'BEGIN:VALARM') inAlarm = true;
        if (line === 'END:VALARM') inAlarm = false;

        if (inEvent && !inAlarm && line.startsWith('DESCRIPTION:')) {
          const descriptionLines = [line];

          while (
            i + 1 < lines.length &&
            (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))
          ) {
            i++;
            descriptionLines.push(lines[i]);
          }

          descriptionLines.forEach((l) => modifiedLines.push(l));

          if (htmlDescriptions[eventIndex]) {
            modifiedLines.push(
              'X-ALT-DESC;FMTTYPE=text/html:' + htmlDescriptions[eventIndex]
            );
          }

          continue;
        }

        modifiedLines.push(line);
      }

      resolve(modifiedLines.join('\r\n'));
    });
  });
}

module.exports = {
  generateICS,
};
