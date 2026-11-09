// Drehbuch: „POV: GTA 6 kommt heute raus – und du musst noch arbeiten“
//
// Alle Zeiten in Sekunden. Neue Folgen = diese Datei kopieren und umschreiben
// (?ep=episode-2 lädt episode-2.js).
//
// Sprecher-Farben: LENA (pink), CHEF (orange), DU (weiß, think = Gedanke, kursiv)

const PI = Math.PI;

export default {
  id: 'release-day-arbeit',
  title: 'POV: GTA 6 kommt heute raus – und du musst noch arbeiten',
  place: 'BÜRO · 3. OG',
  day: 'DO',
  duration: 70,
  chatTitle: 'Leonida Crew 🌴',

  // Text oben in der Mitte für die ersten Sekunden (TikTok-Hook). ?hook=0 blendet ihn aus.
  hook: { t: 0, dur: 3.2, text: 'POV: GTA 6 kommt heute raus\nund du musst noch arbeiten 💀' },

  // harte Schnitte (Zeitsprung) – kurze Abblende
  cuts: [14, 38, 52],

  clock: [[0, '08:59'], [6.2, '09:00'], [14, '11:47'], [38, '14:12'], [52, '16:58'], [56.6, '16:59'], [59.6, '17:00']],
  daylight: [[0, 'morning'], [14, 'noon'], [38, 'afternoon'], [52, 'sunset']],
  monitor: [[0, 'mail'], [14, 'excel'], [38, 'gta'], [45.3, 'excel'], [60.2, 'lock']],

  // Kopf: [t, Blickziel] oder [t, yaw, pitch]
  look: [
    [0, 'monitor'], [2.1, 'monitor'], [2.8, 'phone'], [9.3, 'phone'], [10.1, 'lena'], [13.9, 'lena'],
    [14, 'clock'], [17.0, 'clock'], [17.7, 'monitor'], [20.4, 'monitor'], [21.2, -1.95, 0.08], [22.3, -1.95, 0.08],
    [23.0, 'monitor'], [23.4, 'monitor'], [24.0, 'bossLeft'], [29.3, 'bossLeft'], [29.7, 'lap'], [30.5, 'lap'],
    [30.9, 'bossLeft'], [35.7, 'bossLeft'], [36.3, 'lena'], [37.9, 'lena'],
    [38, 'monitor'], [39.7, 'monitor'], [40.4, 'phone'], [43.8, 'phone'], [44.3, 'lena'], [45.0, 'lena'],
    [45.4, 'monitor'], [46.0, 'monitor'], [46.6, 'clock'], [51.9, 'clock'],
    [52, 'window'], [55.2, 'window'], [55.9, 'clock'], [59.9, 'clock'], [60.3, 'lena'], [60.9, 'lena'],
    [61.8, -2.7, 0.0], [63.6, -3.0, 0.02], [64.1, -3.12, 0.1], [70, -3.12, 0.1],
  ],
  // Brennweite: 100 = Weitwinkel, kleiner = Zoom (z. B. auf Uhr oder Handy)
  fov: [
    [0, 100], [2.1, 100], [2.8, 52], [9.3, 52], [10.0, 100], [13.9, 100],
    [14, 36], [17.0, 36], [17.7, 100], [29.3, 100], [29.7, 62], [30.5, 62], [30.9, 100], [39.7, 100], [40.4, 52], [43.8, 52], [44.4, 100],
    [46.0, 100], [46.6, 36], [51.9, 36], [52, 100], [55.2, 100], [55.9, 36], [59.9, 36], [60.4, 100],
    [64.0, 100], [64.6, 78], [70, 78],
  ],
  // Handy: 0 = im Schoß, 1 = vor dem Gesicht
  phone: [[0, 0], [2.0, 0], [2.7, 1], [9.3, 1], [9.9, 0], [39.6, 0], [40.3, 1], [43.8, 1], [44.3, 0]],
  // Körper: [t, x, z, stehen 0..1]
  rig: [[0, 0, 0.18, 0], [60.8, 0, 0.18, 0], [61.6, -0.15, 0.55, 1], [63.4, -0.85, 1.55, 1], [64.0, -0.95, 1.75, 1]],
  // Lena: 0 = schaut auf ihren Monitor, 1 = schaut zu dir
  lena: [[0, 0], [9.2, 0], [9.7, 1], [13.9, 1], [14, 0], [35.6, 0], [36.0, 1], [37.9, 1], [38, 0], [43.9, 0], [44.2, 1], [45.6, 1], [46.0, 0], [59.8, 0], [60.1, 1], [70, 1]],
  // Chef: [t, x, z, Blickrichtung]
  boss: [
    [0, 6.3, 1.6, PI], [19.0, 6.3, 1.6, PI], [21.6, 2.4, 1.5, PI], [23.0, -0.9, 1.25, PI * 0.8], [23.9, -1.2, -0.05, 0],
    [35.8, -1.2, -0.05, 0], [37.9, -1.4, 3.0, -PI / 2],
    [38, 6.3, 1.6, PI], [62.4, 6.3, 1.6, PI], [62.4, 1.4, 2.1, PI], [63.9, -0.95, 2.72, PI / 2], [70, -0.95, 2.72, PI / 2],
  ],

  // Gruppenchat auf dem Handy (notify = Benachrichtigung oben, wenn das Handy unten ist)
  chat: [
    { t: 1.0, from: 'Kevin', text: 'HEUTE. IST. DER. TAG. 🔥🔥🔥', notify: true },
    { t: 3.5, from: 'Mo', text: 'hab kein auge zugemacht lol' },
    { t: 4.9, from: 'Kevin', text: '18 uhr alle online. KEINE ausreden' },
    { t: 6.7, me: true, text: 'bin bis 17 uhr auf arbeit 💀' },
    { t: 8.2, from: 'Kevin', text: 'kündige.' },
    { t: 29.0, from: 'Kevin', text: 'falls dein chef fragt: SAG NEIN', notify: true },
    { t: 39.0, from: 'Mo', text: 'preload fertig ✅', img: 'preload', notify: true },
    { t: 41.4, from: 'Kevin', text: 'meiner hängt bei 99% 😭' },
    { t: 42.8, me: true, text: 'hab heute um 5 uhr morgens geladen 😎' },
    { t: 53.6, from: 'Kevin', text: 'wir sind alle in der lobby. WO BIST DU', notify: true },
  ],
  chatColors: { Kevin: '#2e9f5b', Mo: '#7b5cff' },

  // andere Benachrichtigungen
  notes: [
    { t: 18.3, from: 'Mama ❤️', text: 'Schatz vergiss heute nicht zu essen wenn du zockst 🍝', dur: 2.8 },
  ],

  lines: [
    { t: 10.0, who: 'LENA', text: 'Morgen! Warum grinst du so?' },
    { t: 11.9, who: 'LENA', text: 'Ach stimmt… heute ist ja GTA.' },
    { t: 14.5, who: 'DU', think: true, text: 'Wie kann es erst 11:47 sein?' },
    { t: 20.6, who: 'DU', think: true, text: 'Oh nein. Er kommt hierher.' },
    { t: 24.2, who: 'CHEF', text: 'Kurze Frage…' },
    { t: 25.4, who: 'CHEF', text: 'Kannst du heute bis 20 Uhr bleiben?' },
    { t: 27.5, who: 'CHEF', text: 'Der Quartalsbericht muss raus.' },
    { t: 31.0, who: 'DU', text: 'Heute geht’s leider nicht… Zahnarzt.' },
    { t: 33.2, who: 'CHEF', text: 'Um 18 Uhr?' },
    { t: 34.4, who: 'DU', text: '…Notfall.' },
    { t: 35.2, who: 'CHEF', text: 'Hm. Na gut.' },
    { t: 36.4, who: 'LENA', text: 'Zahnarzt. Klar. 😏' },
    { t: 44.3, who: 'LENA', text: 'Psst! Tab zu – der Chef!' },
    { t: 47.0, who: 'DU', think: true, text: 'Immer noch 14:12?!' },
    { t: 49.0, who: 'DU', think: true, text: 'Die Uhr ist kaputt. Die MUSS kaputt sein.' },
    { t: 52.6, who: 'DU', think: true, text: 'Noch zwei Minuten.' },
    { t: 57.4, who: 'DU', think: true, text: 'Drei… zwei… eins…', slow: 1.4 },
    { t: 60.3, who: 'LENA', text: 'LAUF!' },
    { t: 64.6, who: 'CHEF', text: 'Ach… eine Sache noch.' },
    { t: 66.6, who: 'DU', think: true, text: 'Nein.' },
  ],

  sfx: [{ t: 59.6, type: 'bell' }, { t: 67.6, type: 'sting' }],

  end: { t: 67.6, text: 'TEIL 2 FOLGT', sub: 'Folgen, damit du ihn nicht verpasst' },
};
