// Alle Drehorte in einer Szene, je an eigenem Ursprung. Nur der aktive Ort ist sichtbar.

import * as THREE from 'three';
import { buildOffice, DAYLIGHT, skyTex } from './scene.js';
import { buildBedroom, buildKitchen, buildBus, buildLiving } from './sets.js';

export const ORIGINS = {
  office: [0, 0, 0],
  bedroom: [100, 0, 0],
  kitchen: [200, 0, 0],
  bus: [300, 0, 0],
  living: [400, 0, 0],
};

// Ortsname für die Kopfzeile
export const PLACES = {
  office: 'BÜRO · 3. OG',
  bedroom: 'SCHLAFZIMMER',
  kitchen: 'KÜCHE',
  bus: 'BUS LINIE 6',
  living: 'WOHNZIMMER',
};

export function buildWorld() {
  const scene = new THREE.Scene();
  scene.name = 'POV_ReleaseDay';
  scene.background = new THREE.Color('#9fd6f5');

  const skyMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const skyTexs = Object.fromEntries(Object.entries(DAYLIGHT).map(([k, p]) => [k, skyTex(p)]));

  const hemi = new THREE.HemisphereLight('#e8f6ff', '#8f8a80', 1.2);
  const amb = new THREE.AmbientLight('#ffffff', 0.5);
  const sun = new THREE.DirectionalLight('#ffffff', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 90 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, amb, sun, sun.target);

  const office = buildOffice(skyMat);
  office.sunDir = [-1, 0.2];
  office.sunTarget = [1, 0, 0.5];
  const sets = {
    office,
    bedroom: buildBedroom(skyMat),
    kitchen: buildKitchen(skyMat),
    bus: buildBus(skyMat),
    living: buildLiving(skyMat),
  };
  const towers = [];
  for (const [name, s] of Object.entries(sets)) {
    s.origin = new THREE.Vector3(...ORIGINS[name]);
    s.group.position.copy(s.origin);
    s.group.visible = false;
    scene.add(s.group);
    towers.push(...(s.towers || []));
  }

  let loc = '', day = '';
  function placeSun() {
    const s = sets[loc], p = DAYLIGHT[day];
    if (!s || !p) return;
    const [dx, dz] = s.sunDir;
    const n = Math.hypot(dx, dz);
    sun.position.set(s.origin.x + (dx / n) * 30, p.sunElev, s.origin.z + (dz / n) * 30);
    sun.target.position.set(s.origin.x + s.sunTarget[0], s.sunTarget[1], s.origin.z + s.sunTarget[2]);
  }

  function setLocation(name) {
    if (name === loc) return;
    for (const [k, s] of Object.entries(sets)) s.group.visible = k === name;
    loc = name;
    placeSun();
  }

  function setDaylight(name) {
    if (name === day) return;
    day = name;
    const p = DAYLIGHT[name];
    skyMat.map = skyTexs[name];
    skyMat.needsUpdate = true;
    scene.background.set(p.skyTop);
    sun.color.set(p.sun);
    sun.intensity = p.sunI;
    hemi.color.set(p.hemiSky);
    hemi.groundColor.set(p.hemiGround);
    hemi.intensity = p.hemiI;
    amb.intensity = p.amb;
    office.setDaylight(p);
    for (const b of towers) { b.material.map = b.userData.mats[p.lit ? 1 : 0]; b.material.needsUpdate = true; }
    placeSun();
  }

  function update(t) {
    sets[loc]?.update?.(t);
  }

  return { scene, sets, setLocation, setDaylight, update, get location() { return loc; } };
}
