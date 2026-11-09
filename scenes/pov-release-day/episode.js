// Drehbuch: „POV: Heute Nacht um 00:00 kommt GTA 6 raus“
//
// Ein ganzer Tag (Mi, 18.11.) bis zum Release um 00:00 Uhr am 19.11. – Preload lief schon seit 10.11.
// Alle Zeiten in Sekunden. Neue Folgen = Datei kopieren und umschreiben (?ep=episode-2).
//
// Orte (loc): bedroom, kitchen, bus, office, living – Koordinaten in rig sind lokal zum Ort.
// Sprecher: DU (weiß, think = Gedanke), LENA (pink), CHEF (orange), MO (lila)

const PI = Math.PI;

export default {
  id: 'release-day',
  title: 'POV: Heute Nacht um 00:00 kommt GTA 6 raus',
  duration: 88,
  chatTitle: 'Leonida Crew 🌴',
  dateLine: 'Mittwoch, 18. November',

  // Hook: Vorgriff auf 23:59:56 mit Text, dann „18 STUNDEN VORHER“
  hook: { t: 0, dur: 3.5, text: 'POV: Heute Nacht um 00:00\nkommt GTA 6 raus 🌴' },
  cards: [{ t: 3.6, dur: 1.7, text: '18 STUNDEN VORHER' }],
  cuts: [3.6, 16, 27.2, 40, 46, 54, 62, 68],

  loc: [[0, 'living'], [3.6, 'bedroom'], [16, 'kitchen'], [27.2, 'bus'], [40, 'office'], [62, 'living']],
  day: [[0, 'MI'], [79, 'DO']],
  clock: [
    [0, '23:59:56', true], [3.6, '06:00'], [10.4, '06:01'], [16, '07:10'], [27.2, '07:42'],
    [40, '09:03'], [46, '13:40'], [54, '16:59'], [57.6, '17:00'], [62, '23:41'], [68, '23:59:49', true],
  ],
  daylight: [[0, 'night'], [3.6, 'dawn'], [16, 'morning'], [46, 'noon'], [54, 'sunset'], [62, 'night']],

  // Körper: [t, x, Augenhöhe, z, Körperrichtung] (lokal zum Ort) + Haltung
  rig: [
    [0, 0, 1.12, 1.45, 0], [3.59, 0, 1.12, 1.45, 0],
    [3.6, -1.28, 0.74, -1.72, PI], [11.2, -1.28, 0.74, -1.72, PI], [12.2, -0.72, 1.12, -0.9, 4.71], [15.99, -0.72, 1.12, -0.9, 4.71],
    [16, 0, 1.17, 0.48, 0], [27.19, 0, 1.17, 0.48, 0],
    [27.2, -0.85, 1.17, 0.36, 0], [39.99, -0.85, 1.17, 0.36, 0],
    [40, 0, 1.17, 0.14, 0], [59.0, 0, 1.17, 0.14, 0], [59.8, -0.15, 1.52, 0.55, 0], [61.99, -0.95, 1.52, 1.75, 0],
    [62, 0, 1.12, 1.45, 0], [88, 0, 1.12, 1.45, 0],
  ],
  pose: [[0, 'sit'], [3.6, 'lie'], [11.8, 'sit'], [59.4, 'stand'], [62, 'sit']],

  // Kopf: [t, Blickziel] (nur Büro: monitor, clock, lena, window, bossLeft) oder [t, yaw, pitch]
  look: [
    [0, 0, 0.03], [3.59, 0, 0.03],
    [3.6, PI, 1.3], [9.0, PI, 1.3], [9.8, PI, 0.32], [11.2, PI, 0.32], [12.2, 4.38, 0.05], [13.4, 4.38, 0.05], [14.0, 4.02, 0.12], [15.99, 4.02, 0.12],
    [16, 0, -0.85], [17.4, 0, -0.85], [18.2, 0.42, 0.03], [20.4, 0.42, 0.03], [21.0, 0, 0.0], [27.19, 0, 0.0],
    [27.2, 1.25, -0.02], [30.8, 1.2, -0.02], [31.4, 0.85, 0.05], [34.2, 1.7, 0.05], [35.0, 0.3, -0.3], [39.99, 0.3, -0.3],
    [40, 'monitor'], [42.4, 'monitor'], [42.9, 'lena'], [43.9, 'lena'], [44.3, 'monitor'], [45.99, 'monitor'],
    [46, 'clock'], [48.2, 'clock'], [48.8, 'bossLeft'], [53.99, 'bossLeft'],
    [54, 'window'], [55.0, 'window'], [55.6, 'clock'], [57.8, 'clock'], [58.2, 'lena'], [59.2, 'lena'], [60.0, -2.7, 0.0], [61.99, -3.0, 0.02],
    [62, 0, 0.03], [62.8, 0, 0.03], [63.2, -1.55, -0.05], [65.2, -1.55, -0.05], [65.7, 0, 0.03], [67.99, 0, 0.03],
    [68, 0, 0.03], [88, 0, 0.03],
  ],
  // Brennweite: 100 = Weitwinkel, kleiner = Zoom
  fov: [
    [0, 80], [3.59, 58],
    [3.6, 100], [5.0, 100], [5.4, 62], [8.6, 62], [9.2, 100], [13.4, 100], [14.0, 30], [15.99, 30],
    [16, 72], [17.4, 72], [18.2, 34], [20.4, 34], [21.0, 95], [27.19, 95],
    [27.2, 100], [34.6, 100], [35.2, 60], [39.99, 60],
    [40, 62], [42.4, 62], [42.9, 100], [43.9, 100], [44.3, 62], [45.99, 62],
    [46, 36], [48.2, 36], [48.8, 100], [53.99, 100],
    [54, 100], [55.0, 100], [55.6, 36], [57.8, 36], [58.2, 100], [61.99, 100],
    [62, 100], [67.99, 100],
    [68, 100], [79, 50], [82.1, 50], [83.5, 25], [88, 25],
  ],
  // in der Hand: phone / controller; raise 0 = unten, 1 = vor dem Gesicht / angehoben
  hold: [[0, 'controller'], [3.6, 'phone'], [62, 'controller']],
  phone: [[0, 1], [3.59, 1], [3.6, 0], [4.7, 0], [5.4, 1], [8.6, 1], [9.2, 0], [34.6, 0], [35.2, 1], [39.99, 1], [40, 0], [67.99, 0], [68, 1], [88, 1]],
  screen: [[0, 'chat'], [3.6, 'alarm'], [16, 'chat']],
  press: [[0, 0], [82.0, 0], [82.12, 1], [82.3, 0]],

  // Bildschirme
  monitor: [[0, 'gta'], [44.1, 'excel'], [59.6, 'lock']],
  tv: [[0, 'countdown'], [79, 'flash'], [79.25, 'title'], [82.3, 'loading']],

  // Büro-Figuren
  lena: [[0, 0], [42.5, 0], [42.8, 1], [44.0, 1], [44.3, 0], [57.9, 0], [58.1, 1], [88, 1]],
  boss: [
    [0, 6.3, 1.6, PI], [45.99, 6.3, 1.6, PI], [46, -1.2, -0.05, 0], [52.9, -1.2, -0.05, 0], [53.99, -1.4, 1.6, -PI / 2],
    [54, 6.3, 1.6, PI], [88, 6.3, 1.6, PI],
  ],

  chat: [
    { t: 29.0, from: 'Kevin', text: 'HEUTE NACHT 00:00 🔥🔥🔥', notify: true },
    { t: 35.6, from: 'Kevin', text: 'preload bei allen fertig?' },
    { t: 36.9, me: true, text: 'seit dem 10. november 😎' },
    { t: 38.2, from: 'Mo', text: 'ich hol heute abend pizza 🍕' },
    { t: 64.4, from: 'Kevin', text: 'alle im call? 🎧', notify: true },
    { t: 79.5, from: 'Kevin', text: 'ES IST LIVE 🔥🔥🔥', notify: true },
  ],
  chatColors: { Kevin: '#2e9f5b', Mo: '#7b5cff' },
  notes: [],

  lines: [
    { t: 5.8, who: 'DU', think: true, text: 'Mittwoch, 18. November.' },
    { t: 7.4, who: 'DU', think: true, text: 'Heute Nacht ist es so weit.' },
    { t: 9.9, who: 'DU', think: true, text: 'Noch 18 Stunden.' },
    { t: 14.1, who: 'DU', think: true, text: 'Preload seit dem 10. drauf.' },
    { t: 18.4, who: 'DU', think: true, text: 'Sogar im Fernsehen.' },
    { t: 21.1, who: 'MO', text: 'Bist du heute überhaupt ansprechbar?' },
    { t: 23.2, who: 'DU', text: 'Nein.' },
    { t: 24.0, who: 'MO', text: 'Heute Nacht: Pizza, Energy, kein Schlaf?' },
    { t: 26.2, who: 'DU', text: 'Deal.' },
    { t: 28.0, who: 'DU', think: true, text: 'Noch 16 Stunden.' },
    { t: 30.0, who: 'DU', think: true, text: 'Was mach ich zuerst?' },
    { t: 31.8, who: 'DU', think: true, text: 'Erstmal nur rumfahren… die Stadt ansehen.' },
    { t: 33.9, who: 'DU', think: true, text: '…oder direkt Chaos.' },
    { t: 41.0, who: 'DU', think: true, text: 'Noch 14 Stunden 56 Minuten.' },
    { t: 42.9, who: 'LENA', text: 'Tab zu – der Chef!' },
    { t: 46.5, who: 'DU', think: true, text: 'Wie kann es erst 13:40 sein?' },
    { t: 49.0, who: 'CHEF', text: 'Kannst du heute länger bleiben?' },
    { t: 50.9, who: 'DU', text: 'Heute nicht. Wirklich nicht.' },
    { t: 52.6, who: 'CHEF', text: '…Na gut.' },
    { t: 55.8, who: 'DU', think: true, text: 'Drei… zwei… eins…', slow: 1.3 },
    { t: 58.2, who: 'LENA', text: 'Viel Spaß heute Nacht! 🌴' },
    { t: 63.3, who: 'MO', text: 'Noch 19 Minuten. Ich halt das nicht aus.' },
    { t: 65.8, who: 'DU', think: true, text: 'Jahrelang gewartet. Die 19 Minuten schaff ich.' },
    { t: 71.0, who: 'DU', think: true, text: 'Gleich ist es so weit.' },
    { t: 76.0, who: 'MO', text: 'DREI!' },
    { t: 77.0, who: 'MO', text: 'ZWEI!' },
    { t: 78.0, who: 'MO', text: 'EINS!' },
    { t: 79.3, who: 'MO', text: 'JAAAA!' },
    { t: 80.6, who: 'DU', text: 'Willkommen in Leonida.' },
  ],

  sfx: [{ t: 3.7, type: 'alarm' }, { t: 57.6, type: 'bell' }, { t: 79, type: 'boom' }, { t: 82.12, type: 'press' }, { t: 83.6, type: 'sting' }],

  end: { t: 83.6, text: 'WIR SEHEN UNS IN LEONIDA 🌴', sub: 'Folgen für Teil 2: Die erste Nacht' },
};
