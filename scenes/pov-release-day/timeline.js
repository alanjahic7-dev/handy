// Zeitleisten-Logik für POV-Episoden – ohne Three.js, läuft im Browser und in Node.
//
// Eine Episode (siehe episode.js) beschreibt alles über Keyframes [zeit, ...werte]:
//   numerische Spuren werden weich interpoliert, Text-Spuren springen.
//   Zwei Keys mit derselben Zeit = harter Schnitt.

// Blickrichtungen vom Sitzplatz aus: [yaw, pitch] in Radiant.
// yaw 0 = nach vorn (-z, Monitor), + = nach links (Fenster), - = nach rechts (Lena)
export const LOOK = {
  monitor: [0, -0.12],
  phone: [0, -0.74],
  lap: [0, -1.07],
  clock: [0, 0.17],
  lena: [-1.5, -0.04],
  window: [1.25, 0.08],
  bossLeft: [1.42, 0.26],
};

const smooth = (x) => x * x * (3 - 2 * x);

function segment(keys, t) {
  if (!keys?.length) return null;
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
  return [keys[i], keys[i + 1]];
}

// Numerische Spur: [[t, a, b, ...], ...] -> [a, b, ...] (smoothstep zwischen Keys)
export function sample(keys, t, ease = smooth) {
  const [a, b] = segment(keys, t);
  if (!b || t <= a[0]) return a.slice(1);
  const u = ease(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))));
  return a.slice(1).map((v, k) => v + (b[k + 1] - v) * u);
}

// Text-Spur: [[t, wert], ...] -> wert des letzten Keys <= t
export function step(keys, t) {
  if (!keys?.length) return undefined;
  let v = keys[0][1];
  for (const k of keys) if (k[0] <= t) v = k[1];
  return v;
}

// Blick-Spur mit Namen aus LOOK oder Zahlen: [t, 'monitor'] / [t, yaw, pitch]
export function resolveLook(keys) {
  return keys.map(([t, a, b]) => (typeof a === 'string' ? [t, ...LOOK[a]] : [t, a, b]));
}

// Untertitel in kurze Häppchen (max. 3 Wörter) wie im Referenzvideo
export function chunkLine(line) {
  const words = line.text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const len = cur.join(' ').length;
    if (cur.length >= 3 || len > 16 || (/[.!?…,]$/.test(w) && !/^\d+\.$/.test(w))) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  let t = line.t;
  return chunks.map((c) => {
    const d = Math.max(0.42, c.length * 0.26 + 0.12) * (line.slow ?? 1);
    const out = { t0: t, t1: t + d, text: c.join(' ') };
    t += d;
    return out;
  });
}

export function lineEnd(line) {
  const ch = chunkLine(line);
  return ch[ch.length - 1].t1 + 0.15;
}

// Aktiver Untertitel zum Zeitpunkt t
export function activeLine(ep, t) {
  for (const l of ep.lines) {
    if (t < l.t) continue;
    for (const c of chunkLine(l)) if (t >= c.t0 && t < c.t1 + (c === chunkLine(l).at(-1) ? 0.25 : 0)) return { line: l, chunk: c };
  }
  return null;
}

// Wer spricht gerade laut (für Lip-Sync)
export function speaking(ep, t) {
  const a = activeLine(ep, t);
  if (!a || a.line.think) return null;
  return t < a.chunk.t1 ? a.line.who : null;
}

// Uhr-Spur: [t, 'HH:MM' oder 'HH:MM:SS', tick?] – mit tick läuft die Uhr ab t in Echtzeit weiter
export function clockSecs(ep, t) {
  let key = ep.clock[0];
  for (const k of ep.clock) if (k[0] <= t) key = k;
  const [hh, mm, ss = 0] = key[1].split(':').map(Number);
  return hh * 3600 + mm * 60 + ss + (key[2] ? t - key[0] : 0);
}

export function clockAt(ep, t) {
  const s = Math.floor(clockSecs(ep, t)) % 86400;
  const pad = (v) => String(v).padStart(2, '0');
  return `${pad((s / 3600) | 0)}:${pad(((s / 60) | 0) % 60)}`;
}

// Restzeit bis Mitternacht als HH:MM:SS (für Countdown-Anzeigen)
export function countdownAt(ep, t, extraSecs = 0) {
  const left = Math.max(0, Math.ceil(86400 - clockSecs(ep, t) - extraSecs));
  const pad = (v) => String(v).padStart(2, '0');
  return `${pad((left / 3600) | 0)}:${pad(((left / 60) | 0) % 60)}:${pad(left % 60)}`;
}

export function activeCard(ep, t) {
  return (ep.cards ?? []).find((c) => t >= c.t && t < c.t + c.dur) || null;
}

export function phoneRaise(ep, t) {
  return sample(ep.phone, t)[0];
}

// Benachrichtigungs-Karten: eigene notes + Chat-Nachrichten mit notify
// (nur wenn das Handy gerade nicht in der Hand vor dem Gesicht ist)
export function notifications(ep) {
  const out = ep.notes.map((n) => ({ ...n }));
  for (const m of ep.chat) {
    if (!m.notify || m.me) continue;
    out.push({ t: m.t, from: ep.chatTitle, text: `${m.from}: ${m.text}`, dur: m.dur });
  }
  return out.sort((a, b) => a.t - b.t);
}

export function activeNote(ep, t) {
  let cur = null;
  for (const n of notifications(ep)) if (t >= n.t && t < n.t + (n.dur ?? 2.6)) cur = n;
  return cur;
}

// Sounds für den Video-Export
export function soundEvents(ep) {
  const ev = [];
  for (const n of notifications(ep)) ev.push({ t: n.t, type: 'buzz' });
  for (const m of ep.chat) {
    if (m.notify && !m.me) continue;
    if (m.me) ev.push({ t: m.t, type: 'send' });
    else if (phoneRaise(ep, m.t) > 0.5) ev.push({ t: m.t, type: 'pop' });
  }
  for (const c of ep.cuts) ev.push({ t: c, type: 'cut' });
  for (const s of ep.sfx ?? []) ev.push(s);
  return ev.sort((a, b) => a.t - b.t);
}
