// Weitere Drehorte für die POV-Folge: Schlafzimmer, Küche, Bus, Gaming-Wohnzimmer.
// Jeder Ort ist eine Gruppe mit eigenem Ursprung (Welt-Position setzt world.js).
// Lokale Koordinaten: Boden y = 0, Blick „nach vorn“ = -z.

import * as THREE from 'three';
import {
  rng, toon, toonify, box, cyl, canvasTex, roundRect, FONT, towerTex, makePlant, makeMug, makeSticky,
} from './scene.js';
import { makeNPC } from '../cafe-ocean-drive/characters.js';

// ---------------------------------------------------------------- Bauteile
// Wand entlang lokaler x-Achse (Länge len), optional mit Fensteröffnung
function wall(len, h, mat, hole, frameMat = toon('#f4f1ea')) {
  const g = new THREE.Group();
  const t = 0.12;
  if (!hole) {
    g.add(box(len, h, t, mat, 0, h / 2, 0));
    return g;
  }
  const { x0, x1, y0, y1 } = hole;
  const L = -len / 2, R = len / 2;
  if (x0 > L) g.add(box(x0 - L, h, t, mat, (L + x0) / 2, h / 2, 0));
  if (R > x1) g.add(box(R - x1, h, t, mat, (x1 + R) / 2, h / 2, 0));
  g.add(box(x1 - x0, y0, t, mat, (x0 + x1) / 2, y0 / 2, 0));
  g.add(box(x1 - x0, h - y1, t, mat, (x0 + x1) / 2, (y1 + h) / 2, 0));
  // Rahmen + Mittelpfosten
  const f = 0.06;
  g.add(box(x1 - x0 + f, f, t + 0.04, frameMat, (x0 + x1) / 2, y0, 0));
  g.add(box(x1 - x0 + f, f, t + 0.04, frameMat, (x0 + x1) / 2, y1, 0));
  g.add(box(f, y1 - y0, t + 0.04, frameMat, x0, (y0 + y1) / 2, 0));
  g.add(box(f, y1 - y0, t + 0.04, frameMat, x1, (y0 + y1) / 2, 0));
  g.add(box(f * 0.7, y1 - y0, t + 0.02, frameMat, (x0 + x1) / 2, (y0 + y1) / 2, 0));
  g.add(box(x1 - x0 + 0.1, 0.04, 0.22, frameMat, (x0 + x1) / 2, y0 - 0.02, 0.08));
  return g;
}

// Raum: Boden, Decke, vier Wände. win = { side: 'px'|'nx'|'pz'|'nz', from, to, y0, y1 }
function room(g, { w, d, h, wallColor, floor, ceiling = '#f2efe8', win }) {
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floor.isMaterial ? floor : toon(floor));
  fl.rotation.x = -Math.PI / 2;
  fl.receiveShadow = true;
  g.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), toon(ceiling));
  ce.rotation.x = Math.PI / 2;
  ce.position.y = h;
  g.add(ce);
  const wm = toon(wallColor);
  const sides = {
    nz: { len: w, pos: [0, 0, -d / 2], rot: 0 },
    pz: { len: w, pos: [0, 0, d / 2], rot: Math.PI },
    nx: { len: d, pos: [-w / 2, 0, 0], rot: Math.PI / 2 },
    px: { len: d, pos: [w / 2, 0, 0], rot: -Math.PI / 2 },
  };
  for (const [k, s] of Object.entries(sides)) {
    const hole = win && win.side === k ? { x0: win.from, x1: win.to, y0: win.y0, y1: win.y1 } : null;
    const wg = wall(s.len, h, wm, hole);
    wg.position.set(...s.pos);
    wg.rotation.y = s.rot;
    g.add(wg);
  }
  return wm;
}

function skyPlane(skyMat, x, z, rotY, w = 160, h = 90, y = 18) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), skyMat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  return m;
}

const PASTELS = ['#f4c7d9', '#bfe6e0', '#f6e3a8', '#d8c7f0', '#f3f0ea', '#a9d4ef', '#ffd1b3'];
function cityBlock(r, towers, { x0, x1, z0, z1, n = 18, yBase = -5, maxH = 30 }) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const tw = 3 + r() * 5, th = 6 + r() * maxH, td = 3 + r() * 5;
    const col = PASTELS[(r() * PASTELS.length) | 0];
    const m = toon('#ffffff', { map: towerTex(col, false) });
    const b = box(tw, th, td, m, x0 + r() * (x1 - x0), yBase + th / 2, z0 + r() * (z1 - z0));
    b.castShadow = false;
    b.userData.mats = [m.map, towerTex(col, true)];
    towers.push(b);
    g.add(b);
  }
  return g;
}

export function makePalm(h = 7, r = Math.random) {
  const p = new THREE.Group();
  const tr = cyl(0.18, 0.28, h, toon('#8a6a48'), 6);
  tr.position.y = h / 2;
  tr.rotation.z = (r() - 0.5) * 0.15;
  p.add(tr);
  const frond = toon('#2f8a55');
  for (let k = 0; k < 7; k++) {
    const f = box(3, 0.12, 0.7, frond, 0, h, 0);
    f.geometry.translate(1.5, 0, 0);
    f.rotation.set(0, (k / 7) * Math.PI * 2, -0.4);
    p.add(f);
  }
  return p;
}

function poster(w, h, draw, x, y, z, rotY = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: canvasTex(256, Math.round((256 * h) / w), draw) }));
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  return m;
}

// Retro-Sonnenuntergang mit Palmen (eigenes Motiv, kein Spiel-Artwork)
function sunsetPoster(title) {
  return (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a1650'); g.addColorStop(0.5, '#ff5fae'); g.addColorStop(0.75, '#ffb36b'); g.addColorStop(1, '#2a1650');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffe37a';
    c.beginPath(); c.arc(w / 2, h * 0.62, w * 0.28, Math.PI, 0); c.fill();
    c.fillStyle = '#2a1650';
    for (let i = 0; i < 6; i++) c.fillRect(0, h * 0.5 + i * h * 0.025, w, 3 + i);
    c.fillStyle = '#140a2a';
    for (const [x, s] of [[0.18, 1], [0.85, 0.8]]) {
      c.fillRect(w * x - 4, h * (0.35 + (1 - s) * 0.2), 8, h);
      for (let k = 0; k < 6; k++) {
        c.save(); c.translate(w * x, h * (0.35 + (1 - s) * 0.2)); c.rotate((k / 6) * Math.PI * 2);
        c.fillRect(0, -4, w * 0.16 * s, 8); c.restore();
      }
    }
    c.fillStyle = '#fff';
    c.font = `italic 900 ${Math.round(w * 0.15)}px ${FONT}`;
    c.textAlign = 'center';
    c.fillText(title, w / 2, h * 0.2);
  };
}

function calendarNov(c, w, h, { crossTo = 0 } = {}) {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#e94560'; c.fillRect(0, 0, w, 60);
  c.fillStyle = '#fff'; c.font = `900 36px ${FONT}`; c.textAlign = 'center';
  c.fillText('NOVEMBER', w / 2, 44);
  let d = 1;
  for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
    if (row === 0 && col < 6) continue;
    if (d > 30) break;
    const x = 22 + col * 35, y = 100 + row * 48;
    c.fillStyle = '#222'; c.font = `700 22px ${FONT}`;
    c.fillText(String(d), x, y);
    if (d <= crossTo) {
      c.strokeStyle = '#333'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 12, y - 20); c.lineTo(x + 12, y + 4); c.moveTo(x + 12, y - 20); c.lineTo(x - 12, y + 4); c.stroke();
    }
    if (d === 10) { c.fillStyle = '#2e9f5b'; c.font = `900 13px ${FONT}`; c.fillText('PRELOAD', x, y + 16); }
    if (d === 19) {
      c.strokeStyle = '#e94560'; c.lineWidth = 5;
      c.beginPath(); c.ellipse(x, y - 8, 22, 18, 0.2, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#e94560'; c.font = `900 18px ${FONT}`;
      c.fillText('GTA!!!', x, y + 26);
    }
    d++;
  }
}

// ================================================================ Schlafzimmer
export function buildBedroom(skyMat) {
  const g = new THREE.Group();
  g.name = 'Bedroom';
  const towers = [];
  const r = rng(201);
  const W = 4, D = 4.4, H = 2.6;
  room(g, { w: W, d: D, h: H, wallColor: '#cfe3ea', floor: '#b88a5e', win: { side: 'px', from: -0.9, to: 0.9, y0: 0.9, y1: 2.25 } });
  // Teppich
  g.add(box(1.8, 0.01, 1.4, toon('#ff8fc8'), 0.3, 0.005, 0.6));
  // Bett an der linken Wand, Kopfende hinten (-z)
  g.add(box(1.4, 0.32, 2.15, toon('#6b4a35'), -1.28, 0.16, -1.1));
  g.add(box(1.32, 0.18, 2.05, toon('#f6f3ee'), -1.28, 0.41, -1.1));
  g.add(box(1.4, 0.9, 0.08, toon('#6b4a35'), -1.28, 0.45, -2.16));
  g.add(box(0.8, 0.14, 0.42, toon('#ffffff'), -1.28, 0.57, -1.85)); // Kissen
  const blanket = toon('#ffffff', {
    map: canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#4fd6e0'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ff5fae';
      for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 14);
    }),
  });
  g.add(box(1.38, 0.12, 1.3, blanket, -1.28, 0.55, -0.62));
  // Nachttisch + Lampe
  g.add(box(0.45, 0.5, 0.4, toon('#e9dcc4'), -0.3, 0.25, -1.95));
  const lampShade = cyl(0.1, 0.14, 0.18, toon('#ffd98a', { emissive: '#ffb84a', emissiveIntensity: 0.5 }));
  lampShade.position.set(-0.3, 0.72, -1.95);
  g.add(lampShade, box(0.03, 0.2, 0.03, toon('#333'), -0.3, 0.55, -1.95));
  // Schreibtisch mit Konsole & Bildschirm
  g.add(box(1.3, 0.04, 0.6, toon('#f1f1f1'), 1.2, 0.74, 1.85));
  for (const x of [0.6, 1.8]) g.add(box(0.05, 0.72, 0.55, toon('#333'), x, 0.36, 1.85));
  g.add(box(0.7, 0.42, 0.04, toon('#15161c'), 1.2, 1.05, 2.1));
  g.add(box(0.16, 0.36, 0.3, toon('#f6f6f8'), 1.72, 0.94, 1.95)); // Konsole
  g.add(box(0.16, 0.02, 0.3, toon('#4fd6e0', { emissive: '#4fd6e0', emissiveIntensity: 1 }), 1.72, 1.13, 1.95));
  // Poster hoch an der Fußwand (+z) – sichtbar vom Kopfkissen
  g.add(poster(1.0, 1.35, sunsetPoster('LEONIDA'), -1.1, 1.75, D / 2 - 0.07, Math.PI));
  g.add(poster(0.6, 0.8, sunsetPoster('19.11.'), 0.2, 1.8, D / 2 - 0.07, Math.PI));
  // Kalender neben dem Fenster
  g.add(poster(0.26, 0.32, (c, w, h) => calendarNov(c, w, h, { crossTo: 17 }), W / 2 - 0.07, 1.55, 1.35, -Math.PI / 2));
  // Deckenlampe
  const ceilLamp = cyl(0.25, 0.25, 0.06, toon('#ffffff', { emissive: '#fff6dc', emissiveIntensity: 0.6 }), 20);
  ceilLamp.position.set(0, H - 0.04, 0);
  g.add(ceilLamp);
  // Regal mit Spielen
  g.add(box(0.9, 0.04, 0.25, toon('#e9dcc4'), 1.2, 1.6, 2.05));
  for (let i = 0; i < 7; i++) g.add(box(0.03, 0.2, 0.16, toon(PASTELS[i % PASTELS.length]), 0.85 + i * 0.07, 1.72, 2.05));
  // Draußen: Sonnenaufgang über der Stadt
  g.add(skyPlane(skyMat, 70, 0, -Math.PI / 2));
  g.add(cityBlock(r, towers, { x0: 18, x1: 50, z0: -40, z1: 40, n: 22, yBase: -8 }));
  for (let z = -20; z < 20; z += 6) { const p = makePalm(8, r); p.position.set(10 + r() * 4, -8, z); g.add(p); }
  return { group: g, towers, sunDir: [1, 0.25], sunTarget: [-0.5, 0, 0] };
}

// ================================================================ Küche
export function buildKitchen(skyMat) {
  const g = new THREE.Group();
  g.name = 'Kitchen';
  const towers = [];
  const r = rng(301);
  const W = 4.8, D = 4.8, H = 2.6;
  const floorTex = canvasTex(128, 128, (c, w, h) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      c.fillStyle = (x + y) % 2 ? '#f2efe6' : '#4a4f63';
      c.fillRect(x * 32, y * 32, 32, 32);
    }
  }, { repeat: [6, 6] });
  room(g, { w: W, d: D, h: H, wallColor: '#ffe9c7', floor: toon('#ffffff', { map: floorTex }), win: { side: 'px', from: -1.0, to: 1.0, y0: 0.95, y1: 2.2 } });
  // Theke an der Rückwand (-z)
  const front = toon('#4fd6e0'), top = toon('#f4f1ea');
  g.add(box(3.6, 0.88, 0.6, front, -0.4, 0.44, -2.1));
  g.add(box(3.7, 0.05, 0.64, top, -0.4, 0.9, -2.1));
  g.add(box(3.6, 0.7, 0.35, front, -0.4, 1.95, -2.22)); // Hängeschränke
  for (let x = -2.0; x < 1.4; x += 0.6) g.add(box(0.02, 0.6, 0.01, toon('#2c8f99'), x, 1.95, -2.04));
  g.add(box(0.7, 1.9, 0.65, toon('#f6f6f8'), 1.95, 0.95, -2.05)); // Kühlschrank
  g.add(box(0.03, 0.4, 0.04, toon('#999'), 1.66, 1.3, -1.7));
  g.add(makeSticky('GTA\n19.11.', '#ff8fc8', 0.1).translateX(1.85).translateY(1.5).translateZ(-1.71));
  const coffeeM = box(0.28, 0.38, 0.3, toon('#2a2b33'), 0.6, 1.11, -2.15);
  g.add(coffeeM);
  // Fernseher an der Wand mit Nachrichten
  const tvTex = canvasTex(512, 288, () => {});
  g.add(box(0.86, 0.5, 0.05, toon('#15161c'), -1.3, 1.27, -2.35));
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false }));
  tv.position.set(-1.3, 1.27, -2.32);
  g.add(tv);
  // Tisch & Stühle
  g.add(box(1.3, 0.05, 0.9, toon('#d9b98a'), 0, 0.75, -0.35));
  for (const [x, z] of [[-0.58, -0.75], [0.58, -0.75], [-0.58, 0.05], [0.58, 0.05]]) g.add(box(0.05, 0.73, 0.05, toon('#6b4a35'), x, 0.365, z));
  for (const z of [0.55, -1.25]) {
    g.add(box(0.45, 0.05, 0.42, toon('#ff8fc8'), 0, 0.45, z));
    g.add(box(0.45, 0.5, 0.05, toon('#ff8fc8'), 0, 0.72, z + (z > 0 ? 0.22 : -0.22)));
  }
  // Frühstück
  const bowl = cyl(0.09, 0.06, 0.07, toon('#ffffff'), 20);
  bowl.position.set(0, 0.81, 0.0);
  g.add(bowl);
  const cereal = cyl(0.085, 0.085, 0.01, toon('#f0b84a'), 20);
  cereal.position.set(0, 0.84, 0.0);
  g.add(cereal);
  for (let i = 0; i < 14; i++) g.add(box(0.018, 0.012, 0.018, toon(['#ff5fae', '#4fd6e0', '#ffd166'][i % 3]), (r() - 0.5) * 0.12, 0.85, (r() - 0.5) * 0.12));
  const spoon = box(0.02, 0.01, 0.16, toon('#c9ccd6'), 0.12, 0.8, 0.08);
  spoon.rotation.y = 0.4;
  g.add(spoon);
  const mug = makeMug('NOCH 1 TAG');
  mug.position.set(0.32, 0.775, -0.05);
  g.add(mug);
  const juice = cyl(0.035, 0.032, 0.12, toon('#ffb347'), 12);
  juice.position.set(-0.3, 0.84, -0.05);
  g.add(juice);
  const plate = cyl(0.12, 0.12, 0.015, toon('#ffffff'), 20);
  plate.position.set(-0.05, 0.785, -0.75);
  g.add(plate);
  g.add(box(0.1, 0.02, 0.1, toon('#e0a85a'), -0.05, 0.8, -0.75));
  // Pendelleuchte
  g.add(box(0.01, 0.9, 0.01, toon('#222'), 0, H - 0.45, -0.35));
  const shade = cyl(0.08, 0.22, 0.18, toon('#ffd166', { emissive: '#ffb84a', emissiveIntensity: 0.35 }), 16);
  shade.position.set(0, H - 0.95, -0.35);
  g.add(shade);
  // Mitbewohner Mo gegenüber (schaut nach +z, zu dir)
  const mo = toonify(makeNPC(rng(77), { pose: 'sit', scale: 1 }));
  mo.position.set(0, 0.47, -1.18);
  mo.rotation.y = -Math.PI / 2;
  g.add(mo);
  // Pflanze, Fenster-Aussicht
  const pl = makePlant(0.5);
  pl.scale.setScalar(0.6);
  pl.position.set(W / 2 - 0.15, 0.95, 0.6);
  g.add(pl);
  g.add(poster(0.5, 0.7, sunsetPoster('VICE'), -W / 2 + 0.07, 1.6, -0.6, Math.PI / 2));
  g.add(skyPlane(skyMat, 70, 0, -Math.PI / 2));
  g.add(cityBlock(r, towers, { x0: 16, x1: 50, z0: -40, z1: 40, n: 22, yBase: -6 }));
  for (let z = -16; z < 16; z += 5) { const p = makePlant(1); const pa = makePalm(7, r); pa.position.set(9 + r() * 3, -6, z); g.add(pa); void p; }

  // TV-Nachrichten mit Laufband
  function drawTV(t) {
    const c = tvTex.userData.ctx, w = 512, h = 288;
    c.fillStyle = '#16204a'; c.fillRect(0, 0, w, h);
    const gr = c.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#ff5fae'); gr.addColorStop(1, '#7b5cff');
    c.fillStyle = gr; c.fillRect(0, 40, w, 140);
    c.fillStyle = '#fff'; c.font = `900 22px ${FONT}`; c.textAlign = 'left';
    c.fillText('● LIVE  MORGENMAGAZIN', 16, 28);
    c.font = `900 40px ${FONT}`;
    c.fillText('GTA VI: HEUTE NACHT', 20, 100);
    c.fillText('UM 00:00 UHR', 20, 152);
    c.fillStyle = '#ffd166'; c.fillRect(0, 196, w, 44);
    c.fillStyle = '#16204a'; c.font = `800 24px ${FONT}`;
    const ticker = '+++ Preload läuft seit 10. November +++ Fans nehmen sich frei +++ Server-Ansturm erwartet +++ ';
    const tw = c.measureText(ticker).width;
    const off = (t * 110) % tw;
    c.fillText(ticker + ticker, -off, 226);
    c.fillStyle = '#fff'; c.font = `700 20px ${FONT}`;
    c.fillText('07:10', w - 80, 272);
    tvTex.needsUpdate = true;
  }

  return {
    group: g, towers, sunDir: [1, -0.35], sunTarget: [0, 0, -0.5],
    update(t) { drawTV(t); mo.userData.animate?.(t); },
    mo,
  };
}

// ================================================================ Bus
export function buildBus(skyMat) {
  const g = new THREE.Group();
  g.name = 'Bus';
  const towers = [];
  const r = rng(401);
  const W = 2.5, L = 10, H = 2.3;
  const shell = toon('#e9edf2'), seatM = toon('#3a4a8c'), seatPat = toon('#ffffff', {
    map: canvasTex(64, 64, (c) => {
      c.fillStyle = '#3a4a8c'; c.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 12; i++) { c.fillStyle = ['#ff5fae', '#4fd6e0', '#ffd166'][i % 3]; c.fillRect((i * 23) % 60, (i * 37) % 60, 6, 3); }
    }),
  });
  const floor = box(W, 0.05, L, toon('#5a5f70'), 0, -0.025, 0);
  g.add(floor);
  g.add(box(W, 0.05, L, toon('#f4f6fa'), 0, H, 0));
  // Seitenwände mit Fensterband
  for (const s of [-1, 1]) {
    g.add(box(0.08, 0.85, L, shell, s * W / 2, 0.425, 0));
    g.add(box(0.08, H - 1.95, L, shell, s * W / 2, (H + 1.95) / 2, 0));
    for (let z = -L / 2; z <= L / 2 + 0.01; z += 1.25) g.add(box(0.1, 1.1, 0.1, toon('#2a2b33'), s * W / 2, 1.4, z));
    g.add(box(0.1, 0.06, L, toon('#2a2b33'), s * W / 2, 0.86, 0));
    g.add(box(0.1, 0.06, L, toon('#2a2b33'), s * W / 2, 1.95, 0));
    // Werbestreifen über den Fenstern
    g.add(box(0.02, 0.22, L - 0.4, toon('#ffffff', {
      map: canvasTex(512, 32, (c, w, h) => {
        c.fillStyle = '#ffd166'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#2a1650'; c.font = `900 22px ${FONT}`;
        for (let x = 0; x < w; x += 170) c.fillText('LINIE 6 · OCEAN DRIVE', x + 6, 24);
      }),
    }), s * (W / 2 - 0.05), 2.1, 0));
  }
  g.add(box(W, H, 0.08, shell, 0, H / 2, -L / 2));
  g.add(box(W, H, 0.08, shell, 0, H / 2, L / 2));
  // Zielanzeige vorne
  g.add(box(1.6, 0.26, 0.04, toon('#111'), 0, 2.0, -L / 2 + 0.06));
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.2), new THREE.MeshBasicMaterial({
    toneMapped: false,
    map: canvasTex(512, 64, (c, w, h) => {
      c.fillStyle = '#111'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffb000'; c.font = `900 40px ${FONT}`;
      c.fillText('6  ZENTRUM · BÜROPARK', 16, 48);
    }),
  })).translateY(2.0).translateZ(-L / 2 + 0.09));
  // Sitzreihen (Blick nach -z)
  const rnd = rng(55);
  const npcs = [];
  for (let z = -3.8; z <= 3.8; z += 1.05) for (const x of [-0.85, -0.42, 0.42, 0.85]) {
    g.add(box(0.4, 0.1, 0.42, seatPat, x, 0.45, z));
    g.add(box(0.4, 0.55, 0.08, seatPat, x, 0.75, z + 0.22));
    g.add(box(0.06, 0.4, 0.06, toon('#2a2b33'), x, 0.2, z));
    const mine = x === -0.85 && Math.abs(z - 0.4) < 0.1;
    if (!mine && rnd() < 0.42) {
      const p = toonify(makeNPC(rnd, { pose: rnd() < 0.4 ? 'sit' : 'sit' }));
      p.position.set(x, 0.5, z);
      p.rotation.y = Math.PI / 2;
      g.add(p);
      npcs.push(p);
    }
  }
  // Haltestangen, Halteknöpfe, Schlaufen
  const pole = toon('#ffd23a');
  for (let z = -4; z <= 4; z += 2) {
    const p = cyl(0.025, 0.025, H, pole, 8);
    p.position.set(0.2, H / 2, z);
    g.add(p);
    g.add(box(0.05, 0.06, 0.05, toon('#e94560', { emissive: '#e94560', emissiveIntensity: 0.5 }), 0.2, 1.3, z + 0.03));
  }
  const rail = cyl(0.02, 0.02, L, pole, 8);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(0.2, H - 0.18, 0);
  g.add(rail);
  for (let z = -4.5; z <= 4.5; z += 0.5) g.add(box(0.06, 0.16, 0.02, toon('#2a2b33'), 0.2, H - 0.3, z));
  // Lichtleisten
  for (const x of [-0.7, 0.7]) g.add(box(0.15, 0.02, L - 0.6, new THREE.MeshBasicMaterial({ color: '#fffbea', toneMapped: false }), x, H - 0.02, 0));
  // stehender Fahrgast
  const st = toonify(makeNPC(rng(9), { pose: 'phone' }));
  st.position.set(0.05, 0, -1.6);
  st.rotation.y = Math.PI / 2;
  g.add(st);

  // Draußen: Stadt zieht vorbei (Bus fährt nach -z)
  const scroll = [];
  const outside = new THREE.Group();
  outside.add(box(60, 0.1, 400, toon('#6f7480'), 0, -0.5, 0));
  for (const s of [-1, 1]) {
    outside.add(box(4, 0.15, 400, toon('#e6dcc8'), s * 6, -0.4, 0)); // Gehweg
    const span = 120;
    for (let i = 0; i < 26; i++) {
      const item = new THREE.Group();
      const kind = r();
      if (kind < 0.5) {
        const tw = 5 + r() * 6, th = 5 + r() * 14;
        const col = PASTELS[(r() * PASTELS.length) | 0];
        const m = toon('#ffffff', { map: towerTex(col, false) });
        const b = box(5, th, tw, m, s * (11 + r() * 4), th / 2 - 0.4, 0);
        b.castShadow = false;
        b.userData.mats = [m.map, towerTex(col, true)];
        towers.push(b);
        item.add(b);
      } else {
        const p = makePalm(6 + r() * 2, r);
        p.position.set(s * (7.5 + r()), -0.4, 0);
        item.add(p);
      }
      item.userData.z0 = (i / 26) * span;
      item.userData.span = span;
      scroll.push(item);
      outside.add(item);
    }
  }
  // Plakatwand, die links vorbeizieht
  const bb = new THREE.Group();
  bb.add(box(0.3, 3, 0.3, toon('#333'), -9, 1.2, 0));
  bb.add(new THREE.Mesh(new THREE.PlaneGeometry(9, 4), toon('#ffffff', {
    map: canvasTex(512, 228, (c, w, h) => {
      sunsetPoster('')(c, w, h);
      c.fillStyle = '#fff'; c.textAlign = 'center';
      c.font = `italic 900 64px ${FONT}`;
      c.fillText('HEUTE NACHT', w / 2, 90);
      c.font = `900 84px ${FONT}`;
      c.fillText('00:00 🌴', w / 2, 190);
    }),
  })).rotateY(Math.PI / 2).translateY(4.2).translateZ(-8.8));
  bb.userData.z0 = 60;
  bb.userData.span = 120;
  scroll.push(bb);
  outside.add(bb);
  g.add(outside);
  g.add(skyPlane(skyMat, -70, 0, Math.PI / 2, 200, 90, 16));
  g.add(skyPlane(skyMat, 70, 0, -Math.PI / 2, 200, 90, 16));

  const speed = 8.5;
  return {
    group: g, towers, sunDir: [-1, 0.5], sunTarget: [0, 0, 0],
    update(t) {
      for (const it of scroll) it.position.z = ((it.userData.z0 + t * speed) % it.userData.span) - it.userData.span / 2;
      for (const n of npcs) { n.userData.animate?.(t); }
      st.userData.animate?.(t);
    },
    // Ruckeln für die Kamera
    shake(t) { return [Math.sin(t * 13) * 0.003 + Math.sin(t * 31) * 0.0015, Math.sin(t * 17.3) * 0.004]; },
  };
}

// ================================================================ Gaming-Wohnzimmer (Nacht)
export function buildLiving(skyMat) {
  const g = new THREE.Group();
  g.name = 'Living';
  const towers = [];
  const r = rng(501);
  const W = 5.2, D = 5.2, H = 2.6;
  room(g, { w: W, d: D, h: H, wallColor: '#3a3358', floor: '#5a4a3c', ceiling: '#2a2440', win: { side: 'nx', from: -1.2, to: 1.2, y0: 0.8, y1: 2.3 } });
  g.add(box(2.6, 0.01, 1.8, toon('#7b5cff'), 0, 0.005, 0.6)); // Teppich
  // TV-Wand
  g.add(box(2.2, 0.45, 0.45, toon('#1d1b28'), 0, 0.225, -2.3));
  g.add(box(1.96, 1.12, 0.06, toon('#0c0c12'), 0, 1.25, -2.52));
  const tvTex = canvasTex(1024, 576, () => {});
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 1.05), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false }));
  tv.position.set(0, 1.25, -2.485);
  g.add(tv);
  g.add(box(0.12, 0.36, 0.3, toon('#f6f6f8'), 0.75, 0.63, -2.3)); // Konsole
  g.add(box(0.12, 0.02, 0.3, toon('#4fd6e0', { emissive: '#4fd6e0', emissiveIntensity: 1.2 }), 0.75, 0.82, -2.3));
  // LED-Leisten (Vice-Neon)
  const pink = new THREE.MeshBasicMaterial({ color: '#ff3fa4', toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: '#2fe6ff', toneMapped: false });
  g.add(box(2.3, 0.03, 0.03, pink, 0, 1.86, -2.54), box(2.3, 0.03, 0.03, pink, 0, 0.64, -2.54));
  g.add(box(W - 0.2, 0.03, 0.03, cyan, 0, H - 0.05, -D / 2 + 0.08), box(0.03, 0.03, D - 0.2, cyan, W / 2 - 0.08, H - 0.05, 0));
  const pl1 = new THREE.PointLight('#ff3fa4', 9, 6, 1.4);
  pl1.position.set(0, 1.3, -1.9);
  const pl2 = new THREE.PointLight('#2fe6ff', 5, 7, 1.4);
  pl2.position.set(2.2, 2.2, 1.0);
  const tvGlow = new THREE.PointLight('#b7a8ff', 4, 5, 1.5);
  tvGlow.position.set(0, 1.25, -1.6);
  g.add(pl1, pl2, tvGlow);
  // Sofa
  const sofa = toon('#2d4a8c');
  g.add(box(2.2, 0.42, 0.9, sofa, 0, 0.21, 1.75));
  g.add(box(2.2, 0.75, 0.25, sofa, 0, 0.6, 2.2));
  for (const x of [-1.15, 1.15]) g.add(box(0.2, 0.62, 0.9, sofa, x, 0.31, 1.75));
  g.add(box(0.5, 0.35, 0.15, toon('#ff8fc8'), -0.7, 0.6, 2.0));
  // Couchtisch mit Snacks
  g.add(box(1.2, 0.05, 0.6, toon('#c9a67a'), 0, 0.42, 0.55));
  for (const [x, z] of [[-0.55, 0.3], [0.55, 0.3], [-0.55, 0.8], [0.55, 0.8]]) g.add(box(0.05, 0.4, 0.05, toon('#6b4a35'), x, 0.2, z));
  const pizza = box(0.42, 0.05, 0.42, toon('#ffffff', {
    map: canvasTex(64, 64, (c) => { c.fillStyle = '#e8d5b0'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#e94560'; c.font = `900 14px ${FONT}`; c.fillText('PIZZA', 10, 38); }),
  }), -0.3, 0.47, 0.55);
  pizza.rotation.y = 0.2;
  g.add(pizza);
  for (const [x, col] of [[0.25, '#2fe6ff'], [0.38, '#ff3fa4'], [0.47, '#2fe6ff']]) {
    const can = cyl(0.033, 0.033, 0.12, toon(col), 12);
    can.position.set(x, 0.505, 0.45 + (x * 7) % 0.2);
    g.add(can);
  }
  const chips = box(0.22, 0.28, 0.08, toon('#ffd166'), 0.05, 0.58, 0.72);
  chips.rotation.z = 0.15;
  g.add(chips);
  // Mo sitzt neben dir auf dem Sofa
  const mo = toonify(makeNPC(rng(77), { pose: 'sit', scale: 1 }));
  mo.position.set(0.78, 0.45, 1.62);
  mo.rotation.y = Math.PI / 2;
  g.add(mo);
  // Poster & Regal
  g.add(poster(0.8, 1.1, sunsetPoster('LEONIDA'), W / 2 - 0.07, 1.5, 0.2, -Math.PI / 2));
  g.add(poster(0.26, 0.32, (c, w, h) => calendarNov(c, w, h, { crossTo: 18 }), W / 2 - 0.07, 1.4, -1.2, -Math.PI / 2));
  // Draußen: Stadt bei Nacht
  g.add(skyPlane(skyMat, -70, 0, Math.PI / 2));
  g.add(cityBlock(r, towers, { x0: -50, x1: -16, z0: -40, z1: 40, n: 24, yBase: -10 }));

  // TV-Bild: Countdown -> Blitz -> Titelbild
  let last = '';
  function drawTV(mode, info = {}) {
    const key = mode + JSON.stringify(info);
    if (key === last) return;
    last = key;
    const c = tvTex.userData.ctx, w = 1024, h = 576;
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1b0f3a'); bg.addColorStop(0.6, '#5a1f6a'); bg.addColorStop(1, '#ff5fae');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.textAlign = 'center';
    if (mode === 'countdown') {
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = `800 34px ${FONT}`;
      c.fillText('GTA VI · STARTET IN', w / 2, 170);
      c.fillStyle = '#fff'; c.font = `900 170px ${FONT}`;
      c.shadowColor = '#ff3fa4'; c.shadowBlur = 30;
      c.fillText(info.text || '00:00:00', w / 2, 360);
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = `700 28px ${FONT}`;
      c.fillText('Preload abgeschlossen ✓', w / 2, 440);
    } else if (mode === 'loading') {
      c.fillStyle = '#05030c'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ff8fc8'; c.font = `italic 900 60px ${FONT}`;
      c.fillText('WILLKOMMEN IN LEONIDA', w / 2, h / 2);
    } else if (mode === 'flash') {
      c.fillStyle = '#fff6fb'; c.fillRect(0, 0, w, h);
    } else if (mode === 'title') {
      // eigenes Titelbild: Sonne, Palmen, Neon-Schrift
      c.fillStyle = '#ffe37a';
      c.beginPath(); c.arc(w / 2, h * 0.78, 220, Math.PI, 0); c.fill();
      c.fillStyle = '#5a1f6a';
      for (let i = 0; i < 7; i++) c.fillRect(0, h * 0.62 + i * 18, w, 4 + i * 1.5);
      c.fillStyle = '#140a2a';
      for (const [x, s] of [[0.12, 1], [0.88, 0.9], [0.22, 0.7]]) {
        c.fillRect(w * x - 6, h * (0.3 + (1 - s) * 0.3), 12, h);
        for (let k = 0; k < 7; k++) {
          c.save(); c.translate(w * x, h * (0.3 + (1 - s) * 0.3)); c.rotate((k / 7) * Math.PI * 2);
          c.fillRect(0, -6, 120 * s, 12); c.restore();
        }
      }
      c.fillStyle = '#fff'; c.font = `italic 900 190px ${FONT}`;
      c.shadowColor = '#ff3fa4'; c.shadowBlur = 40;
      c.fillText('GTA VI', w / 2, 270);
      c.shadowColor = '#2fe6ff'; c.shadowBlur = 24;
      c.font = `900 44px ${FONT}`;
      if (info.blink) c.fillText('DRÜCKE START', w / 2, 360);
      c.shadowBlur = 0;
    }
    c.textAlign = 'left';
    tvTex.needsUpdate = true;
  }

  return { group: g, towers, sunDir: [-1, 0.2], sunTarget: [0, 0, 0], drawTV, mo, update(t) { mo.userData.animate?.(t); } };
}
