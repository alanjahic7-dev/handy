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
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function placeLimb(m, a, b) {
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.z = Math.max(0.01, a.distanceTo(b));
  m.lookAt(b);
}

export function makePOV(scene, ep) {
  const camera = new THREE.PerspectiveCamera(100, 9 / 16, 0.03, 400);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const shirt = toon('#3b6fb6'), shirtDark = toon('#2f5a96'), skin = toon('#f0c19a'), jeans = toon('#2c3550'), shoe = toon('#f3f3f6');

  // Körper (dreht sich mit, Kopf = Kamera)
  const body = new THREE.Group();
  scene.add(body);
  const torso = box(0.42, 0.56, 0.24, shirt, 0, 0, 0.04);
  body.add(torso);
  const thighs = new THREE.Group();
  for (const x of [-0.1, 0.1]) {
    thighs.add(box(0.15, 0.15, 0.48, jeans, x, 0, -0.22));
    thighs.add(box(0.13, 0.44, 0.13, jeans, x, -0.24, -0.46));
    thighs.add(box(0.14, 0.08, 0.24, shoe, x, -0.48, -0.52));
  }
  body.add(thighs);

  // Handy
  const phone = new THREE.Group();
  const screenTex = canvasTex(400, 820, () => {});
  const caseMesh = box(0.078, 0.158, 0.012, toon('#15161c'), 0, 0, -0.004);
  phone.add(caseMesh);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.146), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = 0.003;
  phone.add(screen);
  body.add(phone);

  // Hände: zwei am Handy (Kinder des Handys), eine an der Maus
  const handL = box(0.05, 0.085, 0.035, skin, -0.043, -0.045, -0.02);
  const handR = box(0.05, 0.085, 0.035, skin, 0.043, -0.045, -0.02);
  const thumbR = box(0.014, 0.034, 0.012, skin, 0.036, -0.04, 0.006);
  thumbR.rotation.z = 0.35;
  phone.add(handL, handR, thumbR);
  const handMouse = box(0.06, 0.035, 0.09, skin);
  body.add(handMouse);
  const armL = limb(shirtDark, 0.075), armR = limb(shirtDark, 0.075);
  body.add(armL, armR);
  const _w = new THREE.Vector3();
  const localOf = (obj) => body.worldToLocal(obj.getWorldPosition(_w).clone());

  const paintPhone = makePhonePainter(screenTex, ep);
  let lastPos = null;
  let walkPhase = 0;

  // Hilfspunkte in Körperkoordinaten
  const lerp = (a, b, u) => a + (b - a) * u;
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const mix = (a, b, u) => a.clone().lerp(b, u);

  function update({ t, x, z, stand, yaw, pitch, fov, raise, clock }) {
    // Augenhöhe, Wippen beim Gehen
    const eye = lerp(EYE_SIT, EYE_STAND, stand);
    const pos = v3(x, 0, z);
    const speed = lastPos ? pos.distanceTo(lastPos.p) / Math.max(1e-3, Math.abs(t - lastPos.t)) : 0;
    lastPos = { p: pos.clone(), t };
    const walking = Math.min(1, speed / 0.8) * stand;
    walkPhase = t * 9.5;
    const bob = Math.sin(walkPhase) * 0.025 * walking;
    // leichtes Atmen / Handkamera
    const idleY = Math.sin(t * 1.7) * 0.004 + Math.sin(t * 0.63) * 0.003;
    const jitterYaw = Math.sin(t * 0.9) * 0.006 + Math.sin(t * 2.3) * 0.003;
    const jitterPitch = Math.sin(t * 1.3 + 1) * 0.005;

    camera.position.set(x, eye + bob + idleY, z - 0.04);
    camera.rotation.set(pitch + jitterPitch, yaw + jitterYaw, Math.sin(walkPhase * 0.5) * 0.012 * walking);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }

    // Körper: sitzend leicht mitdrehen, stehend ganz
    const bodyYaw = lerp(yaw * 0.3, yaw, stand);
    body.position.set(x, 0, z);
    body.rotation.y = bodyYaw;
    torso.position.set(0, eye - 0.5, 0.2);
    thighs.position.set(0, SEAT_Y + 0.08, 0);
    thighs.visible = stand < 0.5;

    // Handy-Positionen (Körperkoordinaten, relativ zur Augenhöhe)
    const relEye = eye;
    const low = v3(0, relEye - 0.53, -0.3);
    const high = v3(0, relEye - 0.3, -0.31);
    const standLow = v3(-0.22, relEye - 0.72, -0.12);
    const lowP = mix(low, standLow, stand);
    phone.position.copy(mix(lowP, high, raise));
    phone.rotation.set(lerp(lerp(-1.22, -0.2, stand), -0.72, raise), lerp(0.08, 0.4, stand) * (1 - raise), 0);
    
    body.updateMatrixWorld(true);
    // rechte Hand: am Handy (Daumen tippt) oder an der Maus / locker am Körper
    const onPhone = raise > 0.5 || stand > 0.5;
    handR.visible = thumbR.visible = onPhone;
    handMouse.visible = !onPhone;
    handMouse.position.set(0.34, 0.8, -0.6);
    thumbR.position.y = -0.04 + Math.sin(t * 11) * 0.006 * raise;

    const shoulderL = v3(-0.19, relEye - 0.38, 0.06), shoulderR = v3(0.19, relEye - 0.38, 0.06);
    placeLimb(armL, shoulderL, localOf(handL).add(v3(-0.005, -0.02, 0.04)));
    placeLimb(armR, shoulderR, (onPhone ? localOf(handR) : handMouse.position.clone()).add(v3(0.005, -0.02, 0.05)));

    paintPhone(t, clock);
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
  return function paint(t, clock) {
    const msgs = ep.chat.filter((m) => m.t <= t);
    const key = msgs.length + clock;
    if (key === last) return;
    last = key;
    const c = tex.userData.ctx, W = 400, H = 820;
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
