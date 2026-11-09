# handy – POV-Videos im gezeichneten 3D-Stil

3D-Szenen per Code (Three.js), gerendert im Browser (Playwright) und mit ffmpeg zu MP4 zusammengesetzt.

## Am eigenen PC (Windows, Mac, Linux)

### Einmalig installieren
1. **Node.js** (LTS) – https://nodejs.org
2. **ffmpeg** – Windows: `winget install Gyan.FFmpeg` (danach Terminal neu öffnen), Mac: `brew install ffmpeg`
3. Im Projektordner:
   ```bash
   npm install
   npx playwright install chromium
   npm run fetch:rocketbox      # Figuren + Bewegungen (~130 MB)
   ```

### Arbeiten
```bash
npm run serve                  # Vorschau im Browser: http://localhost:8080/scenes/pov-studio-7-tage/
npm run storyboard:7tage       # Bildercollage der ganzen Folge (schnell)
npm run render:7tage -- --gpu  # Video rendern, mit Grafikkarte (am PC deutlich schneller)
```

Ohne `--gpu` wird in Software gerendert. Das läuft überall, ist aber langsam.
Ergebnisse: `scenes/<folge>/storyboard/` und `scenes/<folge>/out/`.

### Projekt aus der Sicherung wiederherstellen
```bash
git clone handy.bundle handy
cd handy
```

## Folgen

| Ordner | Inhalt |
|---|---|
| `scenes/pov-studio-7-tage/` | „7 Tage vor Release“ – Tag im (erfundenen) Studio, Rocketbox-Figuren |
| `scenes/pov-serverraum/` | Launch-Nacht im Serverraum (Prototyp) |
| `scenes/cafe-ocean-drive/` | Café-Set im Pixel-Look |
| `scenes/shared/` | Baukasten: Player, Hände, Körper, Tusche-Filter, Rocketbox-Loader |
