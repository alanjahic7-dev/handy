// Set: Serverraum in der Launch-Nacht (Toon-Stil, Ich-Perspektive).
// Gang zwischen zwei Rack-Reihen, am Ende Wand-Monitor „Launch Control“ und Schreibtisch.
import * as THREE from 'three';
import { toon, canvasTex, noOutline, makePerson, texMat } from '../shared/toon.js';
import { LAUNCH, ALERT, CHEER, LINES } from './script.js';

const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

const ROOM = { x0: -3.2, x1: 3.2, z0: 3.5, z1: -12.6, h: 3.0 };
const RACK_Z = Array.from({ length: 15 }, (_, i) => 1.6 - i * 0.66);
const RACK_X = 1.55;
const ALERT_RACKS = new Set([12, 13]); // Index auf der rechten Seite (z ≈ -6.3 / -7)

function floorTex() {
  const t = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#8a90a3';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#555b6e';
    c.lineWidth = 6;
    c.strokeRect(0, 0, w, h);
    c.fillStyle = '#737a8e';
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      c.beginPath();
      c.arc(40 + x * 39, 40 + y * 39, 7, 0, Math.PI * 2);
      c.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6.4 / 0.6, 16 / 0.6);
  return t;
}

function rackFront(seed) {
  return canvasTex(128, 448, (c, w, h) => {
    c.fillStyle = '#1d212c';
    c.fillRect(0, 0, w, h);
    let y = 14;
    let i = 0;
    while (y < h - 20) {
      const u = 1 + Math.floor(hash(seed * 31 + i) * 3);
      const hh = u * 18;
      c.fillStyle = ['#2c3242', '#343b4e', '#272c39'][i % 3];
      c.fillRect(8, y, w - 16, hh - 3);
      c.fillStyle = '#151820';
      for (let k = 0; k < u * 2; k++) c.fillRect(36, y + 4 + k * 8, 60, 3);
      y += hh;
      i++;
    }
    c.strokeStyle = '#0d0f14';
    c.lineWidth = 4;
    c.strokeRect(2, 2, w - 4, h - 4);
  });
}

// Wand-Monitor: Countdown, Spielerzahl, Kurve, Status
function drawMonitor(ctx, t) {
  const W = 1024, H = 576;
  const alert = t >= ALERT[0] && t < ALERT[1];
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5fd0ff';
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  ctx.fillText('LAUNCH CONTROL  ·  EU-WEST', 36, 54);
  ctx.fillStyle = '#7d8bb0';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('SPIELER ONLINE', 36, 112);
  const since = t - LAUNCH;
  const players = since <= 0 ? 0 : Math.floor(14_800_000 * (1 - Math.exp(-since / 1.6)) + since * 12345);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 84px Inter, system-ui, sans-serif';
  ctx.fillText(players.toLocaleString('de-DE'), 36, 196);
  // Countdown
  if (since < 0) {
    const s = Math.max(0, Math.ceil(-since));
    ctx.fillStyle = '#ffd84a';
    ctx.font = 'bold 120px Inter, system-ui, sans-serif';
    const txt = `00:00:${String(s).padStart(2, '0')}`;
    ctx.fillText(txt, W - 36 - ctx.measureText(txt).width, 196);
    ctx.font = '600 22px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#7d8bb0';
    ctx.fillText('BIS ZUM START', W - 36 - ctx.measureText('BIS ZUM START').width, 112);
  } else {
    ctx.fillStyle = '#3fe08a';
    ctx.font = 'bold 72px Inter, system-ui, sans-serif';
    const txt = 'LIVE';
    ctx.fillText(txt, W - 36 - ctx.measureText(txt).width, 190);
  }
  // Kurve
  const gx = 36, gy = 240, gw = W - 72, gh = 240;
  ctx.strokeStyle = '#1f2a48';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(gx, gy + (gh * i) / 4); ctx.lineTo(gx + gw, gy + (gh * i) / 4); ctx.stroke(); }
  const win = 14;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const tt = t - win + (win * i) / 200;
    const s = tt - LAUNCH;
    const v = s <= 0 ? 0.02 + 0.01 * Math.sin(tt * 3) : Math.min(1, 1 - Math.exp(-s / 1.6)) * 0.92 + 0.02;
    const x = gx + (gw * i) / 200, y = gy + gh - v * gh;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.strokeStyle = alert ? '#ff4a5a' : '#5fd0ff';
  ctx.lineWidth = 7;
  ctx.stroke();
  // Status
  const blink = Math.floor(t * 4) % 2 === 0;
  ctx.fillStyle = alert ? (blink ? '#d7262e' : '#7a1218') : '#143a28';
  ctx.fillRect(36, 500, W - 72, 52);
  ctx.fillStyle = alert ? '#fff' : '#3fe08a';
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillText(alert ? '⚠  SERVER 3 · LAST 99 %' : '●  ALLE SYSTEME OK', 56, 536);
}

export function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0e18');

  // ---- Raum
  const room = new THREE.Group();
  scene.add(room);
  const L = ROOM.z0 - ROOM.z1, cz = (ROOM.z0 + ROOM.z1) / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.x1 - ROOM.x0, L), texMat(floorTex()));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = cz;
  floor.receiveShadow = true;
  room.add(floor);
  const wall = toon('#525a72');
  room.add(box(0.1, ROOM.h, L, wall, ROOM.x0, ROOM.h / 2, cz));
  room.add(box(0.1, ROOM.h, L, wall, ROOM.x1, ROOM.h / 2, cz));
  room.add(box(ROOM.x1 - ROOM.x0, ROOM.h, 0.1, toon('#454c63'), 0, ROOM.h / 2, ROOM.z1));
  room.add(box(ROOM.x1 - ROOM.x0, ROOM.h, 0.1, wall, 0, ROOM.h / 2, ROOM.z0));
  const ceil = box(ROOM.x1 - ROOM.x0, 0.1, L, toon('#6b7286'), 0, ROOM.h, cz);
  room.add(ceil);
  // Deckenraster
  const grid = toon('#4a5064');
  for (let z = ROOM.z0; z > ROOM.z1; z -= 1.2) room.add(box(ROOM.x1 - ROOM.x0, 0.03, 0.04, grid, 0, ROOM.h - 0.06, z));
  for (let x = ROOM.x0; x < ROOM.x1; x += 1.2) room.add(box(0.04, 0.03, L, grid, x, ROOM.h - 0.06, cz));
  // Kabeltrassen über den Racks
  const tray = toon('#d6a520');
  for (const s of [-1, 1]) {
    room.add(box(0.5, 0.05, L - 1.5, tray, RACK_X * s, 2.62, cz + 0.6));
    for (let z = 2.5; z > -10; z -= 1.5) room.add(box(0.03, 0.35, 0.03, toon('#8b8f99'), (RACK_X - 0.24) * s, 2.8, z));
  }
  // Leuchtstoffröhren im Gang
  const lampMat = new THREE.MeshBasicMaterial({ color: '#e8f2ff' });
  for (let z = 2; z > -12; z -= 2.4) {
    room.add(box(0.36, 0.06, 1.3, toon('#c9ced8'), 0, ROOM.h - 0.08, z));
    const tube = box(0.26, 0.02, 1.18, lampMat, 0, ROOM.h - 0.115, z);
    tube.castShadow = false;
    room.add(tube);
  }
  // Tür hinten (Start)
  room.add(box(1.1, 2.2, 0.08, toon('#525a74'), 0, 1.1, ROOM.z0 - 0.06));
  const exit = canvasTex(256, 96, (c) => { c.fillStyle = '#1a8f4a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#fff'; c.font = 'bold 60px Inter, sans-serif'; c.fillText('EXIT', 64, 70); });
  room.add(box(0.5, 0.18, 0.04, new THREE.MeshBasicMaterial({ map: exit }), 0, 2.45, ROOM.z0 - 0.12));

  // ---- Racks + LEDs
  const sideMat = toon('#1a1e28');
  const topMat = toon('#232836');
  const ledPos = [];
  RACK_Z.forEach((z, i) => {
    for (const s of [-1, 1]) {
      const front = texMat(rackFront(i * 2 + (s > 0 ? 1 : 0)));
      // Front zeigt zum Gang (+x links, -x rechts)
      const mats = s < 0 ? [front, sideMat, topMat, sideMat, sideMat, sideMat] : [sideMat, front, topMat, sideMat, sideMat, sideMat];
      const r = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.62), mats);
      r.position.set(s * (RACK_X + 0.5), 1.05, z);
      r.castShadow = r.receiveShadow = true;
      scene.add(r);
      // Tür-Griff + Schild
      scene.add(box(0.02, 0.3, 0.03, toon('#9aa0ad'), s * (RACK_X - 0.01), 1.15, z + 0.24));
      // LEDs
      for (let k = 0; k < 22; k++) {
        const y = 0.35 + (k % 11) * 0.15 + hash(i * 7 + k + s) * 0.05;
        const zz = z - 0.2 + (k < 11 ? 0 : 0.06) + hash(i + k * 3) * 0.02;
        ledPos.push({ x: s * (RACK_X - 0.012), y, z: zz, side: s, rack: i, k });
      }
    }
  });
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.022, 0.022), new THREE.MeshBasicMaterial({ toneMapped: false }), ledPos.length);
  const m4 = new THREE.Matrix4();
  ledPos.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); leds.setMatrixAt(i, m4); leds.setColorAt(i, new THREE.Color('#3fe08a')); });
  noOutline(leds);
  scene.add(leds);

  // Rote Warnleuchte über den Alarm-Racks
  const beacon = box(0.12, 0.1, 0.12, new THREE.MeshBasicMaterial({ color: '#4a0d10' }), RACK_X - 0.1, 2.25, -6.6);
  scene.add(beacon);

  // ---- Stirnwand: großer Monitor + Seiten-Bildschirme
  const monTex = canvasTex(1024, 576, (c) => drawMonitor(c, 0));
  const monCtx = monTex.userData.ctx;
  scene.add(box(2.75, 1.6, 0.08, toon('#111319'), 0, 1.95, ROOM.z1 + 0.1));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.46), new THREE.MeshBasicMaterial({ map: monTex, toneMapped: false }));
  screen.position.set(0, 1.95, ROOM.z1 + 0.15);
  scene.add(screen);
  const sideTex = canvasTex(256, 160, (c) => {
    c.fillStyle = '#0a0f1e'; c.fillRect(0, 0, 256, 160);
    c.strokeStyle = '#5fd0ff'; c.lineWidth = 3;
    for (let r = 0; r < 6; r++) { c.beginPath(); c.moveTo(14, 24 + r * 22); c.lineTo(60 + hash(r) * 170, 24 + r * 22); c.stroke(); }
  });
  for (const s of [-1, 1]) {
    scene.add(box(0.95, 0.6, 0.06, toon('#111319'), s * 2.1, 2.05, ROOM.z1 + 0.1));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.53), new THREE.MeshBasicMaterial({ map: sideTex, toneMapped: false }));
    sc.position.set(s * 2.1, 2.05, ROOM.z1 + 0.14);
    scene.add(sc);
  }

  // ---- Schreibtisch mit Monitoren, Pizza, Dosen
  const desk = new THREE.Group();
  desk.position.set(0, 0, -11.35);
  scene.add(desk);
  const wood = toon('#6b5a4a');
  desk.add(box(3.6, 0.06, 0.8, wood, 0, 0.75, 0));
  for (const x of [-1.7, 1.7]) desk.add(box(0.06, 0.75, 0.7, toon('#3a3f4a'), x, 0.375, 0));
  const deskScreen = canvasTex(256, 160, (c) => {
    c.fillStyle = '#101a30'; c.fillRect(0, 0, 256, 160);
    c.fillStyle = '#3fe08a'; c.font = 'bold 14px monospace';
    for (let r = 0; r < 9; r++) c.fillText('> ' + 'deploy ok · shard ' + (r * 7 + 3), 10, 20 + r * 16);
  });
  for (const x of [-1.15, -0.45, 0.45, 1.15]) {
    desk.add(box(0.6, 0.36, 0.04, toon('#15171e'), x, 1.05, -0.15));
    desk.add(box(0.05, 0.2, 0.05, toon('#15171e'), x, 0.86, -0.17));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.31), new THREE.MeshBasicMaterial({ map: deskScreen, toneMapped: false }));
    p.position.set(x, 1.05, -0.125);
    desk.add(p);
    desk.add(box(0.42, 0.02, 0.14, toon('#2a2d36'), x, 0.79, 0.15));
  }
  // Pizzakarton (offen) + Dosen
  const pizzaLid = canvasTex(256, 256, (c) => { c.fillStyle = '#d9b98a'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#c0392b'; c.font = 'bold 54px Inter, sans-serif'; c.fillText('PIZZA', 50, 145); });
  desk.add(box(0.42, 0.04, 0.42, toon('#d9b98a'), 1.55, 0.8, 0.2));
  const lid = box(0.42, 0.42, 0.01, texMat(pizzaLid), 1.55, 1.01, -0.01);
  desk.add(lid);
  desk.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 3, 1, false, 0, Math.PI * 1.2), toon('#e7b94a')).translateX(1.55).translateY(0.83).translateZ(0.2));
  const canCols = ['#3fe08a', '#ff5fae', '#5fd0ff', '#3fe08a'];
  canCols.forEach((col, i) => desk.add(box(0.065, 0.12, 0.065, toon(col), -1.6 + i * 0.12, 0.84, 0.25 + (i % 2) * 0.08)));
  // Bürostühle
  const chair = (x, z, rot) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    g.add(box(0.5, 0.08, 0.5, toon('#22252e'), 0, 0.47, 0));
    g.add(box(0.48, 0.6, 0.08, toon('#22252e'), 0, 0.82, -0.24));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), toon('#555a66')).translateY(0.24));
    g.add(box(0.55, 0.04, 0.08, toon('#555a66'), 0, 0.04, 0));
    g.add(box(0.08, 0.04, 0.55, toon('#555a66'), 0, 0.04, 0));
    scene.add(g);
    return g;
  };

  // ---- Figuren
  const actors = new THREE.Group();
  scene.add(actors);
  const tobi = makePerson({ skin: '#e8b48a', hair: '#5a3418', top: '#2e7d74', pants: '#2a2f45', headset: true });
  tobi.position.set(0.75, 0, -10.4);
  actors.add(tobi);
  const miaChair = chair(-0.95, -10.75, Math.PI);
  const mia = makePerson({ skin: '#a86b43', hair: '#1c1410', hairStyle: 'ponytail', top: '#e6b422', pants: '#2d3a5a', glasses: true });
  mia.userData.pose('sit');
  mia.position.set(0, 0.02, 0.05);
  miaChair.add(mia);
  // Kollege am Seitentisch (links), Rücken zur Kamera
  const side = new THREE.Group();
  side.position.set(-2.55, 0, -9.6);
  scene.add(side);
  side.add(box(0.7, 0.05, 1.4, wood, 0, 0.75, 0));
  side.add(box(0.05, 0.35, 0.6, toon('#15171e'), -0.25, 1.05, 0));
  const sideP = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.31), new THREE.MeshBasicMaterial({ map: deskScreen, toneMapped: false }));
  sideP.rotation.y = Math.PI / 2;
  sideP.position.set(-0.22, 1.05, 0);
  side.add(sideP);
  const benChair = chair(-1.95, -9.6, -Math.PI / 2);
  const ben = makePerson({ skin: '#f1c39c', hair: '#c98a3c', hairStyle: 'cap', top: '#7b4fa8', pants: '#1b1a26' });
  ben.userData.pose('sit');
  ben.position.set(0, 0.02, 0.05);
  benChair.add(ben);

  // ---- Licht
  scene.add(new THREE.HemisphereLight('#c9d2ee', '#2a2c38', 0.9));
  const key = new THREE.DirectionalLight('#e2e8ff', 1.4);
  key.position.set(2, 6, 4);
  key.target.position.set(0, 0, -8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 8, bottom: -8, near: 1, far: 30 });
  key.shadow.bias = -0.0005;
  scene.add(key, key.target);
  // Lichtkegel unter den Deckenleuchten (weiche Lichtpfützen auf dem Boden)
  const aisle = [];
  for (let z = 2; z > -12; z -= 2.4) {
    const l = new THREE.SpotLight('#c4d2ff', 9, 7, 0.75, 1.0, 1.4);
    l.position.set(0, 2.85, z);
    l.target.position.set(0, 0, z - 0.2);
    scene.add(l, l.target);
    aisle.push(l);
  }
  const monLight = new THREE.PointLight('#6fc8ff', 6, 6, 1.2);
  monLight.position.set(0, 1.9, -11.6);
  scene.add(monLight);
  const red = new THREE.PointLight('#ff2a3a', 0, 6, 1.0);
  red.position.set(0.8, 2.1, -6.6);
  scene.add(red);

  // ---- Animation (deterministisch über t)
  const col = new THREE.Color();
  const GREEN = new THREE.Color('#3fe08a'), AMBER = new THREE.Color('#ffb02e'), BLUE = new THREE.Color('#5fd0ff'), RED = new THREE.Color('#ff2433'), OFF = new THREE.Color('#123020');
  const talking = (who, t) => LINES.some((l) => (l.who === who || (l.who === 'alle' && who !== 'du')) && t >= l.t0 && t < l.t1 - 0.15);
  const faceY = (obj, wx, wz, worldPos) => Math.atan2(wx - worldPos.x, wz - worldPos.z);

  function update(t, camPos) {
    const alert = t >= ALERT[0] && t < ALERT[1];
    const since = t - LAUNCH;
    // LEDs: zufälliges Blinken; nach dem Launch hektischer; Alarm-Racks rot
    ledPos.forEach((p, i) => {
      const rate = 1.5 + hash(i) * 3 + (since > 0 ? 6 : 0);
      const on = hash(i * 13.7 + Math.floor(t * rate + hash(i) * 10)) > 0.35;
      let c = [GREEN, GREEN, GREEN, AMBER, BLUE][Math.floor(hash(i * 3.3) * 5)];
      if (alert && p.side > 0 && ALERT_RACKS.has(p.rack)) c = Math.floor(t * 6) % 2 ? RED : OFF;
      else if (alert && p.side > 0 && hash(i * 5.1) > 0.6) c = RED;
      col.copy(on ? c : OFF);
      leds.setColorAt(i, col);
    });
    leds.instanceColor.needsUpdate = true;
    const pulse = alert ? 0.5 + 0.5 * Math.sin(t * 12) : 0;
    red.intensity = alert ? 5 * pulse + 1.5 : 0;
    beacon.material.color.set(alert ? (pulse > 0.5 ? '#ff2433' : '#7a1218') : '#4a0d10');
    for (const l of aisle) l.color.set(alert ? '#c49cff' : '#b4c6ff');

    // Monitor neu zeichnen
    drawMonitor(monCtx, t);
    monTex.needsUpdate = true;
    monLight.color.set(alert ? '#ff4a5a' : since > 0 ? '#7fffc0' : '#6fc8ff');

    // Tobi: schaut zur Kamera, beim Countdown zum Monitor, beim Alarm zum Rack, dann Jubel
    const tw = tobi.position;
    const toCam = camPos ? faceY(tobi, camPos.x, camPos.z, tw) : 0;
    const toMon = Math.PI;
    const toRack = faceY(tobi, 1.5, -6.7, tw);
    let yaw;
    if (t < 2.6) yaw = toMon;
    else if (t < 9.2) yaw = lerpAngle(toMon, toCam, ease((t - 2.6) / 0.6));
    else if (t < 13.6) yaw = lerpAngle(toCam, toMon, ease((t - 9.2) / 0.5));
    else if (t < 15.6) yaw = lerpAngle(toMon, toRack, ease((t - 13.6) / 0.4));
    else yaw = lerpAngle(toRack, toCam, ease((t - 15.6) / 0.6));
    tobi.rotation.y = yaw;
    const u = tobi.userData;
    const ch = ease((t - CHEER) / 0.35);
    const jump = t > CHEER && t < CHEER + 2 ? Math.abs(Math.sin((t - CHEER) * 7)) * 0.12 * (1 - (t - CHEER) / 2) : 0;
    u.body.position.y = jump;
    u.armL.rotation.set(0, 0, 0.09 + ch * 2.5);
    u.armR.rotation.set(0, 0, -0.09 - ch * 2.5);
    u.elbowL.rotation.z = ch * 0.3;
    u.elbowR.rotation.z = -ch * 0.3;
    // Nervös: Hände vor dem Gesicht während „Komm schon“
    const nerv = t > 15.6 && t < CHEER ? ease((t - 15.6) / 0.3) : 0;
    if (nerv) { u.armL.rotation.x = -1.2 * nerv; u.armR.rotation.x = -1.2 * nerv; u.elbowL.rotation.x = -1.4 * nerv; u.elbowR.rotation.x = -1.4 * nerv; }
    else { u.elbowL.rotation.x = 0; u.elbowR.rotation.x = 0; }
    u.head.rotation.x = Math.sin(t * 1.7) * 0.03 - (t > 9.2 && t < 13.6 ? 0.12 : 0);
    u.setTalk(talking('tobi', t) ? Math.abs(Math.sin(t * 17)) : 0);

    // Mia: tippt, dreht sich zum Jubel und spricht
    const mu = mia.userData;
    const turn = ease((t - 19.2) / 0.6);
    miaChair.rotation.y = Math.PI - turn * 2.6;
    const cheerM = ease((t - CHEER - 0.3) / 0.4) * (1 - ease((t - 19.4) / 0.5));
    mu.armL.rotation.set(-1.1 * (1 - cheerM), 0, 0.09 + cheerM * 2.5);
    mu.armR.rotation.set(-1.1 * (1 - cheerM), 0, -0.09 - cheerM * 2.5);
    mu.elbowL.rotation.x = mu.elbowR.rotation.x = -0.3 * (1 - cheerM) + Math.sin(t * 20) * 0.05 * (1 - cheerM) * (t < 9 ? 1 : 0);
    mu.head.rotation.x = 0.05 * Math.sin(t * 2.1);
    mu.setTalk(talking('mia', t) ? Math.abs(Math.sin(t * 16 + 1)) : 0);

    // Ben: tippt, Jubel
    const bu = ben.userData;
    const cheerB = ease((t - CHEER - 0.15) / 0.35);
    bu.armL.rotation.set(-1.1 * (1 - cheerB), 0, 0.09 + cheerB * 2.6);
    bu.armR.rotation.set(-1.1 * (1 - cheerB), 0, -0.09 - cheerB * 2.6);
    bu.head.rotation.y = since > 0 && since < 1.5 ? 0.4 : 0;
    bu.setTalk(talking('ben', t) ? 1 : 0);
  }

  return { scene, update, actors };
}

function lerpAngle(a, b, k) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
