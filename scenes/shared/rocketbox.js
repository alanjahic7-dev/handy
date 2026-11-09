// Animierte Menschen aus der Microsoft-Rocketbox-Bibliothek (MIT).
// Dateien vorher holen:  node tools/fetch_rocketbox.mjs
//
//   await preloadRocketbox(['Male_Adult_18', ...], ['m_idle_neutral_01', ...])
//   const a = makeActor('Male_Adult_18', {
//     clips: [ { t: 0, clip: 'm_idle_neutral_01' }, { t: 4, clip: 'm_gestic_talk_neutral_01' } ],
//     path:  [ { t: 0, pos: [0, 0, 0] }, { t: 3, pos: [2, 0, -1] } ],   // optional, Laufwege
//     face:  [ { t: 0, yaw: 0 }, { t: 5, look: [x, z] } ],               // optional, Blickrichtung
//   });
//   scene.add(a.root);  ... jedes Bild: a.update(t)
//
// Alles ist deterministisch über t (kein Echtzeit-Mixer), damit das Video Bild für Bild gerendert werden kann.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const BASE = new URL('./assets/rocketbox/', import.meta.url).href;
const avatars = {};
const clips = {};

// 1×1-Pixel als Ersatz für Normal-/Glanz-Maps (die wir für den gezeichneten Look nicht brauchen)
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
function loaderFor(dir) {
  const m = new THREE.LoadingManager();
  m.setURLModifier((u) => {
    if (!/\.(tga|png|jpe?g)$/i.test(u)) return u;
    const base = u.split(/[\\/]/).pop();
    if (/normal|specular/i.test(base)) return BLANK;
    return dir + base.replace(/\.tga$/i, '.png');
  });
  // Die FBX verweisen auf .tga – wir haben sie als .png abgelegt (URL-Modifier oben)
  m.addHandler(/\.tga$/i, new THREE.TextureLoader(m));
  // done: erfüllt, sobald FBX *und* alle Texturen geladen sind
  const done = new Promise((res) => { m.onLoad = res; m.onError = (u) => console.warn('Rocketbox: fehlt', u); });
  return { loader: new FBXLoader(m), done };
}

async function loadAvatar(name) {
  const dir = `${BASE}avatars/${name}/`;
  const { loader, done } = loaderFor(dir);
  const obj = await loader.loadAsync(`${dir}${name}.fbx`);
  await done;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false;
    const conv = (m) => {
      // Wimpern/Brauen/Haarsträhnen: Transparenz steckt im Alphakanal der Farbtextur
      const opacity = /opacity/i.test(m.name) || !!m.alphaMap;
      const n = new THREE.MeshLambertMaterial({ map: m.map || null, color: m.map ? 0xffffff : m.color, alphaTest: opacity ? 0.4 : 0, side: opacity ? THREE.DoubleSide : THREE.FrontSide });
      if (opacity) n.userData.thin = true;
      n.userData.inkFlat = true;
      if (n.map) n.map.colorSpace = THREE.SRGBColorSpace;
      return n;
    };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
  // Rocketbox ist in Zentimetern modelliert
  obj.scale.setScalar(0.01);
  return obj;
}

async function loadClip(name) {
  const f = await new FBXLoader().loadAsync(`${BASE}clips/${name}.fbx`);
  const clip = f.animations[0];
  clip.name = name;
  // Wurzelbewegung (Bip01-Position): nur die Höhe behalten (y), waagerecht festhalten – Laufwege steuern wir selbst
  for (const tr of clip.tracks) {
    if (/Bip01\.position$/.test(tr.name)) {
      const v = tr.values;
      const x0 = v[0];
      const z0 = v[2];
      for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
    }
  }
  return clip;
}

export async function preloadRocketbox(avatarNames, clipNames) {
  await Promise.all([
    ...avatarNames.filter((n) => !avatars[n]).map(async (n) => { avatars[n] = await loadAvatar(n); }),
    ...clipNames.filter((n) => !clips[n]).map(async (n) => { clips[n] = await loadClip(n); }),
  ]);
}

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
function lerpAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

export function makeActor(name, { clips: timeline = [], path = [], face = [], fade = 0.45, pos = [0, 0, 0], yaw = 0 } = {}) {
  const root = new THREE.Group();
  const model = cloneSkinned(avatars[name]);
  root.add(model);
  root.position.set(...pos);
  root.rotation.y = yaw;
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  for (const seg of timeline) {
    if (!actions[seg.clip]) {
      const a = mixer.clipAction(clips[seg.clip]);
      a.play();
      a.setEffectiveWeight(0);
      actions[seg.clip] = a;
    }
  }
  const head = (() => { let h = null; model.traverse((o) => { if (/Bip01_Head$/.test(o.name)) h = o; }); return h; })();

  function posAt(t) {
    if (!path.length) return null;
    if (t <= path[0].t) return new THREE.Vector3(...path[0].pos);
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      if (t < b.t) return new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), (t - a.t) / (b.t - a.t));
    }
    return new THREE.Vector3(...path[path.length - 1].pos);
  }

  return {
    root,
    model,
    head,
    // Kopfposition in Weltkoordinaten (z. B. als Kamera-Blickziel)
    headWorld() { return head ? head.getWorldPosition(new THREE.Vector3()) : root.position.clone().add(new THREE.Vector3(0, 1.65, 0)); },
    update(t, camPos) {
      // Laufweg + Blickrichtung
      const p = posAt(t);
      if (p) {
        const ahead = posAt(t + 0.15);
        root.position.copy(p);
        if (ahead.distanceToSquared(p) > 1e-6) root.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z);
      }
      let f = null;
      for (const k of face) if (t >= k.t) f = k;
      if (f) {
        const target = (k) => {
          if (k.yaw !== undefined) return k.yaw;
          const L = k.look === 'camera' && camPos ? [camPos.x, camPos.z] : k.look;
          return Math.atan2(L[0] - root.position.x, L[1] - root.position.z);
        };
        const i = face.indexOf(f);
        const prev = i > 0 ? target(face[i - 1]) : root.rotation.y;
        root.rotation.y = lerpAngle(prev, target(f), ease((t - f.t) / (f.turn ?? 0.5)));
      }
      // Animation: aktuelles Segment + Überblendung vom vorherigen
      let cur = -1;
      for (let i = 0; i < timeline.length; i++) if (t >= timeline[i].t) cur = i;
      for (const a of Object.values(actions)) a.setEffectiveWeight(0);
      if (cur >= 0) {
        const seg = timeline[cur];
        const k = cur > 0 ? ease((t - seg.t) / fade) : 1;
        const set = (s, w, local) => {
          const a = actions[s.clip];
          const d = a.getClip().duration;
          const tt = local * (s.speed ?? 1) + (s.offset ?? 0);
          a.time = s.once ? Math.min(tt, d - 1e-3) : ((tt % d) + d) % d;
          a.setEffectiveWeight(a.getEffectiveWeight() + w);
        };
        if (k < 1) { const prev = timeline[cur - 1]; set(prev, 1 - k, t - prev.t); }
        set(seg, k, t - seg.t);
      }
      mixer.update(0);
    },
  };
}
