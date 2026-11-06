// Blockfiguren im Vice-Files-Stil (sitzend).
//
// Lokales System jeder Figur: Ursprung = Mitte der Sitzfläche, Figur schaut nach +x.
// userData:
//   head        – Kopf-Gruppe (für Nicken / Kopfdrehen)
//   setMouth(n) – Mund 0 = zu, 1 = halb, 2 = offen (nur wenn ein Mund sichtbar ist)
//   armR, armL  – Arm-Gruppen (Gesten)

import * as THREE from 'three';

function px(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}

const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...extra });

function block(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Box mit eigener Textur auf der Vorderseite (+x), sonst Grundfarbe
function frontBox(w, h, d, base, frontTex, x = 0, y = 0, z = 0) {
  const b = M(base);
  const f = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.9 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [f, b, b, b, b, b]);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Gesicht auf +x-Seite: Textur u läuft von +z nach -z (Blick nach +x)
function girlFace(mouth) {
  return px(16, 16, (c) => {
    c.fillStyle = '#f7c9a3';
    c.fillRect(0, 0, 16, 16);
    // Pony
    c.fillStyle = '#f3bf63';
    c.fillRect(0, 0, 16, 3);
    c.fillRect(0, 3, 4, 2);
    c.fillRect(12, 3, 4, 1);
    // Augenbrauen
    c.fillStyle = '#7a3b1e';
    c.fillRect(3, 5, 3, 1);
    c.fillRect(10, 5, 3, 1);
    // Augen
    c.fillStyle = '#ffffff';
    c.fillRect(3, 7, 3, 2);
    c.fillRect(10, 7, 3, 2);
    c.fillStyle = '#2a1608';
    c.fillRect(5, 7, 1, 2);
    c.fillRect(10, 7, 1, 2);
    // Nase
    c.fillStyle = '#e59a6f';
    c.fillRect(7, 9, 2, 2);
    // Mund
    c.fillStyle = '#4a1a10';
    if (mouth === 0) c.fillRect(7, 12, 3, 1);
    else if (mouth === 1) c.fillRect(7, 12, 3, 2);
    else { c.fillRect(6, 11, 4, 3); c.fillStyle = '#ffffff'; c.fillRect(6, 11, 4, 1); }
  });
}

function girlJacketFront() {
  return px(16, 20, (c) => {
    c.fillStyle = '#e9a66b';
    c.fillRect(0, 0, 16, 20);
    // pinkes Top mit schwarzem Reißverschluss
    c.fillStyle = '#ff5fae';
    c.fillRect(5, 1, 6, 16);
    c.fillStyle = '#111018';
    c.fillRect(7, 3, 2, 14);
    c.fillStyle = '#5be0e6';
    c.fillRect(6, 6, 1, 1);
    c.fillRect(10, 9, 1, 1);
    c.fillRect(6, 13, 1, 1);
    // Revers / Nähte
    c.fillStyle = '#c9814a';
    c.fillRect(4, 0, 1, 20);
    c.fillRect(11, 0, 1, 20);
    c.fillRect(1, 12, 3, 1);
    c.fillRect(12, 12, 3, 1);
    // pinke Schulterstreifen
    c.fillStyle = '#ff5fae';
    c.fillRect(0, 2, 2, 2);
    c.fillRect(14, 2, 2, 2);
  });
}

function detectiveFace() {
  return px(16, 16, (c) => {
    c.fillStyle = '#2b1c14';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#1a110c';
    c.fillRect(0, 9, 16, 7); // hochgeschlagener Kragen / Schal
    c.fillStyle = '#f2f2f2';
    c.fillRect(4, 6, 1, 1);
    c.fillRect(11, 6, 1, 1);
  });
}

function detectiveCoatFront() {
  return px(16, 20, (c) => {
    c.fillStyle = '#6e5527';
    c.fillRect(0, 0, 16, 20);
    // dunkle Revers in V-Form
    c.fillStyle = '#2a1d16';
    for (let y = 0; y < 10; y++) c.fillRect(4 + Math.floor(y / 3), y, 8 - 2 * Math.floor(y / 3), 1);
    c.fillStyle = '#3a2a1a';
    c.fillRect(6, 10, 4, 10);
    // Knöpfe
    c.fillStyle = '#d8d8e0';
    for (const [x, y] of [[5, 11], [10, 11], [5, 14], [10, 14]]) c.fillRect(x, y, 1, 1);
    // Gürtel mit Schnalle
    c.fillStyle = '#2a1d16';
    c.fillRect(0, 17, 16, 2);
    c.fillStyle = '#e6e6ee';
    c.fillRect(7, 17, 2, 2);
  });
}

function shoeFront(base, a, b) {
  return px(8, 4, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, 8, 4);
    c.fillStyle = a;
    c.fillRect(0, 3, 8, 1);
    if (b) { c.fillStyle = b; c.fillRect(0, 1, 8, 1); }
  });
}

// --------------------------------------------------------------- Beine & Arme
function seatedLegs(g, { pants, shoe, shoeTex, scale = 1 }) {
  const s = scale;
  const pm = M(pants);
  for (const z of [-0.075 * s, 0.075 * s]) {
    g.add(block(0.4 * s, 0.14 * s, 0.14 * s, pm, 0.13 * s, 0.07 * s, z)); // Oberschenkel
    g.add(block(0.13 * s, 0.4 * s, 0.13 * s, pm, 0.3 * s, -0.19 * s, z)); // Unterschenkel
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.08 * s, 0.15 * s), [
      new THREE.MeshStandardMaterial({ map: shoeTex, roughness: 0.8 }), M(shoe), M(shoe), M(shoe), M(shoe), M(shoe),
    ]);
    sh.position.set(0.35 * s, -0.43 * s, z);
    sh.castShadow = true;
    g.add(sh);
  }
}

function seatedArm(side, { sleeve, hand, cuff, scale = 1 }) {
  // side = +1 (rechts, -z) / -1 (links, +z)
  const s = scale;
  const arm = new THREE.Group();
  arm.position.set(-0.02 * s, 0.53 * s, -side * 0.225 * s); // Schulter
  const sm = M(sleeve);
  arm.add(block(0.11 * s, 0.24 * s, 0.11 * s, sm, 0, -0.1 * s, 0)); // Oberarm
  arm.add(block(0.26 * s, 0.1 * s, 0.1 * s, sm, 0.12 * s, -0.22 * s, side * 0.02 * s)); // Unterarm nach vorn
  if (cuff) arm.add(block(0.03 * s, 0.11 * s, 0.11 * s, M(cuff), 0.25 * s, -0.22 * s, side * 0.02 * s));
  arm.add(block(0.08 * s, 0.08 * s, 0.08 * s, M(hand), 0.3 * s, -0.22 * s, side * 0.03 * s)); // Hand
  return arm;
}

// --------------------------------------------------------------- Figur A: die Blonde
export function makeGirl() {
  const g = new THREE.Group();
  g.name = 'Character_A_Girl';
  const skin = '#f7c9a3';
  const hairM = M('#f3bf63');
  const hairDark = M('#e0a24a');

  seatedLegs(g, { pants: '#15121c', shoe: '#f3eef6', shoeTex: shoeFront('#f3eef6', '#ff3fa4', '#4fd6e0') });
  g.add(block(0.26, 0.14, 0.32, M('#15121c'), -0.01, 0.07, 0)); // Hüfte
  g.add(frontBox(0.22, 0.42, 0.34, '#e9a66b', girlJacketFront(), -0.02, 0.35, 0)); // Jacke
  g.add(block(0.24, 0.06, 0.36, M('#d68f55'), -0.02, 0.17, 0)); // Jackensaum

  const armR = seatedArm(1, { sleeve: '#e9a66b', hand: skin, cuff: '#ff5fae' });
  const armL = seatedArm(-1, { sleeve: '#e9a66b', hand: skin, cuff: '#4fd6e0' });
  g.add(armR, armL);

  // Kopf
  const head = new THREE.Group();
  head.position.set(0, 0.56, 0);
  const faces = [girlFace(0), girlFace(1), girlFace(2)];
  const faceMat = new THREE.MeshStandardMaterial({ map: faces[0], roughness: 0.9 });
  const skinM = M(skin);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), [faceMat, skinM, skinM, skinM, skinM, skinM]);
  h.position.y = 0.16;
  h.castShadow = true;
  head.add(h);
  // Haare als Schale
  head.add(block(0.33, 0.07, 0.34, hairM, -0.005, 0.33, 0)); // oben
  head.add(block(0.06, 0.32, 0.34, hairM, -0.17, 0.17, 0)); // hinten
  head.add(block(0.27, 0.2, 0.03, hairM, -0.02, 0.22, 0.165)); // Seite links
  head.add(block(0.27, 0.2, 0.03, hairM, -0.02, 0.22, -0.165)); // Seite rechts
  head.add(block(0.08, 0.16, 0.035, hairDark, -0.11, 0.06, 0.168)); // Strähne
  head.add(block(0.1, 0.22, 0.08, hairM, -0.2, 0.02, 0)); // Pferdeschwanz
  // Haarreif mit Punkten
  head.add(block(0.08, 0.035, 0.345, M('#111018'), 0.05, 0.36, 0));
  head.add(block(0.04, 0.03, 0.04, M('#ff3fa4', { emissive: '#ff3fa4', emissiveIntensity: 0.3 }), 0.06, 0.385, 0.07));
  head.add(block(0.04, 0.03, 0.04, M('#4fd6e0', { emissive: '#4fd6e0', emissiveIntensity: 0.3 }), 0.06, 0.385, -0.07));
  g.add(head);

  // Uhr am linken Handgelenk
  armL.add(block(0.04, 0.04, 0.115, M('#4fd6e0'), 0.22, -0.22, -0.02));

  g.userData = {
    head, armR, armL,
    setMouth(n) { faceMat.map = faces[Math.max(0, Math.min(2, n | 0))]; faceMat.needsUpdate = true; },
  };
  return g;
}

// --------------------------------------------------------------- Figur B: der Detektiv
export function makeDetective() {
  const g = new THREE.Group();
  g.name = 'Character_B_Detective';
  const s = 1.08;
  const coat = '#6e5527';

  seatedLegs(g, { pants: '#2e1d14', shoe: '#141012', shoeTex: shoeFront('#141012', '#e8e8ee', '#e8e8ee'), scale: s });
  g.add(block(0.27 * s, 0.14 * s, 0.33 * s, M('#2e1d14'), -0.01 * s, 0.07 * s, 0));
  // Mantelschöße über den Oberschenkeln
  for (const z of [-0.085 * s, 0.085 * s]) g.add(block(0.34 * s, 0.04 * s, 0.17 * s, M(coat), 0.1 * s, 0.16 * s, z));
  g.add(block(0.05 * s, 0.32 * s, 0.36 * s, M('#5e4720'), -0.13 * s, 0.02 * s, 0)); // Mantel hinten bis zum Sitz
  g.add(frontBox(0.23 * s, 0.44 * s, 0.36 * s, coat, detectiveCoatFront(), -0.02 * s, 0.36 * s, 0));

  const armR = seatedArm(1, { sleeve: coat, hand: '#24170f', cuff: '#2a1d16', scale: s });
  const armL = seatedArm(-1, { sleeve: coat, hand: '#24170f', cuff: '#2a1d16', scale: s });
  g.add(armR, armL);

  const head = new THREE.Group();
  head.position.set(0, 0.58 * s, 0);
  const faceMat = new THREE.MeshStandardMaterial({ map: detectiveFace(), roughness: 0.9 });
  const darkM = M('#2b1c14');
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.3 * s, 0.3 * s), [faceMat, darkM, darkM, darkM, darkM, darkM]);
  h.position.y = 0.16 * s;
  h.castShadow = true;
  head.add(h);
  // hochgeschlagener Kragen
  head.add(block(0.33 * s, 0.13 * s, 0.34 * s, M('#3a2a1a'), -0.01 * s, 0.05 * s, 0));
  // Fedora
  const hat = new THREE.Group();
  hat.position.y = 0.32 * s;
  hat.add(block(0.5 * s, 0.03 * s, 0.48 * s, M('#3d2716'), 0.02 * s, 0, 0)); // Krempe
  hat.add(block(0.32 * s, 0.05 * s, 0.32 * s, M('#a8823f'), 0, 0.04 * s, 0)); // Hutband
  hat.add(block(0.31 * s, 0.13 * s, 0.31 * s, M('#5a3a22'), 0, 0.13 * s, 0)); // Krone
  hat.add(block(0.12 * s, 0.03 * s, 0.32 * s, M('#4a301c'), 0, 0.2 * s, 0)); // Knick
  head.add(hat);
  g.add(head);

  g.userData = { head, armR, armL, hat, setMouth() {} };
  return g;
}
