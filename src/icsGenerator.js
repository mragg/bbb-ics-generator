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

/*
 * Prüft rekursiv, ob irgendwo in den API-Daten ein Hinweis
 * auf ein ausgefallenes / abgesagtes Spiel vorhanden ist.
 *
 * Das ist absichtlich etwas breiter gehalten, da wir bisher
 * noch nicht wissen, in welchem Feld die DBB-API den Ausfall liefert.
 */
function isCancelledMatch(match, matchInfo) {
  const cancellationWords = [
    'ausgefallen',
    'ausfall',
    'abgesagt',
    'absage',
    'entfallen',
    'entfällt',
    'cancelled',
    'canceled',
    'cancel',
    'abgebrochen'
  ];

  const cancellationKeys = [
    'cancelled',
    'canceled',
    'iscancelled',
    'iscanceled',
    'cancelledmatch',
    'canceledmatch',
    'cancelstatus',
    'cancelstatusname',
    'ausgefallen',
    'abgesagt',
    'entfallen'
  ];

  function checkValue(value, key = '') {
    if (typeof value === 'boolean') {
      return cancellationKeys.includes(
        key.toLowerCase()
      ) && value === true;
    }

    if (typeof value === 'number') {
      return false;
    }

    if (typeof value === 'string') {
      const normalized = value
        .toLowerCase()
        .trim();

      const keyNormalized = key
        .toLowerCase()
        .replace(/[_\-\s]/g, '');

      // Bekannte Status-/Textwerte
      if (
        cancellationWords.some(word =>
          normalized.includes(word)
        )
      ) {
        return true;
      }

      // Boolean-artige Felder als String
      if (
        ['true', 'yes', 'ja'].includes(normalized) &&
        cancellationKeys.includes(keyNormalized)
      ) {
        return true;
      }

      return false;
    }

    if (Array.isArray(value)) {
      return value.some(item =>
        checkValue(item, key)
      );
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).some(
        ([childKey, childValue]) =>
          checkValue(childValue, childKey)
      );
    }

    return false;
  }

  return (
    checkValue(match, '') ||
    checkValue(matchInfo, '')
  );
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

  /*
   * Prüfen, ob das Spiel ausgefallen / abgesagt ist.
   */
  const cancelled = isCancelledMatch(
    match,
    matchInfo
  );

  const normalSummary =
    `${prefix}${homeNameSummary} vs. ${guestNameSummary}`;

  const summary = cancelled
    ? `❌ AUSGEFALLEN ❌ ${normalSummary}`
    : normalSummary;

  const cleanSummary = (text) =>
    typeof text === 'string'
      ? text.replace(/[\r\n]+/g, ' ').trim()
      : 'Untitled event';

  const summaryClean = cleanSummary(summary);

  /*
   * WICHTIG:
   * Die Uhrzeit wird direkt aus der API übernommen.
   *
   * NICHT:
   * new Date(...)
   *
   * Dadurch gibt es keine automatische Zeitzonenverschiebung.
   */

  const dateStr =
    matchInfo?.kickoffDate ||
    match?.kickoffDate;

  const timeStr =
    matchInfo?.kickoffTime ||
    match?.kickoffTime;

  /*
   * Spiele zwischen 22:00 und 05:00 Uhr
   * werden nicht generiert.
   *
   * 22:00–23:59 -> überspringen
   * 00:00–04:59 -> überspringen
   * 05:00        -> normal
   */

  if (timeStr) {
    const [hour, minute] =
      timeStr.split(':').map(Number);

    const timeInMinutes =
      hour * 60 + minute;

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

  console.log(
    `[CANCEL DEBUG] ${homeNameSummary} vs ${guestNameSummary}: cancelled = ${cancelled}`
  );

  /*
   * EXAKT die API-Zeit
   */
  const start =
    kickoffToArr(dateStr, timeStr);

  /*
   * Ende: 2,5 Stunden nach Anpfiff.
   * Hier benutzen wir bewusst eine lokale Zeitberechnung,
   * aber NICHT für den Start.
   */

  const [year, month, day] =
    dateStr.split('-').map(Number);

  const [hour, minute] =
    timeStr.split(':').map(Number);

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
    kickoffForEnd.getTime() +
      2.5 * 60 * 60 * 1000
  );

  const end = dateToArr(endDate);

  const feld =
    matchInfo?.matchInfo?.spielfeld ||
    match?.spielfeld ||
    {};

  const location =
    feld.strasse &&
    feld.plz &&
    feld.ort
      ? `${feld.strasse}, ${feld.plz} ${feld.ort}, Deutschland`
      : 'Ort unbekannt';

  const descriptionLines = [
    ...(cancelled
      ? [
          '❌ DIESES SPIEL WURDE ABGESAGT / IST AUSGEFALLEN.'
        ]
      : []),

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

    `Anpfiff: ${formatKickoff(
      dateStr,
      timeStr
    )}`,

    `Update: ${new Date().toLocaleString(
      'de-DE',
      {
        timeZone: 'Europe/Berlin'
      }
    )}`,
  ].filter(Boolean);

  const description =
    descriptionLines.join('\n');

  const htmlDescription =
    createHtmlDescription(
      descriptionLines,
      feld
    );

  const alarmTriggerMinutes =
    isHome ? 30 : 60;

  const event = {
    uid: `${
      match?.matchId ||
      matchInfo?.matchId
    }@basketball-bund.net`,

    title: summaryClean,

    description,

    /*
     * local bedeutet:
     * Die Werte [Jahr, Monat, Tag, Stunde, Minute]
     * werden exakt als lokale Kalenderzeit verwendet.
     */

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

        description:
          'Spiel beginnt bald',

        trigger: {
          minutes:
            alarmTriggerMinutes,

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
    const matchInfo =
      details[match.matchId];

    /*
     * Vollständiger Debug des Spiels.
     *
     * Wichtig:
     * Im GitHub-Action-Log kann man hier sehen,
     * wie die DBB-API das Spiel tatsächlich liefert.
     */

    console.log(
      `\n================ FULL MATCH DEBUG ================`
    );

    console.log(
      `[FULL DEBUG] Match ${match.matchId}`
    );

    console.log(
      JSON.stringify(
        match,
        null,
        2
      )
    );

    console.log(
      `[FULL MATCHINFO DEBUG] Match ${match.matchId}`
    );

    console.log(
      JSON.stringify(
        matchInfo,
        null,
        2
      )
    );

    console.log(
      `===================================================\n`
    );

    const event =
      await buildEvent(
        match,
        matchInfo,
        teamId,
        type
      );

    /*
     * Ausgefilterte Spiele (z.B. 00:00)
     * nicht in events aufnehmen.
     */

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

  const teams =
    require('../teams.json');

  const team =
    teams.find(
      t =>
        Number(t.id) ===
        Number(teamId)
    );

  const teamName =
    team?.name ||
    'Basketball Team';

  const typeLabel =
    type === 'home'
      ? ' - Heimspiele'
      : type === 'away'
        ? ' - Auswärtsspiele'
        : '';

  const calendarName =
    `${teamName}${typeLabel}`;

  const htmlDescriptions =
    events.map(
      e => e.htmlDescription
    );

  events.forEach(
    e =>
      delete e.htmlDescription
  );

  return new Promise(
    (resolve, reject) => {
      createEvents(
        events,
        (error, value) => {
          if (error) {
            reject(error);
            return;
          }

          const lines =
            value.split('\r\n');

          const modifiedLines = [];

          let eventIndex = -1;
          let inEvent = false;
          let inAlarm = false;

          for (
            let i = 0;
            i < lines.length;
            i++
          ) {
            const line =
              lines[i];

            if (
              line ===
              'BEGIN:VCALENDAR'
            ) {
              modifiedLines.push(
                line
              );

              modifiedLines.push(
                'VERSION:2.0'
              );

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
                icsEscape(
                  calendarName
                )
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
              line.startsWith(
                'VERSION:'
              ) ||
              line.startsWith(
                'PRODID:'
              ) ||
              line.startsWith(
                'CALSCALE:'
              ) ||
              line.startsWith(
                'METHOD:'
              )
            ) {
              continue;
            }

            if (
              line ===
              'BEGIN:VEVENT'
            ) {
              inEvent = true;
              eventIndex++;
            }

            if (
              line ===
              'END:VEVENT'
            ) {
              inEvent = false;
            }

            if (
              line ===
              'BEGIN:VALARM'
            ) {
              inAlarm = true;
            }

            if (
              line ===
              'END:VALARM'
            ) {
              inAlarm = false;
            }

            if (
              inEvent &&
              !inAlarm &&
              line.startsWith(
                'DESCRIPTION:'
              )
            ) {
              const descriptionLines =
                [line];

              while (
                i + 1 <
                  lines.length &&
                (
                  lines[i + 1]
                    .startsWith(' ') ||
                  lines[i + 1]
                    .startsWith('\t')
                )
              ) {
                i++;

                descriptionLines.push(
                  lines[i]
                );
              }

              descriptionLines.forEach(
                l =>
                  modifiedLines.push(l)
              );

              if (
                htmlDescriptions[
                  eventIndex
                ]
              ) {
                modifiedLines.push(
                  'X-ALT-DESC;FMTTYPE=text/html:' +
                  htmlDescriptions[
                    eventIndex
                  ]
                );
              }

              continue;
            }

            modifiedLines.push(
              line
            );
          }

          resolve(
            modifiedLines.join(
              '\r\n'
            )
          );
        }
      );
    }
  );
}

module.exports = {
  generateICS
};
