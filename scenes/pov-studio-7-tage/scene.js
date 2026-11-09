// Set: Großraumbüro eines (erfundenen) Spielestudios, 3. Stock, Fensterfront zur Stadt.
// Tageszeit/Licht folgt dem Drehbuch: Morgen, Mittag, Abend (+ Alarm), Nacht.
import * as THREE from 'three';
import { toon, texMat, canvasTex, noOutline } from '../shared/toon.js';
import { preloadRocketbox, makeActor } from '../shared/rocketbox.js';
import { ACTORS, DESKS, CHAT, SHOTS } from './script.js';

const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const FONT = (w, px) => `${w} ${px}px Inter, 'Noto Color Emoji', system-ui, sans-serif`;
const ROOM = { x0: -6.5, x1: 6.5, z0: 9.5, z1: -8, h: 3.0 };

// ---------- Bildschirme ----------
function drawPlayerMonitor(c, t) {
  const W = 512, H = 300;
  c.fillStyle = '#1b1f2a'; c.fillRect(0, 0, W, H);
  if (t >= 33 && t < 46) {
    // Build kaputt
    const blink = Math.floor(t * 3) % 2;
    c.fillStyle = blink ? '#5a1218' : '#3a0d12'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ff4a5a'; c.font = FONT(800, 44); c.fillText('BUILD FAILED', 30, 80);
    c.fillStyle = '#ffd0d0'; c.font = FONT(600, 20);
    ['7.0.412 · main', 'Crash: MainMenu.cpp:1182', 'NullRef: Flamingo_AI::Init()', 'Letzter Commit: du · 17:21'].forEach((l, i) => c.fillText(l, 30, 130 + i * 32));
    return;
  }
  if (t >= 46) {
    // Nachts: Build läuft
    const p = Math.min(1, Math.max(0, (t - 46.4) / 5.2));
    c.fillStyle = '#0d1220'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#8fa3c8'; c.font = FONT(700, 22); c.fillText('BUILD 7.0.413', 30, 50);
    c.fillStyle = '#26304a'; c.fillRect(30, 120, W - 60, 34);
    c.fillStyle = p >= 1 ? '#3fe08a' : '#5fd0ff'; c.fillRect(30, 120, (W - 60) * p, 34);
    c.fillStyle = '#fff'; c.font = FONT(800, 46); c.fillText(p >= 1 ? 'OK ✓' : `${Math.floor(p * 100)} %`, 30, 230);
    return;
  }
  // Ticket-System
  c.fillStyle = '#e9ecf2'; c.fillRect(0, 0, W, 44);
  c.fillStyle = '#2a3142'; c.font = FONT(800, 20); c.fillText('BUG-4471', 18, 30);
  c.fillStyle = '#d7262e'; c.fillRect(150, 10, 110, 26); c.fillStyle = '#fff'; c.font = FONT(800, 15); c.fillText('KRITISCH', 168, 29);
  c.fillStyle = '#fff'; c.font = FONT(800, 26); c.fillText('Flamingo läuft durch Wände', 18, 88);
  c.fillStyle = '#9aa6bf'; c.font = FONT(600, 17);
  ['Gefunden: Strand-Mission, Abschnitt 2', 'Reproduzierbar: 10/10', 'Fällig: HEUTE'].forEach((l, i) => c.fillText(l, 18, 124 + i * 26));
  // kleines „Video“ des Bugs: Flamingo geht durch eine Wand
  c.fillStyle = '#7fb6d8'; c.fillRect(300, 112, 190, 150);
  c.fillStyle = '#e6cf9a'; c.fillRect(300, 222, 190, 40);
  c.fillStyle = '#8a8f99'; c.fillRect(395, 140, 18, 100);
  const fx = 320 + ((t * 30) % 150);
  c.fillStyle = '#ff7fae';
  c.beginPath(); c.ellipse(fx, 190, 16, 11, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(fx + 8, 160, 5, 28); c.beginPath(); c.arc(fx + 12, 158, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#c44'; c.fillRect(fx - 4, 200, 3, 24); c.fillRect(fx + 3, 200, 3, 24);
  // blinkender Cursor im Kommentarfeld
  c.fillStyle = '#2a3142'; c.fillRect(18, 214, 260, 48);
  if (Math.floor(t * 2) % 2) { c.fillStyle = '#fff'; c.fillRect(28, 226, 2, 24); }
}

function drawWall(c, t) {
  const W = 1024, H = 512;
  const days = t >= 59.0 ? 6 : 7;
  const glitch = t >= 58.8 && t < 59.25;
  c.fillStyle = '#0b0f1c'; c.fillRect(0, 0, W, H);
  // erfundenes Studio-Logo: Stern + Name
  c.fillStyle = '#ffd84a';
  c.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 34, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(80 + Math.cos(a) * r, 70 + Math.sin(a) * r); }
  c.fill();
  c.fillStyle = '#fff'; c.font = FONT(800, 34); c.fillText('NORTH STAR GAMES', 130, 82);
  c.fillStyle = '#8fa3c8'; c.font = FONT(700, 34); c.fillText('RELEASE IN', 60, 210);
  c.save();
  if (glitch) { c.translate((hash(Math.floor(t * 30)) - 0.5) * 40, 0); c.globalAlpha = 0.6 + hash(t) * 0.4; }
  c.fillStyle = days === 6 ? '#ff5a64' : '#fff'; c.font = FONT(900, 210); c.fillText(String(days), 60, 420);
  c.font = FONT(900, 120); c.fillText('TAGEN', 230, 420);
  c.restore();
  c.fillStyle = '#ff5a64'; c.font = FONT(800, 30);
  const bugs = t < 33 ? 1204 : t < 46 ? 1187 : t < 59 ? 1161 : 1158;
  c.fillText(`BUGS OFFEN: ${bugs.toLocaleString('de-DE')}`, 60, 475);
}

function drawPhone(c, t) {
  const W = 360, H = 720;
  c.fillStyle = '#0f1115'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff'; c.font = FONT(700, 18); c.fillText('13:05', 22, 34);
  c.fillText('▮▮▮ 61 %', W - 110, 34);
  c.fillStyle = '#1d2129'; c.fillRect(0, 50, W, 64);
  c.fillStyle = '#fff'; c.font = FONT(800, 24); c.fillText(CHAT.title, 22, 92);
  let y = 150;
  const wrap = (text, maxW) => {
    const words = text.split(' '); const lines = []; let l = '';
    for (const w of words) { const n = l ? l + ' ' + w : w; if (c.measureText(n).width > maxW && l) { lines.push(l); l = w; } else l = n; }
    if (l) lines.push(l);
    return lines;
  };
  for (const m of CHAT.messages) {
    if (t < m.t) continue;
    let text = m.text;
    if (m.me && t < m.typeTo) text = text.slice(0, Math.floor(text.length * Math.max(0, (t - m.t) / (m.typeTo - m.t))));
    const typing = m.me && t < (m.typeTo ?? 0) + 0.3;
    c.font = FONT(600, 21);
    const lines = wrap(text || ' ', 230);
    const bh = 22 + lines.length * 27 + (m.me ? 0 : 22);
    const bw = Math.max(...lines.map((l) => c.measureText(l).width), m.me ? 40 : c.measureText(m.from).width) + 32;
    if (typing) {
      // Eingabefeld unten
      c.fillStyle = '#2a2f3a'; c.fillRect(14, H - 90, W - 28, 60);
      c.fillStyle = '#fff'; c.fillText(lines[lines.length - 1] + (Math.floor(t * 3) % 2 ? '|' : ''), 30, H - 52);
      continue;
    }
    const x = m.me ? W - 16 - bw : 16;
    c.fillStyle = m.me ? '#2e7d4f' : '#262b35';
    c.beginPath(); c.roundRect(x, y, bw, bh, 16); c.fill();
    if (!m.me) { c.fillStyle = '#ffd84a'; c.font = FONT(800, 17); c.fillText(m.from, x + 16, y + 26); }
    c.fillStyle = '#fff'; c.font = FONT(600, 21);
    lines.forEach((l, i) => c.fillText(l, x + 16, y + (m.me ? 34 : 54) + i * 27));
    y += bh + 14;
  }
}

// ---------- Aufbau ----------
export async function buildScene() {
  const avatarNames = [...new Set(Object.values(ACTORS).map((a) => a.avatar))];
  const clipNames = [...new Set(Object.values(ACTORS).flatMap((a) => a.clips.map((c) => c.clip)))];
  await preloadRocketbox(avatarNames, clipNames);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9fb6d6');
  const L = ROOM.z0 - ROOM.z1, cz = (ROOM.z0 + ROOM.z1) / 2, RW = ROOM.x1 - ROOM.x0;

  // Boden (Teppichfliesen), Decke, Wände
  const carpet = canvasTex(256, 256, (c) => {
    c.fillStyle = '#6f7684'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1800; i++) { c.fillStyle = hash(i) > 0.5 ? '#767d8b' : '#686f7c'; c.fillRect(hash(i * 3) * 256, hash(i * 7) * 256, 2, 2); }
    c.strokeStyle = '#5f6572'; c.lineWidth = 3; c.strokeRect(0, 0, 256, 256);
  });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
  carpet.repeat.set(RW / 0.6, L / 0.6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, L), texMat(carpet));
  floor.rotation.x = -Math.PI / 2; floor.position.z = cz; floor.receiveShadow = true;
  scene.add(floor);
  const ceilTex = canvasTex(256, 256, (c) => { c.fillStyle = '#e4e2dc'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#b9b6ae'; c.lineWidth = 6; c.strokeRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) { c.fillStyle = '#d6d3cb'; c.fillRect(hash(i) * 250, hash(i + 9) * 250, 3, 3); } });
  ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping; ceilTex.repeat.set(RW / 1.2, L / 1.2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, L), texMat(ceilTex));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ROOM.h, cz); scene.add(ceil);
  const wallM = toon('#d9d4c8');
  scene.add(box(0.12, ROOM.h, L, wallM, ROOM.x0, ROOM.h / 2, cz));
  scene.add(box(RW, ROOM.h, 0.12, wallM, 0, ROOM.h / 2, ROOM.z1));
  scene.add(box(RW, ROOM.h, 0.12, wallM, 0, ROOM.h / 2, ROOM.z0));
  // Deckenleuchten (Panels)
  const panelMat = new THREE.MeshBasicMaterial({ color: '#f4f7ff' });
  const panels = [];
  for (let z = 7.5; z > -7.5; z -= 3) for (const x of [-3.6, 0, 3.6]) {
    const p = box(1.1, 0.03, 0.55, panelMat, x, ROOM.h - 0.02, z);
    p.castShadow = false; scene.add(p); panels.push(p);
  }

  // Fensterfront rechts (x = 6.5): Pfosten, Brüstung, Glas
  const frameM = toon('#3c4250');
  scene.add(box(0.2, 0.75, L, toon('#cfc9bb'), ROOM.x1, 0.375, cz));
  scene.add(box(0.14, 0.12, L, frameM, ROOM.x1, 0.8, cz));
  scene.add(box(0.14, 0.2, L, frameM, ROOM.x1, ROOM.h - 0.1, cz));
  for (let z = ROOM.z0; z >= ROOM.z1; z -= 1.75) scene.add(box(0.12, ROOM.h, 0.09, frameM, ROOM.x1, ROOM.h / 2, z));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(L, ROOM.h - 0.95), new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.12, depthWrite: false }));
  glass.rotation.y = -Math.PI / 2; glass.position.set(ROOM.x1 + 0.02, 0.85 + (ROOM.h - 0.95) / 2, cz);
  noOutline(glass); scene.add(glass);

  // Stadt draußen: viele Häuserblöcke bis zum Horizont, Fenster leuchten nachts
  const city = new THREE.Group(); scene.add(city);
  const winDay = canvasTex(64, 128, (c) => { c.fillStyle = '#b7b2a6'; c.fillRect(0, 0, 64, 128); c.fillStyle = '#6d7f96'; for (let y = 6; y < 128; y += 16) for (let x = 6; x < 64; x += 16) c.fillRect(x, y, 9, 9); });
  const winNight = canvasTex(64, 128, (c) => { c.fillStyle = '#1b1f2c'; c.fillRect(0, 0, 64, 128); for (let y = 6; y < 128; y += 16) for (let x = 6; x < 64; x += 16) { c.fillStyle = hash(x * 3 + y) > 0.55 ? '#ffd88a' : '#232838'; c.fillRect(x, y, 9, 9); } });
  for (const t of [winDay, winNight]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  const bMat = new THREE.MeshLambertMaterial({ map: winDay });
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const N = 900;
  const blocks = new THREE.InstancedMesh(bGeo, bMat, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  let k = 0;
  for (let i = 0; i < N; i++) {
    const gx = 14 + Math.floor(i / 30) * 9 + hash(i) * 3, gz = -60 + (i % 30) * 6 + hash(i + 1) * 2;
    const h = 6 + hash(i * 1.7) ** 2 * (gx < 40 ? 40 : 22);
    sc.set(4 + hash(i * 2) * 4, h, 3 + hash(i * 5) * 3); ps.set(gx, h / 2 - 12, gz);
    m4.compose(ps, q, sc); blocks.setMatrixAt(k++, m4);
  }
  noOutline(blocks);
  city.add(blocks);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon('#5d6470'));
  ground.rotation.x = -Math.PI / 2; ground.position.set(150, -12, 0); city.add(ground);

  // Lift hinten (z = 9.5)
  scene.add(box(1.8, 2.4, 0.08, toon('#9aa1ad'), 0, 1.2, ROOM.z0 - 0.08));
  scene.add(box(0.03, 2.3, 0.1, toon('#5b616c'), 0, 1.15, ROOM.z0 - 0.12));
  scene.add(box(0.15, 0.3, 0.05, toon('#30343c'), 1.2, 1.2, ROOM.z0 - 0.1));

  // Countdown-Wand vorne (z = -8)
  const wallTex = canvasTex(1024, 512, (c) => drawWall(c, 0));
  scene.add(box(4.3, 2.2, 0.08, toon('#111319'), 0, 1.75, ROOM.z1 + 0.1));
  const wallScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.05), new THREE.MeshBasicMaterial({ map: wallTex, toneMapped: false }));
  wallScreen.position.set(0, 1.75, ROOM.z1 + 0.15); scene.add(wallScreen);
  // Kanban/Whiteboard links an der Wand
  const board = canvasTex(512, 256, (c) => {
    c.fillStyle = '#f4f3ee'; c.fillRect(0, 0, 512, 256);
    c.fillStyle = '#333'; c.font = FONT(800, 22); ['OFFEN', 'IN ARBEIT', 'FERTIG'].forEach((h, i) => c.fillText(h, 20 + i * 170, 34));
    const cols = ['#ffd84a', '#ff9ec4', '#9be3ff', '#b6f09c'];
    for (let i = 0; i < 26; i++) { c.fillStyle = cols[i % 4]; c.fillRect(20 + (i % 3) * 170 + hash(i) * 70, 50 + hash(i * 3) * 170, 46, 36); }
  });
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), texMat(board));
  bd.rotation.y = Math.PI / 2; bd.position.set(ROOM.x0 + 0.08, 1.55, -2.5); scene.add(bd);
  // Poster
  const poster = canvasTex(256, 360, (c) => { c.fillStyle = '#ff7fae'; c.fillRect(0, 0, 256, 360); c.fillStyle = '#fff'; c.font = FONT(900, 40); c.fillText('CRUNCH', 30, 300); c.fillText('TIME', 30, 345); c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(128, 140, 80, 0, Math.PI * 2); c.fill(); });
  const pst = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.12), texMat(poster));
  pst.rotation.y = Math.PI / 2; pst.position.set(ROOM.x0 + 0.08, 1.6, 4.0); scene.add(pst);

  // ---- Schreibtische
  const deskM = toon('#e8e3d8'), legM = toon('#4a4f5a'), monM = toon('#17191f'), chairM = toon('#2a2d35');
  const codeTex = canvasTex(256, 150, (c) => { c.fillStyle = '#141824'; c.fillRect(0, 0, 256, 150); for (let r = 0; r < 12; r++) { c.fillStyle = ['#5fd0ff', '#ffd84a', '#9be3a0', '#c8a0ff'][r % 4]; c.fillRect(10 + (r % 3) * 12, 8 + r * 11.5, 40 + hash(r) * 150, 5); } });
  const nightCode = canvasTex(256, 150, (c) => { c.fillStyle = '#05070c'; c.fillRect(0, 0, 256, 150); });
  const monitorScreens = [];
  const chairs = {};
  function makeDesk(x, z, { mine = false } = {}) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    g.add(box(1.6, 0.04, 0.8, deskM, 0, 0.74, 0));
    for (const sx of [-0.76, 0.76]) g.add(box(0.05, 0.72, 0.7, legM, sx, 0.36, 0));
    g.add(box(1.6, 0.45, 0.03, toon('#8b95a8'), 0, 0.98, -0.42)); // Sichtschutz
    for (const mx of mine ? [0] : [-0.33, 0.33]) {
      g.add(box(mine ? 0.7 : 0.55, mine ? 0.42 : 0.33, 0.03, monM, mx, 1.1, -0.22));
      g.add(box(0.05, 0.2, 0.05, monM, mx, 0.86, -0.24));
      if (!mine) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.29), new THREE.MeshBasicMaterial({ map: codeTex, toneMapped: false }));
        s.position.set(mx, 1.1, -0.203); g.add(s); monitorScreens.push(s);
      }
    }
    g.add(box(0.44, 0.02, 0.15, toon('#2b2e36'), 0, 0.77, 0.12));
    g.add(box(0.07, 0.025, 0.11, toon('#2b2e36'), 0.34, 0.77, 0.14));
    // Becher + Kleinkram
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.1, 16), toon(['#c0392b', '#2e86de', '#f4efe6'][Math.floor(hash(x * 3 + z) * 3)]));
    mug.position.set(-0.6, 0.81, 0.15); g.add(mug);
    // Stuhl
    const ch = new THREE.Group(); ch.position.set(0, 0, 0.72); g.add(ch);
    ch.add(box(0.5, 0.07, 0.48, chairM, 0, 0.46, 0));
    ch.add(box(0.48, 0.55, 0.07, chairM, 0, 0.8, 0.26));
    ch.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), legM).translateY(0.24));
    ch.add(box(0.55, 0.04, 0.07, legM, 0, 0.04, 0)); ch.add(box(0.07, 0.04, 0.55, legM, 0, 0.04, 0));
    return { g, ch };
  }
  const deskRows = [4.5, 1.5, -1.5, -4.5];
  for (const z of deskRows) for (const x of [-4.6, -2.6, 2.6, 4.6]) {
    const mine = x === DESKS.du[0] && z === DESKS.du[1];
    const d = makeDesk(x, z, { mine });
    for (const [n, p] of Object.entries(DESKS)) if (p[0] === x && p[1] === z) chairs[n] = d.ch;
  }
  // Mein Monitor (groß, Inhalt je nach Szene)
  const myTex = canvasTex(512, 300, (c) => drawPlayerMonitor(c, 11));
  const myScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.387), new THREE.MeshBasicMaterial({ map: myTex, toneMapped: false }));
  myScreen.position.set(DESKS.du[0], 1.1, DESKS.du[1] - 0.203); scene.add(myScreen);
  // Flamingo-Figur auf meinem Tisch
  const fl = new THREE.Group(); fl.position.set(DESKS.du[0] + 0.5, 0.76, DESKS.du[1] + 0.05); scene.add(fl);
  const pink = toon('#ff8fb8');
  fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), pink).translateY(0.12));
  fl.children[0].scale.set(1.3, 0.85, 0.8);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.1, 8), pink); neck.position.set(0.04, 0.19, 0); neck.rotation.z = -0.3; fl.add(neck);
  fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), pink).translateX(0.06).translateY(0.245));
  for (const s of [-0.012, 0.012]) fl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6), toon('#c44')).translateY(0.04).translateZ(s));
  fl.rotation.y = -0.8;

  // ---- Handy (für die Hände, Szene 3)
  const phoneTex = canvasTex(360, 720, (c) => drawPhone(c, 24));
  const phone = new THREE.Group();
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.155, 0.009), toon('#1a1c22')));
  const ps2 = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false }));
  ps2.position.z = 0.0051; phone.add(ps2);
  const phoneWrap = new THREE.Group(); phoneWrap.add(phone);

  // ---- Figuren
  const actors = {};
  for (const [name, spec] of Object.entries(ACTORS)) {
    const a = makeActor(spec.avatar, { clips: spec.clips, path: spec.path || [], face: spec.face || [], pos: spec.pos || [0, 0, 0], yaw: spec.yaw || 0 });
    a.show = spec.show;
    scene.add(a.root);
    actors[name] = a;
  }

  // ---- Licht
  const hemi = new THREE.HemisphereLight('#f4f2ff', '#5a5650', 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe6c4', 2.2);
  sun.position.set(14, 9, 3); sun.target.position.set(0, 0, -1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  const spots = [];
  for (let z = 7.5; z > -7.5; z -= 3) for (const x of [-3.6, 3.6]) {
    const s = new THREE.SpotLight('#fff6e8', 6, 6, 0.9, 1, 1.4);
    s.position.set(x, ROOM.h - 0.05, z); s.target.position.set(x, 0, z); scene.add(s, s.target); spots.push(s);
  }
  const screenGlow = new THREE.PointLight('#8fc0ff', 0, 2.2, 1.5); screenGlow.position.set(DESKS.du[0], 1.15, DESKS.du[1] + 0.1); scene.add(screenGlow);
  const tobiGlow = new THREE.PointLight('#8fc0ff', 0, 2.0, 1.5); tobiGlow.position.set(DESKS.tobi[0], 1.15, DESKS.tobi[1] + 0.1); scene.add(tobiGlow);
  const alarm = new THREE.PointLight('#ff2a3a', 0, 14, 1.0); alarm.position.set(0, 2.6, 0); scene.add(alarm);

  const SKY = { morning: '#a9c4e6', noon: '#b7d0ee', evening: '#1d2740', night: '#0b0f1c' };
  function mood(t) { return t < 24 ? 'morning' : t < 33 ? 'noon' : t < 46 ? 'evening' : 'night'; }

  function update(t, { camPos, preCamera } = {}) {
    for (const [n, a] of Object.entries(actors)) {
      a.root.visible = !a.show || a.show.some(([s, e]) => t >= s && t < e);
      if (a.root.visible) a.update(t, camPos);
    }
    if (preCamera) return;
    const m = mood(t);
    scene.background.set(SKY[m]);
    const night = m === 'night', eve = m === 'evening';
    hemi.intensity = night ? 0.12 : eve ? 0.7 : 1.3;
    hemi.color.set(night ? '#6f86c8' : '#f4f2ff');
    sun.intensity = m === 'morning' ? 2.2 : m === 'noon' ? 1.6 : 0;
    sun.position.set(14, m === 'morning' ? 6 : 12, m === 'morning' ? 6 : 1);
    for (const s of spots) s.intensity = night ? 0 : 6;
    panelMat.color.set(night ? '#2a2d36' : '#f4f7ff');
    bMat.map = night || eve ? winNight : winDay; bMat.color.set(night || eve ? '#ffffff' : '#f2f0ea');
    screenGlow.intensity = night ? 2.5 : 0.6;
    tobiGlow.intensity = night ? 1.6 : 0;
    for (const s of monitorScreens) s.material.map = night ? nightCode : codeTex;
    // Alarm: rotes Pulsieren
    const al = t >= 33.3 && t < 37.8 ? (0.5 + 0.5 * Math.sin(t * 9)) * (1 - ease((t - 37.2) / 0.6)) : 0;
    alarm.intensity = al * 9;
    drawPlayerMonitor(myTex.userData.ctx, t); myTex.needsUpdate = true;
    drawWall(wallTex.userData.ctx, t); wallTex.needsUpdate = true;
    if (t >= 24 && t < 33) { drawPhone(phoneTex.userData.ctx, t); phoneTex.needsUpdate = true; }
  }

  return { scene, update, actors, phone: phoneWrap };
}
