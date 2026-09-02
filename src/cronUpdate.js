const { fetchTeamMatches, fetchMatchInfo } = require('./apiClient');
const { generateICS } = require('./icsGenerator');
const { saveICS } = require('./storage');
const teams = require('../teams.json');
const fs = require('fs');
const path = require('path');

async function updateAll() {
  const meta = [];

  for (const t of teams) {
    try {
      console.log(`[DEBUG] Starte Update für Team ${t.id} (${t.name})`);

      // Matches abrufen
      const matches = await fetchTeamMatches(t.id);
      console.log(`[DEBUG] API-Matches: ${matches ? matches.length : 0}`);

      if (!Array.isArray(matches) || matches.length === 0) {
        console.warn(`[WARN] Keine Matches für Team ${t.id}`);
        continue;
      }

      // Detailinfos für jedes Match holen
      const details = {};
      for (const m of matches) {
        try {
          details[m.matchId] = await fetchMatchInfo(m.matchId);
        } catch (err) {
          console.warn(`[WARN] Konnte Details für Match ${m.matchId} nicht laden:`, err.message);
          details[m.matchId] = null;
        }
      }

      // FIX: Sicheres Filtern mit Optional Chaining (?.)
      // Wenn homeTeam oder guestTeam null ist, wird die Bedingung einfach zu false, statt das Skript abstürzen zu lassen
      const homeMatches = matches.filter(m => m.homeTeam?.teamPermanentId && Number(m.homeTeam.teamPermanentId) === Number(t.id));
      const awayMatches = matches.filter(m => m.guestTeam?.teamPermanentId && Number(m.guestTeam.teamPermanentId) === Number(t.id));

      // Für alle Varianten ICS generieren
      const matchVariants = {
        all: matches,
        home: homeMatches,
        away: awayMatches,
      };

      for (const [kind, ms] of Object.entries(matchVariants)) {
        // Leere Arrays überspringen, um unnötige Warnungen zu vermeiden
        if (ms.length === 0) {
          console.log(`[INFO] Keine Spiele für Team ${t.id}, Typ ${kind}. Überspringe ICS-Erstellung.`);
          continue;
        }

        console.log(`[DEBUG] Erzeuge ICS für Team ${t.id}, Typ ${kind} (${ms.length} Spiele)`);
        const ics = await generateICS(ms, details, t.id, kind);
        
        if (ics) {
          saveICS(t.id, kind, ics);
          console.log(`[DEBUG] ICS gespeichert: ${t.id}_${kind}.ics`);
        } else {
          console.warn(`[WARN] generateICS hat null zurückgegeben für Team ${t.id}, Typ ${kind}`);
        }
      }

      meta.push({
        teamId: t.id,
        teamName: t.name,
        ageGroup: t.ageGroup,
        lastUpdate: new Date().toISOString(),
        matchCount: matches.length,
        homeMatchCount: homeMatches.length,
        awayMatchCount: awayMatches.length,
      });
      
      console.log(`[SUCCESS] Update für Team ${t.id} erfolgreich abgeschlossen.`);

    } catch (e) {
      console.error(`[FEHLER] Beim Update Team ${t.id} (${t.name}):`, e.stack || e);
      // WICHTIG: Wir machen hier mit dem nächsten Team weiter, statt das ganze Skript zu beenden
    }
  }

  // Metadata speichern
  const metaPath = path.resolve(__dirname, '../generated/metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`[SUCCESS] metadata.json mit ${meta.length} Teams aktualisiert.`);
}

updateAll();
