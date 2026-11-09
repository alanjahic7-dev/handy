// Drehbuch: „POV: Du arbeitest an GTA 6 in der Release-Woche“ – Teil: Serverraum, Launch-Nacht.
// Alle Zeiten in Sekunden. Satire – Studio, Figuren und Dialoge sind erfunden.

export const DURATION = 24;
export const LAUNCH = 12.5;          // Start-Moment (Monitor-Countdown läuft auf diesen Zeitpunkt)
export const ALERT = [13.6, 17.2];   // Server-Rack wird rot
export const CHEER = 17.4;           // „Es hält!“

// Untertitelfarben pro Sprecher (wie in den Vorbildern: eine Farbe pro Figur)
export const SPEAKERS = {
  du: '#ffffff',
  tobi: '#8fd8ff',
  mia: '#ffd84a',
  alle: '#ffffff',
};

export const LINES = [
  { t0: 2.9, t1: 4.5, who: 'tobi', text: 'Da bist du ja!' },
  { t0: 4.7, t1: 6.9, who: 'tobi', text: 'Zehn Sekunden. Wenn das hält …' },
  { t0: 7.0, t1: 8.8, who: 'tobi', text: '… geb ich einen aus.' },
  { t0: 9.5, t1: 10.4, who: 'alle', text: 'Drei …' },
  { t0: 10.5, t1: 11.4, who: 'alle', text: 'Zwei …' },
  { t0: 11.5, t1: 12.4, who: 'alle', text: 'Eins …' },
  { t0: 14.0, t1: 15.5, who: 'du', text: 'Tobi … der ist rot.' },
  { t0: 15.6, t1: 17.1, who: 'tobi', text: 'Komm schon, komm schon …' },
  { t0: 17.6, t1: 19.5, who: 'tobi', text: 'Es hält. ES HÄLT!' },
  { t0: 19.8, t1: 21.6, who: 'mia', text: 'Ich will einen Doppelten.' },
];

// Einblendungen oben links (dark = Ort/Zeit, red = Alarm)
export const BOXES = [
  { t0: 0.4, t1: LAUNCH, kicker: 'Studio · Serverraum B', text: 'Mittwoch, 18. Nov., 23:59 Uhr', variant: 'dark' },
  { t0: LAUNCH, t1: ALERT[0], kicker: 'Release', text: 'Donnerstag, 19. Nov., 00:00 Uhr', variant: 'dark' },
  { t0: ALERT[0], t1: ALERT[1], kicker: '⚠ Server 3 · Last 99 %', text: 'Millionen gleichzeitig online', variant: 'red' },
  { t0: ALERT[1], t1: 21.7, kicker: 'Release', text: 'Donnerstag, 19. Nov., 00:00 Uhr', variant: 'dark' },
];

// Abspann
export const ENDCARD = {
  t0: 21.9,
  lines: ['Fortsetzung folgt …'],
  small: 'Satire. Studio, Figuren und Dialoge erfunden.',
};

// Kamera (Augenhöhe 1.65). look = Blickziel. Die Kamera gleitet auf einer Kurve durch die Keys;
// hold: true = dort abbremsen (z. B. Ende einer Gehstrecke).
const TOBI_HEAD = [0.75, 1.68, -10.4];
const MONITOR = [0, 1.95, -12.4];
const RACK = [1.5, 1.35, -6.7];
const MIA = [-0.95, 1.2, -10.9];
export const CAM = [
  { t: 0.0, pos: [0, 1.65, 1.2], look: [0, 1.55, -12] },
  { t: 2.4, pos: [0, 1.65, -3.6], look: [0.3, 1.6, -12] },
  { t: 4.6, pos: [0.05, 1.65, -7.7], look: TOBI_HEAD, hold: true },
  { t: 8.8, pos: [0.0, 1.65, -8.0], look: TOBI_HEAD },
  { t: 9.6, pos: [-0.15, 1.65, -8.4], look: MONITOR },
  { t: 13.4, pos: [-0.2, 1.65, -8.5], look: [0.0, 1.9, -12.4] },
  { t: 13.9, pos: [-0.2, 1.65, -8.4], look: RACK },
  { t: 15.5, pos: [-0.15, 1.65, -8.2], look: [1.5, 1.3, -6.9] },
  { t: 16.0, pos: [-0.15, 1.65, -8.3], look: TOBI_HEAD },
  { t: 19.4, pos: [-0.1, 1.65, -8.6], look: TOBI_HEAD },
  { t: 20.0, pos: [-0.2, 1.65, -8.7], look: MIA },
  { t: 24.0, pos: [-0.2, 1.62, -8.9], look: [-0.5, 1.6, -11] },
];
// Gehbewegung (Head-Bob) in diesen Zeitfenstern
export const WALK = [[0.0, 4.6]];

// Geräusche (werden vom Render-Skript per ffmpeg synthetisiert)
export const SFX = [
  { t: 9.5, type: 'beep' },
  { t: 10.5, type: 'beep' },
  { t: 11.5, type: 'beep' },
  { t: LAUNCH, type: 'launch' },
  { t: 13.75, type: 'whoosh' },
  { t: ALERT[0], type: 'alarm', until: ALERT[1] },
  { t: CHEER, type: 'chime' },
];
