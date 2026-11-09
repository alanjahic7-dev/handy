# POV: Dein Tag im Studio – 7 Tage vor Release (Teil 1)

Folge für die Serie **„POV: Du arbeitest an GTA 6 in der Release-Woche“**.
Satire: Studio („North Star Games“), Figuren und Dialoge sind erfunden. Es gibt keine
Logos, echten Personen oder Spielinhalte von Rockstar.

65 Sekunden, 9:16, sechs Szenen mit Zeitsprüngen (Abblende auf Schwarz):

| Zeit | Szene |
|---|---|
| 08:47 | Ankunft: durch den Gang, Tobi kommt mit Kaffee entgegen. Titel „7 Tage vor Release“ |
| 09:20 | Am Platz: Bug-Ticket „Flamingo läuft durch Wände“, Producerin Mia kommt vorbei |
| 13:05 | Mittagspause: Familien-Chat auf dem Handy („Kannst du uns das Spiel früher schicken?“) |
| 17:40 | Eilmeldung „Build 7.0.412 – Absturz im Hauptmenü“, der Chef kommt: „Wer hat zuletzt eingecheckt?“ |
| 23:58 | Nachts: neuer Build läuft auf 100 %, „Alle Tests grün.“ |
| 00:00 | Die Wand springt auf „Noch 6 Tage“, Abspann mit Teil-2-Frage für die Kommentare |

## Technik

- **Figuren**: Microsoft Rocketbox (MIT), echte Menschmodelle mit Skelett und Bewegungen
  (Gehen, Reden, Am-Tisch-Arbeiten, Gähnen …). `../shared/rocketbox.js`
- **Player**: `../shared/pov-player.js` – Shots mit Zeitsprüngen, Kopfzeile, Eilmeldungs-Boxen,
  Titel, Untertitel pro Sprecher, Abspann. Neue Folgen brauchen nur `script.js` + `scene.js`.
- **Look**: Tusche-Linien, Fischauge, echte Ego-Hände (Becher, Tastatur, Handy) aus `../shared/toon.js`

## Rendern

```bash
npm install
npm run fetch:rocketbox      # einmalig: Figuren + Bewegungen laden (~130 MB, nicht im Repo)
npm run render:7tage         # -> scenes/pov-studio-7-tage/out/pov_studio_7_tage.mp4
npm run stills:7tage         # nur Standbilder nach previews/
```

Ansehen im Browser: `npm run serve` → http://localhost:8080/scenes/pov-studio-7-tage/
