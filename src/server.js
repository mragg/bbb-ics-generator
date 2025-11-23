const express = require('express');
const { readICS, ICS_DIR } = require('./storage');
const path = require('path');

const app = express();

app.get('/ics/team/:teamId/:type.ics', (req, res) => {
  const { teamId, type } = req.params;
  if (!['all', 'home', 'away'].includes(type)) {
    return res.status(400).send('Ungültiger Kalendertyp');
  }

  const icsContent = readICS(teamId, type);
  if (!icsContent) return res.status(404).send('Kalender nicht gefunden');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.send(icsContent);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
