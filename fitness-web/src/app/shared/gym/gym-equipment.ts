import * as THREE from 'three';

/**
 * Low-poly gym equipment built from simple shapes (boxes, cylinders, spheres).
 * Everything is made in code, so there are no model files to download.
 * Units are metres; each builder returns a Group standing on y = 0.
 */

export const C = { red: 0xec5a5f, yellow: 0xf2b632, green: 0x34ab72, blue: 0x4a86f5, steel: 0x8e99a8 };

interface MatOptions {
  r?: number;
  m?: number;
  extra?: THREE.MeshStandardMaterialParameters;
}

/** Every mesh gets its own material, so a single zone can glow on hover */
export const mat = (color: THREE.ColorRepresentation, o: MatOptions = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0.1, ...o.extra });
export const STEEL = () => mat(0x5d6676, { r: 0.35, m: 0.7 });
export const DARK = () => mat(0x2a2f38, { r: 0.55, m: 0.4 });
export const PAD = () => mat(0x1b1e24, { r: 0.85 });
export const CHROME = () => mat(0xc9d1db, { r: 0.2, m: 0.95 });

export function mesh(geo: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, parent?: THREE.Object3D) =>
  mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
export function cyl(
  r: number,
  h: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  parent?: THREE.Object3D,
  axis: 'x' | 'y' | 'z' = 'y',
  seg = 20,
) {
  const m = mesh(new THREE.CylinderGeometry(r, r, h, seg), material, x, y, z, parent);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

/** Olympic barbell with bumper plates, along the x axis */
export function barbell(plates: number[] = [C.red, C.blue]) {
  const g = new THREE.Group();
  cyl(0.028, 2.2, CHROME(), 0, 0, 0, g, 'x', 12);
  for (const s of [-1, 1]) {
    cyl(0.04, 0.42, CHROME(), s * 0.86, 0, 0, g, 'x', 12);
    cyl(0.06, 0.04, CHROME(), s * 0.63, 0, 0, g, 'x', 16);
    plates.forEach((c, i) => {
      const r = i === 0 ? 0.225 : 0.2;
      cyl(r, 0.06, mat(c, { r: 0.7 }), s * (0.69 + i * 0.065), 0, 0, g, 'x', 28);
    });
  }
  return g;
}

export function squatRack() {
  const g = new THREE.Group();
  const s = 0.11;
  for (const x of [-0.75, 0.75]) for (const z of [-0.6, 0.6]) box(s, 2.5, s, DARK(), x, 1.25, z, g);
  for (const x of [-0.75, 0.75]) { box(s, s, 1.3, DARK(), x, 2.45, 0, g); box(s, s, 1.3, DARK(), x, 0.06, 0, g); }
  box(1.6, s, s, DARK(), 0, 2.45, -0.6, g);
  box(1.6, s, s, DARK(), 0, 2.45, 0.6, g);
  for (const x of [-0.75, 0.75]) { box(0.08, 0.06, 0.18, STEEL(), x, 1.38, 0.66, g); box(0.06, 0.06, 0.9, STEEL(), x, 0.75, 0.2, g); }
  const bar = barbell([C.red, C.yellow]);
  bar.position.set(0, 1.45, 0.66);
  g.add(bar);
  return g;
}

export function bench() {
  const g = new THREE.Group();
  box(0.36, 0.1, 1.3, PAD(), 0, 0.46, 0.15, g);
  box(0.08, 0.4, 0.08, STEEL(), 0, 0.22, 0.65, g);
  box(0.5, 0.05, 0.08, STEEL(), 0, 0.03, 0.65, g);
  box(0.08, 0.4, 0.08, STEEL(), 0, 0.22, -0.3, g);
  // uprights
  for (const x of [-0.45, 0.45]) {
    box(0.07, 1.1, 0.07, DARK(), x, 0.55, -0.55, g);
    box(0.07, 0.05, 0.6, DARK(), x, 0.03, -0.55, g);
  }
  box(0.97, 0.06, 0.07, DARK(), 0, 0.06, -0.55, g);
  const bar = barbell([C.blue, C.green]);
  bar.position.set(0, 1.1, -0.55);
  g.add(bar);
  return g;
}

export function plateTree() {
  const g = new THREE.Group();
  box(0.6, 0.05, 0.6, DARK(), 0, 0.03, 0, g);
  cyl(0.05, 1.2, DARK(), 0, 0.6, 0, g);
  const pegs = [[0.35, C.red], [0.65, C.blue], [0.95, C.yellow]];
  pegs.forEach(([y, c], i) => {
    for (const s of [-1, 1]) {
      const p = cyl(0.21 - i * 0.02, 0.06, mat(c, { r: 0.7 }), s * 0.12, y, 0, g, 'x', 28);
      p.position.x = s * 0.12;
    }
  });
  return g;
}

export function weightStack(h = 1.3) {
  const g = new THREE.Group();
  const n = 14;
  for (let i = 0; i < n; i++) box(0.4, (h / n) * 0.82, 0.22, mat(i % 2 ? 0x2b3039 : 0x23272e, { r: 0.5, m: 0.5 }), 0, 0.12 + (h / n) * i + (h / n) / 2, 0, g);
  cyl(0.015, h + 0.4, CHROME(), -0.12, (h + 0.4) / 2, 0, g, 'y', 8);
  cyl(0.015, h + 0.4, CHROME(), 0.12, (h + 0.4) / 2, 0, g, 'y', 8);
  return g;
}

export function cableCrossover(span = 4.6) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const x = s * span / 2;
    box(0.12, 2.7, 0.12, DARK(), x - 0.3, 1.35, -0.25, g);
    box(0.12, 2.7, 0.12, DARK(), x + 0.3, 1.35, -0.25, g);
    box(0.72, 0.1, 0.6, DARK(), x, 0.05, -0.1, g);
    const st = weightStack(1.4); st.position.set(x, 0, -0.25); g.add(st);
    // pulley on the inner side + hanging cable and handle
    const px = x - s * 0.42;
    mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 20), STEEL(), px, 2.1, 0.0, g).rotation.y = Math.PI / 2;
    cyl(0.008, 0.7, mat(0x111111), px, 1.72, 0.02, g, 'y', 6);
    box(0.2, 0.04, 0.04, mat(C.blue, { r: 0.5 }), px, 1.36, 0.02, g);
  }
  box(span + 0.72, 0.12, 0.12, DARK(), 0, 2.72, -0.25, g);
  box(span - 0.6, 0.06, 0.06, CHROME(), 0, 2.45, -0.25, g);
  return g;
}

export function legPress() {
  const g = new THREE.Group();
  box(1.2, 0.12, 2.6, DARK(), 0, 0.06, 0, g);
  // 45° rails + sled
  for (const x of [-0.42, 0.42]) {
    const rail = box(0.1, 0.1, 2.0, STEEL(), x, 1.0, -0.55, g);
    rail.rotation.x = Math.PI / 4;
  }
  const sled = box(0.9, 0.7, 0.08, mat(0x30363f, { r: 0.4, m: 0.5 }), 0, 1.25, -0.85, g);
  sled.rotation.x = Math.PI / 4;
  for (const s of [-1, 1]) {
    const pl = cyl(0.24, 0.07, mat(s < 0 ? C.green : C.yellow, { r: 0.7 }), s * 0.6, 1.5, -1.15, g, 'x', 28);
    pl.rotation.set(Math.PI / 4, 0, Math.PI / 2);
  }
  // seat and back rest
  box(0.6, 0.12, 0.55, PAD(), 0, 0.5, 0.7, g);
  const back = box(0.6, 0.85, 0.12, PAD(), 0, 0.85, 1.05, g);
  back.rotation.x = -0.45;
  box(0.08, 0.4, 0.4, STEEL(), 0, 0.3, 0.75, g);
  return g;
}

export function chestFly() {
  const g = new THREE.Group();
  box(1.4, 0.1, 1.2, DARK(), 0, 0.05, 0, g);
  box(0.16, 2.2, 0.16, DARK(), -0.6, 1.1, -0.45, g);
  box(0.16, 2.2, 0.16, DARK(), 0.6, 1.1, -0.45, g);
  box(1.36, 0.14, 0.16, DARK(), 0, 2.2, -0.45, g);
  const st = weightStack(1.5); st.position.set(0, 0, -0.45); g.add(st);
  box(0.45, 0.1, 0.45, PAD(), 0, 0.55, 0.1, g);
  box(0.45, 0.8, 0.1, PAD(), 0, 1.0, -0.15, g);
  box(0.08, 0.5, 0.08, STEEL(), 0, 0.28, 0.1, g);
  for (const s of [-1, 1]) {
    const arm = box(0.07, 0.07, 0.8, STEEL(), s * 0.55, 1.35, 0.12, g);
    arm.rotation.y = s * 0.5;
    cyl(0.06, 0.35, PAD(), s * 0.72, 1.35, 0.42, g, 'y', 12);
  }
  return g;
}

export function kettlebell(size: number, color: number) {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(size, 20, 16), mat(0x22262d, { r: 0.45, m: 0.6 }), 0, size, 0, g);
  body.scale.y = 0.92;
  mesh(new THREE.TorusGeometry(size * 0.62, size * 0.13, 8, 20, Math.PI), mat(0x22262d, { r: 0.45, m: 0.6 }), 0, size * 1.75, 0, g);
  mesh(new THREE.CylinderGeometry(size * 1.01, size * 1.01, size * 0.22, 24), mat(color, { r: 0.6 }), 0, size * 0.95, 0, g);
  return g;
}

export function kettlebellRack() {
  const g = new THREE.Group();
  for (const z of [-1.6, 1.6]) { box(0.08, 1.0, 0.08, DARK(), -0.25, 0.5, z, g); box(0.08, 1.0, 0.08, DARK(), 0.25, 0.5, z, g); }
  box(0.6, 0.05, 3.3, STEEL(), 0, 0.35, 0, g);
  box(0.6, 0.05, 3.3, STEEL(), 0, 0.9, 0, g);
  const colors = [C.yellow, C.blue, C.green, C.red, 0xa77bd9];
  colors.forEach((c, i) => { const k = kettlebell(0.13 + i * 0.012, c); k.position.set(0, 0.375, -1.3 + i * 0.65); g.add(k); });
  colors.slice(0, 4).forEach((c, i) => { const k = kettlebell(0.12, c); k.position.set(0, 0.925, -1.0 + i * 0.68); g.add(k); });
  const loose = kettlebell(0.19, C.red); loose.position.set(0.9, 0, 0.4); g.add(loose);
  return g;
}

export function pullUpStation() {
  const g = new THREE.Group();
  for (const x of [-0.9, 0.9]) {
    box(0.12, 2.7, 0.12, DARK(), x, 1.35, 0, g);
    box(0.12, 0.08, 1.0, DARK(), x, 0.04, 0, g);
  }
  cyl(0.03, 2.0, CHROME(), 0, 2.6, 0.08, g, 'x', 12);
  // dip handles
  for (const x of [-0.32, 0.32]) {
    box(0.06, 0.06, 0.55, STEEL(), x, 1.25, 0.32, g);
    box(0.06, 1.25, 0.06, STEEL(), x, 0.62, 0.05, g);
  }
  box(0.7, 0.06, 0.06, STEEL(), 0, 1.25, 0.05, g);
  return g;
}

function mat2(color: number) { return mat(color, { r: 0.95 }); }
export function mats() {
  const g = new THREE.Group();
  box(0.75, 0.04, 1.9, mat2(0x2f6f57), -1.3, 0.02, 0, g);
  box(0.75, 0.04, 1.9, mat2(0x2d4f86), 0, 0.02, 0, g);
  const rolled = cyl(0.12, 0.75, mat2(0x7a3b3d), 1.25, 0.12, -0.6, g, 'x', 16);
  rolled.rotation.y = 0.2;
  return g;
}

export function balls() {
  const g = new THREE.Group();
  mesh(new THREE.SphereGeometry(0.55, 32, 24), mat(C.blue, { r: 0.35 }), -0.9, 0.55, 0.4, g);
  mesh(new THREE.SphereGeometry(0.48, 32, 24), mat(0x5c6472, { r: 0.35 }), 0.1, 0.48, -0.7, g);
  // medicine ball rack
  box(1.4, 0.06, 0.4, DARK(), 0.9, 0.5, 0.7, g);
  for (const x of [0.25, 1.55]) box(0.06, 0.5, 0.4, DARK(), x, 0.25, 0.7, g);
  [C.red, C.yellow, C.green].forEach((c, i) => mesh(new THREE.SphereGeometry(0.17, 20, 16), mat(c, { r: 0.8 }), 0.45 + i * 0.45, 0.7, 0.7, g));
  return g;
}

export function bandRack() {
  const g = new THREE.Group();
  for (const x of [-1.0, 1.0]) { box(0.08, 1.9, 0.08, DARK(), x, 0.95, 0, g); box(0.08, 0.06, 0.6, DARK(), x, 0.03, 0, g); }
  box(2.08, 0.08, 0.08, DARK(), 0, 1.9, 0, g);
  [C.red, C.yellow, C.green, C.blue, 0x2a2f38].forEach((c, i) => {
    const x = -0.8 + i * 0.4;
    cyl(0.012, 0.12, CHROME(), x, 1.82, 0, g, 'y', 6);
    const band = mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 28), mat(c, { r: 0.7 }), x, 1.62, 0, g);
    band.scale.y = 1.9 - i * 0.12;
  });
  return g;
}

// ---------- more equipment ----------
export const WOOD = () => mat(0xa8784a, { r: 0.75 });
export const SCREEN = (hex = 0x5fc4c9) => mat(0x0e1116, { r: 0.3, extra: { emissive: hex, emissiveIntensity: 0.9 } });

/** Treadmill, runner faces -z */
export function treadmill() {
  const g = new THREE.Group();
  box(0.86, 0.18, 2.1, DARK(), 0, 0.12, 0.1, g);
  box(0.62, 0.03, 1.8, mat(0x121418, { r: 0.9 }), 0, 0.22, 0.15, g);
  for (const s of [-1, 1]) {
    const post = box(0.07, 1.2, 0.07, STEEL(), s * 0.4, 0.75, -0.75, g);
    post.rotation.x = 0.18;
    box(0.06, 0.06, 0.55, STEEL(), s * 0.4, 1.08, -0.45, g);
  }
  box(0.86, 0.32, 0.16, DARK(), 0, 1.36, -0.9, g).rotation.x = -0.5;
  box(0.6, 0.22, 0.02, SCREEN(0x5fc4c9), 0, 1.4, -0.8, g).rotation.x = -0.5;
  return g;
}

/** Spin bike, rider faces -z */
export function bike() {
  const g = new THREE.Group();
  box(0.5, 0.06, 1.1, DARK(), 0, 0.03, 0, g);
  cyl(0.27, 0.07, mat(0x30363f, { r: 0.4, m: 0.6 }), 0, 0.42, -0.32, g, 'x', 28);
  const down = box(0.08, 0.9, 0.08, STEEL(), 0, 0.5, 0.05, g); down.rotation.x = -0.35;
  box(0.08, 0.95, 0.08, STEEL(), 0, 0.55, -0.42, g).rotation.x = 0.15;
  box(0.24, 0.07, 0.32, PAD(), 0, 1.0, 0.25, g);
  box(0.5, 0.05, 0.08, CHROME(), 0, 1.07, -0.5, g);
  box(0.26, 0.16, 0.03, SCREEN(0xf2b632), 0, 1.15, -0.55, g).rotation.x = -0.4;
  return g;
}

/** Rowing machine, length along z */
export function rower() {
  const g = new THREE.Group();
  box(0.16, 0.08, 2.6, STEEL(), 0, 0.3, 0.2, g);
  for (const z of [-1.0, 1.4]) box(0.6, 0.06, 0.1, DARK(), 0, 0.03, z, g);
  box(0.06, 0.3, 0.06, DARK(), 0, 0.15, 1.4, g);
  cyl(0.32, 0.22, mat(0x1f2329, { r: 0.4, m: 0.5 }), 0, 0.45, -1.15, g, 'x', 28);
  box(0.34, 0.08, 0.36, PAD(), 0, 0.38, 0.5, g);
  for (const s of [-1, 1]) box(0.14, 0.03, 0.26, DARK(), s * 0.16, 0.42, -0.6, g).rotation.x = -0.9;
  box(0.4, 0.04, 0.04, mat(C.blue), 0, 0.55, -0.85, g);
  return g;
}

export function latPulldown() {
  const g = new THREE.Group();
  box(1.2, 0.1, 1.5, DARK(), 0, 0.05, 0, g);
  box(0.14, 2.6, 0.14, DARK(), 0, 1.3, -0.55, g);
  box(0.14, 0.14, 1.0, DARK(), 0, 2.55, -0.1, g);
  mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 20), STEEL(), 0, 2.42, 0.32, g).rotation.y = Math.PI / 2;
  cyl(0.008, 0.6, mat(0x111111), 0, 2.1, 0.32, g, 'y', 6);
  cyl(0.02, 1.3, CHROME(), 0, 1.8, 0.32, g, 'x', 10);
  const st = weightStack(1.5); st.position.set(0, 0, -0.62); st.rotation.y = Math.PI / 2; g.add(st);
  box(0.45, 0.1, 0.4, PAD(), 0, 0.5, 0.45, g);
  box(0.08, 0.45, 0.08, STEEL(), 0, 0.25, 0.45, g);
  cyl(0.07, 0.5, PAD(), 0, 0.75, 0.3, g, 'x', 12);
  return g;
}

export function legExtension() {
  const g = new THREE.Group();
  box(1.0, 0.1, 1.3, DARK(), 0, 0.05, 0, g);
  box(0.5, 0.12, 0.5, PAD(), 0, 0.55, 0.1, g);
  const back = box(0.5, 0.7, 0.1, PAD(), 0, 0.95, 0.42, g); back.rotation.x = 0.15;
  box(0.08, 0.5, 0.08, STEEL(), 0, 0.28, 0.1, g);
  const arm = box(0.06, 0.06, 0.55, STEEL(), 0.3, 0.42, -0.28, g); arm.rotation.x = 0.7;
  cyl(0.07, 0.45, PAD(), 0, 0.2, -0.45, g, 'x', 12);
  const st = weightStack(1.0); st.position.set(0.45, 0, 0.45); st.scale.set(0.7, 1, 0.8); g.add(st);
  return g;
}

export function inclineBench() {
  const g = new THREE.Group();
  box(0.4, 0.08, 1.3, STEEL(), 0, 0.06, 0, g);
  box(0.36, 0.1, 0.45, PAD(), 0, 0.46, 0.35, g);
  const back = box(0.36, 0.1, 1.0, PAD(), 0, 0.85, -0.18, g); back.rotation.x = -0.65;
  box(0.08, 0.4, 0.08, STEEL(), 0, 0.25, 0.35, g);
  box(0.08, 0.7, 0.08, STEEL(), 0, 0.45, -0.3, g).rotation.x = -0.4;
  return g;
}

export function deadliftPlatform() {
  const g = new THREE.Group();
  box(1.3, 0.06, 2.4, WOOD(), 0, 0.03, 0, g);
  for (const s of [-1, 1]) box(0.75, 0.06, 2.4, mat(0x15181d, { r: 0.95 }), s * 1.02, 0.03, 0, g);
  const bar = barbell([C.red, C.red]);
  bar.position.set(0, 0.29, 0);
  g.add(bar);
  return g;
}

export function barbellWallRack() {
  const g = new THREE.Group();
  box(1.6, 0.08, 0.3, DARK(), 0, 0.04, 0, g);
  box(1.6, 0.08, 0.06, DARK(), 0, 1.2, -0.12, g);
  for (let i = 0; i < 6; i++) cyl(0.028, 2.1, CHROME(), -0.65 + i * 0.26, 1.05, 0, g, 'y', 10);
  return g;
}

export function plyoBox(w: number, h: number, d: number) {
  const g = new THREE.Group();
  box(w, h, d, WOOD(), 0, h / 2, 0, g);
  box(w + 0.01, 0.03, d + 0.01, mat(0x6b4a2c, { r: 0.8 }), 0, h - 0.015, 0, g);
  return g;
}

export function plyoBoxes() {
  const g = new THREE.Group();
  const a = plyoBox(0.75, 0.75, 0.6); a.position.set(0, 0, 0); g.add(a);
  const b = plyoBox(0.6, 0.5, 0.5); b.position.set(0.85, 0, 0.2); b.rotation.y = 0.3; g.add(b);
  const c = plyoBox(0.5, 0.3, 0.45); c.position.set(0.05, 0.75, 0); c.rotation.y = -0.25; g.add(c);
  return g;
}

/** Pull-up rig with three bays and gymnastic rings */
export function rig() {
  const g = new THREE.Group();
  const xs = [-2.7, -0.9, 0.9, 2.7];
  for (const x of xs) for (const z of [-0.5, 0.5]) box(0.12, 2.9, 0.12, DARK(), x, 1.45, z, g);
  for (const z of [-0.5, 0.5]) box(5.52, 0.12, 0.12, DARK(), 0, 2.9, z, g);
  for (const x of xs) box(0.12, 0.12, 1.1, DARK(), x, 2.9, 0, g);
  cyl(0.03, 1.8, CHROME(), -1.8, 2.55, 0.5, g, 'x', 12);
  cyl(0.03, 1.8, CHROME(), 0, 2.55, 0.5, g, 'x', 12);
  // rings
  for (const s of [-1, 1]) {
    cyl(0.012, 1.0, mat(0x111111), 1.8 + s * 0.25, 2.35, 0, g, 'y', 6);
    mesh(new THREE.TorusGeometry(0.11, 0.022, 10, 24), WOOD(), 1.8 + s * 0.25, 1.75, 0, g);
  }
  // dip station on the outside
  for (const s of [-1, 1]) box(0.06, 0.06, 0.6, STEEL(), -3.0 + s * 0.28, 1.25, 0.9, g);
  for (const s of [-1, 1]) box(0.06, 1.25, 0.06, STEEL(), -3.0 + s * 0.28, 0.62, 1.15, g);
  return g;
}

export function slamBalls() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.16 + i * 0.015, 18, 14), mat(0x15181d, { r: 0.9 }), i * 0.42, 0.16 + i * 0.015, 0, g);
  return g;
}

export function sled() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) box(0.06, 0.06, 1.0, CHROME(), s * 0.3, 0.05, 0, g);
  box(0.66, 0.05, 0.5, DARK(), 0, 0.12, 0, g);
  cyl(0.04, 0.4, CHROME(), 0, 0.33, 0, g, 'y', 10);
  [C.blue, C.yellow].forEach((c, i) => cyl(0.225, 0.06, mat(c, { r: 0.7 }), 0, 0.18 + i * 0.07, 0, g, 'y', 28));
  for (const s of [-1, 1]) { const h = box(0.04, 0.9, 0.04, STEEL(), s * 0.25, 0.5, 0.45, g); h.rotation.x = -0.35; }
  return g;
}

export function lockers(n = 4) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const c = [0x2d4f86, 0x3a4150][i % 2];
    box(0.6, 2.0, 0.55, mat(c, { r: 0.5, m: 0.4 }), i * 0.62, 1.0, 0, g);
    box(0.06, 0.12, 0.02, CHROME(), i * 0.62 + 0.2, 1.1, 0.285, g);
    for (let k = 0; k < 3; k++) box(0.3, 0.015, 0.01, mat(0x1c2028), i * 0.62, 1.7 + k * 0.05, 0.28, g);
  }
  return g;
}

export function waterCooler() {
  const g = new THREE.Group();
  box(0.36, 1.0, 0.36, mat(0xdfe5ec, { r: 0.4 }), 0, 0.5, 0, g);
  cyl(0.15, 0.45, mat(0x7fb8ff, { r: 0.1, extra: { transparent: true, opacity: 0.75 } }), 0, 1.25, 0, g, 'y', 20);
  box(0.12, 0.06, 0.06, mat(C.blue), 0, 0.75, 0.2, g);
  return g;
}

export function plant(h = 1.4) {
  const g = new THREE.Group();
  cyl(0.24, 0.45, mat(0xd7dbe1, { r: 0.7 }), 0, 0.225, 0, g, 'y', 18);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const leaf = mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(i % 2 ? 0x2f7d4f : 0x3c9a62, { r: 0.8 }), Math.cos(a) * 0.18, 0.55 + (h - 0.5) * (0.5 + (i % 3) * 0.2), Math.sin(a) * 0.18, g);
    leaf.scale.set(0.8, 1.3, 0.8);
  }
  return g;
}

export function woodBench(len = 2) {
  const g = new THREE.Group();
  box(len, 0.08, 0.4, WOOD(), 0, 0.45, 0, g);
  for (const s of [-1, 1]) box(0.08, 0.42, 0.34, DARK(), s * (len / 2 - 0.2), 0.21, 0, g);
  return g;
}

export function bandAnchor() {
  const g = new THREE.Group();
  box(0.5, 0.06, 0.5, DARK(), 0, 0.03, 0, g);
  box(0.1, 1.6, 0.1, DARK(), 0, 0.8, 0, g);
  for (const y of [0.4, 0.9, 1.4]) mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), CHROME(), 0, y, 0.07, g);
  const b = mesh(new THREE.TorusGeometry(0.4, 0.016, 6, 28, Math.PI * 0.9), mat(C.green, { r: 0.7 }), 0.35, 0.9, 0.25, g);
  b.rotation.set(Math.PI / 2, 0, 0.2);
  return g;
}

