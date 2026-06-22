const Table = require('cli-table3');

function formatComparison(title, headers, rows) {
  const table = new Table({
    head: headers,
    style: { head: ['cyan'], border: ['grey'] },
    wordWrap: true,
    colWidths: headers.map(() => Math.floor(80 / headers.length))
  });
  rows.forEach(row => table.push(row));
  console.log(`\n${title}`);
  console.log(table.toString());
}

function formatBudget(items) {
  const table = new Table({
    head: ['Item', 'Per Person (HKD)', 'Total (HKD)', 'Status'],
    style: { head: ['green'], border: ['grey'] }
  });
  let total = 0;
  items.forEach(item => {
    table.push([item.name, item.perPerson, item.total, item.status || 'TBC']);
    total += item.total || 0;
  });
  table.push(['TOTAL', '', total, '']);
  console.log(table.toString());
}

module.exports = { formatComparison, formatBudget };
