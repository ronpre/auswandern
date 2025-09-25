# Auswanderungsleitfaden (PDF)

Erzeugt PDFs aus HTML mit Puppeteer.

## Dateien
- `leitfaden.html` – Generischer Leitfaden mit Länderauswahl (Top: Norwegen, Alternativen: Kanada/Irland)
- `norwegen.html` – Norwegen‑spezifische Version
- `kanada.html` – Kanada‑spezifische Version
- `neuseeland.html` – Neuseeland‑spezifische Version
- `island.html` – Island‑spezifische Version
- `scripts/build-pdf.js` – HTML→PDF Script (A4, Ränder, Hintergrund)
- `laendervergleich.html` – Vergleich Norwegen/Neuseeland/Island/Kanada (Matrix)
    	- Enthält konservative Budget‑Richtwerte (Oslo, Toronto/Vancouver, Auckland, Reykjavík) und grobe Nettolohn‑Spannen
- `package.json` – npm‑Skripte und Abhängigkeiten

## PDF erzeugen
```zsh
cd "/Users/rp/Documents/projekte/auswandern"
# Generische Version
npm run build
# Norwegen‑Version
npm run build:norwegen
# Kanada‑Version
npm run build:kanada
# Neuseeland‑Version
npm run build:neuseeland
# Island‑Version
npm run build:island
# Ländervergleich (Matrix)
npm run build:laendervergleich
# Ländervergleich (3 Seiten)
npm run build:laendervergleich:3pages
# Alles bauen
npm run build:all
```

## Anpassung
- Passen Sie Inhalte direkt in den HTML‑Dateien an.
- Weitere Länder können als eigene `<land>.html` erstellt und in `package.json` per Skript ergänzt werden.

## Export‑Mappe (ZIP)
```zsh
cd "/Users/rp/Documents/projekte/auswandern"
npm run export:zip
```

Erzeugt die Datei `auswanderung.zip` im Projektordner.
