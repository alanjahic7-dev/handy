// Drehbuch: „POV: Dein Tag im Studio – 7 Tage vor dem GTA-6-Release“ (Teil 1)
// Satire: Studio, Figuren und Dialoge sind erfunden. Keine echten Personen, Logos oder Spielinhalte.
// Datum: Release am Do., 19. Nov. 2026 -> 7 Tage vorher = Do., 12. Nov. 2026.

export const DURATION = 65;

export const SPEAKERS = { du: '#ffffff', tobi: '#8fd8ff', mia: '#ffd84a', chef: '#ff8a7a' };

// ---- Orte (Grundriss: Gang bei x = 0, Fensterwand rechts bei x = 6.5, Lift hinten bei z = 9.5)
const SEAT = (x, z) => [x, 0, z + 0.62];    // Sitzplatz vor einem Schreibtisch, Blick nach -z
export const DESKS = {
  du: [2.6, -1.5], tobi: [4.6, -1.5], m04: [-2.6, 1.5], f08: [-4.6, -1.5], m16: [4.6, -4.5], mia: [-4.6, 4.5],
};
const EYE_SIT = [2.6, 1.2, -0.82];
const MON = [2.6, 1.12, -1.8];

export const SHOTS = [
  // 1) Ankunft, 08:47 – durch den Gang, Tobi kommt entgegen
  { t0: 0, t1: 11, hands: 'cup', walk: [[0, 4.8]], cam: [
    { t: 0, pos: [0, 1.65, 8.4], look: [0, 1.5, -8] },
    { t: 2.6, pos: [0.05, 1.65, 5.4], look: [0.2, 1.55, -8] },
    { t: 4.8, pos: [0.0, 1.65, 3.4], look: { actor: 'tobi' }, hold: true },
    { t: 9.6, pos: [0.0, 1.65, 3.3], look: { actor: 'tobi' } },
    { t: 11, pos: [0.1, 1.65, 3.2], look: [0, 2.1, -7.9] },
  ] },
  // 2) Am Platz, 09:20 – Bug-Ticket, Mia kommt
  { t0: 11, t1: 24, hands: 'desk', typing: [[11.3, 13.8], [21.6, 24]], cam: [
    { t: 11, pos: EYE_SIT, look: MON },
    { t: 13.6, pos: EYE_SIT, look: [2.5, 1.1, -1.8] },
    { t: 14.6, pos: [2.58, 1.2, -0.8], look: { actor: 'mia' }, hold: true },
    { t: 20.8, pos: [2.58, 1.2, -0.8], look: { actor: 'mia' } },
    { t: 21.8, pos: EYE_SIT, look: MON, hold: true },
    { t: 24, pos: EYE_SIT, look: [2.6, 1.1, -1.8] },
  ] },
  // 3) Mittagspause, 13:05 – Familien-Chat
  { t0: 24, t1: 33, hands: 'phone', cam: [
    { t: 24, pos: EYE_SIT, look: [2.55, 0.7, -1.2] },
    { t: 33, pos: EYE_SIT, look: [2.53, 0.71, -1.2] },
  ] },
  // 4) Build kaputt, 17:40 – der Chef kommt
  { t0: 33, t1: 46, hands: 'desk', cam: [
    { t: 33, pos: EYE_SIT, look: MON },
    { t: 35.0, pos: EYE_SIT, look: MON, hold: true },
    { t: 36.2, pos: [2.55, 1.2, -0.78], look: { actor: 'chef' } },
    { t: 39.8, pos: [2.55, 1.2, -0.78], look: { actor: 'chef' }, hold: true },
    { t: 40.6, pos: [2.55, 1.2, -0.78], look: [-2.6, 1.2, 2.0] },
    { t: 41.6, pos: [2.55, 1.2, -0.78], look: { actor: 'chef' }, hold: true },
    { t: 43.6, pos: [2.55, 1.2, -0.78], look: { actor: 'chef' } },
    { t: 44.2, pos: [2.6, 1.2, -0.8], look: { actor: 'tobi' } },
    { t: 46, pos: [2.6, 1.2, -0.8], look: { actor: 'tobi' } },
  ] },
  // 5) Nachts, 23:58 – der neue Build
  { t0: 46, t1: 57, hands: 'desk', typing: [[46.2, 47.5]], cam: [
    { t: 46, pos: EYE_SIT, look: MON },
    { t: 51.6, pos: EYE_SIT, look: [2.6, 1.1, -1.8], hold: true },
    { t: 52.5, pos: [2.62, 1.2, -0.8], look: { actor: 'tobi' } },
    { t: 57, pos: [2.62, 1.2, -0.8], look: { actor: 'tobi' } },
  ] },
  // 6) Mitternacht – die Wand springt auf „NOCH 6 TAGE“
  { t0: 57, t1: 65, hands: 'none', walk: [[57, 58.6]], cam: [
    { t: 57, pos: [1.0, 1.65, -2.2], look: [0, 1.95, -7.9] },
    { t: 58.6, pos: [0.4, 1.65, -3.6], look: [0, 1.95, -7.9], hold: true },
    { t: 65, pos: [0.35, 1.65, -3.8], look: [0, 1.95, -7.9] },
  ] },
];

export const HEADER = [
  { t0: 0, t1: 11, line1: 'Donnerstag, 12. November · 08:47', line2: 'Studio · 3. Stock · QA' },
  { t0: 11, t1: 24, line1: 'Donnerstag · 09:20', line2: 'Platz 3B' },
  { t0: 24, t1: 33, line1: 'Donnerstag · 13:05', line2: 'Mittagspause' },
  { t0: 33, t1: 46, line1: 'Donnerstag · 17:40', line2: 'Platz 3B' },
  { t0: 46, t1: 59, line1: 'Donnerstag · 23:58', line2: 'Platz 3B' },
  { t0: 59, t1: 65, line1: 'Freitag, 13. November · 00:00', line2: 'Studio · 3. Stock' },
];

export const TITLES = [
  { t0: 0.5, t1: 3.4, text: '7 Tage vor Release' },
  { t0: 59.3, t1: 61.7, text: 'Noch 6 Tage.' },
];

export const BOXES = [
  { t0: 33.4, t1: 37.6, kicker: '⚠ Build 7.0.412 · 17:39', text: 'Absturz im Hauptmenü.', variant: 'red' },
  { t0: 51.7, t1: 54.2, kicker: 'Build 7.0.413 · 23:59', text: 'Alle Tests grün.', variant: 'dark' },
];

export const LINES = [
  { t0: 5.2, t1: 6.9, who: 'tobi', text: 'Morgen. Hast du geschlafen?' },
  { t0: 7.1, t1: 8.3, who: 'du', text: 'Zwei Stunden.' },
  { t0: 8.5, t1: 9.7, who: 'tobi', text: 'Luxus.' },
  { t0: 14.6, t1: 16.3, who: 'mia', text: 'Bug 4471. Der Flamingo.' },
  { t0: 16.5, t1: 18.4, who: 'du', text: 'Läuft der immer noch durch Wände?' },
  { t0: 18.6, t1: 20.7, who: 'mia', text: 'Er war im Trailer. Heute noch.' },
  { t0: 31.2, t1: 32.8, who: 'du', text: 'Mittagspause. Theoretisch.' },
  { t0: 37.8, t1: 39.8, who: 'chef', text: 'Wer hat zuletzt eingecheckt?' },
  { t0: 41.8, t1: 43.5, who: 'du', text: '… der Flamingo-Fix.' },
  { t0: 44.0, t1: 45.6, who: 'tobi', text: 'Oh nein.' },
  { t0: 52.6, t1: 53.6, who: 'tobi', text: '… Grün?' },
  { t0: 53.8, t1: 54.8, who: 'du', text: 'Grün.' },
  { t0: 55.0, t1: 56.8, who: 'tobi', text: 'Dann schlafen wir heute zwei Stunden.' },
];

export const ENDCARD = {
  t0: 62.0,
  big: 'Teil 2: 6 Tage vor Release?\nSchreibt’s in die Kommentare.',
  small: 'Satire. Studio, Figuren und Dialoge erfunden.',
};

// ---- Handy-Chat (Szene 3): Nachrichten erscheinen nacheinander
export const CHAT = {
  title: 'Familie 🏠',
  messages: [
    { t: 24.5, from: 'Mama', text: 'Kannst du uns das Spiel schon früher schicken? ❤️' },
    { t: 25.9, from: 'Deniz', text: 'bro nur 1 kopie 🙏🙏' },
    { t: 27.2, from: 'Onkel Ali', text: 'Was machst du da eigentlich genau?' },
    { t: 28.4, me: true, typeTo: 30.4, text: 'Ich darf nicht mal sagen, wo ich arbeite.' },
  ],
};

// ---- Figuren (Microsoft Rocketbox). clips: Bewegungen über die Zeit, path: Laufwege, face: Blickrichtung,
//      show: Zeitfenster, in denen die Figur im Bild ist.
const PI = Math.PI;
export const ACTORS = {
  tobi: {
    avatar: 'Male_Adult_18',
    clips: [
      { t: 0, clip: 'm_walk_neutral_01', speed: 1.1 },
      { t: 4.7, clip: 'm_idle_neutral_01' },
      { t: 5.1, clip: 'm_gestic_talk_neutral_01' },
      { t: 9.8, clip: 'm_idle_neutral_01' },
      { t: 11, clip: 'm_sit_table_idle_scratch_head' },
      { t: 24, clip: 'm_work_table' },
      { t: 39.6, clip: 'm_sit_table_idle_look_around', offset: 1.5 },
      { t: 43.8, clip: 'm_sit_table_idle_neutral_01' },
      { t: 46, clip: 'm_sit_table_idle_roll_head' },
      { t: 51.8, clip: 'm_sit_table_idle_yawn' },
      { t: 54.6, clip: 'm_sit_table_idle_neutral_01' },
    ],
    path: [
      { t: 0, pos: [0.5, 0, -1.8] }, { t: 4.7, pos: [0.42, 0, 2.15] }, { t: 10.95, pos: [0.42, 0, 2.15] },
      { t: 11, pos: SEAT(...DESKS.tobi) },
    ],
    face: [{ t: 4.7, look: 'camera', turn: 0.4 }, { t: 11, yaw: PI, turn: 0 }],
  },
  mia: {
    avatar: 'Female_Adult_15',
    clips: [
      { t: 0, clip: 'f_work_table' },
      { t: 11, clip: 'f_walk_neutral_01' },
      { t: 14.1, clip: 'f_gestic_talk_self-assured_01' },
      { t: 20.9, clip: 'f_walk_neutral_01' },
      { t: 25, clip: 'f_work_table' },
      { t: 39.8, clip: 'f_sit_table_idle_neutral_01' },
    ],
    path: [
      { t: 0, pos: SEAT(...DESKS.mia) }, { t: 10.99, pos: SEAT(...DESKS.mia) },
      { t: 11, pos: [0.3, 0, 2.6] }, { t: 14.0, pos: [1.65, 0, -0.55] }, { t: 20.9, pos: [1.65, 0, -0.55] },
      { t: 24.9, pos: [0.25, 0, 4.6] }, { t: 25, pos: SEAT(...DESKS.mia) },
    ],
    face: [{ t: 0, yaw: PI, turn: 0 }, { t: 14.0, look: 'camera', turn: 0.4 }, { t: 20.9, look: [0.25, 4.6], turn: 0.4 }, { t: 25, yaw: PI, turn: 0 }],
    show: [[0, 46]],
  },
  chef: {
    avatar: 'Male_Adult_08',
    clips: [
      { t: 0, clip: 'm_walk_fast_01' },
      { t: 37.4, clip: 'm_gestic_talk_excited_01' },
      { t: 40.2, clip: 'm_gestic_listen_angry_01' },
    ],
    path: [{ t: 33, pos: [0.1, 0, 7.5] }, { t: 37.4, pos: [1.2, 0, 0.35] }],
    face: [{ t: 37.4, look: 'camera', turn: 0.35 }],
    show: [[33, 46]],
  },
  m04: {
    avatar: 'Male_Adult_04',
    clips: [{ t: 0, clip: 'm_work_table' }, { t: 39.7, clip: 'm_sit_table_idle_look_around', offset: 1.2 }, { t: 44, clip: 'm_work_table' }],
    pos: SEAT(...DESKS.m04), yaw: PI, show: [[0, 46]],
  },
  f08: {
    avatar: 'Female_Adult_08',
    clips: [{ t: 0, clip: 'f_work_table', offset: 2 }, { t: 39.9, clip: 'f_sit_table_idle_neutral_01' }, { t: 44, clip: 'f_work_table' }],
    pos: SEAT(...DESKS.f08), yaw: PI, show: [[0, 46]],
  },
  m16: {
    avatar: 'Male_Adult_16',
    clips: [{ t: 0, clip: 'm_sit_table_idle_neutral_01' }, { t: 24, clip: 'm_work_table', offset: 3 }],
    pos: SEAT(...DESKS.m16), yaw: PI, show: [[0, 46]],
  },
};

// Geräusche (vom Render-Skript per ffmpeg erzeugt)
export const SFX = [
  { t: 11.3, type: 'typing', until: 13.8 },
  { t: 21.6, type: 'typing', until: 24 },
  { t: 24.3, type: 'buzz' },
  { t: 24.5, type: 'ping' }, { t: 25.9, type: 'ping' }, { t: 27.2, type: 'ping' },
  { t: 28.4, type: 'tap', until: 30.4 },
  { t: 30.6, type: 'whoosh' },
  { t: 33.4, type: 'alarm', until: 36.0 },
  { t: 40.4, type: 'whoosh' },
  { t: 46.2, type: 'typing', until: 47.5 },
  { t: 51.7, type: 'chime' },
  { t: 59.0, type: 'launch' },
];
