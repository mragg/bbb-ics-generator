const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.resolve(__dirname, '../generated')));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../generated/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server läuft auf Port', PORT));
