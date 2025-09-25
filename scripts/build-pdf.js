#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const args = process.argv.slice(2);
  let input = path.join(root, 'leitfaden.html');
  let output = path.join(root, 'auswanderungsleitfaden.pdf');
    let headerTitle = '';
    let headerDate = '';
    // Optional Konfigurationsdatei laden
    const configPath = path.join(root, 'pdf.config.json');
    let cfg = {};
    if (fs.existsSync(configPath)) {
      try {
        cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')) || {};
      } catch {
        console.warn('Warnung: pdf.config.json konnte nicht geparst werden.');
      }
    }

    for (const a of args) {
      if (a.startsWith('--input=')) input = path.resolve(root, a.split('=')[1]);
      if (a.startsWith('--output=')) output = path.resolve(root, a.split('=')[1]);
      if (a.startsWith('--title=')) headerTitle = a.split('=')[1];
      if (a.startsWith('--date=')) headerDate = a.split('=')[1];
    }

    if (!fs.existsSync(input)) {
      console.error('HTML nicht gefunden:', input);
      process.exit(1);
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

  let html = fs.readFileSync(input, 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Medienmodus steuern (screen/print) – per Env oder Konfig
  const media = (process.env.PDF_MEDIA || cfg.media || 'screen').toString();
  await page.emulateMediaType(media === 'print' ? 'print' : 'screen');

    // Seitenumbruch-Konfiguration: erzwinge Seitenwechsel vor jedem Element des Selektors
    const breakSelector = process.env.PDF_BREAK_SELECTOR || cfg.pageBreakSelector || 'section';
    if (breakSelector) {
      await page.addStyleTag({
        content: `
          @media print {
            ${breakSelector} { break-before: page; page-break-before: always; }
            ${breakSelector}:first-child { break-before: auto; page-break-before: auto; }
          }
        `
      });
    }

    // Optionale helles Druckthema für bessere Lesbarkeit
    const forceLight = (process.env.PDF_LIGHT_THEME || cfg.forceLightTheme) ?? true;
    if (String(forceLight) === 'true' || forceLight === true) {
      const printBg = process.env.PDF_PRINT_BG || cfg.printBg || '#f3f4f6'; // gray-100
      const printInk = process.env.PDF_PRINT_INK || cfg.printInk || '#111827'; // gray-900
      const printCard = process.env.PDF_PRINT_CARD || cfg.printCard || '#ffffff';
      const printMuted = process.env.PDF_PRINT_MUTED || cfg.printMuted || '#374151'; // gray-700
      await page.addStyleTag({
        content: `
          @media print {
            html, body { background: ${printBg} !important; color: ${printInk} !important; }
            .container { background: transparent !important; }
            header, section { background: ${printCard} !important; color: ${printInk} !important; border-color: #e5e7eb !important; box-shadow: none !important; }
            .meta, .small, .foot { color: ${printMuted} !important; }
            .tag { background: #f3f4f6 !important; color: #111827 !important; border-color: #e5e7eb !important; }
            .callout { background: #f9fafb !important; border-left-color: #9ca3af !important; }
            .pros { color: #065f46 !important; }
            .cons { color: #7f1d1d !important; }
            .flow .step { background: #f9fafb !important; border-color: #e5e7eb !important; }

            /* Keine Absatz-Trennungen und bessere Umbrüche */
            p, li, blockquote, pre, code, table, thead, tbody, tfoot, tr, td, th, .flow .step, .checklist, .callout { page-break-inside: avoid; break-inside: avoid; }
            /* Ganze Kästchen (Cards/Abschnitte) nicht über Seiten trennen */
            section, header, .grid > * { page-break-inside: avoid; break-inside: avoid; }
            /* Alle Überschriften beginnen auf neuer Seite (außer die erste auf der Seite) */
            h1, h2, h3, h4, h5, h6 { break-before: page; page-break-before: always; break-after: avoid; page-break-after: avoid; }
            /* Erstes Element im Dokument nicht erzwingen */
            body h1:first-of-type, body h2:first-of-type, body h3:first-of-type, body h4:first-of-type, body h5:first-of-type, body h6:first-of-type { break-before: auto; page-break-before: auto; }
            /* Überschrift als erstes Kindelement einer Section nicht zusätzlich umbrechen (Section bricht bereits) */
            section > :first-child:is(h1,h2,h3,h4,h5,h6) { break-before: auto; page-break-before: auto; }
            /* Überschrift nicht vom folgenden Absatz trennen */
            h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p { break-before: avoid; page-break-before: avoid; }
            ul, ol { page-break-inside: auto; break-inside: auto; }
            p { orphans: 3; widows: 3; }
          }
        `
      });
    }

    // Header/Footer vorbereiten
  const fallbackTitle = path.basename(input).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const title = headerTitle || process.env.PDF_TITLE || cfg.title || fallbackTitle;
  const date = headerDate || process.env.PDF_DATE || cfg.date || new Date().toLocaleDateString('de-DE');

  const headerColor = process.env.PDF_COLOR || cfg.headerColor || '#111827';
  const borderColor = cfg.borderColor || '#e5e7eb';
  const headerFontSize = parseFloat(process.env.PDF_HEADER_FONT_SIZE || cfg.headerFontSize || 9);

    const headerTemplate = `
      <div style="width:100%; font-size:${headerFontSize}px; color:${headerColor}; padding:6px 10px; display:flex; justify-content:space-between; border-bottom:1px solid ${borderColor};">
        <span>${title}</span>
        <span>${date}</span>
      </div>
    `;
    const footerTemplate = `
      <div style="width:100%; font-size:${headerFontSize}px; color:${headerColor}; padding:6px 10px; display:flex; justify-content:center; border-top:1px solid ${borderColor};">
        <span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span>
      </div>
    `;

  const defaultMargins = { top: '16mm', bottom: '14mm', left: '12mm', right: '12mm' };
    let margins = Object.assign({}, defaultMargins, cfg.margins || {});
    // Env overrides for margins if provided
    margins.top = process.env.PDF_MARGIN_TOP || margins.top;
    margins.bottom = process.env.PDF_MARGIN_BOTTOM || margins.bottom;
    margins.left = process.env.PDF_MARGIN_LEFT || margins.left;
    margins.right = process.env.PDF_MARGIN_RIGHT || margins.right;

    const scale = parseFloat(process.env.PDF_SCALE || cfg.scale || '1');
    const displayHeaderFooter = String(process.env.PDF_DISPLAY_HEADER_FOOTER || 'true') !== 'false';
    const pageRanges = process.env.PDF_PAGE_RANGES || cfg.pageRanges;
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: margins,
      scale: isNaN(scale) ? 1 : Math.max(0.5, Math.min(1.0, scale)),
      displayHeaderFooter,
      headerTemplate: displayHeaderFooter ? headerTemplate : undefined,
      footerTemplate: displayHeaderFooter ? footerTemplate : undefined,
      pageRanges: pageRanges
    });

    await browser.close();
    console.log('PDF erzeugt:', output);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();