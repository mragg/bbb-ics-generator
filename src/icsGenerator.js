const { createEvents } = require('ics');

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
    throw new Error(
      `Ungültige Spieldaten: date=${dateStr}, time=${timeStr}`
    );
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

function createHtmlDescription(descriptionLines, feld) {
  const html = `<!DOCTYPE HTML>
<HTML>
<HEAD>
<META CHARSET="UTF-8">
</HEAD>
<BODY>
<p><strong>${descriptionLines[0]}</strong></p>
<p>${descriptionLines[1]}</p>
<p>${descriptionLines[2]}</p>
<p>${descriptionLines[3]}<br>${descriptionLines[4]}</p>
${feld.bezeichnung ? `<p><strong>Halle:</strong> ${feld.bezeichnung}</p>` : ''}
${feld.strasse && feld.ort
    ? `<p><strong>Adresse:</strong> ${feld.strasse}, ${feld.plz} ${feld.ort}</p>`
    : ''}
<p><strong>${descriptionLines[descriptionLines.length - 2]}</strong></p>
<p><em>${descriptionLines[descriptionLines.length - 1]}</em></p>
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

  const homeNameSummary = getTeamNameForSummary(homeTeamObj);
  const guestNameSummary = getTeamNameForSummary(guestTeamObj);

  const homeNameDesc = getTeamNameForDescription(homeTeamObj);
  const guestNameDesc = getTeamNameForDescription(guestTeamObj);

  const isHome = homeTeamId === ownTeamId;
  const isAway = guestTeamId === ownTeamId;

  let prefix = '';

  if (calendarType === 'all') {
    prefix = isHome
      ? 'HEIM: '
      : isAway
        ? 'AUSWÄRTS: '
        : '';
  }

  const summary = `${prefix}${homeNameSummary} vs. ${guestNameSummary}`;

  const cleanSummary = (text) =>
    typeof text === 'string'
      ? text.replace(/[\r\n]+/g, ' ').trim()
      : 'Untitled event';

  const summaryClean = cleanSummary(summary);

  /*
   * Die Uhrzeit wird direkt aus der API übernommen.
   * Es wird für den Start KEIN new Date(...) verwendet,
   * damit keine automatische Zeitzonenverschiebung entsteht.
   */
  const dateStr = matchInfo?.kickoffDate || match?.kickoffDate;
  const timeStr = matchInfo?.kickoffTime || match?.kickoffTime;

  /*
   * Spiele mit ungewöhnlichen Uhrzeiten werden nicht erzeugt.
   *
   * Übersprungen werden:
   * 22:00 - 23:59
   * 00:00 - 04:59
   *
   * Dadurch werden beispielsweise ausgefallene Spiele,
   * die von der API mit 00:00 Uhr zurückgegeben werden,
   * nicht in den Kalender eingetragen.
   */
  if (timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);

    const timeInMinutes = hour * 60 + minute;

    const tooLateOrEarly =
      timeInMinutes >= 22 * 60 ||
      timeInMinutes < 5 * 60;

    if (tooLateOrEarly) {
      console.log(
        `[SKIP] Spiel wird nicht generiert, ungewöhnliche Uhrzeit: ${dateStr} ${timeStr} – Match ${match?.matchId}`
      );

      return null;
    }
  }

  console.log(
    `[TIME DEBUG] ${homeNameSummary} vs ${guestNameSummary}: API = ${dateStr} ${timeStr}`
  );

  // EXAKT die API-Zeit
  const start = kickoffToArr(dateStr, timeStr);

  /*
   * Ende: 2,5 Stunden nach Anpfiff.
   *
   * Hier benutzen wir bewusst eine lokale Zeitberechnung,
   * aber NICHT für den Start.
   */
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const kickoffForEnd = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  const endDate = new Date(
    kickoffForEnd.getTime() + 2.5 * 60 * 60 * 1000
  );

  const end = dateToArr(endDate);

  const feld =
    matchInfo?.matchInfo?.spielfeld ||
    match?.spielfeld ||
    {};

  const location =
    feld.strasse && feld.plz && feld.ort
      ? `${feld.strasse}, ${feld.plz} ${feld.ort}, Deutschland`
      : 'Ort unbekannt';

  const descriptionLines = [
    `Wettbewerb: ${
      matchInfo?.ligaData?.liganame ||
      match?.ligaData?.liganame ||
      'Unbekannt'
    }`,

    `Saison: ${
      matchInfo?.ligaData?.seasonName ||
      match?.ligaData?.seasonName ||
      'Unbekannt'
    }`,

    `Heim: ${homeNameDesc || 'Unbekannt'}`,

    `Gast: ${guestNameDesc || 'Unbekannt'}`,

    feld.bezeichnung
      ? `Halle: ${feld.bezeichnung}`
      : '',

    feld.strasse && feld.ort
      ? `${feld.strasse}, ${feld.plz} ${feld.ort}`
      : '',

    `Anpfiff: ${formatKickoff(dateStr, timeStr)}`,

    `Update: ${new Date().toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin'
    })}`,
  ].filter(Boolean);

  const description = descriptionLines.join('\n');

  const htmlDescription =
    createHtmlDescription(descriptionLines, feld);

  const alarmTriggerMinutes = isHome ? 30 : 60;

  const event = {
    uid: `${match?.matchId || matchInfo?.matchId}@basketball-bund.net`,

    title: summaryClean,

    description,

    start,

    /*
     * local bedeutet:
     * Die Werte [Jahr, Monat, Tag, Stunde, Minute]
     * werden exakt als lokale Kalenderzeit verwendet.
     */
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
          minutes: alarmTriggerMinutes,
          before: true
        }
      }
    ],

    // Für späteres X-ALT-DESC
    htmlDescription,
  };

  return event;
}

async function generateICS(
  matches,
  details,
  teamId,
  type = 'all'
) {
  const events = [];

  for (const match of matches) {
    const matchInfo = details[match.matchId];

    const event = await buildEvent(
      match,
      matchInfo,
      teamId,
      type
    );

    // Nur tatsächlich erzeugte Events hinzufügen
    if (event) {
      events.push(event);
    }
  }

  if (!events.length) {
    return null;
  }

  events.forEach((e, i) => {
    console.log(
      `[DEBUG] Event ${i}: "${e.title}" Start:`,
      e.start
    );
  });

  const teams = require('../teams.json');

  const team = teams.find(
    t => Number(t.id) === Number(teamId)
  );

  const teamName =
    team?.name || 'Basketball Team';

  const typeLabel =
    type === 'home'
      ? ' - Heimspiele'
      : type === 'away'
        ? ' - Auswärtsspiele'
        : '';

  const calendarName =
    `${teamName}${typeLabel}`;

  const htmlDescriptions =
    events.map(e => e.htmlDescription);

  events.forEach(
    e => delete e.htmlDescription
  );

  return new Promise((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) {
        reject(error);
        return;
      }

      const lines = value.split('\r\n');

      const modifiedLines = [];

      let eventIndex = -1;
      let inEvent = false;
      let inAlarm = false;

      for (
        let i = 0;
        i < lines.length;
        i++
      ) {
        const line = lines[i];

        if (line === 'BEGIN:VCALENDAR') {
          modifiedLines.push(line);
          modifiedLines.push('VERSION:2.0');
          modifiedLines.push(
            'PRODID:-//bbb-ics-generator//DE'
          );
          modifiedLines.push(
            'CALSCALE:GREGORIAN'
          );
          modifiedLines.push(
            'METHOD:PUBLISH'
          );
          modifiedLines.push(
            'X-WR-CALNAME:' +
            icsEscape(calendarName)
          );
          modifiedLines.push(
            'X-WR-TIMEZONE:Europe/Berlin'
          );
          modifiedLines.push(
            'X-WR-CALDESC:Basketball-Spielplan'
          );

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

        if (line === 'END:VEVENT') {
          inEvent = false;
        }

        if (line === 'BEGIN:VALARM') {
          inAlarm = true;
        }

        if (line === 'END:VALARM') {
          inAlarm = false;
        }

        if (
          inEvent &&
          !inAlarm &&
          line.startsWith('DESCRIPTION:')
        ) {
          const descriptionLines = [line];

          while (
            i + 1 < lines.length &&
            (
              lines[i + 1].startsWith(' ') ||
              lines[i + 1].startsWith('\t')
            )
          ) {
            i++;
            descriptionLines.push(
              lines[i]
            );
          }

          descriptionLines.forEach(
            l => modifiedLines.push(l)
          );

          if (
            htmlDescriptions[eventIndex]
          ) {
            modifiedLines.push(
              'X-ALT-DESC;FMTTYPE=text/html:' +
              htmlDescriptions[eventIndex]
            );
          }

          continue;
        }

        modifiedLines.push(line);
      }

      resolve(
        modifiedLines.join('\r\n')
      );
    });
  });
}

module.exports = {
  generateICS
};
