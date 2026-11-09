// Wiederverwendbarer Player für POV-Folgen.
// Eine Folge besteht aus script.js (Drehbuch) + scene.js (Set) + einer kleinen index.html:
//
//   import { runPov } from '../shared/pov-player.js';
//   import * as S from './script.js';
//   import { buildScene } from './scene.js';
//   runPov(S, buildScene);
//
// Drehbuch (script.js) – alle Zeiten in Sekunden:
//   DURATION
//   SHOTS   [{ t0, t1, name, seated, hands: 'cup'|'desk'|'lap'|'phone'|'none' | [{ t, mode }],
//              walk: [[a, b]], typing: [[a, b]], raiseL: [[a, b]],
//              fov, cam: [{ t, pos: [x,y,z], look: [x,y,z] | { actor: 'tobi', dy }, hold }] }]
//            Zwischen zwei Shots wird kurz auf Schwarz abgeblendet (Zeitsprung).
//   HEADER  [{ t0, t1, line1, line2 }]                Ort/Zeit oben links
//   BOXES   [{ t0, t1, kicker, text, variant: 'red'|'dark' }]
//   TITLES  [{ t0, t1, text }]                         große Texteinblendung („NOCH 7 TAGE“)
//   SPEAKERS { name: farbe },  LINES [{ t0, t1, who, text }]
//   ENDCARD { t0, big, small }
//   SFX     [...]  (für tools/render_video.mjs)
import * as THREE from 'three';
import { createPovPost, makePovHands, makePovBody, preloadHands } from './toon.js';

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const inAny = (t, ranges = []) => ranges.reduce((m, [a, b]) => Math.max(m, ease((t - a) / 0.3) * (1 - ease((t - b + 0.3) / 0.3))), 0);

const CSS = `
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  #stage { position: relative; margin: 0 auto; overflow: hidden; }
  canvas { display: block; }
  #ov { position: absolute; inset: 0; pointer-events: none; font-family: Inter, 'Arial Black', system-ui, sans-serif; color: #fff; }
  #hdr { position: absolute; left: calc(var(--u) * 46); top: calc(var(--u) * 62); text-shadow: 0 calc(var(--u) * 2) calc(var(--u) * 6) rgba(0,0,0,.8); }
  #hdr .l1 { font-weight: 800; font-size: calc(var(--u) * 31); letter-spacing: .07em; text-transform: uppercase; }
  #hdr .l2 { font-weight: 700; font-size: calc(var(--u) * 23); letter-spacing: .1em; text-transform: uppercase; opacity: .92; margin-top: calc(var(--u) * 4); }
  .box { position: absolute; left: calc(var(--u) * 58); right: calc(var(--u) * 58); top: calc(var(--u) * 210); padding: calc(var(--u) * 20) calc(var(--u) * 30) calc(var(--u) * 24);
         border-radius: calc(var(--u) * 18); background: rgba(22, 24, 32, .94); border: calc(var(--u) * 3) solid rgba(0,0,0,.65);
         box-shadow: 0 calc(var(--u) * 8) calc(var(--u) * 24) rgba(0,0,0,.45); }
  .box .k { color: #b9c0d0; font-weight: 700; font-size: calc(var(--u) * 26); margin-bottom: calc(var(--u) * 6); }
  .box .v { font-weight: 800; font-size: calc(var(--u) * 40); line-height: 1.18; }
  .box.red { background: #c9252c; }
  .box.red .k { color: #ffe1e1; }
  #title { position: absolute; left: 0; right: 0; top: 15%; text-align: center; font-weight: 900; font-size: calc(var(--u) * 74); letter-spacing: .05em;
           -webkit-text-stroke: calc(var(--u) * 12) #111; paint-order: stroke fill; text-transform: uppercase; }
  #sub { position: absolute; left: 6%; right: 6%; top: 61%; text-align: center; font-weight: 900; font-size: calc(var(--u) * 50); line-height: 1.15;
         -webkit-text-stroke: calc(var(--u) * 10) #121218; paint-order: stroke fill; }
  #end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 8%; }
  #end .big { font-weight: 900; font-size: calc(var(--u) * 64); line-height: 1.15; -webkit-text-stroke: calc(var(--u) * 10) #121218; paint-order: stroke fill; }
  #end .small { position: absolute; bottom: 12%; left: 8%; right: 8%; font-weight: 700; font-size: calc(var(--u) * 27); color: #d5dae6; -webkit-text-stroke: calc(var(--u) * 6) #121218; paint-order: stroke fill; }
  #info { position: fixed; bottom: 8px; left: 8px; color: #fff; font: 12px system-ui; opacity: .7; }
  body.render #info { display: none; }
`;

export async function runPov(S, buildScene, opts = {}) {
  const params = new URLSearchParams(location.search);
  const W = +params.get('w') || Math.round(Math.min(innerHeight * 9 / 16, innerWidth));
  const H = +params.get('h') || Math.round(W * 16 / 9);
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  document.body.insertAdjacentHTML('beforeend', `
    <div id="stage"><div id="ov">
      <div id="hdr"><div class="l1"></div><div class="l2"></div></div>
      <div id="box" class="box" style="display:none"><div class="k"></div><div class="v"></div></div>
      <div id="title"></div><div id="sub"></div>
      <div id="end" style="display:none"><div class="big"></div><div class="small"></div></div>
    </div></div>
    <div id="info">Leertaste = Pause · ←/→ = 1 s springen · ?t=12 = Standbild</div>`);
  if (params.has('w')) document.body.classList.add('render');
  const stage = document.getElementById('stage');
  stage.style.width = W + 'px';
  stage.style.height = H + 'px';
  stage.style.setProperty('--u', W / 1080 + 'px');

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  await preloadHands();
  const set = await buildScene();
  const { scene } = set;
  const camera = new THREE.PerspectiveCamera(100, W / H, 0.03, 200);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  const hands = await makePovHands(camera, { sleeve: opts.sleeve || '#3b3f4a', skin: opts.skin || '#f1c39c', phone: set.phone || null });
  const post = createPovPost(renderer, W, H, { fisheye: +(params.get('fisheye') ?? opts.fisheye ?? 0.42), ...(opts.post || {}) });
  // Eigener Körper im Sitzen (Shots mit seated: true)
  const body = makePovBody({ pants: opts.pants || '#2d3a5a', top: opts.sleeve || '#3b3f4a' });
  body.visible = false;
  scene.add(body);

  // ---- Kamera: Hermite-Spline innerhalb eines Shots
  const shotAt = (t) => S.SHOTS.find((s) => t >= s.t0 && t < s.t1) || S.SHOTS[S.SHOTS.length - 1];
  const resolve = (look, t) => {
    if (Array.isArray(look)) return new THREE.Vector3(...look);
    const a = set.actors?.[look.actor];
    const p = a ? a.headWorld() : new THREE.Vector3();
    return p.add(new THREE.Vector3(0, look.dy ?? 0, 0));
  };
  function spline(K, t, get) {
    if (t <= K[0].t) return get(K[0]);
    if (t >= K[K.length - 1].t) return get(K[K.length - 1]);
    let i = 0;
    while (t >= K[i + 1].t) i++;
    const a = K[i], b = K[i + 1], dt = b.t - a.t;
    const tan = (j) => (K[j].hold || j === 0 || j === K.length - 1 ? new THREE.Vector3() : get(K[j + 1]).sub(get(K[j - 1])).divideScalar(K[j + 1].t - K[j - 1].t));
    const u = (t - a.t) / dt, u2 = u * u, u3 = u2 * u;
    return get(a).multiplyScalar(2 * u3 - 3 * u2 + 1).add(tan(i).multiplyScalar((u3 - 2 * u2 + u) * dt))
      .add(get(b).multiplyScalar(-2 * u3 + 3 * u2)).add(tan(i + 1).multiplyScalar((u3 - u2) * dt));
  }
  const sway = (t, s) => Math.sin(t * 0.61 + s) * 0.6 + Math.sin(t * 1.37 + s * 2.1) * 0.3 + Math.sin(t * 2.9 + s * 3.7) * 0.1;
  function placeCamera(t, shot) {
    const K = shot.cam;
    const pos = spline(K, t, (k) => new THREE.Vector3(...k.pos));
    // Blick als Richtung interpolieren (nicht als Punkt) – sonst schwingt die Kurve bei weit
    // entfernten Zielen über und der Blick kippt. Leicht nachziehend (Kopf folgt verzögert).
    const dirOf = (k) => resolve(k.look, t).sub(new THREE.Vector3(...k.pos)).normalize();
    const dir = spline(K, t - 0.08, dirOf).normalize().lerp(spline(K, t, dirOf).normalize(), 0.5).normalize();
    const look = pos.clone().add(dir.clone().multiplyScalar(3));
    const bob = inAny(t, shot.walk);
    const phase = t * Math.PI * 2 * 1.7;
    pos.y += (Math.abs(Math.sin(phase)) - 0.5) * 0.04 * bob;
    pos.x += Math.sin(phase / 2) * 0.02 * bob;
    look.x += sway(t, 0) * 0.05;
    look.y += sway(t, 1.3) * 0.035 + Math.sin(phase) * 0.03 * bob;
    camera.position.copy(pos);
    camera.lookAt(look);
    camera.rotateZ(Math.sin(phase / 2) * 0.01 * bob + sway(t, 2.6) * 0.007);
    if (camera.fov !== (shot.fov || 100)) { camera.fov = shot.fov || 100; camera.updateProjectionMatrix(); }
    // Körper: unter den Augen, dreht mit der (ruhigen) Blickrichtung mit – wie auf einem Drehstuhl
    body.visible = !!shot.seated;
    if (body.visible) {
      const yaw = Math.atan2(-dir.x, -dir.z);
      body.position.set(pos.x, 0, pos.z);
      body.rotation.set(0, yaw, 0);
    }
    hands.update(t, { ...handsAt(shot, t), body, bob, phase, typing: inAny(t, shot.typing), raiseL: inAny(t, shot.raiseL) });
  }
  // Hand-Haltung eines Shots: 'desk' oder [{ t, mode }] mit weichem Wechsel (0.5 s)
  function handsAt(shot, t) {
    const H = shot.hands || 'none';
    if (typeof H === 'string') return { mode: H };
    let i = 0;
    while (i < H.length - 1 && t >= H[i + 1].t) i++;
    const cur = H[i];
    const k = ease((t - cur.t) / 0.5);
    return i > 0 && k < 1 ? { mode: H[i - 1].mode, modeB: cur.mode, k } : { mode: cur.mode };
  }

  // ---- Overlays
  const $ = (id) => document.getElementById(id);
  const hdr = $('hdr'), boxEl = $('box'), titleEl = $('title'), subEl = $('sub'), endEl = $('end');
  const find = (list, t) => (list || []).find((x) => t >= x.t0 && t < x.t1);
  function overlays(t) {
    for (const id of ['hdr', 'box', 'title', 'sub', 'end']) $(id).style.visibility = '';
    const h = find(S.HEADER, t);
    hdr.style.display = h ? '' : 'none';
    if (h) { hdr.querySelector('.l1').textContent = h.line1; hdr.querySelector('.l2').textContent = h.line2 || ''; }
    const b = find(S.BOXES, t);
    if (b) {
      boxEl.style.display = '';
      boxEl.className = 'box ' + (b.variant === 'red' ? 'red' : '');
      boxEl.querySelector('.k').textContent = b.kicker;
      boxEl.querySelector('.v').textContent = b.text;
      const a = ease((t - b.t0) / 0.25) * (1 - ease((t - b.t1 + 0.25) / 0.25));
      boxEl.style.opacity = a;
      boxEl.style.transform = `translateY(${(1 - a) * -16}px) scale(${1 + 0.03 * Math.max(0, 1 - (t - b.t0) * 4)})`;
    } else boxEl.style.display = 'none';
    const ti = find(S.TITLES, t);
    titleEl.textContent = ti ? ti.text : '';
    if (ti) titleEl.style.opacity = ease((t - ti.t0) / 0.2) * (1 - ease((t - ti.t1 + 0.3) / 0.3));
    const l = find(S.LINES, t);
    if (l) {
      subEl.textContent = l.text;
      subEl.style.color = S.SPEAKERS[l.who] || '#fff';
      const a = ease((t - l.t0) / 0.12);
      subEl.style.opacity = a;
      subEl.style.transform = `scale(${0.92 + 0.08 * a})`;
    } else subEl.textContent = '';
    // Abblenden: Zeitsprünge zwischen Shots, Anfang, Abspann
    let fade = 1 - ease(t / 0.4);
    for (const s of S.SHOTS.slice(1)) fade = Math.max(fade, 1 - Math.min(1, Math.abs(t - s.t0) / 0.32));
    const e = S.ENDCARD;
    if (e && t >= e.t0) {
      fade = Math.max(fade, ease((t - e.t0) / 0.6) * 0.75);
      endEl.style.display = '';
      endEl.style.opacity = ease((t - e.t0 - 0.3) / 0.4);
      endEl.querySelector('.big').textContent = e.big;
      endEl.querySelector('.small').textContent = e.small;
    } else endEl.style.display = 'none';
    post.uniforms.fade.value = fade;
  }

  function renderAt(t) {
    const shot = shotAt(t);
    set.update(t, { camPos: camera.position, shot, preCamera: true });
    placeCamera(t, shot);
    set.update(t, { camPos: camera.position, shot });
    overlays(t);
    post.render(scene, camera, t);
  }

  // ---- Kameraplan von oben (für das Storyboard): Kameraweg, Blickrichtungen, Figuren
  const planGroup = new THREE.Group();
  scene.add(planGroup);
  planGroup.visible = false;
  function renderPlan(i) {
    const shot = S.SHOTS[i];
    const tm = (shot.t0 + shot.t1) / 2;
    renderAt(tm);
    planGroup.clear();
    const pts = [];
    for (let tt = shot.t0; tt <= shot.t1; tt += 0.1) pts.push(spline(shot.cam, tt, (k) => new THREE.Vector3(...k.pos)).setY(2.6));
    planGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#ff2d55' })));
    for (const k of shot.cam) {
      const p = new THREE.Vector3(...k.pos).setY(2.6);
      const d = resolve(k.look, k.t).setY(2.6).sub(p).normalize();
      planGroup.add(new THREE.ArrowHelper(d, p, 1.1, '#ff2d55', 0.3, 0.2));
    }
    // Figuren als Punkte zum Zeitpunkt der Shot-Mitte
    for (const [n, a] of Object.entries(set.actors || {})) {
      if (!a.root.visible) continue;
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), new THREE.MeshBasicMaterial({ color: '#1e90ff' }));
      m.rotation.x = -Math.PI / 2; m.position.copy(a.root.position).setY(2.62); planGroup.add(m);
    }
    planGroup.visible = true;
    hands.group.visible = false;
    const b = new THREE.Box3();
    for (const k of shot.cam) b.expandByPoint(new THREE.Vector3(...k.pos));
    const c = b.getCenter(new THREE.Vector3());
    const half = Math.max(4.5, (b.max.x - b.min.x) * 0.8, (b.max.z - b.min.z) * 0.5);
    const top = new THREE.OrthographicCamera(-half, half, half * H / W, -half * H / W, 0.1, 10);
    top.position.set(c.x, 2.8, c.z); top.up.set(0, 0, -1); top.lookAt(c.x, 0, c.z);
    for (const id of ['hdr', 'box', 'title', 'sub', 'end']) $(id).style.visibility = 'hidden';
    renderer.setRenderTarget(null);
    renderer.render(scene, top);
    planGroup.visible = false;
  }

  let t = +(params.get('t') ?? 0);
  let playing = !params.has('t') && !params.has('w');
  let last = performance.now();
  function loop(now) {
    if (playing) { t += (now - last) / 1000; if (t > S.DURATION) t = 0; }
    last = now;
    renderAt(t);
    requestAnimationFrame(loop);
  }
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') playing = !playing;
    if (e.code === 'ArrowRight') t = Math.min(S.DURATION, t + 1);
    if (e.code === 'ArrowLeft') t = Math.max(0, t - 1);
  });
  if (params.has('w')) renderAt(t); else requestAnimationFrame(loop);
  window.__pov = { renderAt, renderPlan, duration: S.DURATION, sfx: S.SFX || [], camera, set, hands, script: JSON.parse(JSON.stringify({ SHOTS: S.SHOTS, LINES: S.LINES || [], HEADER: S.HEADER || [], BOXES: S.BOXES || [], TITLES: S.TITLES || [] })) };
  window.__ready = true;
}
