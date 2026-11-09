// Gemeinsame Bausteine für POV-Videos im Toon-Stil
// (Cel-Shading + schwarze Konturen + Fischauge, Ich-Perspektive mit Händen).
//
//   toon(color)            – Toon-Material (3 harte Lichtstufen), gecacht pro Farbe
//   makePerson(opts)       – stehende/sitzende Cartoon-Figur mit Gelenken
//   makePovHands(camera)   – eigene Hände (echte Hand-Modelle mit Fingergelenken), async
//   createPovPost(...)     – Tusche-Linien (Kanten aus Tiefe/Normalen) + Fischauge + Papier + Korn
//   canvasTex(w, h, draw)  – CanvasTexture-Helfer
//
// Hinweis: Nebel (scene.fog) färbt auch die Konturen ein – für den Look besser weglassen.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// ---------- Materialien ----------
// Weiche, matte Schattierung (Lambert) – die Tusche-Linien kommen im Post-Filter dazu.
// (Name „toon“ bleibt aus Kompatibilitätsgründen.)
const cache = new Map();
export function toon(color, extra) {
  if (extra) return new THREE.MeshLambertMaterial({ color, ...extra });
  if (!cache.has(color)) cache.set(color, new THREE.MeshLambertMaterial({ color }));
  return cache.get(color);
}
export const texMat = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.userData.ctx = ctx;
  return t;
}

// Objekt bekommt keine Tusche-Linien (z. B. kleine LEDs)
export function noOutline(obj) {
  obj.userData.noInk = true;
  return obj;
}

const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const cap = (r, len, mat, x, y, z) => mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat, x, y, z);
const ball = (r, mat, x, y, z, s = [1, 1, 1]) => {
  const m = mesh(new THREE.SphereGeometry(r, 24, 16), mat, x, y, z);
  m.scale.set(...s);
  return m;
};

// ---------- Figuren ----------
// Lokales System: Füße auf y = 0, Figur schaut nach +z.
// userData: body, head, mouth, armL/armR (Schulter), elbowL/elbowR, hipL/hipR, kneeL/kneeR,
//           setTalk(0..1), pose('stand'|'sit')
export function makePerson(o = {}) {
  const {
    skin = '#f1c39c', hair = '#3a2414', hairStyle = 'short', top = '#3a6ea5', pants = '#2a2f45',
    shoes = '#2b2b30', glasses = false, headset = false, beard = false, scale = 1,
  } = o;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const S = toon(skin), T = toon(top), P = toon(pants), H = toon(hair), SH = toon(shoes);
  const dark = toon('#141418');

  // Glatte, sich verjüngende Glieder (Zylinder + Kugel-Gelenke) statt Bauklötze
  const limb = (r0, r1, len, mat) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(r0, r1, len, 18), mat, 0, -len / 2, 0));
    g.add(ball(r1, mat, 0, -len, 0));
    return g;
  };

  // Hüfte + Beine
  body.add(ball(0.165, P, 0, 0.93, 0, [1.08, 0.62, 0.78]));
  const legs = {};
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(0.09 * side, 0.92, 0);
    hip.add(limb(0.082, 0.062, 0.44, P));
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    knee.add(limb(0.062, 0.05, 0.4, P));
    const shoe = cap(0.05, 0.13, SH, 0, -0.44, 0.05);
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1.2, 1, 0.75);
    knee.add(shoe);
    hip.add(knee);
    body.add(hip);
    legs[side] = { hip, knee };
  }

  // Oberkörper: gedrehtes Profil mit Taille, Brust und runden Schultern
  const prof = [[0.001, 0], [0.15, 0], [0.158, 0.06], [0.152, 0.16], [0.168, 0.3], [0.19, 0.42], [0.185, 0.5], [0.13, 0.565], [0.06, 0.58], [0.001, 0.58]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const torso = mesh(new THREE.LatheGeometry(prof, 28), T, 0, 0.9, 0);
  torso.scale.set(1.12, 1, 0.66);
  body.add(torso);
  body.add(mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.12, 14), S, 0, 1.52, 0));

  // Arme
  const arms = {};
  for (const side of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(0.2 * side, 1.4, 0);
    sh.add(ball(0.068, T, 0, 0, 0));
    sh.add(limb(0.064, 0.05, 0.29, T));
    const el = new THREE.Group();
    el.position.y = -0.29;
    el.add(limb(0.05, 0.04, 0.24, T));
    el.add(mesh(new THREE.CylinderGeometry(0.034, 0.03, 0.04, 14), S, 0, -0.25, 0));
    if (handCache[side]) {
      const h = makeHand(side, S, { fingers: [0, -1, 0], back: [side, 0, 0] });
      h.group.position.y = -0.255;
      h.group.scale.setScalar(0.95);
      el.add(h.group);
    } else {
      el.add(ball(0.05, S, 0, -0.3, 0, [0.85, 1.15, 0.6]));
    }
    sh.add(el);
    sh.rotation.z = 0.09 * side;
    body.add(sh);
    arms[side] = { sh, el };
  }

  // Kopf
  const head = new THREE.Group();
  head.position.y = 1.55;
  head.scale.setScalar(0.86);
  body.add(head);
  head.add(ball(0.145, S, 0, 0.13, 0, [0.95, 1.08, 0.97]));
  head.add(ball(0.03, S, -0.14, 0.12, 0, [0.5, 1, 0.8]));
  head.add(ball(0.03, S, 0.14, 0.12, 0, [0.5, 1, 0.8]));
  // Augen: große weiße Augäpfel, schwarze Pupillen (wie in den Vorbildern)
  const white = toon('#fbfbf6');
  for (const side of [-1, 1]) {
    head.add(ball(0.03, white, 0.05 * side, 0.15, 0.124, [1, 1.25, 0.6]));
    head.add(ball(0.0145, dark, 0.048 * side, 0.148, 0.142, [1, 1.2, 0.5]));
    const brow = mesh(new THREE.BoxGeometry(0.05, 0.011, 0.012), H, 0.054 * side, 0.212, 0.13);
    brow.rotation.z = -0.12 * side;
    head.add(brow);
  }
  head.add(ball(0.022, S, 0, 0.105, 0.145, [0.9, 1, 0.9]));
  const mouth = ball(0.024, toon('#5a1f1c'), 0, 0.05, 0.132, [1.3, 0.35, 0.5]);
  head.add(mouth);

  // Haare
  const capGeo = new THREE.SphereGeometry(0.155, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
  const hairTop = mesh(capGeo, H, 0, 0.14, -0.005);
  hairTop.scale.set(0.98, 1.08, 1.02);
  hairTop.rotation.x = -0.25;
  head.add(hairTop);
  head.add(ball(0.15, H, 0, 0.12, -0.025, [0.98, 1.0, 0.9]));
  if (hairStyle === 'long') {
    const l = cap(0.13, 0.22, H, 0, -0.02, -0.06);
    l.scale.set(1.15, 1, 0.55);
    head.add(l);
  }
  if (hairStyle === 'ponytail') {
    const p = cap(0.05, 0.16, H, 0, 0.0, -0.17);
    p.rotation.x = 0.4;
    head.add(p);
  }
  if (hairStyle === 'cap') {
    const visor = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), H, 0, 0.215, 0.07);
    visor.rotation.x = -0.15;
    head.add(visor);
  }
  if (beard) {
    head.add(ball(0.12, H, 0, 0.06, 0.04, [1.0, 0.75, 0.85]));
    mouth.position.z = 0.15;
  }
  if (glasses) {
    const g = toon('#1b1b22');
    for (const side of [-1, 1]) head.add(mesh(new THREE.TorusGeometry(0.038, 0.006, 6, 20), g, 0.054 * side, 0.15, 0.15));
    head.add(mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), g, 0, 0.155, 0.152));
  }
  if (headset) {
    const hs = toon('#22252c');
    head.add(mesh(new THREE.TorusGeometry(0.165, 0.012, 6, 24, Math.PI), hs, 0, 0.13, -0.01));
    for (const side of [-1, 1]) {
      const cup = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 18), hs, 0.16 * side, 0.12, 0);
      cup.rotation.z = Math.PI / 2;
      head.add(cup);
    }
    const boom = cap(0.007, 0.13, hs, -0.12, 0.05, 0.08);
    boom.rotation.set(0, -0.7, 1.35);
    head.add(boom);
    head.add(ball(0.016, hs, -0.06, 0.04, 0.13));
  }

  root.scale.setScalar(scale);
  root.userData = {
    body, head, mouth, armL: arms[1].sh, armR: arms[-1].sh, elbowL: arms[1].el, elbowR: arms[-1].el,
    hipL: legs[1].hip, hipR: legs[-1].hip, kneeL: legs[1].knee, kneeR: legs[-1].knee,
    setTalk(v) { mouth.scale.set(1.3 - v * 0.35, 0.35 + v * 1.3, 0.5); },
    pose(p) {
      const sit = p === 'sit';
      for (const s of [legs[1], legs[-1]]) { s.hip.rotation.x = sit ? -Math.PI / 2 : 0; s.knee.rotation.x = sit ? Math.PI / 2 : 0; }
      body.position.y = sit ? -0.45 : 0;
    },
  };
  return root;
}

// ---------- Eigene Hände (Ich-Perspektive) ----------
// Echte Hand-Modelle mit Fingergelenken (WebXR generic-hand, MIT), hängen an der Kamera.
// Gelenk-Achsen (WebXR): Finger zeigen nach -z, Handrücken nach +y.
// Posen: 'cup' (hält Becher), 'relaxed', 'fist', 'phone'
const HAND_URL = new URL('./assets/hands/', import.meta.url).href;
const FINGERS = ['index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'];
const PHAL = ['phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal'];
const POSES = {
  relaxed: { curl: [0.25, 0.35, 0.25], thumb: [0.1, 0.15, 0.1], spread: 0.06 },
  cup: { curl: [0.95, 1.0, 0.6], thumb: [0.5, 0.5, 0.3], spread: 0.0 },
  fist: { curl: [1.45, 1.6, 1.1], thumb: [0.7, 0.8, 0.6], spread: 0.0 },
  phone: { curl: [0.6, 0.9, 0.5], thumb: [0.2, 0.3, 0.2], spread: 0.0 },
};

const handCache = {};
// Einmal vor dem Szenenaufbau aufrufen, dann können makeHand/makePerson echte Hände nutzen.
export async function preloadHands() {
  const loader = new GLTFLoader();
  for (const side of [-1, 1]) {
    if (!handCache[side]) handCache[side] = (await loader.loadAsync(HAND_URL + (side > 0 ? 'right.glb' : 'left.glb'))).scene;
  }
}

// Eine Hand (side 1 = rechts, -1 = links) mit Fingergelenken.
// Ausrichtung: Finger zeigen nach fingers, Handrücken nach back (im Eltern-System), Handgelenk im Ursprung.
export function makeHand(side, mat, { fingers = [0, 0, -1], back = [0, 1, 0] } = {}) {
  const model = cloneSkinned(handCache[side]);
  model.updateMatrixWorld(true);
  const joints = {};
  model.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) { o.material = mat; o.frustumCulled = false; o.castShadow = true; }
    if (o.name) joints[o.name] = o;
  });
  // Die Gelenke liegen im Modell lose nebeneinander -> zu Ketten verbinden,
  // damit eine Drehung am Grundgelenk den ganzen Finger mitnimmt.
  const chain = (names) => { for (let i = 1; i < names.length; i++) joints[names[i - 1]].attach(joints[names[i]]); };
  for (const f of FINGERS) chain(['wrist', `${f}-metacarpal`, ...PHAL.map((ph) => `${f}-${ph}`), `${f}-tip`]);
  chain(['wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip']);
  model.updateMatrixWorld(true);
  const rest = {};
  for (const [n, j] of Object.entries(joints)) rest[n] = j.quaternion.clone();
  const wp = (n) => joints[n].getWorldPosition(new THREE.Vector3());
  const wrist = wp('wrist');
  const F = wp('middle-finger-tip').sub(wrist).normalize();
  const T = wp('index-finger-metacarpal').sub(wp('pinky-finger-metacarpal'));
  T.sub(F.clone().multiplyScalar(T.dot(F))).normalize();
  const B = side > 0 ? F.clone().cross(T) : T.clone().cross(F);
  const tF = new THREE.Vector3(...fingers).normalize(), tB = new THREE.Vector3(...back).normalize();
  const tT = side > 0 ? tB.clone().cross(tF) : tF.clone().cross(tB);
  const src = new THREE.Matrix4().makeBasis(F, B, T);
  const dst = new THREE.Matrix4().makeBasis(tF, tB, tT);
  const group = new THREE.Group();
  group.quaternion.setFromRotationMatrix(dst.multiply(src.invert()));
  model.position.copy(wrist).negate();
  group.add(model);
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  function setPose(poseA, poseB = poseA, k = 0) {
    const A = POSES[poseA], Bp = POSES[poseB];
    const mix = (a, b) => a + (b - a) * k;
    FINGERS.forEach((f, fi) => PHAL.forEach((ph, pi) => {
      const j = joints[`${f}-${ph}`];
      const spread = pi === 0 ? (fi - 1.5) * mix(A.spread, Bp.spread) : 0;
      e.set(-mix(A.curl[pi], Bp.curl[pi]) * (1 + fi * 0.06), spread, 0);
      j.quaternion.copy(rest[j.name]).multiply(q.setFromEuler(e));
    }));
    ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal'].forEach((n, i) => {
      e.set(-mix(A.thumb[i], Bp.thumb[i]), 0, 0);
      joints[n].quaternion.copy(rest[n]).multiply(q.setFromEuler(e));
    });
  }
  setPose('relaxed');
  return { group, setPose };
}

export async function makePovHands(camera, { sleeve = '#3b3f4a', cuff = '#2c2f38', skin = '#f1c39c', cup = true } = {}) {
  await preloadHands();
  const g = new THREE.Group();
  camera.add(g);
  const skinMat = new THREE.MeshLambertMaterial({ color: skin });
  const parts = {};
  for (const side of [-1, 1]) {
    const hand = makeHand(side, skinMat);
    hand.group.traverse((o) => { o.castShadow = false; });
    const holder = new THREE.Group(); // Handgelenk-Raum
    holder.add(hand.group);
    // Ärmel: Unterarm verläuft hinter dem Handgelenk (+z)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.04, 0.3, 18), toon(sleeve));
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, 0.0, 0.23);
    arm.scale.set(1.12, 1, 1);
    holder.add(arm);
    const cuffM = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.048, 0.03, 18), toon(cuff));
    cuffM.rotation.x = Math.PI / 2;
    cuffM.position.set(0, 0, 0.075);
    cuffM.scale.set(1.12, 1, 1);
    holder.add(cuffM);
    if (side > 0 && cup) {
      const c = new THREE.Group();
      c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.029, 0.11, 24), toon('#f4efe6')));
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 24), toon('#2a2a30'));
      lid.position.y = 0.06;
      c.add(lid);
      c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0368, 0.0332, 0.045, 24), toon('#a8723f')));
      // Becher liegt in der Handfläche (-y), quer zu den Fingern
      c.rotation.z = Math.PI / 2;
      c.position.set(0.0, -0.05, -0.065);
      holder.add(c);
    }
    g.add(holder);
    parts[side] = { holder, hand };
  }

  // Grundhaltung in Kameraraum (x rechts, y oben, -z nach vorn)
  const BASE = {
    // rechts: Becher, Handrücken nach außen, Daumen oben
    1: { pos: [0.2, -0.29, -0.37], rot: [0.35, 0.3, -1.45] },
    // links: locker, Handrücken oben, Finger nach vorn-innen
    [-1]: { pos: [-0.18, -0.27, -0.38], rot: [0.45, -0.45, 0.35] },
  };
  return {
    group: g,
    // bob: Gehbewegung 0..1, phase: Schrittphase, raiseL/raiseR: Hand hochreißen (0..1)
    update(t, { bob = 0, phase = 0, raiseL = 0, raiseR = 0 } = {}) {
      for (const side of [-1, 1]) {
        const p = parts[side], b = BASE[side];
        const raise = side > 0 ? raiseR : raiseL;
        const sway = Math.sin(phase + (side > 0 ? Math.PI : 0)) * 0.012 * bob;
        const breathe = Math.sin(t * 1.6 + side) * 0.004;
        p.holder.position.set(b.pos[0] - raise * 0.04 * side, b.pos[1] + sway + breathe + raise * 0.13, b.pos[2] - raise * 0.03);
        p.holder.rotation.set(b.rot[0] + raise * 0.45 + Math.sin(t * 0.9 + side) * 0.02, b.rot[1], b.rot[2] - raise * 0.25 * side, 'YXZ');
        if (side > 0 && cup) p.hand.setPose('cup');
        else p.hand.setPose('relaxed', 'fist', raise);
      }
    },
  };
}

// ---------- Nachbearbeitung: Tusche-Look ----------
// 1) Farbe rendern  2) Normalen + Tiefe rendern  3) Kombinieren:
//    Fischauge -> Kanten aus Tiefe & Normalen (zittrige, variable Strichstärke)
//    -> gedämpfte Farben, Papierstruktur, Korn, Vignette, Abblende
export function createPovPost(renderer, W, H, opts = {}) {
  const { fisheye = 0.42, grain = 0.02, vignette = 0.35, line = 1.25, ink = '#14141c', saturation = 0.86, tint = [1, 1, 1] } = opts;
  const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const rtND = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
  rtND.depthTexture = new THREE.DepthTexture(W, H);
  rtND.depthTexture.type = THREE.FloatType;
  const normalMat = new THREE.MeshNormalMaterial();
  const inkC = new THREE.Color(ink);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: rtColor.texture }, tND: { value: rtND.texture }, tDepth: { value: rtND.depthTexture },
      cameraNear: { value: 0.03 }, cameraFar: { value: 60 },
      k: { value: fisheye }, aspect: { value: W / H }, grain: { value: grain }, vignette: { value: vignette },
      time: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, tint: { value: new THREE.Vector3(...tint) },
      fade: { value: 0 }, lineW: { value: line * (H / 1280) }, ink: { value: new THREE.Vector3(inkC.r, inkC.g, inkC.b) },
      sat: { value: saturation },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      #include <packing>
      uniform sampler2D tColor, tND, tDepth;
      uniform float cameraNear, cameraFar, k, aspect, grain, vignette, time, fade, lineW, sat;
      uniform vec2 res; uniform vec3 tint, ink;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
      float lin(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
      vec3 nrm(vec2 uv){ return texture2D(tND, uv).xyz * 2.0 - 1.0; }
      float edge(vec2 uv, vec2 o){
        float d0 = lin(uv);
        float dl = lin(uv - vec2(o.x,0.0)), dr = lin(uv + vec2(o.x,0.0)), du = lin(uv + vec2(0.0,o.y)), dd = lin(uv - vec2(0.0,o.y));
        float dEdge = (abs(dl + dr - 2.0*d0) + abs(du + dd - 2.0*d0)) / max(d0, 0.05);
        float sil = max(max(abs(dl-d0), abs(dr-d0)), max(abs(du-d0), abs(dd-d0))) / max(d0, 0.05);
        vec3 nl = nrm(uv - vec2(o.x,0.0)), nr = nrm(uv + vec2(o.x,0.0)), nu = nrm(uv + vec2(0.0,o.y)), nd = nrm(uv - vec2(0.0,o.y));
        float nEdge = length(nl - nr) + length(nu - nd);
        return max(max(smoothstep(0.012, 0.035, dEdge), smoothstep(0.06, 0.14, sil)), smoothstep(0.45, 0.85, nEdge));
      }
      void main(){
        // Fischauge
        vec2 p = vUv * 2.0 - 1.0;
        vec2 q = vec2(p.x * aspect, p.y);
        float m = aspect * aspect + 1.0;
        vec2 s = (p * (1.0 + k * dot(q,q)) / (1.0 + k * m)) * 0.5 + 0.5;
        // Handgezeichnete Linie: Strichstärke schwankt, Linie „kocht“ 8x pro Sekunde leicht
        float boil = floor(time * 8.0);
        vec2 px = 1.0 / res;
        vec2 jit = (vec2(vnoise(s * vec2(9.0, 16.0) + boil * 3.1), vnoise(s * vec2(16.0, 9.0) - boil * 2.3)) - 0.5) * px * 1.6;
        float w = lineW * mix(0.65, 1.55, vnoise(s * vec2(5.0, 9.0) + boil * 0.37));
        vec2 ss = s + jit;
        float e = edge(ss, px * w);
        vec3 c = texture2D(tColor, s).rgb * tint;
        // Farben dämpfen, leicht aufhellen (wie gedruckt)
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, sat);
        c = c * 0.95 + 0.012;
        // Papierstruktur + Korn
        float paper = fbm(vUv * res / 6.0) * 0.6 + fbm(vUv * vec2(3.0, 5.0)) * 0.4;
        c *= 0.95 + 0.08 * paper;
        c = mix(c, ink, e * 0.93);
        c += (hash(floor(vUv * res / 1.5) + boil * 7.31) - 0.5) * grain;
        c *= mix(1.0, smoothstep(1.6, 0.35, length(q * vec2(1.0, 0.85))), vignette);
        c *= 1.0 - fade;
        gl_FragColor = vec4(max(c, 0.0), 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const qScene = new THREE.Scene();
  qScene.add(quad);
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const clear = new THREE.Color();
  return {
    uniforms: mat.uniforms,
    render(scene, camera, t) {
      mat.uniforms.time.value = t;
      mat.uniforms.cameraNear.value = camera.near;
      mat.uniforms.cameraFar.value = camera.far;
      renderer.setRenderTarget(rtColor);
      renderer.render(scene, camera);
      // Normalen + Tiefe
      const bg = scene.background, auto = renderer.shadowMap.autoUpdate;
      renderer.getClearColor(clear);
      const alpha = renderer.getClearAlpha();
      const hidden = [];
      scene.traverse((o) => { if (o.userData.noInk && o.visible) { o.visible = false; hidden.push(o); } });
      scene.background = null;
      scene.overrideMaterial = normalMat;
      renderer.shadowMap.autoUpdate = false;
      renderer.setClearColor(0x8080ff, 1);
      renderer.setRenderTarget(rtND);
      renderer.clear();
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      for (const o of hidden) o.visible = true;
      scene.background = bg;
      renderer.shadowMap.autoUpdate = auto;
      renderer.setClearColor(clear, alpha);
      renderer.setRenderTarget(null);
      renderer.render(qScene, qCam);
    },
  };
}
