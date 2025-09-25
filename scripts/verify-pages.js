#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function getPageCount(filePath) {
  const data = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(data);
  return pdf.getPageCount();
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const targets = [
    { file: 'leitfaden.pdf', expect: parseInt(process.env.EXPECT_LEITFADEN || '5', 10) },
    { file: 'laendervergleich.pdf', expect: parseInt(process.env.EXPECT_VERGLEICH || '3', 10) },
  ];

  let ok = true;
  for (const t of targets) {
    const p = path.join(root, t.file);
    if (!fs.existsSync(p)) {
      console.error(`Fehlt: ${t.file}`);
      ok = false;
      continue;
    }
    try {
      const count = await getPageCount(p);
      const mark = count === t.expect ? '✓' : '✗';
      console.log(`${mark} ${t.file}: ${count} Seiten (Soll: ${t.expect})`);
      if (count !== t.expect) ok = false;
    } catch (e) {
      console.error(`Fehler beim Lesen von ${t.file}:`, e.message);
      ok = false;
    }
  }
  process.exit(ok ? 0 : 2);
}

main();
