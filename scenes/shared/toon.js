// Gemeinsame Bausteine für POV-Videos im Toon-Stil
// (Cel-Shading + schwarze Konturen + Fischauge, Ich-Perspektive mit Händen).
//
//   toon(color)            – Toon-Material (3 harte Lichtstufen), gecacht pro Farbe
//   makePerson(opts)       – stehende/sitzende Cartoon-Figur mit Gelenken
//   makePovHands(camera)   – eigene Hände (Ärmel + Hand), hängen an der Kamera
//   createPovPost(...)     – Konturen (OutlineEffect) + Fischauge + Korn + Vignette
//   canvasTex(w, h, draw)  – CanvasTexture-Helfer
//
// Hinweis: Nebel (scene.fog) färbt auch die Konturen ein – für den Look besser weglassen.

import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

// ---------- Materialien ----------
export const GRADIENT = (() => {
  const t = new THREE.DataTexture(new Uint8Array([120, 195, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const cache = new Map();
export function toon(color, extra) {
  if (extra) return new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT, ...extra });
  if (!cache.has(color)) cache.set(color, new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT }));
  return cache.get(color);
}

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

export function noOutline(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) m.userData.outlineParameters = { visible: false };
  });
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

  // Hüfte + Beine
  body.add(ball(0.17, P, 0, 0.94, 0, [1.05, 0.7, 0.8]));
  const legs = {};
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(0.095 * side, 0.92, 0);
    hip.add(cap(0.075, 0.3, P, 0, -0.21, 0));
    const knee = new THREE.Group();
    knee.position.y = -0.43;
    knee.add(cap(0.068, 0.3, P, 0, -0.2, 0));
    const shoe = cap(0.06, 0.12, SH, 0, -0.44, 0.06);
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1.15, 1, 0.8);
    knee.add(shoe);
    hip.add(knee);
    body.add(hip);
    legs[side] = { hip, knee };
  }

  // Oberkörper
  const torso = cap(0.17, 0.32, T, 0, 1.22, 0);
  torso.scale.set(1.18, 1, 0.78);
  body.add(torso);
  body.add(cap(0.05, 0.06, S, 0, 1.5, 0));

  // Arme
  const arms = {};
  for (const side of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(0.24 * side, 1.42, 0);
    sh.add(cap(0.058, 0.22, T, 0, -0.15, 0));
    const el = new THREE.Group();
    el.position.y = -0.31;
    el.add(cap(0.052, 0.2, T, 0, -0.13, 0));
    el.add(ball(0.055, S, 0, -0.31, 0, [0.85, 1.15, 0.6]));
    const thumb = cap(0.018, 0.04, S, 0.035 * -side, -0.28, 0.02);
    thumb.rotation.z = 0.5 * side;
    el.add(thumb);
    sh.add(el);
    sh.rotation.z = 0.09 * side;
    body.add(sh);
    arms[side] = { sh, el };
  }

  // Kopf
  const head = new THREE.Group();
  head.position.y = 1.53;
  body.add(head);
  head.add(ball(0.145, S, 0, 0.13, 0, [0.95, 1.08, 0.97]));
  head.add(ball(0.03, S, -0.14, 0.12, 0, [0.5, 1, 0.8]));
  head.add(ball(0.03, S, 0.14, 0.12, 0, [0.5, 1, 0.8]));
  // Augen: große weiße Augäpfel, schwarze Pupillen (wie in den Vorbildern)
  const white = toon('#fbfbf6');
  for (const side of [-1, 1]) {
    head.add(ball(0.036, white, 0.052 * side, 0.15, 0.122, [1, 1.3, 0.6]));
    head.add(ball(0.017, dark, 0.05 * side, 0.148, 0.143, [1, 1.2, 0.5]));
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
// Hängen an der Kamera und ragen von den unteren Bildecken ins Bild.
// Rechte Hand hält einen Kaffeebecher (cup: true), linke ist frei.
export function makePovHands(camera, { sleeve = '#3b3f4a', skin = '#f1c39c', cup = true } = {}) {
  const g = new THREE.Group();
  camera.add(g);
  const SL = toon(sleeve), S = toon(skin);
  const parts = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(0.25 * side, -0.47, -0.42);
    arm.rotation.set(-0.95, 0, 0.32 * side);
    arm.add(cap(0.05, 0.3, SL, 0, -0.08, 0));
    arm.add(mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.035, 16), toon('#2c2f38'), 0, 0.1, 0));
    const hand = new THREE.Group();
    hand.position.y = 0.16;
    hand.scale.setScalar(0.85);
    arm.add(hand);
    hand.add(ball(0.05, S, 0, 0.03, 0, [1.05, 1.2, 0.55]));
    const holding = side === 1 && cup;
    for (let i = 0; i < 4; i++) {
      const f = cap(0.014, 0.05, S, -0.033 + i * 0.022, 0.1, 0.004);
      f.rotation.x = holding ? -1.2 : -0.3;
      hand.add(f);
    }
    const th = cap(0.016, 0.04, S, -0.05 * side, 0.04, 0.02);
    th.rotation.z = 0.9 * side;
    hand.add(th);
    if (holding) {
      const c = new THREE.Group();
      c.position.set(0, 0.07, 0.06);
      c.rotation.x = 0.95;
      c.add(mesh(new THREE.CylinderGeometry(0.045, 0.034, 0.13, 20), toon('#f4efe6'), 0, 0, 0));
      c.add(mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.015, 20), toon('#2a2a30'), 0, 0.07, 0));
      c.add(mesh(new THREE.CylinderGeometry(0.044, 0.04, 0.05, 20), toon('#a8723f'), 0, -0.005, 0));
      hand.add(c);
    }
    g.add(arm);
    parts[side] = { arm, base: arm.position.clone(), rot: arm.rotation.clone() };
  }
  return {
    group: g,
    // bob: Gehbewegung 0..1, phase: Schrittphase, raiseL/raiseR: Hand hochreißen (0..1)
    update(t, { bob = 0, phase = 0, raiseL = 0, raiseR = 0 } = {}) {
      for (const side of [-1, 1]) {
        const p = parts[side];
        const sway = Math.sin(phase + (side === 1 ? Math.PI : 0)) * 0.016 * bob;
        const idle = Math.sin(t * 1.3 + side) * 0.004;
        const raise = side === 1 ? raiseR : raiseL;
        p.arm.position.set(p.base.x - raise * 0.05 * side, p.base.y + sway + idle + raise * 0.2, p.base.z - raise * 0.05);
        p.arm.rotation.set(p.rot.x - raise * 0.35, p.rot.y, p.rot.z - raise * 0.2 * side);
      }
    },
  };
}

// ---------- Nachbearbeitung ----------
// Szene + Konturen (OutlineEffect) -> Render-Target -> Fischauge, Korn, Vignette, Abblende
export function createPovPost(renderer, W, H, opts = {}) {
  const { fisheye = 0.42, grain = 0.028, vignette = 0.4, thickness = 0.0055, tint = [1, 1, 1] } = opts;
  const effect = new OutlineEffect(renderer, { defaultThickness: thickness, defaultColor: [0.02, 0.02, 0.035], defaultAlpha: 1 });
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: rt.texture }, k: { value: fisheye }, aspect: { value: W / H }, grain: { value: grain },
      vignette: { value: vignette }, time: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, tint: { value: new THREE.Vector3(...tint) },
      fade: { value: 0 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float k, aspect, grain, vignette, time, fade; uniform vec2 res; uniform vec3 tint;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        // Fischauge: Bildmitte vergrößert, Ränder gestaucht (Ecken bleiben Ecken)
        vec2 p = vUv * 2.0 - 1.0;
        vec2 q = vec2(p.x * aspect, p.y);
        float r2 = dot(q, q);
        float m = aspect * aspect + 1.0;
        vec2 s = p * (1.0 + k * r2) / (1.0 + k * m);
        vec3 c = texture2D(tDiffuse, s * 0.5 + 0.5).rgb * tint;
        // Papier-/Filmkorn, 12 Mal pro Sekunde neu
        c += (hash(floor(vUv * res / 1.5) + floor(time * 12.0) * 7.31) - 0.5) * grain;
        c *= mix(1.0, smoothstep(1.55, 0.35, length(q * vec2(1.0, 0.85))), vignette);
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
  return {
    uniforms: mat.uniforms,
    render(scene, camera, t) {
      mat.uniforms.time.value = t;
      renderer.setRenderTarget(rt);
      renderer.clear();
      effect.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(qScene, qCam);
    },
  };
}
