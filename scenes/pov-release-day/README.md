# POV-Format: „Release Day“

Serienformat in der Ich-Perspektive, angelehnt an den Aufbau virale POV-Videos:
Fischauge, Comic-Konturen, oben eine feste Zeile mit **Ort · Wochentag Uhrzeit**,
Nachrichten-Karten oben, Handy mit Gruppenchat in den eigenen Händen und
kurze, farbige Untertitel pro Sprecher. Die Figuren sind unsere Vice-Files-Blockfiguren
(Lena = die Blonde).

**Folge 1:** *POV: GTA 6 kommt heute raus – und du musst noch arbeiten* (70 s, 9:16)

| Zeit | Uhr | Was passiert |
|---|---|---|
| 0–14 s | 08:59 | Crew-Chat explodiert („HEUTE. IST. DER. TAG.“), Lena merkt, warum du grinst |
| 14–38 s | 11:47 | Zoom auf die Uhr, Mama schreibt, der Chef will, dass du bis 20 Uhr bleibst → „Zahnarzt“ |
| 38–52 s | 14:12 | Heimlicher Countdown-Tab, Preload-Screenshot im Chat, Lena: „Tab zu – der Chef!“, die Uhr steht still |
| 52–70 s | 16:58 | Sonnenuntergang, Countdown bis 17:00, „LAUF!“ – der Chef: „Ach… eine Sache noch.“ → **Teil 2 folgt** |

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
npm run render:pov                           # -> export/release-day-arbeit.mp4 (1080x1920, 30 fps, mit Sounds)
node tools/render_pov.mjs scenes/pov-release-day --stills 6,25,62   # nur Standbilder -> previews/
node tools/render_pov.mjs scenes/pov-release-day --from 50 --to 70 --out teil.mp4
```

Der Ton enthält Vibration bei Nachrichten, Chat-Pops, Wusch bei Zeitsprüngen, die
17-Uhr-Glocke und einen Abschluss-Sting. **Stimmen** (Lena, Chef, Gedanken) sprecht ihr
selbst ein oder legt TTS darüber – die Untertitel-Zeiten stehen in `episode.js`.

## Neue Folge schreiben

Alles steht in **`episode.js`** – kein Code nötig. Datei kopieren (z. B. `episode-2.js`) und ändern:

| Feld | Inhalt |
|---|---|
| `place`, `day`, `clock` | Kopfzeile: Ort, Wochentag, Uhrzeit ab Sekunde x |
| `cuts` | Zeitsprünge mit kurzer Abblende |
| `daylight` | `morning`, `noon`, `afternoon`, `sunset` (Fenster & Licht) |
| `monitor` | Bildschirm: `mail`, `excel`, `gta` (Countdown bis 18:00), `lock` |
| `look` | Kopf: `[sek, 'monitor'/'phone'/'lap'/'clock'/'lena'/'window'/'bossLeft']` oder `[sek, yaw, pitch]` |
| `fov` | Zoom: 100 = Weitwinkel, ~36 = Zoom auf Uhr, ~52 = Handy |
| `phone` | 0 = Handy im Schoß, 1 = vor dem Gesicht |
| `rig` | Aufstehen & Laufen: `[sek, x, z, stehen 0..1]` |
| `lena`, `boss` | Lena dreht sich zu dir (0..1), Chef läuft `[sek, x, z, richtung]` |
| `chat` | Gruppenchat; `notify: true` = Karte oben, `me: true` = deine Nachricht, `img: 'preload'` |
| `notes` | andere Benachrichtigungen (z. B. Mama) |
| `lines` | Untertitel: `who` = `LENA` / `CHEF` / `DU`, `think: true` = Gedanke (kursiv) |
| `end` | Abspann („TEIL 2 FOLGT“) |

Zwei Keys mit derselben Zeit = harter Schnitt (z. B. der Chef taucht plötzlich auf).

## Dateien

- `scene.js` – Büro (Fensterfront mit Skyline & Palmen, Stellwände, Wanduhr, Chefbüro, Kollegen), Tageslicht-Presets, Monitor-Inhalte
- `pov.js` – Kopf-Kamera, eigener Körper, Hände, Handy mit Chat-Display
- `timeline.js` – Keyframes, Untertitel-Häppchen, Benachrichtigungen, Sound-Events
- `episode.js` – das Drehbuch
- `index.html` – Comic-Shader (Konturen aus Tiefe/Normalen, Fischauge) und Overlays
