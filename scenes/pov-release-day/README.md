# POV-Format: „Release Day“

Serienformat in der Ich-Perspektive, angelehnt an den Aufbau virale POV-Videos:
Fischauge, Comic-Konturen, oben eine feste Zeile mit **Ort · Wochentag Uhrzeit**,
Nachrichten-Karten oben, Handy mit Gruppenchat in den eigenen Händen und
kurze, farbige Untertitel pro Sprecher. Die Figuren sind unsere Vice-Files-Blockfiguren
(Lena = die Blonde).

**Folge 1:** *POV: Heute Nacht um 00:00 kommt GTA 6 raus* (88 s, 9:16)

Ein ganzer Tag voller Vorfreude: Mittwoch, 18. November, bis zum Release am 19. November
um 00:00 Uhr. Der Preload lief schon seit dem 10. November.

| Zeit | Ort · Uhr | Was passiert |
|---|---|---|
| 0–3,6 s | Wohnzimmer · 23:59:56 | **Hook:** Countdown auf dem TV, Controller in der Hand, Text „POV: Heute Nacht um 00:00 kommt GTA 6 raus“ |
| 3,6–16 s | Schlafzimmer · 06:00 | „18 STUNDEN VORHER“, Wecker mit Release-Widget, Poster, Kalender (10.11. Preload, 19.11. eingekreist) |
| 16–27 s | Küche · 07:10 | Frühstück, Morgenmagazin im TV, Mitbewohner Mo: „Pizza, Energy, kein Schlaf?“ – „Deal.“ |
| 27–40 s | Bus Linie 6 · 07:42 | Stadt mit Palmen zieht vorbei, Plakat „HEUTE NACHT 00:00“, Tagträumen, Crew-Chat |
| 40–62 s | Büro · 09:03 → 17:00 | Countdown-Tab, Lena: „Tab zu – der Chef!“, Chef will Überstunden → „Heute nicht.“, Feierabend-Glocke |
| 62–83,6 s | Wohnzimmer · 23:41 → 00:00 | Neon-LEDs, Mo auf dem Sofa, Countdown „DREI! ZWEI! EINS!“, Titelbild, START gedrückt |
| 83,6–88 s | | Abspann „WIR SEHEN UNS IN LEONIDA 🌴“ |

## Ansehen

```bash
npm install
npm run serve
# -> http://localhost:8080/scenes/pov-release-day/
```

Unten: Play/Pause und Zeitleiste. URL-Parameter:

- `?t=25` – Standbild bei 25 s
- `?look=pixel` – zusätzlich verpixelt (Vice-Files-Look), `&lowres=360` für die Pixelgröße
- `?fisheye=0.55` – Krümmung (0 = aus), `?lines=1.6` – Strichstärke
- `?hook=0` – Hook-Text am Anfang aus (wenn ihr ihn lieber als TikTok-Text setzt)
- `?ep=episode-2` – andere Folge laden

## Video rendern

```bash
npm run render:pov                           # -> export/release-day.mp4 (1080x1920, 30 fps, mit Sounds)
node tools/render_pov.mjs scenes/pov-release-day --stills 6,25,62   # nur Standbilder -> previews/
node tools/render_pov.mjs scenes/pov-release-day --from 50 --to 70 --out teil.mp4
```

Der Ton enthält Wecker, Vibration bei Nachrichten, Chat-Pops, Wusch bei Zeitsprüngen,
die 17-Uhr-Glocke, den Release-Boom um 00:00, den Tastendruck und einen Abschluss-Sting. **Stimmen** (Mo, Lena, Chef, Gedanken) sprecht ihr
selbst ein oder legt TTS darüber – die Untertitel-Zeiten stehen in `episode.js`.

## Neue Folge schreiben

Alles steht in **`episode.js`** – kein Code nötig. Datei kopieren (z. B. `episode-2.js`) und ändern:

| Feld | Inhalt |
|---|---|
| `loc` | Drehort: `bedroom`, `kitchen`, `bus`, `office`, `living` |
| `day`, `clock` | Kopfzeile: Wochentag, Uhrzeit ab Sekunde x (`[t, '23:59:49', true]` = Uhr läuft sekundengenau) |
| `hook`, `cards` | Hook-Text am Anfang, große Zwischentitel („18 STUNDEN VORHER“) |
| `cuts` | Zeitsprünge mit kurzer Abblende |
| `daylight` | `dawn`, `morning`, `noon`, `afternoon`, `sunset`, `night` (Fenster & Licht) |
| `monitor` | Büro-Bildschirm: `mail`, `excel`, `gta` (Countdown bis 00:00), `lock` |
| `tv` | Wohnzimmer-TV: `countdown`, `flash`, `title`, `loading` |
| `look` | Kopf: `[sek, yaw, pitch]` (im Büro auch Namen: `monitor`, `clock`, `lena`, `window`, `bossLeft`) |
| `fov` | Zoom: 100 = Weitwinkel, ~36 = Zoom auf Uhr, ~52 = Handy |
| `hold`, `phone`, `screen`, `press` | Was du hältst (`phone`/`controller`), 0 = unten / 1 = vor dem Gesicht, Handy-Bildschirm (`alarm`/`chat`), Tastendruck |
| `rig`, `pose` | Augenposition `[sek, x, höhe, z, körperrichtung]` im Ort, Haltung `lie`/`sit`/`stand` |
| `lena`, `boss` | Lena dreht sich zu dir (0..1), Chef läuft `[sek, x, z, richtung]` |
| `chat` | Gruppenchat; `notify: true` = Karte oben, `me: true` = deine Nachricht, `img: 'preload'` |
| `notes` | andere Benachrichtigungen (z. B. Mama) |
| `lines` | Untertitel: `who` = `DU` / `MO` / `LENA` / `CHEF`, `think: true` = Gedanke (kursiv) |
| `end` | Abspann („WIR SEHEN UNS IN LEONIDA 🌴“) |

Zwei Keys mit derselben Zeit = harter Schnitt (z. B. der Chef taucht plötzlich auf).

## Dateien

- `scene.js` – Büro (Fensterfront mit Skyline & Palmen, Stellwände, Wanduhr, Chefbüro, Kollegen), Tageslicht-Presets, Monitor-Inhalte
- `sets.js` – Schlafzimmer, Küche (TV-Nachrichten), Bus (vorbeiziehende Stadt), Gaming-Wohnzimmer (Neon, TV-Countdown, Titelbild)
- `world.js` – alle Orte in einer Szene, Ortswechsel, Sonnenstand je Fensterseite
- `pov.js` – Kopf-Kamera, eigener Körper (liegen/sitzen/stehen), Hände, Handy (Wecker & Chat), Controller
- `timeline.js` – Keyframes, Untertitel-Häppchen, Benachrichtigungen, Sound-Events
- `episode.js` – das Drehbuch
- `index.html` – Comic-Shader (Konturen aus Tiefe/Normalen, Fischauge) und Overlays
