const XLSX = require('xlsx');
const path = require('path');

const WORKBOOK_PATH = path.join(__dirname, '..', '🦊 Ski babies 2027 🦊.xlsx');

function readWorkbook() {
  return XLSX.readFile(WORKBOOK_PATH);
}

function getSheet(sheetName) {
  const wb = readWorkbook();
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found. Available: ${wb.SheetNames.join(', ')}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
}

function getSheetAsObjects(sheetName, headerRow = 0) {
  const wb = readWorkbook();
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found.`);
  return XLSX.utils.sheet_to_json(ws, { range: headerRow });
}

function listSheets() {
  return readWorkbook().SheetNames;
}

function writeSheet(sheetName, data, wb) {
  if (!wb) wb = readWorkbook();
  const ws = XLSX.utils.aoa_to_sheet(data);
  if (wb.SheetNames.includes(sheetName)) {
    wb.Sheets[sheetName] = ws;
  } else {
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  XLSX.writeFile(wb, WORKBOOK_PATH);
  return wb;
}

module.exports = { readWorkbook, getSheet, getSheetAsObjects, listSheets, writeSheet, WORKBOOK_PATH };

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'list') {
    console.log(listSheets());
  } else if (cmd === 'read') {
    const sheet = process.argv[3] || listSheets()[0];
    const data = getSheet(sheet);
    data.forEach((row, i) => {
      const filtered = row.map(c => c === '' ? '' : String(c));
      if (filtered.some(v => v !== '')) console.log(`${i}: ${filtered.join(' | ')}`);
    });
  }
}
