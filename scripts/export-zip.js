#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'auswanderung.zip');

const files = [
  'leitfaden.pdf',
  'norwegen.pdf',
  'kanada.pdf',
  'neuseeland.pdf',
  'island.pdf',
  'laendervergleich.pdf',
  'empfehlung.pdf'
];

const present = files.filter(f => fs.existsSync(path.join(root, f)));
if (present.length === 0) {
  console.error('Keine PDFs gefunden. Bitte zunächst build:all ausführen.');
  process.exit(1);
}

try {
  if (fs.existsSync(out)) fs.unlinkSync(out);
  const cmd = `cd ${JSON.stringify(root)} && zip -q ${JSON.stringify(path.basename(out))} ${present.map(f => JSON.stringify(f)).join(' ')}`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('ZIP erstellt:', out);
} catch (e) {
  console.error('Fehler beim ZIP‑Export:', e.message);
  process.exit(1);
}
