// Ich-Perspektive: Kamera als Kopf, sichtbarer Körper, Hände und Handy mit Chat-Display.

import * as THREE from 'three';
import { toon, box, canvasTex, roundRect, FONT } from './scene.js';

const SEAT_Y = 0.47;
const EYE_SIT = SEAT_Y + 0.7;
const EYE_STAND = 1.52;

// Gliedmaße als Quader zwischen zwei Punkten
function limb(mat, thick) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(thick, thick, 1), mat);
  m.castShadow = true;
  return m;
}
function placeLimb(m, a, b) {
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.z = Math.max(0.01, a.distanceTo(b));
  m.lookAt(b);
}

function makeController() {
  const g = new THREE.Group();
  const body = toon('#1c1d26'), light = toon('#2a2c38');
  g.add(box(0.15, 0.03, 0.07, body, 0, 0, 0));
  for (const s of [-1, 1]) {
    const grip = box(0.045, 0.035, 0.09, body, s * 0.062, -0.006, 0.045);
    grip.rotation.y = s * 0.35;
    g.add(grip);
    const stick = box(0.022, 0.012, 0.022, light, s * 0.028, 0.02, 0.012);
    g.add(stick);
  }
  const btn = (x, z, c) => g.add(box(0.012, 0.01, 0.012, toon(c, { emissive: c, emissiveIntensity: 0.4 }), x, 0.018, z));
  btn(0.055, -0.012, '#2fe6ff'); btn(0.068, 0.0, '#ff3fa4'); btn(0.042, 0.0, '#ffd166'); btn(0.055, 0.012, '#7ef0a8');
  g.add(box(0.03, 0.004, 0.02, toon('#ff3fa4', { emissive: '#ff3fa4', emissiveIntensity: 1.2 }), 0, 0.017, -0.02));
  return g;
}

// update({ t, eye, pose, face, yaw, pitch, fov, raise, hold, screen, clock, shake, mouse, press })
//   eye   – Weltposition der Augen
//   pose  – 'sit' | 'stand' | 'lie'
//   hold  – 'phone' | 'controller' | 'none'
export function makePOV(scene, ep) {
  const camera = new THREE.PerspectiveCamera(100, 9 / 16, 0.03, 400);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const shirt = toon('#3b6fb6'), shirtDark = toon('#2f5a96'), skin = toon('#f0c19a'), jeans = toon('#2c3550'), shoe = toon('#f3f3f6');

  const body = new THREE.Group();
  scene.add(body);
  const torso = box(0.42, 0.56, 0.24, shirt, 0, 0, 0.2);
  body.add(torso);
  const thighs = new THREE.Group();
  for (const x of [-0.1, 0.1]) {
    thighs.add(box(0.15, 0.15, 0.48, jeans, x, 0, -0.22));
    thighs.add(box(0.13, 0.44, 0.13, jeans, x, -0.24, -0.46));
    thighs.add(box(0.14, 0.08, 0.24, shoe, x, -0.48, -0.52));
  }
  body.add(thighs);

  // Handy (in der Welt, Position wird zwischen Schoß und Gesicht gemischt)
  const phone = new THREE.Group();
  const screenTex = canvasTex(400, 820, () => {});
  phone.add(box(0.078, 0.158, 0.012, toon('#15161c'), 0, 0, -0.004));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.146), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = 0.003;
  phone.add(screen);
  scene.add(phone);
  const handL = box(0.05, 0.085, 0.035, skin, -0.043, -0.045, -0.02);
  const handR = box(0.05, 0.085, 0.035, skin, 0.043, -0.045, -0.02);
  const thumbR = box(0.014, 0.034, 0.012, skin, 0.036, -0.04, 0.006);
  thumbR.rotation.z = 0.35;
  phone.add(handL, handR, thumbR);

  // Controller
  const pad = makeController();
  scene.add(pad);
  const padL = box(0.05, 0.05, 0.09, skin, -0.075, -0.02, 0.06);
  const padR = box(0.05, 0.05, 0.09, skin, 0.075, -0.02, 0.06);
  const padThumb = box(0.022, 0.016, 0.03, skin, 0.055, 0.03, 0.0);
  pad.add(padL, padR, padThumb);

  const handMouse = box(0.06, 0.035, 0.09, skin);
  scene.add(handMouse);
  const armL = limb(shirtDark, 0.075), armR = limb(shirtDark, 0.075);
  scene.add(armL, armR);

  const paintPhone = makePhonePainter(screenTex, ep);
  let lastEye = null;

  const lerp = (a, b, u) => a + (b - a) * u;
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  const _w = new THREE.Vector3();

  // Ort + Drehung in Körperkoordinaten -> Welt
  function bodyPose(pos, rx, ry = 0) {
    const p = body.localToWorld(pos.clone());
    const q = body.quaternion.clone().multiply(_q.setFromEuler(_e.set(rx, ry, 0)));
    return { p, q };
  }
  function camPose(pos, rx = 0) {
    const p = camera.localToWorld(pos.clone());
    const q = camera.quaternion.clone().multiply(_q.setFromEuler(_e.set(rx, 0, 0)));
    return { p, q };
  }
  function place(obj, a, b, u) {
    obj.position.copy(a.p).lerp(b.p, u);
    obj.quaternion.copy(a.q).slerp(b.q, u);
  }

  function update({ t, eye, pose = 'sit', face = 0, yaw, pitch, fov, raise, hold = 'phone', screen: scr = 'chat', clock, shake, mouse, press = 0 }) {
    const stand = pose === 'stand' ? 1 : 0;
    const lie = pose === 'lie';
    const speed = lastEye && Math.abs(t - lastEye.t) < 0.5 ? eye.distanceTo(lastEye.p) / Math.max(1e-3, Math.abs(t - lastEye.t)) : 0;
    lastEye = { p: eye.clone(), t };
    const walking = Math.min(1, speed / 0.8) * stand;
    const walkPhase = t * 9.5;
    const bob = Math.sin(walkPhase) * 0.025 * walking;
    const idleY = Math.sin(t * 1.7) * 0.004 + Math.sin(t * 0.63) * 0.003;
    const jYaw = Math.sin(t * 0.9) * 0.006 + Math.sin(t * 2.3) * 0.003 + (shake?.[1] ?? 0);
    const jPitch = Math.sin(t * 1.3 + 1) * 0.005 + (shake?.[0] ?? 0);

    camera.position.set(eye.x, eye.y + bob + idleY, eye.z);
    camera.rotation.set(pitch + jPitch, yaw + jYaw, Math.sin(walkPhase * 0.5) * 0.012 * walking);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld(true);

    const bodyYaw = face + (yaw - face) * (stand ? 1 : 0.3);
    body.position.set(eye.x, 0, eye.z + 0.04);
    body.rotation.y = bodyYaw;
    body.updateMatrixWorld(true);
    const ey = eye.y;
    torso.position.y = ey - 0.5;
    torso.visible = !lie;
    thighs.position.y = ey - 0.62;
    thighs.visible = pose === 'sit';

    // Handy
    phone.visible = hold === 'phone';
    if (phone.visible) {
      let low;
      if (lie) low = camPose(v3(0.18, -0.42, -0.12), 0.6);
      else if (stand) low = bodyPose(v3(-0.22, ey - 0.72, -0.12), -0.2, 0.4);
      else low = bodyPose(v3(0, ey - 0.53, -0.3), -1.22);
      const high = camPose(v3(0, -0.03, -0.31));
      place(phone, low, high, raise);
      thumbR.position.y = -0.04 + Math.sin(t * 11) * 0.006 * raise;
    }

    // Controller
    pad.visible = hold === 'controller';
    if (pad.visible) {
      place(pad, bodyPose(v3(0, ey - 0.5, -0.28), 0.9), bodyPose(v3(0, ey - 0.36, -0.36), 0.75), raise);
      padThumb.position.y = 0.03 - press * 0.012;
    }

    // rechte Hand an der Maus (Büro), wenn das Handy unten ist
    const atMouse = mouse && hold === 'phone' && raise < 0.5 && pose === 'sit';
    handR.visible = thumbR.visible = !atMouse;
    handMouse.visible = !!atMouse;
    if (atMouse) handMouse.position.copy(mouse);

    // Arme (liegend unsichtbar)
    armL.visible = armR.visible = !lie && hold !== 'none';
    if (armL.visible) {
      const shL = body.localToWorld(v3(-0.19, ey - 0.38, 0.06));
      const shR = body.localToWorld(v3(0.19, ey - 0.38, 0.06));
      const hl = hold === 'controller' ? padL : handL;
      const hr = hold === 'controller' ? padR : (atMouse ? handMouse : handR);
      const back = (o, s) => o.getWorldPosition(_w).clone().add(body.localToWorld(v3(s * 0.005, -0.02, 0.05)).sub(body.position));
      placeLimb(armL, shL, back(hl, -1));
      placeLimb(armR, shR, back(hr, 1));
    }

    if (phone.visible) paintPhone(t, clock, scr);
  }

  return { camera, update, phone };
}

// ---------------------------------------------------------------- Handy-Display: Gruppenchat
function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function makePhonePainter(tex, ep) {
  let last = '';
  return function paint(t, clock, scr = 'chat') {
    const msgs = ep.chat.filter((m) => m.t <= t);
    const key = scr + msgs.length + clock;
    if (key === last) return;
    last = key;
    const c = tex.userData.ctx, W = 400, H = 820;
    if (scr === 'alarm') { paintAlarm(c, W, H, clock, ep); tex.needsUpdate = true; return; }
    c.clearRect(0, 0, W, H);
    // Hintergrund
    c.fillStyle = '#ece5dc';
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < H; y += 40) for (let x = (y / 40) % 2 ? 20 : 0; x < W; x += 40) c.fillRect(x, y, 6, 6);
    // Statusleiste
    c.fillStyle = '#1e7a4c';
    c.fillRect(0, 0, W, 130);
    c.fillStyle = '#fff';
    c.font = `700 22px ${FONT}`;
    c.textAlign = 'left';
    c.fillText(clock, 24, 34);
    c.textAlign = 'right';
    c.fillText('5G ▮▮▮ 87%', W - 20, 34);
    c.textAlign = 'left';
    c.fillStyle = '#ffd166';
    c.beginPath(); c.arc(50, 88, 26, 0, Math.PI * 2); c.fill();
    c.font = `30px ${FONT}`;
    c.fillText('🌴', 34, 99);
    c.fillStyle = '#fff';
    c.font = `800 28px ${FONT}`;
    c.fillText('Leonida Crew', 90, 86);
    c.font = `500 18px ${FONT}`;
    c.fillText('Kevin, Mo, Du', 90, 112);

    // Nachrichten von unten nach oben
    let y = H - 96;
    c.fillStyle = '#f7f7f7';
    c.fillRect(0, H - 80, W, 80);
    c.fillStyle = '#fff';
    roundRect(c, 16, H - 66, W - 100, 50, 25);
    c.fill();
    c.fillStyle = '#999';
    c.font = `500 20px ${FONT}`;
    c.fillText('Nachricht', 36, H - 34);
    c.fillStyle = '#1e7a4c';
    c.beginPath(); c.arc(W - 46, H - 41, 26, 0, Math.PI * 2); c.fill();

    c.save();
    c.beginPath();
    c.rect(0, 132, W, H - 216);
    c.clip();
    for (let i = msgs.length - 1; i >= 0 && y > 150; i--) {
      const m = msgs[i];
      c.font = `600 25px ${FONT}`;
      const lines = wrap(c, m.text, 250);
      const tw = Math.max(...lines.map((l) => c.measureText(l).width));
      const nameH = m.me ? 0 : 28;
      const imgH = m.img ? 120 : 0;
      const bh = nameH + lines.length * 32 + 20 + imgH;
      const bw = Math.max(tw, m.img ? 250 : 0, m.me ? 0 : 90) + 32;
      y -= bh;
      const x = m.me ? W - bw - 16 : 16;
      c.fillStyle = m.me ? '#d3f7c4' : '#ffffff';
      roundRect(c, x, y, bw, bh, 16);
      c.fill();
      let ty = y + 10;
      if (!m.me) {
        c.fillStyle = ep.chatColors?.[m.from] || '#c0392b';
        c.font = `800 21px ${FONT}`;
        c.fillText(m.from, x + 16, ty + 20);
        ty += nameH;
      }
      if (m.img === 'preload') {
        // „Screenshot“: Download-Balken bei 100 %
        c.fillStyle = '#1b1240';
        roundRect(c, x + 12, ty + 4, bw - 24, imgH - 12, 10);
        c.fill();
        const g = c.createLinearGradient(x, 0, x + bw, 0);
        g.addColorStop(0, '#ff5fae'); g.addColorStop(1, '#7b5cff');
        c.fillStyle = '#fff';
        c.font = `800 20px ${FONT}`;
        c.fillText('GTA VI · Preload', x + 26, ty + 40);
        c.fillStyle = '#3a3360';
        roundRect(c, x + 26, ty + 58, bw - 52, 18, 9); c.fill();
        c.fillStyle = g;
        roundRect(c, x + 26, ty + 58, bw - 52, 18, 9); c.fill();
        c.fillStyle = '#7ef0a8';
        c.font = `800 18px ${FONT}`;
        c.fillText('100 % ✓', x + 26, ty + 98);
        ty += imgH;
      }
      c.fillStyle = '#111';
      c.font = `600 25px ${FONT}`;
      lines.forEach((l, k) => c.fillText(l, x + 16, ty + 26 + k * 32));
      y -= 14;
    }
    c.restore();
    tex.needsUpdate = true;
  };
}

// Sperrbildschirm mit Wecker und Countdown-Widget
function paintAlarm(c, W, H, clock, ep) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a1650'); g.addColorStop(0.55, '#ff5fae'); g.addColorStop(1, '#ffb36b');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#140a2a';
  for (const [x, s] of [[0.15, 1], [0.86, 0.85]]) {
    c.fillRect(W * x - 5, H * (0.55 + (1 - s) * 0.15), 10, H);
    for (let k = 0; k < 6; k++) {
      c.save(); c.translate(W * x, H * (0.55 + (1 - s) * 0.15)); c.rotate((k / 6) * Math.PI * 2);
      c.fillRect(0, -5, 80 * s, 10); c.restore();
    }
  }
  c.fillStyle = '#fff'; c.textAlign = 'center';
  c.font = `700 24px ${FONT}`;
  c.fillText(ep.dateLine || 'Mittwoch, 18. November', W / 2, 90);
  c.font = `800 120px ${FONT}`;
  c.fillText(clock, W / 2, 210);
  // Wecker-Karte
  c.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(c, 24, 260, W - 48, 120, 22); c.fill();
  c.fillStyle = '#111'; c.textAlign = 'left';
  c.font = `800 24px ${FONT}`;
  c.fillText('⏰ Wecker', 46, 300);
  c.font = `900 34px ${FONT}`;
  c.fillText('AUFSTEHEN 🌴', 46, 348);
  // Countdown-Widget
  c.fillStyle = 'rgba(20,10,42,0.85)';
  roundRect(c, 24, 400, W - 48, 130, 22); c.fill();
  c.fillStyle = '#ff8fc8'; c.font = `800 22px ${FONT}`;
  c.fillText('GTA VI · Release', 46, 440);
  c.fillStyle = '#fff'; c.font = `900 40px ${FONT}`;
  const [hh, mm] = clock.split(':').map(Number);
  const left = 24 * 60 - (hh * 60 + mm);
  c.fillText(`noch ${Math.floor(left / 60)} Std ${left % 60} Min`, 46, 490);
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = `600 18px ${FONT}`;
  c.fillText('heute 00:00 · Preload ✓ seit 10.11.', 46, 518);
  c.textAlign = 'left';
}
