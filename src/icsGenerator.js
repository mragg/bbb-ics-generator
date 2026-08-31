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
 * Prüft, ob ein Spiel abgesagt / ausgefallen ist.
 *
 * Nach Analyse der echten DBB-API-Daten gilt ein Spiel
 * insbesondere dann als ausgefallen, wenn:
 *
 * - match.abgesagt === true
 * - match.verzicht === true
 * - homeTeam.verzicht === true
 * - guestTeam.verzicht === true
 *
 * Dasselbe wird zusätzlich in matchInfo geprüft.
 */
function isCancelledMatch(match, matchInfo) {
  if (!match && !matchInfo) {
    return false;
  }

  // Direkte Absage
  if (
    match?.abgesagt === true ||
    matchInfo?.abgesagt === true
  ) {
    return true;
  }

  // Spiel / Mannschaft verzichtet
  if (
    match?.verzicht === true ||
    matchInfo?.verzicht === true
  ) {
    return true;
  }

  // Heimteam verzichtet
  if (
    match?.homeTeam?.verzicht === true ||
    matchInfo?.homeTeam?.verzicht === true
  ) {
    return true;
  }

  // Gastteam verzichtet
  if (
    match?.guestTeam?.verzicht === true ||
    matchInfo?.guestTeam?.verzicht === true
  ) {
    return true;
  }

  return false;
}

/*
 * Gibt den Grund für den Ausfall zurück.
 * Hilft bei den Logs und bei der Beschreibung.
 */
function getCancellationReason(match, matchInfo) {
  const reasons = [];

  if (
    match?.abgesagt === true ||
    matchInfo?.abgesagt === true
  ) {
    reasons.push('Spiel abgesagt');
  }

  if (
    match?.verzicht === true ||
    matchInfo?.verzicht === true
  ) {
    reasons.push('Verzicht');
  }

  if (
    match?.homeTeam?.verzicht === true ||
    matchInfo?.homeTeam?.verzicht === true
  ) {
    const homeName =
      getTeamNameForDescription(
        matchInfo?.homeTeam ||
        match?.homeTeam ||
        {}
      );

    reasons.push(`${homeName} hat verzichtet`);
  }

  if (
    match?.guestTeam?.verzicht === true ||
    matchInfo?.guestTeam?.verzicht === true
  ) {
    const guestName =
      getTeamNameForDescription(
        matchInfo?.guestTeam ||
        match?.guestTeam ||
        {}
      );

    reasons.push(`${guestName} hat verzichtet`);
  }

  if (!reasons.length) {
    return 'Unbekannter Ausfallgrund';
  }

  return [...new Set(reasons)].join(', ');
}

function createHtmlDescription(descriptionLines, feld) {
  const htmlLines = descriptionLines
    .map(line => `<p>${line}</p>`)
    .join('');

  const html = `<!DOCTYPE HTML>
<HTML>
<HEAD>
<META CHARSET="UTF-8">
</HEAD>
<BODY>
${htmlLines}
${feld.bezeichnung
    ? `<p><strong>Halle:</strong> ${feld.bezeichnung}</p>`
    : ''}
${feld.strasse && feld.ort
    ? `<p><strong>Adresse:</strong> ${feld.strasse}, ${feld.plz} ${feld.ort}</p>`
    : ''}
</BODY>
</HTML>`;

  return icsEscape(
    html.replace(/\r?\n/g, '')
  );
}

async function buildEvent(
  match,
  matchInfo,
  teamId,
  calendarType = 'all'
) {
  const homeTeamObj =
    matchInfo?.homeTeam ||
    match?.homeTeam ||
    {};

  const guestTeamObj =
    matchInfo?.guestTeam ||
    match?.guestTeam ||
    {};

  const homeTeamId =
    Number(homeTeamObj.teamPermanentId);

  const guestTeamId =
    Number(guestTeamObj.teamPermanentId);

  const ownTeamId =
    Number(teamId);

  const homeNameSummary =
    getTeamNameForSummary(homeTeamObj);

  const guestNameSummary =
    getTeamNameForSummary(guestTeamObj);

  const homeNameDesc =
    getTeamNameForDescription(homeTeamObj);

  const guestNameDesc =
    getTeamNameForDescription(guestTeamObj);

  const isHome =
    homeTeamId === ownTeamId;

  const isAway =
    guestTeamId === ownTeamId;

  let prefix = '';

  if (calendarType === 'all') {
    prefix = isHome
      ? 'HEIM: '
      : isAway
        ? 'AUSWÄRTS: '
        : '';
  }

  /*
   * Prüfen, ob Spiel ausgefallen ist.
   */
  const cancelled =
    isCancelledMatch(
      match,
      matchInfo
    );

  const cancellationReason =
    cancelled
      ? getCancellationReason(
          match,
          matchInfo
        )
      : '';

  const normalSummary =
    `${prefix}${homeNameSummary} vs. ${guestNameSummary}`;

  /*
   * Ausgefallene Spiele deutlich im Titel markieren.
   */
  const summary = cancelled
    ? `❌ AUSGEFALLEN ❌ ${normalSummary}`
    : normalSummary;

  const cleanSummary = (text) =>
    typeof text === 'string'
      ? text
          .replace(/[\r\n]+/g, ' ')
          .trim()
      : 'Untitled event';

  const summaryClean =
    cleanSummary(summary);

  /*
   * Uhrzeit aus der API.
   *
   * Für den Start KEIN new Date(...),
   * damit keine automatische Zeitzonenverschiebung
   * entsteht.
   */
  const dateStr =
    matchInfo?.kickoffDate ||
    match?.kickoffDate;

  const timeStr =
    matchInfo?.kickoffTime ||
    match?.kickoffTime;

  /*
   * Spiele zwischen 22:00 und 05:00 Uhr
   * werden NICHT in den Kalender aufgenommen.
   *
   * 22:00–23:59 -> überspringen
   * 00:00–04:59 -> überspringen
   * ab 05:00    -> normal
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
    `[CANCEL DEBUG] ${homeNameSummary} vs ${guestNameSummary}: cancelled = ${cancelled}${cancelled ? ` | Grund: ${cancellationReason}` : ''}`
  );

  /*
   * EXAKT die API-Zeit.
   */
  const start =
    kickoffToArr(
      dateStr,
      timeStr
    );

  /*
   * Ende: 2,5 Stunden nach Anpfiff.
   *
   * Hier lokale Berechnung, da nur das Ende
   * berechnet werden muss.
   */
  const [
    year,
    month,
    day
  ] =
    dateStr
      .split('-')
      .map(Number);

  const [
    hour,
    minute
  ] =
    timeStr
      .split(':')
      .map(Number);

  const kickoffForEnd =
    new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0
    );

  const endDate =
    new Date(
      kickoffForEnd.getTime() +
        2.5 *
        60 *
        60 *
        1000
    );

  const end =
    dateToArr(
      endDate
    );

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

  /*
   * Beschreibung aufbauen.
   */
  const descriptionLines = [];

  if (cancelled) {
    descriptionLines.push(
      '❌ DIESES SPIEL IST AUSGEFALLEN / ABGESAGT.'
    );

    descriptionLines.push(
      `Grund: ${cancellationReason}`
    );
  }

  descriptionLines.push(
    `Wettbewerb: ${
      matchInfo?.ligaData?.liganame ||
      match?.ligaData?.liganame ||
      'Unbekannt'
    }`
  );

  descriptionLines.push(
    `Saison: ${
      matchInfo?.ligaData?.seasonName ||
      match?.ligaData?.seasonName ||
      'Unbekannt'
    }`
  );

  descriptionLines.push(
    `Heim: ${homeNameDesc || 'Unbekannt'}`
  );

  descriptionLines.push(
    `Gast: ${guestNameDesc || 'Unbekannt'}`
  );

  if (feld.bezeichnung) {
    descriptionLines.push(
      `Halle: ${feld.bezeichnung}`
    );
  }

  if (feld.strasse && feld.ort) {
    descriptionLines.push(
      `${feld.strasse}, ${feld.plz} ${feld.ort}`
    );
  }

  descriptionLines.push(
    `Anpfiff: ${formatKickoff(
      dateStr,
      timeStr
    )}`
  );

  descriptionLines.push(
    `Update: ${new Date().toLocaleString(
      'de-DE',
      {
        timeZone: 'Europe/Berlin'
      }
    )}`
  );

  const description =
    descriptionLines.join('\n');

  const htmlDescription =
    createHtmlDescription(
      descriptionLines,
      feld
    );

  const alarmTriggerMinutes =
    isHome
      ? 30
      : 60;

  const event = {
    uid:
      `${match?.matchId ||
        matchInfo?.matchId
      }@basketball-bund.net`,

    title:
      summaryClean,

    description,

    /*
     * local bedeutet:
     * Die Werte [Jahr, Monat, Tag, Stunde, Minute]
     * werden exakt als lokale Kalenderzeit verwendet.
     */
    start,

    startInputType:
      'local',

    startOutputType:
      'local',

    end,

    endInputType:
      'local',

    endOutputType:
      'local',

    location,

    busyStatus:
      'BUSY',

    /*
     * Bei einem ausgefallenen Spiel möchten wir
     * keine normale Erinnerungsbenachrichtigung
     * bekommen.
     */
    alarms:
      cancelled
        ? []
        : [
            {
              action:
                'display',

              description:
                'Spiel beginnt bald',

              trigger: {
                minutes:
                  alarmTriggerMinutes,

                before:
                  true
              }
            }
          ],

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
     * =====================================================
     * VOLLSTÄNDIGER DEBUG
     * =====================================================
     *
     * Dieser Bereich bleibt absichtlich erhalten.
     * Damit können wir bei zukünftigen Problemen
     * direkt sehen, welche Daten die DBB-API liefert.
     */

    console.log(
      '\n================ FULL MATCH DEBUG ================'
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
      '===================================================\n'
    );

    /*
     * Event erzeugen.
     */
    const event =
      await buildEvent(
        match,
        matchInfo,
        teamId,
        type
      );

    /*
     * Nur tatsächlich erzeugte Events hinzufügen.
     *
     * Spiele zwischen 22:00 und 05:00 Uhr
     * liefern null und werden dadurch ignoriert.
     */
    if (event) {
      events.push(event);
    }
  }

  /*
   * Keine Events vorhanden.
   */
  if (!events.length) {
    return null;
  }

  events.forEach(
    (e, i) => {
      console.log(
        `[DEBUG] Event ${i}: "${e.title}" Start:`,
        e.start
      );
    }
  );

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

  /*
   * HTML-Beschreibungen sichern,
   * bevor sie aus den Events entfernt werden.
   */
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

          const modifiedLines =
            [];

          let eventIndex =
            -1;

          let inEvent =
            false;

          let inAlarm =
            false;

          for (
            let i = 0;
            i < lines.length;
            i++
          ) {
            const line =
              lines[i];

            /*
             * Kalenderkopf.
             */
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

            /*
             * Diese Standardfelder werden
             * durch unsere eigenen ersetzt.
             */
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

            /*
             * Event beginnt.
             */
            if (
              line ===
              'BEGIN:VEVENT'
            ) {
              inEvent =
                true;

              eventIndex++;
            }

            /*
             * Event endet.
             */
            if (
              line ===
              'END:VEVENT'
            ) {
              inEvent =
                false;
            }

            /*
             * Alarm beginnt.
             */
            if (
              line ===
              'BEGIN:VALARM'
            ) {
              inAlarm =
                true;
            }

            /*
             * Alarm endet.
             */
            if (
              line ===
              'END:VALARM'
            ) {
              inAlarm =
                false;
            }

            /*
             * Beschreibung finden und
             * HTML-Version hinzufügen.
             */
            if (
              inEvent &&
              !inAlarm &&
              line.startsWith(
                'DESCRIPTION:'
              )
            ) {
              const descriptionLines =
                [line];

              /*
               * ICS kann die Beschreibung
               * auf mehrere gefaltete Zeilen verteilen.
               */
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
                  modifiedLines.push(
                    l
                  )
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
