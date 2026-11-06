// Café am Ocean Drive – prozedurale 3D-Landschaft (Three.js)
//
// Koordinatensystem (Meter):
//   +y = oben
//   -z = Häuserzeile (Art-Deco-Fassaden), Café-Terrasse auf dem Gehweg davor
//   +z = Straße -> Park mit Palmen -> Strand -> Ozean
//   x  = entlang des Ocean Drive
//
// Der Haupttisch steht bei ANCHORS.table; Figur A sitzt links (-x) und schaut
// nach +x, Figur B sitzt rechts (+x) und schaut nach -x.

import * as THREE from 'three';
import { makeGirl, makeDetective, makeNPC } from './characters.js';

// ---------------------------------------------------------------- utilities
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(1985);
const R = (a, b) => a + (b - a) * rand();

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, flatShading: true, ...opts });
}

function shadow(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

function cyl(rt, rb, h, material, seg = 10) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
}

function canvasTexture(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function noiseFill(ctx, w, h, base, variance, count) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const v = Math.floor(R(-variance, variance));
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
    ctx.fillRect(R(0, w), R(0, h), R(1, 3), R(1, 3));
  }
}

// ---------------------------------------------------------------- palette
const PAL = {
  pink: '#f4b6c2',
  coral: '#ff8a7a',
  mint: '#9fe3cf',
  aqua: '#3fc1c9',
  lavender: '#c9b6f0',
  lemon: '#ffe8a3',
  cream: '#fbf3e4',
  white: '#fdfbf7',
  chrome: '#d9dde2',
  asphalt: '#3a3d42',
  sand: '#f1dfb8',
  grass: '#5f9e4b',
  neonPink: '#ff3fa4',
  neonCyan: '#33f0ff',
};

// ---------------------------------------------------------------- layout
export const LAYOUT = {
  facadeZ: -7,
  sidewalkFront: 0, // Bordstein
  streetFar: 8,
  parkFar: 16,
  shoreZ: 46,
};

export const ANCHORS = {
  table: new THREE.Vector3(0, 0, -3.2),
  tableTopY: 0.75,
  seatA: { position: new THREE.Vector3(-0.58, 0.47, -3.2), rotationY: Math.PI / 2 }, // schaut nach +x
  seatB: { position: new THREE.Vector3(0.58, 0.47, -3.2), rotationY: -Math.PI / 2 }, // schaut nach -x
  cupA: new THREE.Vector3(-0.15, 0.75, -3.17),
  cupB: new THREE.Vector3(0.15, 0.75, -3.23),
  // Augenhöhe einer sitzenden Person (für Kameras / Blickrichtung)
  eyeA: new THREE.Vector3(-0.5, 1.22, -3.2),
  eyeB: new THREE.Vector3(0.5, 1.22, -3.2),
};

// Hochformat 9:16 (Standard, wie die bisherigen Videos)
export const CAMERAS = {
  establishing: { pos: [1.5, 2.3, 7.4], target: [-1, 3.6, -5], fov: 74, label: 'Totale – Café bei Nacht von der Straße' },
  streetLife: { pos: [-15, 1.8, 3.6], target: [-3, 1.5, -2.6], fov: 60, label: 'Straßenleben – Gäste, Passanten, Autos' },
  aerial: { pos: [-9, 17, 42], target: [0, 3, -4], fov: 52, label: 'Luftaufnahme – Strand, Park, Ocean Drive' },
  terrace: { pos: [0.3, 1.55, 1.6], target: [0, 1.25, -3.6], fov: 56, label: 'Halbtotale – Terrasse' },
  twoShot: { pos: [0, 1.3, -0.6], target: [0, 1.02, -3.2], fov: 66, label: 'Two-Shot – beide im Profil' },
  otsA: { pos: [-1.45, 1.5, -2.7], target: [0.58, 1.1, -3.3], fov: 46, label: 'Über die Schulter von A auf B' },
  otsB: { pos: [1.45, 1.5, -2.7], target: [-0.58, 1.1, -3.3], fov: 46, label: 'Über die Schulter von B auf A' },
  closeA: { pos: [0.6, 1.35, -1.7], target: [-0.58, 0.98, -3.2], fov: 40, label: 'Nah – Figur A' },
  closeB: { pos: [-0.6, 1.4, -1.7], target: [0.58, 1.02, -3.2], fov: 40, label: 'Nah – Figur B' },
  tableInsert: { pos: [0.22, 1.18, -2.65], target: [0, 0.8, -3.2], fov: 46, label: 'Insert – Kaffee & Laterne' },
  oceanView: { pos: [0, 1.5, -5.9], target: [0, 2.6, 12], fov: 64, label: 'Von hinten – Blick aufs Meer & Mond' },
};

export const CAMERAS_WIDE = {
  aerial: { pos: [-14, 16, 52], target: [0, 2, -3], fov: 38, label: 'Luftaufnahme – Strand, Park und Ocean Drive' },
  establishing: { pos: [9.5, 7.5, 24], target: [0, 3.2, -4], fov: 40, label: 'Totale – Ocean Drive vom Park' },
  street: { pos: [-7.5, 1.7, 4.5], target: [0, 1.4, -3.4], fov: 42, label: 'Straßenseite – Terrasse' },
  terrace: { pos: [0.4, 1.45, 1.2], target: [0, 1.0, -3.4], fov: 38, label: 'Halbtotale – Tisch mit Café' },
  twoShot: { pos: [0.0, 1.15, -1.35], target: [0, 1.0, -3.2], fov: 35, label: 'Two-Shot – beide im Profil' },
  otsA: { pos: [-1.18, 1.42, -2.82], target: [0.55, 1.18, -3.28], fov: 38, label: 'Über die Schulter von A auf B' },
  otsB: { pos: [1.18, 1.42, -3.58], target: [-0.55, 1.18, -3.12], fov: 38, label: 'Über die Schulter von B auf A' },
  closeA: { pos: [0.55, 1.25, -2.35], target: [-0.5, 1.2, -3.2], fov: 30, label: 'Nah – Figur A' },
  closeB: { pos: [-0.55, 1.25, -2.35], target: [0.5, 1.2, -3.2], fov: 30, label: 'Nah – Figur B' },
  tableInsert: { pos: [0.35, 1.15, -2.65], target: [0, 0.78, -3.2], fov: 32, label: 'Insert – Kaffeetassen' },
  oceanView: { pos: [0.0, 1.25, -5.6], target: [0, 1.6, 20], fov: 50, label: 'Blick vom Café aufs Meer' },
};

// ---------------------------------------------------------------- sky
export const MOON_POS = new THREE.Vector3(-60, 110, 300);

function glowTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
let _glow;
export function glow(color, size, opacity = 0.6) {
  _glow ||= glowTexture();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.set(size, size, 1);
  s.name = 'Glow';
  return s;
}

function buildSky(scene) {
  const geo = new THREE.SphereGeometry(400, 32, 24);
  const top = new THREE.Color('#0b0a22');
  const mid = new THREE.Color('#1d1640');
  const horizon = new THREE.Color('#3c2160');
  const colors = [];
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 400;
    const c = new THREE.Color();
    if (y < 0) c.copy(horizon);
    else if (y < 0.12) c.lerpColors(horizon, mid, y / 0.12);
    else c.lerpColors(mid, top, Math.min(1, (y - 0.12) / 0.5));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  sky.name = 'Sky';
  scene.add(sky);

  // Sterne
  const starPos = [];
  for (let i = 0; i < 900; i++) {
    const th = R(0, Math.PI * 2), y = R(0.08, 1);
    const r = Math.sqrt(1 - y * y);
    starPos.push(Math.cos(th) * r * 380, y * 380, Math.sin(th) * r * 380);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 }));
  stars.name = 'Stars';
  scene.add(stars);

  // Mond mit Lichthof
  const moon = new THREE.Mesh(new THREE.CircleGeometry(14, 20), new THREE.MeshBasicMaterial({ color: '#e9e6f2', fog: false, toneMapped: false }));
  moon.position.copy(MOON_POS);
  moon.lookAt(0, 0, 0);
  moon.name = 'Moon';
  scene.add(moon);
  const halo = glow('#8f86d8', 90, 0.5);
  halo.position.copy(MOON_POS).multiplyScalar(1.01);
  scene.add(halo);

  // dunkle Nachtwolken
  const cloudTex = canvasTexture(256, 128, (ctx) => {
    for (let i = 0; i < 14; i++) {
      const x = R(50, 206), y = R(50, 90), r = R(25, 50);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(120,100,190,0.6)');
      g.addColorStop(1, 'rgba(120,100,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: R(0.25, 0.45) }));
    const w = R(60, 110);
    c.scale.set(w, w * 0.3, 1);
    c.position.set(R(-200, 200), R(30, 60), R(180, 320));
    scene.add(c);
  }
}

// ---------------------------------------------------------------- ground
function buildGround(scene) {
  const g = new THREE.Group();
  g.name = 'Ground';
  const L = 220;

  // Gehweg: helle Terrazzo-Platten
  const sidewalkTex = canvasTexture(512, 512, (ctx, w, h) => {
    noiseFill(ctx, w, h, '#ece4d6', 28, 4000);
    ctx.strokeStyle = 'rgba(120,105,90,0.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * w / 4, 0); ctx.lineTo(i * w / 4, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * h / 4); ctx.lineTo(w, i * h / 4); ctx.stroke();
    }
    // Terrazzo-Splitter
    const chips = ['#f4b6c2', '#9fe3cf', '#ffffff', '#c9b6f0', '#d9c7a8'];
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = chips[i % chips.length];
      ctx.globalAlpha = 0.6;
      ctx.fillRect(R(0, w), R(0, h), R(1, 4), R(1, 4));
    }
    ctx.globalAlpha = 1;
  }, { repeat: [L / 4, 7 / 4] });
  const sidewalkDepth = LAYOUT.sidewalkFront - LAYOUT.facadeZ;
  const sidewalk = box(L, 0.15, sidewalkDepth, mat('#ffffff', { map: sidewalkTex, roughness: 0.7 }), 0, 0.075 - 0.15 + 0.15 - 0.075, LAYOUT.facadeZ + sidewalkDepth / 2);
  sidewalk.position.y = -0.075; // Oberkante = 0
  sidewalk.name = 'Sidewalk';
  g.add(sidewalk);

  // Bordstein
  const curb = box(L, 0.17, 0.25, mat('#d8d4cc'), 0, -0.085, LAYOUT.sidewalkFront + 0.12);
  g.add(curb);

  // Straße
  const asphaltTex = canvasTexture(512, 512, (ctx, w, h) => noiseFill(ctx, w, h, '#45484d', 35, 9000), { repeat: [L / 6, 1.5] });
  const streetW = LAYOUT.streetFar - LAYOUT.sidewalkFront;
  const street = box(L, 0.1, streetW, mat('#ffffff', { map: asphaltTex, roughness: 0.92 }), 0, -0.2, LAYOUT.sidewalkFront + streetW / 2);
  street.name = 'Street';
  g.add(street);

  // Doppelte gelbe Mittellinie
  const yellow = mat('#f2c230', { roughness: 0.6 });
  [-0.08, 0.08].forEach((dz) => g.add(box(L, 0.005, 0.1, yellow, 0, -0.148, LAYOUT.sidewalkFront + streetW / 2 + dz)));
  // Parkbuchten-Markierung
  const white = mat('#f4f4f0', { roughness: 0.6 });
  for (let x = -60; x <= 60; x += 6) g.add(box(0.12, 0.005, 2.2, white, x, -0.148, LAYOUT.sidewalkFront + 1.35));

  // Gegenüberliegender Bordstein + Park (Lummus-Park-Stil)
  g.add(box(L, 0.17, 0.25, mat('#d8d4cc'), 0, -0.085, LAYOUT.streetFar - 0.12));
  const grassTex = canvasTexture(256, 256, (ctx, w, h) => {
    noiseFill(ctx, w, h, '#5f9e4b', 40, 6000);
  }, { repeat: [L / 3, 3] });
  const parkW = LAYOUT.parkFar - LAYOUT.streetFar;
  g.add(box(L, 0.2, parkW, mat('#ffffff', { map: grassTex, roughness: 1 }), 0, -0.1, LAYOUT.streetFar + parkW / 2));
  // geschwungener Fußweg im Park
  const pathMat = mat('#e8dcc4', { roughness: 0.9 });
  for (let x = -100; x < 100; x += 1) {
    const z = LAYOUT.streetFar + 4 + Math.sin(x * 0.12) * 1.2;
    const seg = box(1.05, 0.02, 2, pathMat, x + 0.5, 0.005, z);
    seg.rotation.y = -Math.atan(Math.cos(x * 0.12) * 0.144);
    g.add(seg);
  }
  // niedrige Korallenstein-Mauer zum Strand
  const coralTex = canvasTexture(256, 64, (ctx, w, h) => noiseFill(ctx, w, h, '#e3d2b0', 60, 3000), { repeat: [L / 2, 1] });
  g.add(box(L, 0.6, 0.45, mat('#ffffff', { map: coralTex }), 0, 0.3, LAYOUT.parkFar - 0.25));

  // Strand
  const sandTex = canvasTexture(512, 512, (ctx, w, h) => noiseFill(ctx, w, h, '#f1dfb8', 30, 12000), { repeat: [L / 8, 6] });
  const beachW = LAYOUT.shoreZ - LAYOUT.parkFar + 30;
  const sandGeo = new THREE.PlaneGeometry(L, beachW, 80, 30);
  sandGeo.rotateX(-Math.PI / 2);
  const sp = sandGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const z = sp.getZ(i) + LAYOUT.parkFar + beachW / 2;
    const x = sp.getX(i);
    // leichte Dünen, fällt zum Wasser hin ab
    let y = -0.15 + Math.sin(x * 0.21) * 0.08 + Math.cos(x * 0.13 + z * 0.3) * 0.06;
    y -= Math.max(0, z - (LAYOUT.shoreZ - 8)) * 0.06;
    sp.setY(i, y);
  }
  sandGeo.computeVertexNormals();
  const sand = new THREE.Mesh(sandGeo, mat('#ffffff', { map: sandTex, roughness: 1 }));
  sand.position.z = LAYOUT.parkFar + beachW / 2;
  sand.name = 'Beach';
  g.add(sand);

  // Hinter der Häuserzeile
  g.add(box(L, 0.1, 60, mat('#9a958c'), 0, -0.06, LAYOUT.facadeZ - 30));

  shadow(g, false, true);
  scene.add(g);
}

// ---------------------------------------------------------------- ocean
function buildOcean(scene) {
  const w = 600, d = 400;
  const geo = new THREE.PlaneGeometry(w, d, 120, 60);
  geo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geo.attributes.position.array);
  const colors = [];
  const shallow = new THREE.Color('#1d3a6a');
  const deep = new THREE.Color('#0a1236');
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i) + d / 2; // 0 = Ufer
    const t = Math.min(1, z / 45);
    const c = new THREE.Color().lerpColors(shallow, deep, Math.pow(t, 0.7));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const ocean = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.2, flatShading: true })
  );
  ocean.position.set(0, -0.55, LAYOUT.shoreZ + d / 2 - 6);
  ocean.name = 'Ocean';
  ocean.receiveShadow = true;
  scene.add(ocean);

  // Schaumkante an der Brandung
  const foam = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 2.2, 200, 1).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#b9b4ff', transparent: true, opacity: 0.35, roughness: 0.6 })
  );
  foam.position.set(0, -0.5, LAYOUT.shoreZ - 4.6);
  foam.name = 'Foam';
  scene.add(foam);

  // Mondlicht-Streifen auf dem Wasser
  const streakTex = canvasTexture(32, 256, (ctx, w, h) => {
    for (let y = 0; y < h; y += 6) {
      const a = 0.15 + 0.6 * (y / h);
      const ww = R(4, w) * (0.3 + 0.7 * y / h);
      ctx.fillStyle = `rgba(230,225,255,${a})`;
      ctx.fillRect((w - ww) / 2, y, ww, 3);
    }
  });
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(14, 250), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.7 }));
  streak.rotation.x = -Math.PI / 2;
  const dir = new THREE.Vector2(-60, 300).normalize();
  streak.rotation.z = Math.atan2(dir.x, dir.y);
  streak.position.set(dir.x * 140, -0.25, LAYOUT.shoreZ + dir.y * 125);
  streak.name = 'MoonReflection';
  scene.add(streak);

  return (t) => {
    const a = p.array;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      a[i * 3 + 1] =
        Math.sin(x * 0.08 + t * 0.9) * 0.12 +
        Math.sin(z * 0.15 - t * 1.3) * 0.18 +
        Math.sin((x + z) * 0.31 + t * 2.1) * 0.05;
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    foam.position.z = LAYOUT.shoreZ - 4.6 + Math.sin(t * 0.6) * 0.8;
    foam.material.opacity = 0.4 + Math.sin(t * 0.6 + 1) * 0.15;
  };
}

// ---------------------------------------------------------------- palms
function frondGeometry(len, width) {
  const segs = 10;
  const geo = new THREE.PlaneGeometry(width, len, 4, segs);
  geo.translate(0, len / 2, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const t = y / len;
    const x = p.getX(i);
    // schmaler werdend + Fiederung angedeutet durch V-Form
    const taper = Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.6);
    p.setX(i, x * taper);
    const droop = t * t * len * 0.75;
    p.setZ(i, -(droop + Math.abs(x * taper) * 0.35));
    p.setY(i, y * (1 - t * 0.25));
  }
  geo.rotateX(-Math.PI / 2 + 0.3); // Wedel zeigt nach außen und hängt nach unten
  geo.computeVertexNormals();
  return geo;
}

const frondTex = (() => {
  let t;
  return () => {
    if (t) return t;
    t = canvasTexture(128, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#4c7a2c';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
      for (let y = 4; y < h; y += 6) {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#2f6b22'); g.addColorStop(0.5, '#5aa33a'); g.addColorStop(1, '#2f6b22');
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(2, y + 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w - 2, y + 14); ctx.stroke();
      }
    });
    return t;
  };
})();

function makePalm(height = 8, lean = 0.6, seed = 0) {
  const g = new THREE.Group();
  g.name = 'Palm';
  const dir = seed * 2.1;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector3(Math.cos(dir) * lean * t * t * 2, t * height, Math.sin(dir) * lean * t * t * 2));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const barkTex = canvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9b8466';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) {
      ctx.fillStyle = 'rgba(70,55,40,0.5)';
      ctx.fillRect(0, y, w, 3);
    }
  }, { repeat: [1, height * 1.2] });
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.17, 6, false), mat('#ffffff', { map: barkTex, roughness: 1 }));
  g.add(trunk);
  const top = curve.getPoint(1);
  const crown = new THREE.Group();
  crown.position.copy(top);
  const fmat = new THREE.MeshStandardMaterial({ map: frondTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85, color: '#ffffff' });
  const n = 11;
  for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(frondGeometry(R(2.6, 3.4), R(0.9, 1.2)), fmat);
    f.rotation.y = (i / n) * Math.PI * 2 + R(-0.2, 0.2);
    f.rotation.x = R(-0.35, 0.15);
    crown.add(f);
  }
  const nutMat = mat('#6b4f2a');
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), nutMat);
    c.position.set(Math.cos(i * 1.6) * 0.2, -0.2, Math.sin(i * 1.6) * 0.2);
    crown.add(c);
  }
  g.add(crown);
  g.userData.crown = crown;
  return shadow(g);
}

// ---------------------------------------------------------------- Art-Deco-Gebäude
function signTexture(text, color, { w = 1024, h = 256, font = 'italic 700 150px Georgia, serif' } = {}) {
  return canvasTexture(w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.75;
    ctx.fillText(text, w / 2, h / 2);
  });
}

function verticalSignTexture(text, color) {
  return canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#20182c';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '700 150px Futura, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letters = [...text];
    const step = h / (letters.length + 0.5);
    letters.forEach((l, i) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.fillStyle = color;
      ctx.fillText(l, w / 2, step * (i + 0.75));
    });
  });
}

function windowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#a9d8ef');
    g.addColorStop(0.5, '#e8f6fb');
    g.addColorStop(1, '#5b8fb0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, w, h);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
  });
}

function interiorTexture(variant = 0) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    // warme Rückwand
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7a4a3a');
    g.addColorStop(1, '#4a2c24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Fliesenspiegel (Mint) hinter der Theke
    ctx.fillStyle = '#7fcbb8';
    ctx.fillRect(0, h * 0.42, w, h * 0.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, h * 0.42); ctx.lineTo(x, h * 0.62); ctx.stroke(); }
    for (let y = h * 0.42; y < h * 0.62; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // Regale mit Tassen / Flaschen
    ctx.fillStyle = '#c8a27a';
    for (const y of [h * 0.18, h * 0.32]) {
      ctx.fillRect(20, y, w - 40, 8);
      for (let x = 40; x < w - 40; x += 34) {
        ctx.fillStyle = ['#fdfbf7', '#f4b6c2', '#3fc1c9', '#ffe8a3'][(x / 34 + variant) % 4 | 0];
        ctx.fillRect(x, y - 26, 18, 26);
        ctx.fillStyle = '#c8a27a';
      }
    }
    // Theke
    ctx.fillStyle = '#2b1e19';
    ctx.fillRect(0, h * 0.62, w, h * 0.06);
    const tg = ctx.createLinearGradient(0, h * 0.68, 0, h);
    tg.addColorStop(0, '#f4b6c2');
    tg.addColorStop(1, '#c47f8d');
    ctx.fillStyle = tg;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let x = 10; x < w; x += 40) ctx.fillRect(x, h * 0.68, 6, h * 0.32);
    // Espressomaschine (nur Variante 0)
    if (variant === 0) {
      ctx.fillStyle = '#d9dde2';
      ctx.fillRect(w * 0.55, h * 0.5, 120, 60);
      ctx.fillStyle = '#9aa0a8';
      ctx.fillRect(w * 0.55 + 10, h * 0.5 + 40, 100, 8);
    }
    // Hängelampen mit Lichtschein
    for (let x = w / 6; x < w; x += w / 3) {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 60); ctx.stroke();
      const lg = ctx.createRadialGradient(x, 70, 2, x, 70, 90);
      lg.addColorStop(0, 'rgba(255,220,150,0.95)');
      lg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(x, 70, 90, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcf8a';
      ctx.beginPath(); ctx.arc(x, 66, 14, Math.PI, 0); ctx.fill();
    }
  });
}

function neonMat(color) {
  // HDR-Farbe (>1), damit nur LEDs/Neon den Bloom auslösen
  const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, fog: true });
  m.color.multiplyScalar(2.2);
  return m;
}

function makeDecoBuilding({ width, floors, color, accent, trim = PAL.white, name, signText, signColor, tower = true, cafe = false, neon }) {
  const g = new THREE.Group();
  g.name = name;
  const floorH = 3.3;
  const groundH = 4;
  const H = groundH + floors * floorH;
  const depth = 14;
  const wall = mat(color, { roughness: 0.85 });
  const accentM = mat(accent, { roughness: 0.7 });
  const trimM = mat(trim, { roughness: 0.6 });
  const glassDark = new THREE.MeshStandardMaterial({ color: '#1c1a3a', roughness: 0.2, metalness: 0.4 });
  const glassWarm = new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb85c', emissiveIntensity: 1.1 });
  const glassPink = new THREE.MeshStandardMaterial({ color: '#ff7ac0', emissive: '#ff5fae', emissiveIntensity: 0.7 });
  const pickGlass = () => { const r = rand(); return r < 0.6 ? glassDark : r < 0.88 ? glassWarm : glassPink; };

  // Hauptkörper (Fassade bei z=0)
  if (cafe) {
    // Erdgeschoss zurückgesetzt, damit man durch die Scheiben ins Café sieht
    g.add(box(width, H - groundH, depth, wall, 0, groundH + (H - groundH) / 2, -depth / 2));
    g.add(box(width, groundH, depth - 0.7, wall, 0, groundH / 2, -0.7 - (depth - 0.7) / 2));
    const segW = (width - 2) / 3;
    for (let k = 0; k <= 3; k++) {
      const px = -width / 2 + 1 + k * segW;
      const pw = k === 0 || k === 3 ? 2.2 : 0.4;
      const cx = k === 0 ? px - 0.9 : k === 3 ? px + 0.9 : px;
      g.add(box(pw, groundH, 0.7, wall, cx, groundH / 2, -0.35));
    }
    g.add(box(width, groundH - 3.1, 0.7, wall, 0, 3.1 + (groundH - 3.1) / 2, -0.35));
  } else {
    g.add(box(width, H, depth, wall, 0, H / 2, -depth / 2));
  }
  // Sockel / Erdgeschossband
  g.add(box(width + 0.1, 0.45, 0.2, accentM, 0, 0.22, 0.05));

  // Obergeschoss-Fenster mit "Eyebrows" (Sonnenblenden)
  const winW = 1.5, winH = 1.6;
  const cols = Math.max(2, Math.floor((width - (tower ? 3 : 1)) / 2.6));
  for (let f = 0; f < floors; f++) {
    const y = groundH + f * floorH + 1.5;
    for (let c = 0; c < cols; c++) {
      const half = (cols - 1) / 2;
      let x = (c - half) * ((width - (tower ? 3.2 : 1.2)) / cols);
      if (tower) x += Math.sign(x || 1) * 1.0;
      const win = box(winW, winH, 0.05, pickGlass(), x, y, 0.03);
      g.add(win);
      g.add(box(winW + 0.5, 0.08, 0.6, trimM, x, y + winH / 2 + 0.12, 0.3)); // Eyebrow
      g.add(box(winW + 0.2, 0.1, 0.18, trimM, x, y - winH / 2 - 0.05, 0.09)); // Fensterbank
    }
    // horizontales Band + LED-Leiste
    g.add(box(width, 0.18, 0.12, accentM, 0, groundH + f * floorH + 0.1, 0.06));
    if (neon) g.add(box(width, 0.12, 0.08, neonMat(neon), 0, groundH + f * floorH + 0.1, 0.16));
  }

  // LED-Konturen: Dachkante + senkrechte Gebäudekanten
  if (neon) {
    const nm = neonMat(neon);
    g.add(box(width + 0.1, 0.14, 0.1, nm, 0, H + 0.92, 0.12));
    g.add(box(width * 0.6 + 0.1, 0.07, 0.07, nm, 0, H + 1.62, 0.1));
    for (const sx of [-1, 1]) g.add(box(0.14, H - groundH + 0.9, 0.1, nm, sx * (width / 2 + 0.02), groundH + (H - groundH + 0.9) / 2, 0.06));
  }
  // Attika mit gestuftem Abschluss
  g.add(box(width, 0.9, 0.3, trimM, 0, H + 0.45, -0.1));
  g.add(box(width * 0.6, 0.7, 0.3, accentM, 0, H + 1.25, -0.1));
  g.add(box(width * 0.3, 0.6, 0.3, trimM, 0, H + 1.9, -0.1));

  // Mittelturm mit vertikalen Finnen und Leuchtschild
  if (tower) {
    const tw = 1.6;
    const y0 = cafe ? groundH - 0.1 : 0; // beim Café bleibt der Eingang frei
    const th = H + 3.5 - y0;
    g.add(box(tw, th, 0.9, trimM, 0, y0 + th / 2, 0.2));
    for (const dx of [-0.55, 0, 0.55]) g.add(box(0.12, th, 0.25, neon && dx !== 0 ? neonMat(neon) : accentM, dx, y0 + th / 2, 0.72));
    // Bullaugen
    for (let f = 0; f < floors; f++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 24), trimM);
      ring.position.set(0, groundH + f * floorH + 1.6, 0.68);
      g.add(ring);
    }
    if (signText) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, Math.min(H - 1, signText.length * 0.95), 0.25),
        [trimM, trimM, trimM, trimM,
          new THREE.MeshStandardMaterial({ map: verticalSignTexture(signText, signColor), emissive: signColor, emissiveIntensity: 0.35, emissiveMap: verticalSignTexture(signText, signColor) }),
          trimM]
      );
      sign.position.set(0, groundH + (H - groundH) / 2 + 0.5, 1.25);
      sign.name = 'VerticalSign';
      sign.material[4].emissiveIntensity = 1.4;
      g.add(sign);
      const sg = glow(signColor, 5, 0.35);
      sg.position.set(0, sign.position.y, 1.6);
      g.add(sg);
      const sl = new THREE.PointLight(signColor, 3, 12, 1.8);
      sl.position.set(0, sign.position.y - 1, 2.2);
      g.add(sl);
    }
  }

  // Erdgeschoss
  if (cafe) {
    // große Schaufenster + Eingang
    const storeGlass = new THREE.MeshPhysicalMaterial({ color: '#cfe8ee', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 1.5 });
    const segW = (width - 2) / 3;
    for (let i = 0; i < 3; i++) {
      const x = -width / 2 + 1 + segW * (i + 0.5);
      if (i === 1) {
        // Tür
        g.add(box(1.8, 2.6, 0.06, storeGlass, x, 1.3, 0.04));
        const doorIn = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshBasicMaterial({ map: interiorTexture(1) }));
        doorIn.position.set(x, 1.3, -0.68);
        g.add(doorIn);
        g.add(box(0.05, 2.6, 0.6, mat('#3a2a22'), x - 0.9, 1.3, -0.3));
        g.add(box(0.05, 2.6, 0.6, mat('#3a2a22'), x + 0.9, 1.3, -0.3));
        g.add(box(2.0, 0.12, 0.12, mat(PAL.chrome, { metalness: 0.9, roughness: 0.25 }), x, 2.66, 0.08));
      } else {
        g.add(box(segW - 0.4, 2.7, 0.06, storeGlass, x, 1.75, 0.04));
        // warmes Innenlicht
        const inner = new THREE.Mesh(new THREE.PlaneGeometry(segW - 0.4, 2.7), new THREE.MeshBasicMaterial({ map: interiorTexture(i), toneMapped: true }));
        inner.position.set(x, 1.75, -0.68);
        g.add(inner);
        g.add(box(0.05, 2.7, 0.6, mat('#3a2a22'), x - (segW - 0.4) / 2, 1.75, -0.3));
        g.add(box(0.05, 2.7, 0.6, mat('#3a2a22'), x + (segW - 0.4) / 2, 1.75, -0.3));
        g.add(box(segW - 0.4, 0.05, 0.6, mat('#3a2a22'), x, 3.1, -0.3));
      }
      // Chromrahmen
      g.add(box(0.1, 3.2, 0.12, mat(PAL.chrome, { metalness: 0.9, roughness: 0.25 }), x - segW / 2, 1.6, 0.08));
    }
    // Neonschriftzug über dem Café
    const neonW = width * 0.42;
    const backing = box(neonW + 0.3, neonW / 4 + 0.1, 0.08, mat('#1f2a33', { roughness: 0.4 }), 0, 4.75, 1.36);
    g.add(backing);
    const neon = new THREE.Mesh(
      new THREE.PlaneGeometry(neonW, neonW / 4),
      new THREE.MeshBasicMaterial({ map: signTexture('Ocean Café', PAL.neonPink), transparent: true, toneMapped: false })
    );
    neon.position.set(0, 4.75, 1.41);
    neon.name = 'NeonSign';
    g.add(neon);
    const ng = glow(PAL.neonPink, 7, 0.45);
    ng.position.set(0, 4.75, 1.6);
    g.add(ng);
    const neonLight = new THREE.PointLight(PAL.neonPink, 4, 10, 1.8);
    neonLight.position.set(0, 4.6, 2.0);
    g.add(neonLight);
  } else {
    const shopGlass = new THREE.MeshStandardMaterial({ color: '#36525e', roughness: 0.08, metalness: 0.5 });
    g.add(box(width - 2, 2.8, 0.06, shopGlass, 0, 1.8, 0.04));
  }
  // Vordach-Gesims über Erdgeschoss
  g.add(box(width, 0.25, 1.4, trimM, 0, groundH - 0.25, 0.7));
  g.add(box(width, 0.08, 0.06, mat(signColor || accent, { emissive: signColor || accent, emissiveIntensity: 1.6 }), 0, groundH - 0.38, 1.41));

  return shadow(g);
}

// ---------------------------------------------------------------- Möbel & Requisiten
function makeBistroTable(topColor = '#f3efe8') {
  const g = new THREE.Group();
  g.name = 'BistroTable';
  const marbleTex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = topColor;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(140,140,150,0.35)';
    for (let i = 0; i < 9; i++) {
      ctx.lineWidth = R(0.5, 2);
      ctx.beginPath();
      let x = R(0, w), y = R(0, h);
      ctx.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += R(-40, 40); y += R(-40, 40); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
  const top = cyl(0.3, 0.3, 0.03, mat('#ffffff', { map: marbleTex, roughness: 0.25 }), 40);
  top.position.y = 0.735;
  g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 40), mat(PAL.chrome, { metalness: 0.9, roughness: 0.2 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.735;
  g.add(rim);
  const metal = mat('#2b2b2e', { metalness: 0.7, roughness: 0.35 });
  const post = cyl(0.03, 0.03, 0.7, metal, 16);
  post.position.y = 0.37;
  g.add(post);
  const base = cyl(0.04, 0.22, 0.04, metal, 32);
  base.position.y = 0.02;
  g.add(base);
  return shadow(g);
}

function makeBistroChair(seatColor = '#c98a4b', frameColor = '#2b2b2e') {
  const g = new THREE.Group();
  g.name = 'BistroChair';
  const frame = mat(frameColor, { metalness: 0.6, roughness: 0.35 });
  // Rattan-Geflecht
  const weave = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = seatColor;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 8) {
      for (let j = 0; j < h; j += 8) {
        ctx.fillStyle = (i + j) % 16 === 0 ? 'rgba(255,240,210,0.45)' : 'rgba(60,30,10,0.25)';
        ctx.fillRect(i, j, 8, 4);
      }
    }
  }, { repeat: [2, 2] });
  const seatM = mat('#ffffff', { map: weave, roughness: 0.9 });
  const seat = cyl(0.21, 0.21, 0.04, seatM, 28);
  seat.position.y = 0.45;
  g.add(seat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.015, 8, 28), frame);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.45;
  g.add(ring);
  // Beine leicht gespreizt
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const leg = cyl(0.012, 0.012, 0.47, frame, 8);
    leg.position.set(Math.cos(a) * 0.17, 0.225, Math.sin(a) * 0.17);
    leg.rotation.z = -Math.cos(a) * 0.08;
    leg.rotation.x = Math.sin(a) * 0.08;
    g.add(leg);
  }
  // Rückenlehne (hinten = -x in lokalem System, Sitzender schaut nach +x)
  const back = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 8, 24, Math.PI), frame);
  back.rotation.y = Math.PI / 2;
  back.position.set(-0.17, 0.7, 0);
  g.add(back);
  const backPanel = box(0.03, 0.18, 0.32, seatM, -0.18, 0.78, 0);
  g.add(backPanel);
  for (const dz of [-0.17, 0.17]) {
    const s = cyl(0.012, 0.012, 0.42, frame, 8);
    s.position.set(-0.18, 0.66, dz);
    g.add(s);
  }
  return shadow(g);
}

function makeCup({ color = '#ffffff', coffee = '#5a3519', latte = true } = {}) {
  const g = new THREE.Group();
  g.name = 'CoffeeCup';
  const porcelain = mat(color, { roughness: 0.25 });
  const saucer = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.07, 0.002), new THREE.Vector2(0.075, 0.012), new THREE.Vector2(0.072, 0.014), new THREE.Vector2(0.065, 0.006), new THREE.Vector2(0, 0.006)], 32),
    porcelain
  );
  g.add(saucer);
  const profile = [
    new THREE.Vector2(0, 0.008), new THREE.Vector2(0.025, 0.008), new THREE.Vector2(0.032, 0.012),
    new THREE.Vector2(0.042, 0.035), new THREE.Vector2(0.046, 0.068), new THREE.Vector2(0.047, 0.075),
    new THREE.Vector2(0.043, 0.075), new THREE.Vector2(0.042, 0.068), new THREE.Vector2(0.038, 0.035), new THREE.Vector2(0, 0.02),
  ];
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), porcelain);
  g.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 8, 16, Math.PI * 1.3), porcelain);
  handle.position.set(0.05, 0.045, 0);
  handle.rotation.z = -Math.PI * 0.65;
  g.add(handle);
  // Kaffee mit Latte-Art
  const surfTex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = coffee;
    ctx.fillRect(0, 0, w, h);
    if (latte) {
      ctx.fillStyle = '#f2e1c7';
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2 + 8, 28, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = coffee;
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2 + 22, 14, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2e1c7';
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2 - 22, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
  });
  const surface = new THREE.Mesh(new THREE.CircleGeometry(0.042, 32), new THREE.MeshStandardMaterial({ map: surfTex, roughness: 0.3 }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.066;
  g.add(surface);
  // Löffel
  const spoon = box(0.004, 0.002, 0.07, mat(PAL.chrome, { metalness: 1, roughness: 0.2 }), 0.03, 0.016, 0.04);
  spoon.rotation.y = 0.5;
  g.add(spoon);
  return shadow(g);
}

function makeSteam() {
  const tex = canvasTexture(64, 128, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0.5)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h);
    ctx.bezierCurveTo(w * 0.1, h * 0.7, w * 0.9, h * 0.4, w * 0.5, 0);
    ctx.bezierCurveTo(w * 0.8, h * 0.4, w * 0.3, h * 0.7, w * 0.6, h);
    ctx.fill();
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.5 }));
  s.scale.set(0.06, 0.13, 1);
  s.name = 'Steam';
  return s;
}

function makeUmbrella(stripeA = PAL.aqua, stripeB = PAL.white) {
  const g = new THREE.Group();
  g.name = 'Umbrella';
  const tex = canvasTexture(512, 64, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? stripeA : stripeB;
      ctx.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.55, 8, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
  canopy.position.y = 2.45;
  g.add(canopy);
  // Volant
  const valance = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.14, 8, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }));
  valance.position.y = 2.12;
  g.add(valance);
  const pole = cyl(0.025, 0.025, 2.7, mat('#f5f2ea'), 10);
  pole.position.y = 1.35;
  g.add(pole);
  const base = cyl(0.18, 0.2, 0.08, mat('#2b2b2e'), 16);
  base.position.y = 0.04;
  g.add(base);
  return shadow(g);
}

function makeAwning(width, colorA = PAL.coral, colorB = PAL.white) {
  const tex = canvasTexture(512, 128, (ctx, w, h) => {
    const n = 16;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? colorA : colorB;
      ctx.fillRect((i * w) / n, 0, w / n, h);
    }
  }, { repeat: [Math.round(width / 2.5), 1] });
  const g = new THREE.Group();
  g.name = 'Awning';
  const m = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 });
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(width, 2.4), m);
  slope.rotation.x = -Math.PI / 2 + 0.38;
  slope.position.set(0, 0, 1.1);
  g.add(slope);
  // Wellen-Volant
  const valGeo = new THREE.PlaneGeometry(width, 0.3, 120, 1);
  const vp = valGeo.attributes.position;
  for (let i = 0; i < vp.count; i++) if (vp.getY(i) < 0) vp.setY(i, -0.15 - Math.abs(Math.sin(vp.getX(i) * 2.5)) * 0.12);
  const val = new THREE.Mesh(valGeo, m);
  val.position.set(0, -0.48, 2.22);
  g.add(val);
  return shadow(g);
}

function makePlanter(plant = 'palm') {
  const g = new THREE.Group();
  g.name = 'Planter';
  const pot = cyl(0.28, 0.22, 0.55, mat(PAL.white, { roughness: 0.5 }), 20);
  pot.position.y = 0.275;
  g.add(pot);
  const band = cyl(0.285, 0.285, 0.08, mat(PAL.aqua), 20);
  band.position.y = 0.48;
  g.add(band);
  const leafMat = new THREE.MeshStandardMaterial({ map: frondTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85 });
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(frondGeometry(R(0.7, 1.0), 0.35), leafMat);
    f.position.y = 0.55;
    f.rotation.y = (i / 9) * Math.PI * 2;
    f.rotation.x = 0.5 + R(-0.2, 0.2);
    g.add(f);
  }
  return shadow(g);
}

function makeFlowerVase() {
  const g = new THREE.Group();
  g.name = 'FlowerVase';
  const vase = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.025, 0), new THREE.Vector2(0.03, 0.04), new THREE.Vector2(0.012, 0.11), new THREE.Vector2(0.016, 0.13), new THREE.Vector2(0.013, 0.13)], 20),
    new THREE.MeshPhysicalMaterial({ color: '#bfeee6', roughness: 0.05, transmission: 0.6, thickness: 0.02, transparent: true, opacity: 0.8 })
  );
  g.add(vase);
  const stem = cyl(0.005, 0.005, 0.14, mat('#3d7a2a'), 6);
  stem.position.y = 0.16;
  g.add(stem);
  const petalM = mat(PAL.coral, { roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), petalM);
    p.scale.set(1, 0.4, 1.6);
    p.position.set(Math.cos(i) * 0.014, 0.235, Math.sin(i) * 0.014);
    p.rotation.y = i;
    g.add(p);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), mat('#f5c542'));
  center.position.y = 0.24;
  g.add(center);
  return shadow(g);
}

function makeSugarCaddy() {
  const g = new THREE.Group();
  g.name = 'SugarCaddy';
  g.add(box(0.08, 0.04, 0.05, mat(PAL.chrome, { metalness: 0.9, roughness: 0.25 }), 0, 0.02, 0));
  const colors = ['#f5f0e6', '#c48a52', '#f4b6c2'];
  for (let i = 0; i < 6; i++) {
    const s = box(0.03, 0.005, 0.045, mat(colors[i % 3]), -0.02 + (i % 2) * 0.04, 0.045 + Math.floor(i / 2) * 0.006, 0);
    g.add(s);
  }
  return shadow(g);
}

function makeMenuCard() {
  const tex = canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = PAL.neonPink;
    ctx.font = 'italic 700 26px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Menu', w / 2, 40);
    ctx.fillStyle = '#555';
    ctx.font = '13px sans-serif';
    ['Espresso', 'Cortadito', 'Café con leche', 'Cappuccino', 'Key Lime Pie', 'Pastelito'].forEach((t, i) => ctx.fillText(t, w / 2, 80 + i * 26));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.12), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }));
  m.name = 'MenuCard';
  const holder = new THREE.Group();
  m.position.y = 0.065;
  m.rotation.x = -0.15;
  holder.add(m);
  holder.add(box(0.06, 0.008, 0.03, mat(PAL.chrome, { metalness: 0.9, roughness: 0.2 }), 0, 0.004, 0));
  return shadow(holder);
}

function makeStreetLamp() {
  const g = new THREE.Group();
  g.name = 'StreetLamp';
  const m = mat('#e9efe9', { roughness: 0.5 });
  const pole = cyl(0.07, 0.11, 5, m, 12);
  pole.position.y = 2.5;
  g.add(pole);
  const arm = box(0.08, 0.08, 1.2, m, 0, 4.9, 0.55);
  g.add(arm);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 0.3, 16), m);
  head.position.set(0, 4.75, 1.1);
  g.add(head);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffd27a', emissiveIntensity: 3 }));
  bulb.position.set(0, 4.6, 1.1);
  g.add(bulb);
  const lg = glow('#ffc670', 2.6, 0.55);
  lg.position.set(0, 4.55, 1.1);
  g.add(lg);
  const light = new THREE.PointLight('#ffb35c', 8, 11, 1.6);
  light.position.set(0, 4.3, 1.1);
  g.add(light);
  return shadow(g);
}

let _glowTexCache;
function makeCar(color, x, z, flip = false, underglow) {
  // stilisiertes Retro-Cabrio
  const g = new THREE.Group();
  g.name = 'Car';
  const body = mat(color, { metalness: 0.4, roughness: 0.25 });
  const chrome = mat(PAL.chrome, { metalness: 1, roughness: 0.15 });
  const tire = mat('#1d1d1f', { roughness: 0.9 });
  g.add(box(4.6, 0.55, 1.85, body, 0, 0.6, 0));
  g.add(box(2.2, 0.35, 1.75, body, -0.2, 1.0, 0));
  // Heckflossen
  for (const dz of [-0.82, 0.82]) {
    const fin = box(1.2, 0.18, 0.1, body, -1.9, 1.0, dz);
    fin.rotation.z = 0.12;
    g.add(fin);
  }
  // Windschutzscheibe
  const ws = box(0.05, 0.4, 1.6, new THREE.MeshStandardMaterial({ color: '#9ccbe0', transparent: true, opacity: 0.5, roughness: 0 }), 0.9, 1.35, 0);
  ws.rotation.z = 0.35;
  g.add(ws);
  // Sitze (Cabrio)
  g.add(box(1.4, 0.25, 1.5, mat('#f4efe4'), -0.4, 1.25, 0));
  g.add(box(4.7, 0.1, 1.9, chrome, 0, 0.32, 0));
  for (const [dx, dz] of [[1.45, 0.85], [1.45, -0.85], [-1.45, 0.85], [-1.45, -0.85]]) {
    const w = cyl(0.36, 0.36, 0.24, tire, 20);
    w.rotation.x = Math.PI / 2;
    w.position.set(dx, 0.36, dz);
    g.add(w);
    const hub = cyl(0.18, 0.18, 0.26, mat('#ffffff', { metalness: 0.6, roughness: 0.3 }), 16);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(dx, 0.36, dz);
    g.add(hub);
  }
  // Scheinwerfer / Rücklichter
  for (const dz of [-0.6, 0.6]) {
    g.add(box(0.06, 0.16, 0.3, neonMat('#fff4cc'), 2.31, 0.7, dz));
    g.add(box(0.06, 0.12, 0.25, neonMat('#ff2a4a'), -2.31, 0.75, dz));
  }
  const hg = glow('#fff0c0', 1.6, 0.35);
  hg.position.set(2.5, 0.7, 0);
  g.add(hg);
  // LED-Unterbodenbeleuchtung
  const ug = underglow || '#ff3fa4';
  g.add(box(4.3, 0.04, 0.04, neonMat(ug), 0, 0.22, 0.95));
  g.add(box(4.3, 0.04, 0.04, neonMat(ug), 0, 0.22, -0.95));
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ map: (_glowTexCache ||= glowTexture()), color: ug, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.07;
  g.add(pool);
  g.position.set(x, -0.15, z);
  if (flip) g.rotation.y = Math.PI;
  return shadow(g);
}

function makeLifeguardTower(color = PAL.coral) {
  const g = new THREE.Group();
  g.name = 'LifeguardTower';
  const wood = mat('#efe6d6');
  for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
    const leg = cyl(0.07, 0.07, 2.2, wood, 8);
    leg.position.set(x, 1.1, z);
    g.add(leg);
  }
  g.add(box(2.4, 0.15, 2.4, wood, 0, 2.2, 0));
  const hut = box(1.9, 1.7, 1.9, mat(color, { roughness: 0.6 }), 0, 3.15, 0);
  g.add(hut);
  g.add(box(1.9, 0.9, 0.05, new THREE.MeshStandardMaterial({ color: '#3a6170', roughness: 0.1, metalness: 0.3 }), 0, 3.35, 0.96));
  // gestreifte Seitenwand
  const stripeTex = canvasTexture(128, 128, (ctx, w, h) => {
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffe8a3' : '#3fc1c9'; ctx.fillRect(0, (i * h) / 6, w, h / 6); }
  });
  const side = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.7), new THREE.MeshStandardMaterial({ map: stripeTex }));
  side.position.set(0.96, 3.15, 0);
  side.rotation.y = Math.PI / 2;
  g.add(side);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.7, 4), mat(PAL.lemon));
  roof.position.y = 4.35;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // Rampe
  const ramp = box(0.8, 0.08, 3.4, wood, 0, 1.1, -2.3);
  ramp.rotation.x = -0.62;
  g.add(ramp);
  // Fahne
  const pole = cyl(0.02, 0.02, 1.6, wood, 6);
  pole.position.set(0.8, 5.1, 0.8);
  g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), new THREE.MeshStandardMaterial({ color: '#f0d23a', side: THREE.DoubleSide }));
  flag.position.set(1.1, 5.7, 0.8);
  flag.name = 'Flag';
  g.add(flag);
  return shadow(g);
}

function makeBeachUmbrellaAndChairs(color) {
  const g = new THREE.Group();
  const u = makeUmbrella(color, PAL.white);
  u.rotation.z = 0.12;
  g.add(u);
  for (const dx of [-0.6, 0.6]) {
    const lounger = new THREE.Group();
    lounger.add(box(0.6, 0.06, 1.8, mat('#ffffff'), 0, 0.3, 0));
    const back = box(0.6, 0.06, 0.7, mat('#ffffff'), 0, 0.5, -0.95);
    back.rotation.x = 0.8;
    lounger.add(back);
    lounger.add(box(0.5, 0.02, 1.6, mat(color), 0, 0.34, 0.05));
    lounger.position.set(dx, 0, 1.4);
    g.add(lounger);
  }
  return shadow(g);
}

// ---------------------------------------------------------------- Platzhalter-Figuren
// Diese Puppen markieren nur Sitzposition, Größe und Blickrichtung.
// Sie werden später durch die echten Charaktere ersetzt.
function makePlaceholderFigure(color, label) {
  const g = new THREE.Group();
  g.name = `Placeholder_${label}`;
  const m = mat(color, { roughness: 0.6 });
  const skin = mat('#e8c4a8', { roughness: 0.7 });
  // lokales System: Sitzender schaut nach +x, Ursprung = Sitzfläche Mitte
  const hips = box(0.3, 0.14, 0.36, m, -0.02, 0.07, 0);
  g.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 6, 12), m);
  torso.position.set(-0.04, 0.38, 0);
  torso.scale.set(0.85, 1, 1.15);
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), skin);
  head.position.set(-0.02, 0.78, 0);
  head.scale.set(1, 1.15, 0.95);
  g.add(head);
  // Nase als Blickrichtungsmarker
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 8), skin);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.1, 0.78, 0);
  g.add(nose);
  for (const dz of [-0.1, 0.1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.32, 4, 8), m);
    thigh.rotation.z = Math.PI / 2;
    thigh.position.set(0.18, 0.06, dz);
    g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), mat('#3b3b45'));
    shin.position.set(0.36, -0.2, dz);
    g.add(shin);
    // Arme zum Tisch
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.24, 4, 8), m);
    upper.position.set(0.0, 0.42, dz * 2.2);
    upper.rotation.z = 0.35;
    g.add(upper);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.22, 4, 8), skin);
    fore.rotation.z = Math.PI / 2;
    fore.position.set(0.16, 0.3, dz * 1.8);
    g.add(fore);
  }
  return shadow(g);
}

// ---------------------------------------------------------------- Aufbau
export function buildScene({ placeholders = true } = {}) {
  const scene = new THREE.Scene();
  scene.name = 'CafeOceanDrive';
  scene.fog = new THREE.Fog('#150e2c', 35, 240);

  buildSky(scene);
  buildGround(scene);
  const updateOcean = buildOcean(scene);

  // Licht: warme Nachmittagssonne von Südosten über dem Meer
  const hemi = new THREE.HemisphereLight('#3a2f80', '#0c0718', 0.32);
  scene.add(hemi);
  // Mondlicht (kühl, von der Meerseite)
  const sun = new THREE.DirectionalLight('#9c95ff', 0.45);
  sun.position.set(-12, 30, 40);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  sun.name = 'Moonlight';
  scene.add(sun, sun.target);

  // ---- Häuserzeile
  const buildings = new THREE.Group();
  buildings.name = 'Buildings';
  const row = [
    { width: 13, floors: 2, color: PAL.lavender, accent: PAL.aqua, neon: PAL.neonCyan, name: 'Deco_Lavender', signText: 'BREEZE', signColor: PAL.neonCyan, x: -20 },
    { width: 14, floors: 3, color: PAL.pink, accent: PAL.aqua, neon: PAL.neonPink, name: 'Deco_OceanCafe', signText: 'MAREA', signColor: PAL.neonPink, x: -1.5, cafe: true },
    { width: 12, floors: 3, color: PAL.mint, accent: PAL.coral, neon: PAL.neonPink, name: 'Deco_Mint', signText: 'TIDES', signColor: PAL.neonPink, x: 15 },
    { width: 11, floors: 2, color: PAL.lemon, accent: PAL.aqua, neon: '#b06bff', name: 'Deco_Lemon', tower: false, x: 28 },
    { width: 12, floors: 4, color: PAL.white, accent: PAL.coral, neon: PAL.neonCyan, name: 'Deco_White', signText: 'SANDS', signColor: PAL.neonCyan, x: -33 },
    { width: 14, floors: 3, color: '#bfe3f2', accent: PAL.pink, neon: '#b06bff', name: 'Deco_Sky', signText: 'PALMS', signColor: PAL.neonPink, x: 41 },
    { width: 13, floors: 2, color: '#ffd1b3', accent: PAL.aqua, neon: PAL.neonPink, name: 'Deco_Peach', tower: false, x: -46 },
  ];
  for (const b of row) {
    const bld = makeDecoBuilding(b);
    bld.position.set(b.x, 0, LAYOUT.facadeZ);
    buildings.add(bld);
  }
  scene.add(buildings);

  // Markise über der Café-Terrasse
  const awning = makeAwning(12.5, PAL.coral, PAL.white);
  awning.position.set(-1.5, 3.25, LAYOUT.facadeZ);
  scene.add(awning);

  // ---- Café-Terrasse
  const terrace = new THREE.Group();
  terrace.name = 'CafeTerrace';

  // Haupttisch (Hero)
  const hero = new THREE.Group();
  hero.name = 'HeroTable';
  hero.position.copy(ANCHORS.table);
  hero.add(makeBistroTable());
  const chairA = makeBistroChair('#c98a4b');
  chairA.name = 'ChairA';
  chairA.position.set(ANCHORS.seatA.position.x - ANCHORS.table.x, 0, 0);
  chairA.rotation.y = 0; // Lehne bei -x, schaut nach +x
  hero.add(chairA);
  const chairB = makeBistroChair('#c98a4b');
  chairB.name = 'ChairB';
  chairB.position.set(ANCHORS.seatB.position.x - ANCHORS.table.x, 0, 0);
  chairB.rotation.y = Math.PI;
  hero.add(chairB);

  const cupA = makeCup({ latte: true });
  cupA.name = 'CupA';
  cupA.position.set(ANCHORS.cupA.x - ANCHORS.table.x, ANCHORS.tableTopY, ANCHORS.cupA.z - ANCHORS.table.z);
  hero.add(cupA);
  const cupB = makeCup({ latte: true, coffee: '#4a2a12' });
  cupB.name = 'CupB';
  cupB.position.set(ANCHORS.cupB.x - ANCHORS.table.x, ANCHORS.tableTopY, ANCHORS.cupB.z - ANCHORS.table.z);
  cupB.rotation.y = Math.PI;
  hero.add(cupB);
  const steams = [];
  for (const c of [cupA, cupB]) {
    const s = makeSteam();
    s.position.set(c.position.x, ANCHORS.tableTopY + 0.15, c.position.z);
    hero.add(s);
    steams.push(s);
  }
  const vase = makeFlowerVase();
  vase.position.set(0, ANCHORS.tableTopY, -0.18);
  hero.add(vase);
  const sugar = makeSugarCaddy();
  sugar.position.set(0.05, ANCHORS.tableTopY, 0.17);
  hero.add(sugar);
  const menu = makeMenuCard();
  menu.position.set(-0.08, ANCHORS.tableTopY, 0.18);
  menu.rotation.y = 0.3;
  hero.add(menu);
  // Glas Wasser
  const glass = cyl(0.03, 0.026, 0.11, new THREE.MeshPhysicalMaterial({ color: '#e8f7ff', roughness: 0.02, transmission: 0.9, thickness: 0.01, transparent: true, opacity: 0.45 }), 20);
  glass.position.set(0.12, ANCHORS.tableTopY + 0.055, -0.15);
  hero.add(glass);
  // Tischlaterne – warmes Licht auf die Gesichter (wie das Lagerfeuer)
  const lantern = new THREE.Group();
  lantern.name = 'TableLantern';
  lantern.add(box(0.08, 0.012, 0.08, mat('#2b2b2e'), 0, 0.006, 0));
  lantern.add(box(0.08, 0.012, 0.08, mat('#2b2b2e'), 0, 0.13, 0));
  lantern.add(box(0.064, 0.11, 0.064, new THREE.MeshStandardMaterial({ color: '#ffd38a', emissive: '#ffb04a', emissiveIntensity: 1.2, transparent: true, opacity: 0.85 }), 0, 0.068, 0));
  const flame = box(0.02, 0.04, 0.02, new THREE.MeshBasicMaterial({ color: '#fff2c0', toneMapped: false }), 0, 0.05, 0);
  lantern.add(flame);
  const lglow = glow('#ffae4a', 0.6, 0.35);
  lglow.position.y = 0.07;
  lantern.add(lglow);
  const lanternLight = new THREE.PointLight('#ffa040', 1.5, 3.2, 1.4);
  lanternLight.position.y = 0.2;
  lantern.add(lanternLight);
  lantern.position.set(0.0, ANCHORS.tableTopY, 0.03);
  hero.add(lantern);
  vase.position.set(-0.02, ANCHORS.tableTopY, -0.2);
  terrace.add(hero);

  // Lichterkette über der Terrasse (von der Markise zu den Laternen)
  const bulbM = new THREE.MeshBasicMaterial({ color: '#ffd98a', toneMapped: false });
  const bulbColors = ['#ffd98a', '#ff7ac0', '#7af0ff', '#ffd98a'];
  for (const [x0, x1] of [[-8, -3], [-3, 2], [2, 6.5]]) {
    const a = new THREE.Vector3(x0, 3.1, LAYOUT.facadeZ + 1.6);
    const b = new THREE.Vector3(x1, 3.0, -0.3);
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(Math.PI * t) * 0.45;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3), i % 3 ? bulbM : new THREE.MeshBasicMaterial({ color: bulbColors[i % 4], toneMapped: false }));
      m.position.copy(p);
      terrace.add(m);
      if (i % 2 === 0) {
        const gl = glow(bulbColors[i % 4], 0.22, 0.45);
        gl.position.copy(p);
        terrace.add(gl);
      }
    }
    const pl = new THREE.PointLight('#ffc27a', 1.6, 5, 1.8);
    pl.position.set((x0 + x1) / 2, 2.5, (LAYOUT.facadeZ + 1.6 - 0.3) / 2);
    terrace.add(pl);
  }

  // Menschen (Gäste, Passanten, Leute an den Autos)
  const npcs = new THREE.Group();
  npcs.name = 'People';
  scene.add(npcs);

  // Weitere Tische mit Gästen
  const otherTables = [
    [-5.2, -4.6], [-3.4, -1.9], [3.6, -4.5], [3.8, -2.0], [-6.8, -2.1], [6.0, -2.8],
  ];
  otherTables.forEach(([x, z], i) => {
    const t = makeBistroTable(i % 2 ? '#f3efe8' : '#e9f3f1');
    t.position.set(x, 0, z);
    terrace.add(t);
    for (let k = 0; k < 2; k++) {
      const c = makeBistroChair(i % 2 ? '#c98a4b' : '#b8794a');
      const a = (k * Math.PI) + i * 0.4;
      c.position.set(x + Math.cos(a) * 0.6, 0, z + Math.sin(a) * 0.6);
      c.rotation.y = -a + Math.PI;
      terrace.add(c);
      if (i === 5 && k === 1) continue; // ein freier Platz
      const guest = makeNPC(rand, { pose: 'sit' });
      guest.position.set(c.position.x, 0.47, c.position.z);
      guest.rotation.y = c.rotation.y;
      npcs.add(guest);
    }
    const tl = new THREE.Group();
    tl.add(box(0.06, 0.09, 0.06, new THREE.MeshStandardMaterial({ color: '#ffd38a', emissive: '#ffb04a', emissiveIntensity: 2 }), 0, 0.045, 0));
    const tg = glow('#ffae4a', 0.7, 0.5);
    tg.position.y = 0.06;
    tl.add(tg);
    const tlight = new THREE.PointLight('#ffa040', 1.6, 2.6, 1.5);
    tlight.position.y = 0.2;
    tl.add(tlight);
    tl.position.set(x - 0.06, 0.75, z + 0.05);
    terrace.add(tl);
    const cup = makeCup({ latte: i % 3 !== 0 });
    cup.position.set(x + 0.08, 0.75, z);
    terrace.add(cup);
  });
  [[-4.3, -2.9, PAL.aqua], [4.7, -2.9, PAL.coral], [-7.2, -3.4, PAL.mint]].forEach(([x, z, c]) => {
    const u = makeUmbrella(c, PAL.white);
    u.position.set(x, 0, z);
    terrace.add(u);
  });
  // Pflanzkübel als Terrassenbegrenzung
  for (let x = -8; x <= 6; x += 3.5) {
    const p = makePlanter();
    p.position.set(x, 0, -1.0);
    terrace.add(p);
  }
  // Kordel-Absperrung (Chrom-Pfosten)
  const postM = mat(PAL.chrome, { metalness: 0.95, roughness: 0.2 });
  const ropeM = mat(PAL.aqua, { roughness: 0.7 });
  for (let x = -8; x <= 6; x += 1.75) {
    if (Math.abs(((x + 8) / 3.5) % 1) < 0.01) continue;
    const p = cyl(0.025, 0.025, 0.9, postM, 10);
    p.position.set(x, 0.45, -1.0);
    terrace.add(p);
  }
  const rope = cyl(0.015, 0.015, 14, ropeM, 8);
  rope.rotation.z = Math.PI / 2;
  rope.position.set(-1, 0.8, -1.0);
  terrace.add(rope);
  // Tafel-Aufsteller
  const board = new THREE.Group();
  const boardTex = canvasTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#23302d'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c9a66b'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = 'italic 700 40px Georgia'; ctx.fillText('Café', w / 2, 70);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#ffd3e0'; ctx.fillText('Cafecito  $3', w / 2, 140);
    ctx.fillStyle = '#c8fff2'; ctx.fillText('Cortadito  $4', w / 2, 190);
    ctx.fillStyle = '#fff1b8'; ctx.fillText('Key Lime  $7', w / 2, 240);
    ctx.fillStyle = '#ffffff'; ctx.font = 'italic 24px Georgia'; ctx.fillText('~ welcome ~', w / 2, 320);
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), new THREE.MeshStandardMaterial({ map: boardTex }));
  panel.position.y = 0.55;
  panel.rotation.x = -0.12;
  board.add(panel);
  board.add(box(0.62, 0.92, 0.03, mat('#6b4a2b'), 0, 0.55, -0.03));
  board.position.set(1.7, 0, -1.3);
  board.rotation.y = 0.25;
  shadow(board);
  terrace.add(board);
  scene.add(terrace);

  // ---- Straße: Laternen, Autos
  const street = new THREE.Group();
  street.name = 'StreetProps';
  for (let x = -48; x <= 48; x += 16) {
    const l = makeStreetLamp();
    l.position.set(x + 5, 0, -0.1);
    street.add(l);
  }
  street.add(makeCar('#7fd6d0', -9, 1.35, false, PAL.neonCyan));
  street.add(makeCar('#ff9fb2', 12, 1.35, false, PAL.neonPink));
  street.add(makeCar('#fff2b3', 22, 6.6, true, '#b06bff'));
  street.add(makeCar('#2a2a3a', -24, 1.35, false, PAL.neonPink));
  scene.add(street);

  const place = (pose, x, y, z, rotY) => {
    const n = makeNPC(rand, { pose });
    n.position.set(x, y, z);
    n.rotation.y = rotY;
    npcs.add(n);
    return n;
  };
  // am türkisen Cabrio (x=-9): zwei unterhalten sich auf dem Bordstein
  place('stand', -9.6, 0, 0.1, -0.3);
  place('phone', -8.7, 0, 0.12, Math.PI + 0.4);
  // im rosa Cabrio (x=12): Fahrer + Beifahrer, einer steht daneben
  place('sit', 11.7, 1.23, 0.95, 0);
  place('sit', 11.7, 1.23, 1.75, 0);
  place('stand', 13.2, 0, 0.1, Math.PI / 2 + 0.6);
  // am gelben Wagen gegenüber
  place('stand', 21.4, 0, 8.15, -Math.PI / 2);
  place('stand', 22.4, 0, 8.2, -Math.PI / 2 - 0.5);
  // am dunklen Wagen
  place('phone', -24.5, 0, 0.1, Math.PI / 2);
  // Park & Strand
  [[-6, 11.5], [-5.3, 11.8], [9, 12.5], [17, 11], [-15, 12.8], [3, 22], [3.7, 22.4], [-12, 33], [14, 34]].forEach(([x, z], i) => {
    place(i % 4 === 3 ? 'phone' : 'stand', x, z > 20 ? -0.1 : 0, z, rand() * Math.PI * 2);
  });
  // Passanten auf dem Gehweg (laufen in beide Richtungen)
  const walkers = [];
  [[-30, 1], [-12, 1], [9, 1], [25, 1], [-20, -1], [4, -1], [17, -1], [36, -1]].forEach(([x0, dir], i) => {
    const w = makeNPC(rand, { pose: 'walk' });
    w.rotation.y = dir > 0 ? 0 : Math.PI;
    w.position.set(x0, 0, dir > 0 ? -0.33 : -0.58);
    w.userData.walk = { x0, dir, speed: 1.0 + (i % 3) * 0.15 };
    npcs.add(w);
    walkers.push(w);
  });

  // ---- Palmen (Park + Gehweg)
  const palms = new THREE.Group();
  palms.name = 'Palms';
  let pi = 0;
  for (let x = -60; x <= 60; x += R(5.5, 7.5)) {
    const p = makePalm(R(7.5, 10.5), R(0.4, 1.2), pi++);
    p.position.set(x, 0, LAYOUT.streetFar + R(1.2, 6.5));
    palms.add(p);
  }
  for (let x = -40; x <= 40; x += 11) {
    if (Math.abs(x - ANCHORS.table.x) < 4) continue;
    const p = makePalm(R(6, 8), R(0.2, 0.5), pi++);
    p.position.set(x + 2.5, 0, -0.1);
    palms.add(p);
  }
  scene.add(palms);

  // ---- Strand
  const beach = new THREE.Group();
  beach.name = 'BeachProps';
  const tower = makeLifeguardTower(PAL.coral);
  tower.position.set(6, -0.1, 30);
  tower.rotation.y = 0.15;
  beach.add(tower);
  const tower2 = makeLifeguardTower(PAL.aqua);
  tower2.position.set(-38, -0.1, 31);
  beach.add(tower2);
  [[-10, 24, PAL.coral], [-4, 27, PAL.aqua], [16, 25, PAL.lemon], [22, 28, PAL.pink], [-22, 26, PAL.mint]].forEach(([x, z, c]) => {
    const u = makeBeachUmbrellaAndChairs(c);
    u.position.set(x, -0.1, z);
    beach.add(u);
  });
  // Segelboot in der Ferne
  const boat = new THREE.Group();
  boat.name = 'Sailboat';
  boat.add(box(4, 0.6, 1.2, mat('#ffffff'), 0, 0.3, 0));
  const sail = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5, 3), mat('#ffffff'));
  sail.scale.z = 0.05;
  sail.position.y = 3;
  boat.add(sail);
  boat.position.set(-30, -0.4, 110);
  beach.add(boat);
  scene.add(beach);

  // ---- Platzhalter für die zwei Charaktere
  const actors = new THREE.Group();
  actors.name = 'Characters';
  const pA = makeGirl();
  pA.position.copy(ANCHORS.seatA.position);
  pA.rotation.y = 0;
  const pB = makeDetective();
  pB.position.copy(ANCHORS.seatB.position);
  pB.rotation.y = Math.PI;
  actors.add(pA, pB);
  actors.visible = placeholders;
  scene.add(actors);

  // ---- Animation (Meer, Dampf, Palmen im Wind, Fahne)
  const crowns = [];
  palms.traverse((o) => o.userData.crown && crowns.push(o.userData.crown));
  const flags = [];
  beach.traverse((o) => o.name === 'Flag' && flags.push(o));
  function update(t) {
    updateOcean(t);
    const fl = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
    lanternLight.intensity = 1.5 * fl;
    flame.scale.y = fl;
    steams.forEach((s, i) => {
      const k = (t * 0.5 + i * 0.5) % 1;
      s.position.y = ANCHORS.tableTopY + 0.13 + k * 0.06;
      s.material.opacity = 0.45 * Math.sin(k * Math.PI);
    });
    crowns.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 0.9 + i) * 0.035;
      c.rotation.x = Math.cos(t * 0.7 + i * 1.3) * 0.03;
    });
    flags.forEach((f) => (f.rotation.y = Math.sin(t * 3) * 0.25));
    npcs.children.forEach((n) => n.userData.animate && n.userData.animate(t));
    walkers.forEach((w) => {
      const { x0, dir, speed } = w.userData.walk;
      w.position.x = ((((x0 + dir * speed * t + 45) % 90) + 90) % 90) - 45;
    });
    boat.position.x = -30 + t * 0.3;
    boat.rotation.z = Math.sin(t * 0.8) * 0.03;
  }
  update(0);

  return { scene, update, actors, characters: { A: pA, B: pB }, sun, anchors: ANCHORS, cameras: CAMERAS };
}
