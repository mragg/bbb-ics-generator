// src/generateMasterExport.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const ical = require('ical');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const teams = [
  { id: "159756", name: "Herren 1", ageGroup: "" },
  { id: "161199", name: "Herren 2", ageGroup: "" },
  { id: "161336", name: "Damen 1", ageGroup: "" },
  { id: "276298", name: "U18m", ageGroup: "" },
  { id: "276291", name: "U16w", ageGroup: "" },
  { id: "158729", name: "U16.1m", ageGroup: "" },
  { id: "319432", name: "U16.2m", ageGroup: "" },
  { id: "155756", name: "U14.1", ageGroup: "" },
  { id: "161387", name: "U14.2", ageGroup: "" },
  { id: "323081", name: "U14.3", ageGroup: "" },
  { id: "161395", name: "U12.1", ageGroup: "" },
  { id: "276319", name: "U12.2", ageGroup: "" },
  { id: "161690", name: "U10.1", ageGroup: "" },
  { id: "276318", name: "U10.2", ageGroup: "" }
];

const BASE_URL = 'https://mragg.github.io/bbb-ics-generator/';

async function fetchAndParseAllGames() {
  const allGames = [];

  for (const team of teams) {
    const url = `${BASE_URL}${team.id}_all.ics`;
    console.log(`📥 Lade: ${team.name} (${url})`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   ⚠️ Keine Datei gefunden (Status ${response.status})`);
        continue;
      }

      const icsText = await response.text();
      const parsedData = ical.parseICS(icsText);

      for (const key in parsedData) {
        const event = parsedData[key];
        if (event.type !== 'VEVENT') continue;

        const startDate = new Date(event.start);
        let homeAway = 'Unbekannt';
        let opponent = 'Unbekannt';
        let teamName = `${team.name} ${team.ageGroup}`.trim();

        if (event.summary) {
          if (event.summary.includes('HEIM:')) {
            homeAway = 'Heim';
            opponent = event.summary.replace('HEIM: ', '').replace('vs. ', '').trim();
          } else if (event.summary.includes('AUSWÄRTS:')) {
            homeAway = 'Auswärts';
            opponent = event.summary.replace('AUSWÄRTS: ', '').replace('vs. ', '').trim();
          } else if (event.summary.includes('vs.')) {
            const parts = event.summary.split(' vs. ');
            opponent = parts[1] ? parts[1].trim() : event.summary;
          }
        }

        const isCancelled = event.summary && event.summary.includes('AUSGEFALLEN');
        const status = isCancelled ? '❌ Abgesagt' : '✅ Geplant';
        const location = event.location || 'Ort unbekannt';

        allGames.push({
          teamName,
          dateObj: startDate,
          displayDate: startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          displayTime: startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
          homeAway,
          opponent,
          location,
          status
        });
      }
    } catch (error) {
      console.error(`   ❌ Fehler beim Laden von ${team.name}:`, error.message);
    }
  }

  allGames.sort((a, b) => a.dateObj - b.dateObj);
  return allGames;
}

async function generateExcel(games) {
  console.log('\n📊 Erstelle Excel-Datei...');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gesamt-Spielplan');

  worksheet.columns = [
    { header: 'Team Name', key: 'teamName', width: 20 },
    { header: 'Datum', key: 'displayDate', width: 12 },
    { header: 'Uhrzeit', key: 'displayTime', width: 12 },
    { header: 'Heim / Auswärts', key: 'homeAway', width: 15 },
    { header: 'Wer gegen wen (Gegner)', key: 'opponent', width: 25 },
    { header: 'Ort', key: 'location', width: 40 },
    { header: 'Status', key: 'status', width: 12 }
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B00' } };
  worksheet.getRow(1).height = 25;

  games.forEach(game => {
    const row = worksheet.addRow({
      teamName: game.teamName,
      displayDate: game.displayDate,
      displayTime: game.displayTime,
      homeAway: game.homeAway,
      opponent: game.opponent,
      location: game.location,
      status: game.status
    });

    if (game.status.includes('Abgesagt')) {
      row.font = { bold: true, color: { argb: 'FFD32F2F' } };
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      });
    }
  });

  worksheet.autoFilter = 'A1:G1';

  const outputPath = path.resolve(__dirname, '../generated/Gesamt-Spielplan.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel gespeichert: ${outputPath}`);
}

function generatePDF(games) {
  console.log('📄 Erstelle PDF-Datei...');
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const outputPath = path.resolve(__dirname, '../generated/Gesamt-Spielplan.pdf');
  
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#FF6B00').text('TV Neunkirchen Baskets', { align: 'center' });
  doc.fontSize(14).font('Helvetica').fillColor('#0F172A').text('Gesamt-Spielplan aller Mannschaften', { align: 'center' });
  doc.fontSize(10).fillColor('#64748B').text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} Uhr`, { align: 'center' });
  doc.moveDown(1);

  const startX = 40;
  const rowHeight = 18;
  let currentY = doc.y;

  const headers = ['Team', 'Datum', 'Uhrzeit', 'H/A', 'Gegner', 'Ort', 'Status'];
  const colWidths = [90, 60, 60, 50, 110, 280, 70];
  
  doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#FF6B00');
  doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
  
  let currentX = startX;
  headers.forEach((h, i) => {
    doc.text(h, currentX + 4, currentY + 5, { width: colWidths[i] - 8 });
    currentX += colWidths[i];
  });

  currentY += rowHeight;
  doc.fillColor('#0F172A').font('Helvetica').fontSize(8);

  games.forEach((game, index) => {
    if (currentY + rowHeight > doc.page.height - 40) {
      doc.addPage();
      currentY = 40;
      
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#FF6B00');
      doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
      currentX = startX;
      headers.forEach((h, i) => {
        doc.text(h, currentX + 4, currentY + 5, { width: colWidths[i] - 8 });
        currentX += colWidths[i];
      });
      currentY += rowHeight;
      doc.fillColor('#0F172A').font('Helvetica').fontSize(8);
    }

    if (index % 2 === 0) {
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#F8FAFC');
    }

    const isCancelled = game.status.includes('Abgesagt');
    doc.fillColor(isCancelled ? '#D32F2F' : '#0F172A');
    if (isCancelled) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');

    currentX = startX;
    const rowData = [game.teamName, game.displayDate, game.displayTime, game.homeAway, game.opponent, game.location, game.status];
    
    rowData.forEach((text, i) => {
      const align = i === 2 ? 'center' : 'left';
      doc.text(text, currentX + 4, currentY + 4, { width: colWidths[i] - 8, align });
      currentX += colWidths[i];
    });

    currentY += rowHeight;
  });

  doc.end();
  console.log(`✅ PDF gespeichert: ${outputPath}`);
}

async function main() {
  console.log('🚀 Starte Master-Export (ICS-Download & Parse)...');
  
  const games = await fetchAndParseAllGames();
  
  if (games.length === 0) {
    console.log('⚠️ Keine Spiele gefunden. Breche ab.');
    return;
  }

  console.log(`\n✅ Insgesamt ${games.length} Spiele erfolgreich extrahiert und chronologisch sortiert.`);

  await generateExcel(games);
  generatePDF(games);

  console.log('\n🎉 Export erfolgreich abgeschlossen!');
  console.log('📁 Dateien liegen im Ordner: generated/');
}

main();
