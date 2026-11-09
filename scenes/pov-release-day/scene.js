// POV-Set: Großraumbüro in Vice City am Release-Tag (Three.js, Comic-Look)
//
// Koordinatensystem (Meter):
//   +y = oben, Boden y = 0, Decke y = 2.8
//   -z = Stirnwand mit Wanduhr, +z = Rückwand mit Chefbüro
//   -x = Fensterfront (Skyline, Palmen, Meer), +x = weitere Arbeitsplätze
//
// Dein Platz: Stuhl bei ANCHORS.chair, Blick nach -z auf den Monitor.
// Lena (die Blonde) sitzt rechts neben dir (+x), der Chef läuft am Fenster entlang.

import * as THREE from 'three';
import { makeGirl, makeNPC } from '../cafe-ocean-drive/characters.js';

// ---------------------------------------------------------------- utilities
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Toon-Shading: 3 harte Lichtstufen wie im Comic
const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const _toonCache = new Map();
export function toon(color, extra = {}) {
  const k = color + JSON.stringify(extra);
  if (!extra.map && _toonCache.has(k)) return _toonCache.get(k);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...extra });
  if (!extra.map) _toonCache.set(k, m);
  return m;
}

// Wandelt die Standard-Materialien der Vice-Files-Figuren in Toon-Materialien um
export function toonify(root) {
  const cache = new Map();
  const conv = (m) => {
    if (!m || !m.isMeshStandardMaterial) return m;
    if (!cache.has(m)) {
      cache.set(m, new THREE.MeshToonMaterial({
        color: m.color, map: m.map, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity,
        emissiveMap: m.emissiveMap, transparent: m.transparent, opacity: m.opacity, side: m.side, gradientMap: GRAD,
      }));
    }
    return cache.get(m);
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    o.castShadow = true;
    o.receiveShadow = true;
  });
  // Kopf-Gesichter tauschen ihre map über setMouth – Referenz aktualisieren
  return root;
}

export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, material, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function canvasTex(w, h, draw, { repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  t.userData.canvas = c;
  t.userData.ctx = ctx;
  return t;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const FONT = 'Inter, "Arial Black", "Helvetica Neue", Arial, sans-serif';

// ---------------------------------------------------------------- layout
export const ROOM = { x0: -3.2, x1: 7.2, z0: -5, z1: 7, h: 2.8 };

export const ANCHORS = {
  chair: new THREE.Vector3(0, 0.47, 0.18), // Sitzfläche deines Stuhls
  eyeSit: 0.7, // Augenhöhe über der Sitzfläche
  eyeStand: 1.5, // Augenhöhe stehend (über Boden)
  monitor: new THREE.Vector3(0, 1.08, -0.78),
  lenaSeat: new THREE.Vector3(1.75, 0.47, 0.18),
  wallClock: new THREE.Vector3(0, 2.05, -4.93),
};

// ---------------------------------------------------------------- Texturen
function carpetTex() {
  return canvasTex(256, 256, (c, w, h) => {
    const cols = ['#8d94a3', '#959cab', '#878e9d', '#9aa0ae'];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      c.fillStyle = cols[(x * 3 + y * 5) % 4];
      c.fillRect(x * 64, y * 64, 64, 64);
    }
    c.strokeStyle = 'rgba(40,44,60,0.35)';
    c.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke();
    }
    const r = rng(7);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '30,30,50'},0.08)`;
      c.fillRect(r() * w, r() * h, 2, 2);
    }
  }, { repeat: [ (ROOM.x1 - ROOM.x0) / 2.4, (ROOM.z1 - ROOM.z0) / 2.4 ] });
}

function ceilingTex() {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#ecebe6';
    c.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 400; i++) {
      c.fillStyle = 'rgba(120,120,110,0.18)';
      c.fillRect(r() * w, r() * h, 2, 2);
    }
    c.strokeStyle = '#3a3a44';
    c.lineWidth = 5;
    c.strokeRect(0, 0, w, h);
  }, { repeat: [(ROOM.x1 - ROOM.x0) / 0.6, (ROOM.z1 - ROOM.z0) / 0.6] });
}

function lightPanelTex() {
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#fffef6';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#c9c7bd';
    for (let i = 1; i < 6; i++) c.fillRect(0, (i * h) / 6 - 3, w, 6);
    c.strokeStyle = '#2b2b33';
    c.lineWidth = 8;
    c.strokeRect(0, 0, w, h);
  });
}

function skyTex(preset) {
  return canvasTex(512, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, preset.skyTop);
    g.addColorStop(0.55, preset.skyMid);
    g.addColorStop(0.78, preset.skyLow);
    g.addColorStop(1, preset.sea);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    if (preset.sunDisc) {
      c.fillStyle = preset.sunDisc;
      c.beginPath();
      c.arc(w * 0.58, h * 0.7, 34, 0, Math.PI * 2);
      c.fill();
    }
    // Wolkenbänder
    c.fillStyle = preset.cloud;
    const r = rng(11);
    for (let i = 0; i < 9; i++) {
      const x = r() * w, y = h * (0.15 + r() * 0.45);
      roundRect(c, x, y, 60 + r() * 120, 10 + r() * 10, 8);
      c.fill();
    }
    // Meer-Glitzern
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 60; i++) c.fillRect(r() * w, h * 0.8 + r() * h * 0.2, 6 + r() * 14, 2);
  });
}

function towerTex(base, lit) {
  return canvasTex(64, 128, (c, w, h) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const r = rng(base.length * 13 + (lit ? 1 : 0));
    for (let y = 6; y < h - 4; y += 10) for (let x = 5; x < w - 4; x += 11) {
      c.fillStyle = lit && r() < 0.45 ? '#ffd98a' : 'rgba(30,40,70,0.55)';
      c.fillRect(x, y, 6, 6);
    }
  });
}

// ---------------------------------------------------------------- Tageszeiten
export const DAYLIGHT = {
  morning: { skyTop: '#6fc0ee', skyMid: '#bfe3f2', skyLow: '#ffe2b8', sea: '#3fa3c8', cloud: 'rgba(255,255,255,0.75)', sun: '#fff0d4', sunI: 2.3, sunPos: [-24, 13, -8], hemiSky: '#dff1ff', hemiGround: '#8d8270', hemiI: 1.25, amb: 0.55, panel: 0.9, lit: false },
  noon: { skyTop: '#4aa8ec', skyMid: '#9fd6f5', skyLow: '#e1f3f9', sea: '#2e94c0', cloud: 'rgba(255,255,255,0.85)', sun: '#ffffff', sunI: 2.5, sunPos: [-14, 26, 2], hemiSky: '#e8f6ff', hemiGround: '#8f8a80', hemiI: 1.35, amb: 0.6, panel: 0.9, lit: false },
  afternoon: { skyTop: '#5aa2dc', skyMid: '#a8d2ee', skyLow: '#f8d9a2', sea: '#2f86b0', cloud: 'rgba(255,248,235,0.8)', sun: '#ffe1ae', sunI: 2.3, sunPos: [-22, 11, 7], hemiSky: '#fff0dc', hemiGround: '#8a7e70', hemiI: 1.15, amb: 0.5, panel: 0.9, lit: false },
  sunset: { skyTop: '#33296a', skyMid: '#b2508a', skyLow: '#ff9a5c', sea: '#5b3f7a', cloud: 'rgba(255,170,140,0.7)', sunDisc: '#ffd27a', sun: '#ff9b62', sunI: 2.1, sunPos: [-30, 4.5, 3], hemiSky: '#ffb08a', hemiGround: '#4a3a5a', hemiI: 0.85, amb: 0.4, panel: 1.3, lit: true },
};

// ---------------------------------------------------------------- Möbel
function makeDesk(topColor = '#d9c7a4') {
  const g = new THREE.Group();
  const top = toon(topColor);
  const leg = toon('#3a3d48');
  g.add(box(1.4, 0.04, 0.72, top, 0, 0.74, 0));
  for (const x of [-0.66, 0.66]) g.add(box(0.05, 0.72, 0.62, leg, x, 0.36, 0));
  g.add(box(1.3, 0.3, 0.02, toon('#55596a'), 0, 0.55, -0.32));
  return g;
}

function makeOfficeChair(color = '#2c3550') {
  const g = new THREE.Group();
  const m = toon(color), dark = toon('#1f2028');
  g.add(box(0.5, 0.08, 0.48, m, 0, 0.44, 0));
  g.add(box(0.46, 0.55, 0.07, m, 0, 0.78, 0.26));
  const post = cyl(0.03, 0.03, 0.36, dark);
  post.position.y = 0.22;
  g.add(post);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.32, 0.04, 0.05, dark, Math.cos(a) * 0.16, 0.05, Math.sin(a) * 0.16);
    leg.rotation.y = -a;
    g.add(leg);
  }
  return g;
}

function makeMonitor(screenTex) {
  const g = new THREE.Group();
  const dark = toon('#22232b');
  g.add(box(0.62, 0.38, 0.03, dark, 0, 0.0, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  scr.position.z = 0.017;
  g.add(scr);
  g.add(box(0.06, 0.2, 0.04, dark, 0, -0.27, -0.03));
  g.add(box(0.24, 0.02, 0.16, dark, 0, -0.33, -0.02));
  return g;
}

function makeSticky(text, color = '#ffe66b', rot = 0) {
  const t = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1b1b25';
    c.font = `800 30px ${FONT}`;
    c.textAlign = 'center';
    text.split('\n').forEach((l, i, a) => c.fillText(l, w / 2, h / 2 + (i - (a.length - 1) / 2) * 34 + 10));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), toon('#ffffff', { map: t }));
  m.rotation.z = rot;
  return m;
}

function makePlant(h = 0.9) {
  const g = new THREE.Group();
  const pot = cyl(0.16, 0.12, 0.3, toon('#e8e2d4'));
  pot.position.y = 0.15;
  g.add(pot);
  const leaf = toon('#3fa66a'), leaf2 = toon('#2d8a55');
  const r = rng(Math.round(h * 100));
  for (let i = 0; i < 9; i++) {
    const l = box(0.06, h * (0.5 + r() * 0.5), 0.16, i % 2 ? leaf : leaf2, 0, 0.3 + h * 0.3, 0);
    l.rotation.set((r() - 0.5) * 0.9, r() * Math.PI, (r() - 0.5) * 0.9);
    g.add(l);
  }
  return g;
}

function makeMug(text = 'GTA ODER NIX') {
  const g = new THREE.Group();
  const t = canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ff3fa4';
    c.font = `900 34px ${FONT}`;
    c.textAlign = 'center';
    c.fillText(text, w / 2, 45);
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 20, 1, true), toon('#ffffff', { map: t, side: THREE.DoubleSide }));
  body.rotation.y = Math.PI * 0.6;
  body.position.y = 0.05;
  g.add(body);
  const cof = cyl(0.042, 0.042, 0.005, toon('#4a2c18'));
  cof.position.y = 0.09;
  g.add(cof);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 6, 12), toon('#ffffff'));
  handle.position.set(0.05, 0.05, 0);
  g.add(handle);
  return g;
}

// Kalender an der Stellwand: 19. November rot eingekreist
function calendarTex() {
  return canvasTex(256, 320, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#e94560';
    c.fillRect(0, 0, w, 60);
    c.fillStyle = '#fff';
    c.font = `900 36px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('NOVEMBER', w / 2, 44);
    c.fillStyle = '#222';
    c.font = `700 22px ${FONT}`;
    let d = 1;
    for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
      if (row === 0 && col < 6) continue; // 1. Nov 2026 = Sonntag
      if (d > 30) break;
      const x = 22 + col * 35, y = 100 + row * 48;
      c.fillText(String(d), x, y);
      if (d === 19) {
        c.strokeStyle = '#e94560';
        c.lineWidth = 5;
        c.beginPath();
        c.ellipse(x, y - 8, 22, 18, 0.2, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = '#e94560';
        c.font = `900 20px ${FONT}`;
        c.fillText('GTA!!', x, y + 26);
        c.fillStyle = '#222';
        c.font = `700 22px ${FONT}`;
      }
      d++;
    }
  });
}

// ---------------------------------------------------------------- Wanduhr
function makeWallClock() {
  const tex = canvasTex(256, 256, () => {});
  const draw = (hh, mm) => {
    const c = tex.userData.ctx, w = 256;
    c.clearRect(0, 0, w, w);
    c.fillStyle = '#fbfaf4';
    c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill();
    c.lineWidth = 12; c.strokeStyle = '#1d1e26'; c.stroke();
    c.fillStyle = '#1d1e26';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.save(); c.translate(128, 128); c.rotate(a);
      c.fillRect(-4, -110, 8, i % 3 ? 14 : 24);
      c.restore();
    }
    const hand = (a, len, wid, col) => {
      c.save(); c.translate(128, 128); c.rotate(a);
      c.fillStyle = col; c.fillRect(-wid / 2, -len, wid, len + 14);
      c.restore();
    };
    hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, 62, 12, '#1d1e26');
    hand((mm / 60) * Math.PI * 2, 96, 8, '#1d1e26');
    c.fillStyle = '#e94560';
    c.beginPath(); c.arc(128, 128, 9, 0, Math.PI * 2); c.fill();
    tex.needsUpdate = true;
  };
  draw(9, 0);
  const g = new THREE.Group();
  const rim = cyl(0.36, 0.36, 0.06, toon('#1d1e26'), 32);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  face.position.z = 0.035;
  g.add(face);
  let last = '';
  g.userData.setTime = (hh, mm) => {
    const k = hh + ':' + mm;
    if (k !== last) { last = k; draw(hh, mm); }
  };
  return g;
}

// ---------------------------------------------------------------- Chef
function bossFace(mouth) {
  return canvasTex(16, 16, (c) => {
    c.fillStyle = '#e9b48c'; c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#5a4030'; c.fillRect(3, 4, 4, 1); c.fillRect(9, 4, 4, 1); // Brauen
    c.fillStyle = '#1a1010'; c.fillRect(4, 6, 2, 2); c.fillRect(10, 6, 2, 2); // Augen
    c.strokeStyle = '#15151c'; c.lineWidth = 1; c.strokeRect(2.5, 5.5, 5, 3); c.strokeRect(8.5, 5.5, 5, 3); // Brille
    c.fillStyle = '#6a6a72'; c.fillRect(4, 10, 8, 2); // Schnauzer
    c.fillStyle = '#5a2020';
    if (mouth === 1) c.fillRect(6, 12, 4, 1);
    if (mouth === 2) c.fillRect(6, 12, 4, 2);
    c.fillStyle = '#c99070'; c.fillRect(7, 8, 2, 2); // Nase
  });
}
function nearest(t) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; }

function makeBoss() {
  const g = new THREE.Group();
  g.name = 'Boss';
  const suit = toon('#3b4150'), shirt = toon('#f2f2ee'), skin = toon('#e9b48c'), shoe = toon('#141218');
  const legs = [], arms = [];
  for (const z of [-0.08, 0.08]) {
    const leg = new THREE.Group();
    leg.position.set(0, 0.82, z);
    leg.add(box(0.15, 0.74, 0.15, suit, 0, -0.37, 0));
    leg.add(box(0.24, 0.08, 0.16, shoe, 0.04, -0.78, 0));
    legs.push(leg);
    g.add(leg);
  }
  g.add(box(0.28, 0.16, 0.36, suit, 0, 0.88, 0));
  g.add(box(0.27, 0.48, 0.42, suit, 0, 1.18, 0)); // Bauch etwas breiter
  g.add(box(0.02, 0.4, 0.14, shirt, 0.14, 1.22, 0));
  g.add(box(0.025, 0.32, 0.06, toon('#c0283a'), 0.155, 1.2, 0)); // Krawatte
  for (const side of [1, -1]) {
    const arm = new THREE.Group();
    arm.position.set(0, 1.38, -side * 0.26);
    arm.add(box(0.12, 0.5, 0.12, suit, 0, -0.24, 0));
    arm.add(box(0.1, 0.1, 0.1, skin, 0, -0.53, 0));
    arms.push(arm);
    g.add(arm);
  }
  // Kaffeebecher in der linken Hand
  const mug = makeMug('BOSS');
  mug.position.set(0.06, -0.62, 0);
  arms[1].add(mug);
  const head = new THREE.Group();
  head.position.set(0, 1.42, 0);
  const faces = [0, 1, 2].map((n) => nearest(bossFace(n)));
  const faceMat = toon('#ffffff', { map: faces[0] });
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.31), [faceMat, skin, skin, skin, skin, skin]);
  h.position.y = 0.17;
  h.castShadow = true;
  head.add(h);
  const grey = toon('#8d8d96');
  head.add(box(0.06, 0.14, 0.33, grey, -0.15, 0.16, 0));
  head.add(box(0.2, 0.12, 0.03, grey, -0.05, 0.14, 0.165));
  head.add(box(0.2, 0.12, 0.03, grey, -0.05, 0.14, -0.165));
  g.add(head);
  g.userData = {
    head, legs, arms,
    setMouth(n) { const f = faces[Math.max(0, Math.min(2, n | 0))]; if (faceMat.map !== f) { faceMat.map = f; faceMat.needsUpdate = true; } },
    walk(phase, amount) {
      const sw = Math.sin(phase) * 0.5 * amount;
      legs[0].rotation.z = sw; legs[1].rotation.z = -sw;
      arms[0].rotation.z = -sw * 0.7;
      head.position.y = 1.42 + Math.abs(Math.cos(phase)) * 0.02 * amount;
    },
  };
  return g;
}

// ---------------------------------------------------------------- Bau
export function buildScene() {
  const scene = new THREE.Scene();
  scene.name = 'POV_ReleaseDay_Office';
  scene.background = new THREE.Color('#9fd6f5');

  const { x0, x1, z0, z1, h } = ROOM;
  const W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  // Boden & Decke
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), toon('#ffffff', { map: carpetTex() }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  floor.receiveShadow = true;
  scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: ceilingTex(), color: '#d8d7d0' }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, h, cz);
  scene.add(ceil);

  // Leuchtpaneele (wie im Referenzvideo)
  const panelMat = new THREE.MeshBasicMaterial({ map: lightPanelTex(), toneMapped: false });
  for (let x = -1.8; x < x1; x += 2.4) for (let z = -4; z < z1; z += 2.4) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), panelMat);
    p.rotation.x = Math.PI / 2;
    p.position.set(x, h - 0.01, z);
    scene.add(p);
  }

  // Wände
  const wallM = toon('#ece3cf'), trimM = toon('#4a4d5c');
  scene.add(box(W, h, 0.12, wallM, cx, h / 2, z0 - 0.06)); // Stirnwand
  scene.add(box(W, h, 0.12, wallM, cx, h / 2, z1 + 0.06)); // Rückwand
  scene.add(box(0.12, h, D, wallM, x1 + 0.06, h / 2, cz)); // rechte Wand
  scene.add(box(W, 0.1, 0.02, trimM, cx, 0.05, z0 + 0.01));
  scene.add(box(0.02, 0.1, D, trimM, x1 - 0.01, 0.05, cz));
  // Fensterfront links: Brüstung, Sturz, Pfosten – Licht fällt durch die Öffnungen
  const sill = 0.85, lintel = 2.5;
  scene.add(box(0.14, sill, D, wallM, x0 - 0.07, sill / 2, cz));
  scene.add(box(0.14, h - lintel, D, wallM, x0 - 0.07, (h + lintel) / 2, cz));
  scene.add(box(0.3, 0.05, D, toon('#f4f1ea'), x0 + 0.08, sill, cz)); // Fensterbank
  const mullM = toon('#2d303c');
  for (let z = z0; z <= z1 + 0.01; z += 1.5) scene.add(box(0.1, lintel - sill, 0.1, mullM, x0 - 0.05, (sill + lintel) / 2, z));
  scene.add(box(0.08, 0.06, D, mullM, x0 - 0.05, sill + 0.03, cz));
  scene.add(box(0.08, 0.06, D, mullM, x0 - 0.05, lintel - 0.03, cz));
  // Jalousien oben halb heruntergelassen
  const blindM = toon('#e7e4dc');
  for (let z = z0 + 0.75; z < z1; z += 1.5) {
    for (let i = 0; i < 7; i++) {
      const s = box(0.04, 0.03, 1.38, blindM, x0 + 0.03, lintel - 0.06 - i * 0.07, z);
      s.rotation.z = 0.5;
      s.castShadow = true;
      scene.add(s);
    }
  }

  // ---- Draußen: Himmel, Meer, Skyline, Palmen
  const skyMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const skyTexs = Object.fromEntries(Object.entries(DAYLIGHT).map(([k, p]) => [k, skyTex(p)]));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(220, 110), skyMat);
  sky.rotation.y = Math.PI / 2;
  sky.position.set(-90, 22, cz);
  scene.add(sky);
  const outside = new THREE.Group();
  const towersDay = [], towersLit = [];
  const r = rng(85);
  const towerCols = ['#f4c7d9', '#bfe6e0', '#f6e3a8', '#d8c7f0', '#f3f0ea', '#a9d4ef'];
  for (let i = 0; i < 26; i++) {
    const tw = 3 + r() * 5, th = 8 + r() * 30, td = 3 + r() * 5;
    const col = towerCols[(r() * towerCols.length) | 0];
    const dayT = towerTex(col, false), litT = towerTex(col, true);
    const m = toon('#ffffff', { map: dayT });
    const b = box(tw, th, td, m, -22 - r() * 30, th / 2 - 6, -40 + r() * 90);
    b.castShadow = false;
    b.userData.mats = [dayT, litT];
    towersDay.push(b);
    outside.add(b);
  }
  // Promenade + Palmen
  const ground = box(30, 0.2, 140, toon('#e9d9b0'), -18, -6, cz);
  ground.castShadow = false;
  outside.add(ground);
  const trunk = toon('#8a6a48'), frond = toon('#2f8a55');
  for (let z = -40; z < 50; z += 7) {
    const p = new THREE.Group();
    const tr = cyl(0.25, 0.35, 9, trunk, 6);
    tr.position.y = 4.5;
    tr.rotation.z = (r() - 0.5) * 0.2;
    p.add(tr);
    for (let k = 0; k < 7; k++) {
      const f = box(4, 0.15, 0.9, frond, 0, 9, 0);
      f.geometry.translate(2, 0, 0);
      f.rotation.set(0, (k / 7) * Math.PI * 2, -0.35);
      p.add(f);
    }
    p.position.set(-9 - r() * 4, -6, z + r() * 3);
    outside.add(p);
  }
  scene.add(outside);

  // ---- Licht
  const hemi = new THREE.HemisphereLight('#e8f6ff', '#8f8a80', 1.2);
  scene.add(hemi);
  const amb = new THREE.AmbientLight('#ffffff', 0.5);
  scene.add(amb);
  const sun = new THREE.DirectionalLight('#ffffff', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.target.position.set(1, 0, 0.5);
  scene.add(sun, sun.target);
  const fill = new THREE.PointLight('#fff4e0', 6, 9, 1.6);
  fill.position.set(0.6, 2.5, -0.3);
  scene.add(fill);

  // ---- Arbeitsplätze
  const rnd = rng(19);
  const npcs = [];
  function workstation(x, z, { facing = 0, npc = true, mon = 'excel', seed } = {}) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = facing;
    const d = makeDesk();
    d.position.z = -0.6;
    g.add(d);
    const mtex = monitorStaticTex(mon, seed ?? x * 10 + z);
    const m = makeMonitor(mtex);
    m.position.set(0, 1.08, -0.78);
    g.add(m);
    g.add(box(0.44, 0.02, 0.14, toon('#2a2b33'), 0, 0.77, -0.45));
    const chair = makeOfficeChair(['#2c3550', '#5a2d3c', '#2d4a40'][(rnd() * 3) | 0]);
    chair.position.z = 0.18;
    g.add(chair);
    if (npc) {
      const p = toonify(makeNPC(rnd, { pose: 'sit' }));
      p.position.set(0, 0.47, 0.12);
      p.rotation.y = Math.PI / 2;
      g.add(p);
      npcs.push(p);
    }
    scene.add(g);
    return g;
  }
  // dein Platz (ohne Figur)
  const mine = new THREE.Group();
  {
    const d = makeDesk('#e2cfa9');
    d.position.z = -0.6;
    mine.add(d);
    const chair = makeOfficeChair('#2c3550');
    chair.position.z = 0.18;
    mine.add(chair);
    mine.add(box(0.44, 0.02, 0.14, toon('#2a2b33'), 0, 0.77, -0.45)); // Tastatur
    const mouse = box(0.06, 0.03, 0.1, toon('#2a2b33'), 0.34, 0.77, -0.42);
    mine.add(mouse);
    const mug = makeMug('GTA ODER NIX');
    mug.position.set(-0.45, 0.76, -0.5);
    mine.add(mug);
    const plant = makePlant(0.35);
    plant.scale.setScalar(0.5);
    plant.position.set(-0.55, 0.76, -0.82);
    mine.add(plant);
  }
  scene.add(mine);
  const myScreen = canvasTex(1024, 600, () => {});
  const myMonitor = makeMonitor(myScreen);
  myMonitor.position.copy(ANCHORS.monitor);
  scene.add(myMonitor);
  const sticky = makeSticky('18:00\n!!!', '#ffe66b', 0.08);
  sticky.position.set(0.27, 1.2, -0.76);
  scene.add(sticky);
  const sticky2 = makeSticky('NICHT\nSPOILERN', '#7ee0d4', -0.1);
  sticky2.position.set(-0.27, 0.93, -0.76);
  scene.add(sticky2);

  // Stellwände
  const partM = toon('#6f7a96'), partTop = toon('#3a3f50');
  scene.add(box(4.2, 1.22, 0.06, partM, 0.9, 0.61, -1.0));
  scene.add(box(4.2, 0.04, 0.08, partTop, 0.9, 1.23, -1.0));
  scene.add(box(0.06, 0.98, 1.2, partM, 0.88, 0.49, -0.4));
  scene.add(box(0.08, 0.04, 1.2, partTop, 0.88, 0.99, -0.4));
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.25), toon('#ffffff', { map: calendarTex() }));
  cal.position.set(-0.45, 1.06, -0.965);
  scene.add(cal);

  // Lena (die Blonde aus Vice Files) rechts neben dir
  workstation(ANCHORS.lenaSeat.x, 0, { npc: false, mon: 'mail', seed: 3 });
  const lena = toonify(makeGirl());
  lena.position.copy(ANCHORS.lenaSeat);
  lena.rotation.y = Math.PI / 2;
  scene.add(lena);
  bindGirlMouth(lena);

  // weitere Reihen
  workstation(3.6, 0, { mon: 'excel' });
  workstation(5.4, 0, { mon: 'mail' });
  workstation(0, -2.6, { mon: 'excel' });
  workstation(1.8, -2.6, { mon: 'chart' });
  workstation(3.6, -2.6, { mon: 'mail', npc: false });
  workstation(5.4, -2.6, { mon: 'excel' });
  workstation(3.6, 2.6, { mon: 'chart', facing: Math.PI });
  workstation(1.8, 2.6, { mon: 'excel', facing: Math.PI });
  workstation(0, 2.6, { mon: 'mail', facing: Math.PI, npc: false });
  scene.add(box(9.6, 1.22, 0.06, partM, 2.7, 0.61, -3.6));
  scene.add(box(5.6, 1.22, 0.06, partM, 1.8, 0.61, 3.2));

  // Stirnwand: Uhr, Whiteboard, Poster
  const wallClock = makeWallClock();
  wallClock.position.copy(ANCHORS.wallClock);
  scene.add(wallClock);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), toon('#ffffff', {
    map: canvasTex(512, 256, (c, w, hh) => {
      c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, w, hh);
      c.strokeStyle = '#2b2b33'; c.lineWidth = 10; c.strokeRect(0, 0, w, hh);
      c.fillStyle = '#2a4fb0'; c.font = `800 34px ${FONT}`;
      c.fillText('Q4 ZIELE', 24, 52);
      c.font = `600 24px ${FONT}`; c.fillStyle = '#333';
      ['• Quartalsbericht bis FR', '• Meeting 14:00', '• Umsatz +12 %'].forEach((l, i) => c.fillText(l, 30, 100 + i * 40));
      c.strokeStyle = '#e94560'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(330, 200); c.lineTo(380, 150); c.lineTo(420, 170); c.lineTo(480, 90); c.stroke();
    }),
  }));
  board.position.set(2.6, 1.6, z0 + 0.01);
  scene.add(board);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.95), toon('#ffffff', {
    map: canvasTex(256, 352, (c, w, hh) => {
      const g = c.createLinearGradient(0, 0, 0, hh);
      g.addColorStop(0, '#ff7ab6'); g.addColorStop(1, '#ffb36b');
      c.fillStyle = g; c.fillRect(0, 0, w, hh);
      c.fillStyle = '#fff'; c.font = `900 40px ${FONT}`; c.textAlign = 'center';
      c.fillText('TEAMWORK', w / 2, 80);
      c.font = `700 24px ${FONT}`;
      c.fillText('makes the', w / 2, 120);
      c.fillText('dream work', w / 2, 150);
      c.fillStyle = '#2b2b33'; c.fillRect(70, 200, 116, 110);
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(128, 250, 34, 0, Math.PI * 2); c.fill();
    }),
  }));
  poster.position.set(-1.9, 1.55, z0 + 0.01);
  scene.add(poster);
  const exit = box(0.36, 0.16, 0.04, toon('#c0283a', { emissive: '#ff2a3a', emissiveIntensity: 0.8 }), 5.8, 2.45, z0 + 0.04);
  scene.add(exit);

  // Chefbüro hinten rechts mit Glaswand
  const glass = new THREE.MeshBasicMaterial({ color: '#bfe7ff', transparent: true, opacity: 0.22, depthWrite: false });
  const gw = new THREE.Mesh(new THREE.PlaneGeometry(3.2, h), glass);
  gw.position.set(5.6, h / 2, 4.6);
  scene.add(gw);
  const gw2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, h), glass);
  gw2.rotation.y = Math.PI / 2;
  gw2.position.set(4.0, h / 2, 5.8);
  scene.add(gw2);
  for (const [x, z, w, d] of [[4.0, 4.6, 0.06, 0.06], [7.1, 4.6, 0.06, 0.06], [4.0, 7.0, 0.06, 0.06]]) scene.add(box(w, h, d, mullM, x, h / 2, z));
  const bossDesk = makeDesk('#5a3a26');
  bossDesk.position.set(5.6, 0, 6.2);
  bossDesk.rotation.y = Math.PI;
  scene.add(bossDesk);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), toon('#ffffff', {
    map: canvasTex(256, 64, (c, w, hh) => {
      c.fillStyle = '#d9c38a'; c.fillRect(0, 0, w, hh);
      c.fillStyle = '#2b2b33'; c.font = `800 28px ${FONT}`; c.textAlign = 'center';
      c.fillText('H. BRANDT', w / 2, 42);
    }),
  }));
  sign.position.set(4.6, 1.7, 4.57);
  sign.rotation.y = Math.PI;
  scene.add(sign);

  // Pflanzen, Wasserspender, Drucker
  for (const [x, z] of [[-2.7, -4.4], [-2.7, 3.2], [6.6, -4.3], [-2.7, -1.6]]) {
    const p = makePlant(1.1);
    p.position.set(x, 0, z);
    scene.add(p);
  }
  const cooler = new THREE.Group();
  cooler.add(box(0.34, 1.0, 0.34, toon('#e8e8ee'), 0, 0.5, 0));
  const bottle = cyl(0.15, 0.15, 0.42, toon('#7fd0f5', { transparent: true, opacity: 0.85 }));
  bottle.position.y = 1.22;
  cooler.add(bottle);
  cooler.position.set(-2.6, 0, 5.6);
  scene.add(cooler);
  const printer = box(0.6, 0.45, 0.5, toon('#d6d6dc'), 6.6, 0.7, 1.2);
  scene.add(printer, box(0.6, 0.48, 0.5, toon('#55596a'), 6.6, 0.24, 1.2));

  // Chef
  const boss = makeBoss();
  boss.position.set(5.6, 0, 5.4);
  scene.add(boss);

  // ---- Monitor-Inhalte
  const drawMonitor = makeMonitorPainter(myScreen);

  // ---- Tageslicht setzen
  let currentDay = '';
  function setDaylight(name) {
    if (name === currentDay) return;
    currentDay = name;
    const p = DAYLIGHT[name];
    skyMat.map = skyTexs[name];
    skyMat.needsUpdate = true;
    scene.background.set(p.skyTop);
    sun.color.set(p.sun);
    sun.intensity = p.sunI;
    sun.position.set(...p.sunPos);
    hemi.color.set(p.hemiSky);
    hemi.groundColor.set(p.hemiGround);
    hemi.intensity = p.hemiI;
    amb.intensity = p.amb;
    panelMat.color.setScalar(p.panel);
    for (const b of towersDay) { b.material.map = b.userData.mats[p.lit ? 1 : 0]; b.material.needsUpdate = true; }
  }
  setDaylight('morning');

  function update(t) {
    for (const n of npcs) n.userData.animate?.(t);
  }

  return {
    scene, update, setDaylight, drawMonitor,
    lena, boss, wallClock,
  };
}

// makeGirl legt ihr Gesichtsmaterial intern an; toonify ersetzt es. Damit der Mund
// (Lip-Sync) weiter funktioniert, holen wir die drei Gesichtstexturen aus einer Referenzfigur.
function bindGirlMouth(lena) {
  const ref = makeGirl();
  const refMat = ref.userData.head.children[0].material[0];
  const maps = [0, 1, 2].map((n) => { ref.userData.setMouth(n); return refMat.map; });
  const faceMat = lena.userData.head.children[0].material[0];
  lena.userData.setMouth = (n) => {
    const m = maps[Math.max(0, Math.min(2, n | 0))];
    if (faceMat.map !== m) { faceMat.map = m; faceMat.needsUpdate = true; }
  };
}

// ---------------------------------------------------------------- Monitor-Bildschirme
function monitorStaticTex(kind, seed) {
  return canvasTex(256, 150, (c, w, h) => paintScreen(c, w, h, kind, rng(Math.abs(Math.round(seed * 7)) + 1)));
}

function paintScreen(c, w, h, kind, r = rng(1)) {
  c.fillStyle = '#f4f6fa';
  c.fillRect(0, 0, w, h);
  c.fillStyle = kind === 'excel' ? '#1f7a45' : kind === 'chart' ? '#7b5cff' : '#2b5fd9';
  c.fillRect(0, 0, w, h * 0.12);
  if (kind === 'excel') {
    c.strokeStyle = '#c9cfd8';
    c.lineWidth = 1;
    for (let y = h * 0.18; y < h; y += h * 0.07) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let x = 0; x < w; x += w * 0.14) { c.beginPath(); c.moveTo(x, h * 0.18); c.lineTo(x, h); c.stroke(); }
  } else if (kind === 'chart') {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? '#ff7ab6' : '#4fd6e0';
      const bh = h * (0.15 + r() * 0.55);
      c.fillRect(w * 0.1 + i * w * 0.1, h * 0.92 - bh, w * 0.07, bh);
    }
  } else {
    for (let y = h * 0.2; y < h - 8; y += h * 0.1) {
      c.fillStyle = '#d7dce6';
      c.fillRect(w * 0.05, y, w * (0.5 + r() * 0.4), h * 0.04);
    }
  }
}

// Großer Bildschirm an deinem Platz: Posteingang, Excel, Countdown-Tab
function makeMonitorPainter(tex) {
  let last = '';
  return function draw(kind, info = {}) {
    const key = kind + JSON.stringify(info);
    if (key === last) return;
    last = key;
    const c = tex.userData.ctx, w = 1024, h = 600;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f4f6fa';
    c.fillRect(0, 0, w, h);
    const bar = (col, title) => {
      c.fillStyle = col; c.fillRect(0, 0, w, 64);
      c.fillStyle = '#fff'; c.font = `800 30px ${FONT}`; c.textAlign = 'left';
      c.fillText(title, 24, 43);
    };
    if (kind === 'mail') {
      bar('#2b5fd9', 'Posteingang (47)');
      const mails = [
        ['H. Brandt', 'WICHTIG: Quartalsbericht Q4', true],
        ['IT-Support', 'Passwort läuft in 3 Tagen ab', false],
        ['Personal', 'Team-Event: Bowling 🎳', false],
        ['H. Brandt', 'RE: RE: RE: Quartalsbericht', true],
        ['Kantine', 'Heute: Fischstäbchen', false],
        ['Newsletter', 'Ihr Wochenrückblick', false],
      ];
      mails.forEach(([from, sub, bold], i) => {
        const y = 82 + i * 84;
        c.fillStyle = i % 2 ? '#ffffff' : '#eef1f7';
        c.fillRect(0, y, w, 84);
        c.fillStyle = bold ? '#111' : '#555';
        c.font = `${bold ? 800 : 600} 30px ${FONT}`;
        c.fillText(from, 30, y + 36);
        c.font = `${bold ? 700 : 500} 26px ${FONT}`;
        c.fillText(sub, 30, y + 70);
        if (bold) { c.fillStyle = '#e94560'; c.beginPath(); c.arc(w - 40, y + 42, 10, 0, Math.PI * 2); c.fill(); }
      });
    } else if (kind === 'excel') {
      bar('#1f7a45', 'Quartalsbericht_Q4_FINAL_v7.xlsx');
      c.font = `600 22px ${FONT}`;
      const cols = ['', 'A', 'B', 'C', 'D', 'E', 'F'];
      const cw = w / 7;
      for (let row = 0; row < 13; row++) {
        const y = 70 + row * 40;
        for (let col = 0; col < 7; col++) {
          const x = col * cw;
          c.fillStyle = row === 0 || col === 0 ? '#e3e8ee' : '#fff';
          c.fillRect(x, y, cw, 40);
          c.strokeStyle = '#c4cad3'; c.strokeRect(x, y, cw, 40);
          c.fillStyle = '#333';
          let txt = '';
          if (row === 0) txt = cols[col];
          else if (col === 0) txt = String(row);
          else if (col === 1) txt = ['Umsatz', 'Kosten', 'Marge', 'Q1', 'Q2', 'Q3', 'Q4', '', '#BEZUG!', '', '', ''][row - 1] || '';
          else if (row < 8) txt = (((row * 37 + col * 13) % 90) + 10) + '.' + ((row * col) % 9) + '00 €';
          if (txt === '#BEZUG!') c.fillStyle = '#e94560';
          c.fillText(txt, x + 10, y + 28);
        }
      }
    } else if (kind === 'gta') {
      // Heimlicher Browser-Tab: Countdown bis 18:00
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#ff5fae'); g.addColorStop(0.55, '#7b5cff'); g.addColorStop(1, '#1b1240');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e3e6ee'; c.fillRect(0, 0, w, 52);
      c.fillStyle = '#fff'; roundRect(c, 12, 8, 330, 44, 10); c.fill();
      c.fillStyle = '#333'; c.font = `700 22px ${FONT}`; c.textAlign = 'left';
      c.fillText('🌴 Release-Countdown', 28, 38);
      c.textAlign = 'center';
      c.fillStyle = '#fff';
      c.font = `900 64px ${FONT}`;
      c.fillText('GTA VI', w / 2, 190);
      c.font = `800 34px ${FONT}`;
      c.fillText('HEUTE · 18:00 UHR', w / 2, 250);
      c.font = `900 120px ${FONT}`;
      c.fillText(info.countdown || '03:47:12', w / 2, 420);
      c.font = `700 26px ${FONT}`;
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillText('bis zum Start', w / 2, 470);
    } else if (kind === 'lock') {
      c.fillStyle = '#1b2a4a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `800 60px ${FONT}`;
      c.fillText('Gesperrt', w / 2, h / 2);
    }
    c.textAlign = 'left';
    tex.needsUpdate = true;
  };
}
