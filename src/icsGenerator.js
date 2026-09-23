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
    throw new Error(`Ungültige Spieldaten: date=${dateStr}, time=${timeStr}`);
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

function isCancelledMatch(match, matchInfo) {
  if (!match && !matchInfo) return false;

  if (match?.abgesagt === true || matchInfo?.abgesagt === true) return true;
  if (match?.verzicht === true || matchInfo?.verzicht === true) return true;
  if (match?.homeTeam?.verzicht === true || matchInfo?.homeTeam?.verzicht === true) return true;
  if (match?.guestTeam?.verzicht === true || matchInfo?.guestTeam?.verzicht === true) return true;

  return false;
}

function getCancellationReason(match, matchInfo) {
  const reasons = [];

  if (match?.abgesagt === true || matchInfo?.abgesagt === true) reasons.push('Spiel abgesagt');
  if (match?.verzicht === true || matchInfo?.verzicht === true) reasons.push('Verzicht');
  
  if (match?.homeTeam?.verzicht === true || matchInfo?.homeTeam?.verzicht === true) {
    reasons.push(`${getTeamNameForDescription(matchInfo?.homeTeam || match?.homeTeam || {})} hat verzichtet`);
  }
  if (match?.guestTeam?.verzicht === true || matchInfo?.guestTeam?.verzicht === true) {
    reasons.push(`${getTeamNameForDescription(matchInfo?.guestTeam || match?.guestTeam || {})} hat verzichtet`);
  }

  if (!reasons.length) return 'Unbekannter Ausfallgrund';
  return [...new Set(reasons)].join(', ');
}

/*
 * NEU: Robuste HTML-Beschreibung, die dynamisch auf Ergebnisse und Absagen reagiert
 */
function createHtmlDescription(match, feld, cancelled, cancellationReason) {
  const homeName = getTeamNameForDescription(match?.homeTeam || {});
  const guestName = getTeamNameForDescription(match?.guestTeam || {});
  const liga = match?.ligaData?.liganame || 'Unbekannt';
  const saison = match?.ligaData?.seasonName || 'Unbekannt';
  const dateStr = match?.kickoffDate;
  const timeStr = match?.kickoffTime;
  
  // Prüfen, ob ein Ergebnis vorliegt (z.B. "58:83")
  const hasResult = match?.result && typeof match.result === 'string' && match.result.includes(':');

  let html = `<!DOCTYPE HTML><HTML><HEAD><META CHARSET="UTF-8"></HEAD><BODY style="font-family: sans-serif;">`;

  if (cancelled) {
    html += `<p style="color: #dc3545; font-weight: bold;">❌ DIESES SPIEL IST AUSGEFALLEN / ABGESAGT</p>`;
    html += `<p><strong>Grund:</strong> ${cancellationReason}</p>`;
  } else if (hasResult) {
    html += `<p style="color: #198754; font-weight: bold; font-size: 1.1em;">✅ ERGEBNIS: ${match.result}</p>`;
  }

  html += `<p><strong>Wettbewerb:</strong> ${liga}</p>`;
  html += `<p><strong>Saison:</strong> ${saison}</p>`;
  html += `<p><strong>Heim:</strong> ${homeName}</p>`;
  html += `<p><strong>Gast:</strong> ${guestName}</p>`;

  if (feld.bezeichnung) html += `<p><strong>Halle:</strong> ${feld.bezeichnung}</p>`;
  if (feld.strasse && feld.ort) html += `<p><strong>Adresse:</strong> ${feld.strasse}, ${feld.plz} ${feld.ort}</p>`;
  
  if (dateStr && timeStr) {
    html += `<p><strong>Anpfiff:</strong> ${formatKickoff(dateStr, timeStr)}</p>`;
  }

  html += `<p style="color: #6c757d; font-size: 0.9em; margin-top: 15px;"><em>Letztes Update: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</em></p>`;
  html += `</BODY></HTML>`;

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
    prefix = isHome ? 'HEIM: ' : isAway ? 'AUSWÄRTS: ' : '';
  }

  const cancelled = isCancelledMatch(match, matchInfo);
  const cancellationReason = cancelled ? getCancellationReason(match, matchInfo) : '';

  // NEU: Ergebnis in den Titel integrieren
  const hasResult = match?.result && typeof match.result === 'string' && match.result.includes(':');
  
  let normalSummary = `${prefix}${homeNameSummary} vs. ${guestNameSummary}`;
  if (hasResult) {
    normalSummary = `${prefix}${homeNameSummary} ${match.result} ${guestNameSummary}`;
  }

  const summary = cancelled ? `❌ AUSGEFALLEN ❌ ${normalSummary}` : normalSummary;

  const cleanSummary = (text) => typeof text === 'string' ? text.replace(/[\r\n]+/g, ' ').trim() : 'Untitled event';
  const summaryClean = cleanSummary(summary);

  const dateStr = matchInfo?.kickoffDate || match?.kickoffDate;
  const timeStr = matchInfo?.kickoffTime || match?.kickoffTime;

  if (timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;
    const tooLateOrEarly = timeInMinutes >= 22 * 60 || timeInMinutes < 5 * 60;

    if (tooLateOrEarly) {
      console.log(`[SKIP] Spiel wird nicht generiert, ungewöhnliche Uhrzeit: ${dateStr} ${timeStr} – Match ${match?.matchId}`);
      return null;
    }
  }

  console.log(`[TIME DEBUG] ${homeNameSummary} vs ${guestNameSummary}: API = ${dateStr} ${timeStr}`);
  console.log(`[CANCEL/RESULT DEBUG] ${homeNameSummary} vs ${guestNameSummary}: cancelled = ${cancelled}${cancelled ? ` | Grund: ${cancellationReason}` : ''}${hasResult ? ` | Ergebnis: ${match.result}` : ''}`);

  const start = kickoffToArr(dateStr, timeStr);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const kickoffForEnd = new Date(year, month - 1, day, hour, minute, 0, 0);
  const endDate = new Date(kickoffForEnd.getTime() + 2.5 * 60 * 60 * 1000);
  const end = dateToArr(endDate);

  const feld = matchInfo?.matchInfo?.spielfeld || match?.spielfeld || {};
  const location = feld.strasse && feld.plz && feld.ort
    ? `${feld.strasse}, ${feld.plz} ${feld.ort}, Deutschland`
    : 'Ort unbekannt';

  // NEU: Ergebnis auch in die Text-Beschreibung aufnehmen
  const descriptionLines = [
    ...(cancelled ? ['❌ DIESES SPIEL IST AUSGEFALLEN / ABGESAGT.', `Grund: ${cancellationReason}`] : []),
    ...(hasResult ? [`✅ ERGEBNIS: ${match.result}`] : []),
    `Wettbewerb: ${matchInfo?.ligaData?.liganame || match?.ligaData?.liganame || 'Unbekannt'}`,
    `Saison: ${matchInfo?.ligaData?.seasonName || match?.ligaData?.seasonName || 'Unbekannt'}`,
    `Heim: ${homeNameDesc || 'Unbekannt'}`,
    `Gast: ${guestNameDesc || 'Unbekannt'}`,
    feld.bezeichnung ? `Halle: ${feld.bezeichnung}` : '',
    feld.strasse && feld.ort ? `${feld.strasse}, ${feld.plz} ${feld.ort}` : '',
    `Anpfiff: ${formatKickoff(dateStr, timeStr)}`,
    `Update: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
  ].filter(Boolean);

  const description = descriptionLines.join('\n');

  // NEU: Robuste HTML-Generierung übergeben
  const htmlDescription = createHtmlDescription(match, feld, cancelled, cancellationReason);

  const event = {
    uid: `${match?.matchId || matchInfo?.matchId}@basketball-bund.net`,
    title: summaryClean,
    description,
    start,
    startInputType: 'local',
    startOutputType: 'local',
    end,
    endInputType: 'local',
    endOutputType: 'local',
    location,
    busyStatus: 'BUSY',
    htmlDescription,
  };

  return event;
}

async function generateICS(matches, details, teamId, type = 'all') {
  const events = [];

  for (const match of matches) {
    const matchInfo = details[match.matchId];

    console.log('\n================ FULL MATCH DEBUG ================');
    console.log(`[FULL DEBUG] Match ${match.matchId}`);
    console.log(JSON.stringify(match, null, 2));
    console.log(`[FULL MATCHINFO DEBUG] Match ${match.matchId}`);
    console.log(JSON.stringify(matchInfo, null, 2));
    console.log('===================================================\n');

    const event = await buildEvent(match, matchInfo, teamId, type);

    if (event) {
      events.push(event);
    }
  }

  if (!events.length) {
    return null;
  }

  events.forEach((e, i) => {
    console.log(`[DEBUG] Event ${i}: "${e.title}" Start:`, e.start);
  });

  const teams = require('../teams.json');
  const team = teams.find(t => Number(t.id) === Number(teamId));
  const teamName = team?.name || 'Basketball Team';

  const typeLabel = type === 'home' ? ' - Heimspiele' : type === 'away' ? ' - Auswärtsspiele' : '';
  const calendarName = `${teamName}${typeLabel}`;

  const htmlDescriptions = events.map(e => e.htmlDescription);
  events.forEach(e => delete e.htmlDescription);

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

        if (line.startsWith('VERSION:') || line.startsWith('PRODID:') || line.startsWith('CALSCALE:') || line.startsWith('METHOD:')) {
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
          continue;
        }

        if (line === 'END:VALARM') {
          inAlarm = false;
          continue;
        }

        if (inAlarm) {
          continue;
        }

        if (inEvent && line.startsWith('DESCRIPTION:')) {
          const descriptionLines = [line];

          while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
            i++;
            descriptionLines.push(lines[i]);
          }

          descriptionLines.forEach(l => modifiedLines.push(l));

          if (htmlDescriptions[eventIndex]) {
            modifiedLines.push('X-ALT-DESC;FMTTYPE=text/html:' + htmlDescriptions[eventIndex]);
          }

          continue;
        }

        modifiedLines.push(line);
      }

      resolve(modifiedLines.join('\r\n'));
    });
  });
}

module.exports = { generateICS };
