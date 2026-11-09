# POV: Serverraum in der Launch-Nacht

Prototyp für die Serie **„POV: Du arbeitest an GTA 6 in der Release-Woche“**.
Satire: Studio, Figuren und Dialoge sind erfunden. Es gibt keine Logos, Figuren
oder Spielinhalte von Rockstar.

24 Sekunden, 9:16, im Stil der „Du warst dabei“-POV-Videos:
- **Tusche-Linien wie handgezeichnet**: Kanten aus Tiefe und Normalen (auch an Kanten innerhalb
  von Objekten), schwankende Strichstärke, die Linie „kocht“ leicht (8× pro Sekunde)
- **Weiche Schattierung** (Lambert) mit Lichtkegeln unter den Deckenleuchten, gedämpfte Farben, Papierstruktur
- **Fischauge** und Ich-Perspektive mit **echten Händen** (Hand-Modelle mit Fingergelenken, Posen
  `relaxed` / `cup` / `fist` / `phone`)
- **Flüssige Kamera**: Spline durch die Keyframes (kein Abbremsen an jedem Punkt), leicht nachziehender Blick,
  überlagertes Kopf-Wackeln, Head-Bob beim Gehen
- Figuren mit Rumpf-Silhouette, sich verjüngenden Gliedern und echten Händen
- **Ort/Zeit-Box** oben links (dunkel) und **Alarm-Box** (rot)
- **Untertitel mit einer Farbe pro Sprecher** (Du = weiß, Tobi = hellblau, Mia = gelb)
- Abblende mit Abspann „Fortsetzung folgt …“ und Satire-Hinweis

## Dateien

| Datei | Inhalt |
|---|---|
| `script.js` | **Drehbuch**: Dialogzeilen, Einblendungen, Kamera-Keyframes, Geräusche. Hier ändert man die Geschichte. |
| `scene.js` | Set: Rack-Gang mit blinkenden LEDs, Launch-Monitor (Countdown, Spielerzahl, Kurve), Schreibtisch, Figuren, Licht, Animation |
| `index.html` | Abspielseite: Kamerafahrt, Overlays, Untertitel |
| `../shared/toon.js` | Wiederverwendbar für alle POV-Folgen: Material, `makePerson()`, `makeHand()`, `makePovHands()`, Tusche-Filter |
| `../shared/assets/hands/` | Hand-Modelle (WebXR generic-hand, MIT-Lizenz) |
| `previews/` | Standbilder |

## Ansehen

```bash
npm install
npm run serve
# -> http://localhost:8080/scenes/pov-serverraum/
```

Leertaste = Pause, ←/→ = 1 s springen, `?t=14.5` = Standbild, `?fisheye=0.3` = schwächeres Fischauge.

## Video rendern

```bash
npm run render:serverraum        # -> scenes/pov-serverraum/out/pov_serverraum.mp4 (1080×1920)
npm run stills:serverraum        # nur Standbilder nach previews/
node tools/render_video.mjs scenes/pov-serverraum --from 9 --to 15     # nur ein Ausschnitt
node tools/render_video.mjs scenes/pov-serverraum --voice stimmen.wav  # Sprachspur dazumischen
```

Das Skript rendert intern mit 720×1280 und skaliert auf 1080×1920 hoch. Die Overlays
sind HTML und landen über einen Screenshot pro Bild mit im Video. Piepen, Launch-Ton,
Alarm, Whoosh und Raumbrummen werden aus `SFX` in `script.js` per ffmpeg erzeugt.

## Eine neue Folge bauen

1. Ordner kopieren, z. B. `scenes/pov-buero-montag/`
2. In `script.js` Zeilen, Boxen, Kamera und Geräusche anpassen (`hold: true` an einem Kamera-Key = dort anhalten)
3. Set in `scene.js` umbauen. Figuren entstehen mit `makePerson({ top, hair, hairStyle, glasses, headset … })`.
4. `node tools/render_video.mjs scenes/pov-buero-montag`

## Noch offen

- **Stimmen**: ElevenLabs o. Ä. Pro Zeile eine Datei, das Timing kommt aus der Audiolänge.
  Die Lippenbewegung läuft schon automatisch, solange die Zeile der Figur angezeigt wird.
- Echte Geräusche statt synthetischer Töne (Jubel, Tastatur, Lüfter)
