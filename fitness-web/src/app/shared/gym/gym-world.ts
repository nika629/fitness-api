import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  C,
  balls,
  bandAnchor,
  bandRack,
  barbellWallRack,
  bench,
  bike,
  box,
  cableCrossover,
  chestFly,
  deadliftPlatform,
  inclineBench,
  kettlebellRack,
  latPulldown,
  legExtension,
  legPress,
  lockers,
  mat,
  mats,
  mesh,
  plant,
  plateTree,
  plyoBoxes,
  rig,
  rower,
  slamBalls,
  sled,
  squatRack,
  treadmill,
  waterCooler,
  woodBench,
} from './gym-equipment';
import { GYM_ZONES, GymZone } from './gym-zones';

export interface GymWorldOptions {
  reduceMotion: boolean;
  /** Pointer moved over a zone (or off all zones) */
  onHover: (key: string | null) => void;
  /** A zone was clicked, or empty floor (null) */
  onSelect: (key: string | null) => void;
  /** Called every frame with each zone's pin position on screen */
  onFrame: (pins: { key: string; x: number; y: number; visible: boolean }[]) => void;
}

/** Room size in metres */
const W = 36;
const D = 24;
const H = 4.6;

const HOME = { pos: new THREE.Vector3(21, 19.5, 25), target: new THREE.Vector3(-0.5, 0, 0.4) };

interface Flight {
  p0: THREE.Vector3;
  t0: THREE.Vector3;
  p1: THREE.Vector3;
  t1: THREE.Vector3;
  start: number;
  ms: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The 3D gym: renderer, camera, lights, room, equipment zones, hover/click and camera flights.
 * Plain TypeScript + three.js, no Angular inside – the Angular component only talks to it
 * through the methods below and the callbacks in GymWorldOptions.
 */
export class GymWorld {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  private readonly controls: OrbitControls;
  private readonly zoneGroups: THREE.Group[] = [];
  private readonly zoneByKey = new Map<string, { zone: GymZone; group: THREE.Group; size: number; ring: THREE.Mesh }>();
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private readonly visibility: IntersectionObserver;

  private highlighted = new Set<string>();
  private hovered: string | null = null;
  private active: string | null = null;
  private flight: Flight | null = null;
  private intro: { start: number; ms: number; from: THREE.Vector3 } | null = null;
  private frameId = 0;
  private onScreen = true;
  private down: { x: number; y: number } | null = null;
  private readonly pinPoint = new THREE.Vector3();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: HTMLElement,
    private readonly options: GymWorldOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    // soft studio reflections so chrome and mirrors don't render black
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.fog = new THREE.Fog(0x161a21, 60, 110);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 64;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.screenSpacePanning = false;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.target.copy(HOME.target);

    this.addLights();
    this.buildRoom();
    this.buildZones();

    if (options.reduceMotion) {
      this.camera.position.copy(HOME.pos);
    } else {
      this.camera.position.set(48, 42, 56);
      this.intro = { start: performance.now(), ms: 2200, from: this.camera.position.clone() };
    }

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('pointerup', this.onPointerUp);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();

    // stop rendering while the gym is scrolled out of view or the tab is hidden
    this.visibility = new IntersectionObserver(([entry]) => (this.onScreen = entry.isIntersecting));
    this.visibility.observe(host);

    this.frameId = requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------------------
  // Public API used by the Angular component
  // ---------------------------------------------------------------------------

  /** Zones that get the pulsing blue ring (exercises of the next plan) */
  setHighlighted(keys: Iterable<string>): void {
    this.highlighted = new Set(keys);
    for (const [key, z] of this.zoneByKey) z.ring.visible = this.highlighted.has(key);
  }

  /** Glow a zone and fly the camera to it */
  focusZone(key: string, panelOnRight: boolean): void {
    const z = this.zoneByKey.get(key);
    if (!z) return;
    this.stopIntro();
    if (this.active && this.active !== key) this.glow(this.active, false);
    this.active = key;
    this.glow(key, true);

    const target = new THREE.Vector3(z.zone.center[0], 0.9, z.zone.center[2]);
    const dir = this.camera.position.clone().sub(this.controls.target).setY(0).normalize();
    const narrow = this.host.clientWidth < 640;
    const dist = THREE.MathUtils.clamp(z.size * 1.25, 8, 17) * (narrow ? 1.3 : 1);
    const pos = target.clone().add(dir.clone().multiplyScalar(dist)).setY(dist * 0.75);
    // keep the zone left of the side panel on wide screens
    if (panelOnRight && !narrow) {
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
      target.addScaledVector(right, 1.6);
      pos.addScaledVector(right, 1.6);
    }
    this.flyTo(pos, target);
  }

  clearFocus(): void {
    if (this.active) this.glow(this.active, false);
    this.active = null;
  }

  resetView(): void {
    this.clearFocus();
    this.flyTo(HOME.pos.clone(), HOME.target.clone(), 1100);
  }

  setAutoRotate(on: boolean): void {
    this.controls.autoRotate = on;
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.visibility.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      const materials = Array.isArray(m.material) ? m.material : [m.material];
      for (const material of materials) {
        (material as THREE.MeshStandardMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1d24, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3e2, 2.2);
    sun.position.set(-18, 28, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 1, far: 80 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9db8ff, 0.6);
    fill.position.set(24, 12, -8);
    this.scene.add(fill);
  }

  private buildRoom(): void {
    const scene = this.scene;

    const floorTex = canvasTexture(1536, 1024, (x, w) => {
      x.fillStyle = '#23272e';
      x.fillRect(0, 0, w, 1024);
      const cell = w / W;
      for (let i = 0; i < W; i++) {
        for (let j = 0; j < D; j++) {
          const v = 38 + ((i * 7 + j * 13) % 5) * 2;
          x.fillStyle = `rgb(${v},${v + 4},${v + 10})`;
          x.fillRect(i * cell + 1, j * cell + 1, cell - 2, cell - 2);
        }
      }
    });
    const floor = mesh(new THREE.BoxGeometry(W, 0.2, D), mat(0xffffff, { r: 0.92, extra: { map: floorTex } }), 0, -0.1, 0, scene);
    floor.castShadow = false;
    box(W + 0.3, 0.3, 0.3, mat(0x1c2028), 0, -0.1, D / 2 + 0.15, scene);
    box(0.3, 0.3, D + 0.3, mat(0x1c2028), W / 2 + 0.15, -0.1, 0, scene);

    // two walls only, so the room reads like a dollhouse cut-away
    const backWall = box(W + 0.3, H, 0.3, mat(0x3a4150, { r: 0.9 }), 0, H / 2, -D / 2 - 0.15, scene);
    const leftWall = box(0.3, H, D, mat(0x3a4150, { r: 0.9 }), -W / 2 - 0.15, H / 2, 0, scene);
    backWall.castShadow = leftWall.castShadow = false;
    box(W + 0.3, 0.16, 0.05, mat(C.red, { r: 0.6 }), 0, 1.1, -D / 2 + 0.03, scene);
    box(0.05, 0.16, D, mat(C.red, { r: 0.6 }), -W / 2 + 0.03, 1.1, 0, scene);

    // mirrors behind the barbell area
    for (const x of [-15.2, -11.4, -7.6]) {
      box(3.6, 2.5, 0.05, mat(0x9fb0c4, { r: 0.08, m: 0.95 }), x, 2.35, -D / 2 + 0.04, scene).castShadow = false;
    }
    // windows next to the cardio machines
    for (const z of [0.6, 3.6, 6.6, 9.6]) {
      const glass = mat(0xcfe2ff, { r: 0.3, extra: { emissive: 0x9fc0ff, emissiveIntensity: 0.55 } });
      box(0.05, 2.0, 2.5, glass, -W / 2 + 0.03, 2.5, z, scene).castShadow = false;
      box(0.08, 0.08, 2.6, mat(0x1c2028), -W / 2 + 0.06, 2.5, z, scene);
      box(0.08, 2.0, 0.08, mat(0x1c2028), -W / 2 + 0.06, 2.5, z, scene);
    }

    // logo on the back wall above the machines
    const logoTex = canvasTexture(1024, 256, (x) => {
      x.fillStyle = '#ec5a5f';
      x.fillRect(40, 48, 34, 160);
      x.fillRect(150, 48, 34, 160);
      x.fillRect(20, 112, 184, 32);
      x.fillStyle = '#eceff3';
      x.font = '800 150px "Archivo Variable", "Arial Black", sans-serif';
      x.textBaseline = 'middle';
      x.fillText('FITNESS', 240, 132);
    });
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 1.6),
      new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.8 }),
    );
    logo.position.set(13, 3.5, -D / 2 + 0.02);
    scene.add(logo);

    // TV above the cable station
    const tvTex = canvasTexture(640, 360, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, '#1d3a73');
      gr.addColorStop(1, '#0f1726');
      x.fillStyle = gr;
      x.fillRect(0, 0, w, h);
      x.fillStyle = '#8fb2ff';
      x.font = '700 34px "Archivo Variable", Arial, sans-serif';
      x.fillText('TRAIN SMART', 40, 80);
      x.fillStyle = '#ffffff';
      x.font = '800 96px "Archivo Variable", "Arial Black", sans-serif';
      x.fillText('FITNESS', 36, 185);
      x.fillStyle = '#c6cdd8';
      x.font = '600 32px "Archivo Variable", Arial, sans-serif';
      x.fillText('Plans · Workouts · Food · Progress', 40, 262);
    });
    box(3.3, 1.9, 0.1, mat(0x0b0d10, { r: 0.4 }), 1.4, 3.55, -D / 2 + 0.06, scene).castShadow = false;
    const tv = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 1.77), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false }));
    tv.position.set(1.4, 3.55, -D / 2 + 0.12);
    scene.add(tv);
    for (const x of [-4.6, 7.4]) box(0.5, 0.75, 0.35, mat(0x15181d, { r: 0.6 }), x, 3.7, -D / 2 + 0.2, scene);

    // turf sled track along the front edge
    const turfTex = canvasTexture(1024, 160, (x, w, h) => {
      x.fillStyle = '#2f6b45';
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < 1600; i++) {
        x.fillStyle = `rgba(${40 + ((i * 37) % 30)},${110 + ((i * 53) % 50)},${60 + ((i * 29) % 30)},0.5)`;
        x.fillRect((i * 97) % w, (i * 61) % h, 2, 2);
      }
      x.strokeStyle = 'rgba(255,255,255,0.85)';
      x.lineWidth = 4;
      for (let i = 1; i < 10; i++) {
        const xx = (w / 10) * i;
        x.beginPath();
        x.moveTo(xx, 10);
        x.lineTo(xx, h - 10);
        x.stroke();
      }
      x.strokeRect(4, 4, w - 8, h - 8);
    });
    box(18, 0.05, 2.8, mat(0xffffff, { r: 1, extra: { map: turfTex } }), -0.5, 0.025, 10.2, scene).castShadow = false;
    place(scene, sled(), -6.5, 10.2, Math.PI / 2);
    place(scene, sled(), 3.5, 10.0, Math.PI / 2 + 0.1);

    // lockers, water, plants, bench
    place(scene, lockers(5), -17.65, -3.6, Math.PI / 2, 0);
    place(scene, waterCooler(), 16.9, 10.9, 0, 0);
    for (const [x, z, h] of [
      [-17.2, 11.3, 1.6],
      [17.1, 1.6, 1.3],
      [9.6, 11.2, 1.2],
      [-9.8, 11.3, 1.4],
    ]) {
      place(scene, plant(h), x, z, 0, 0);
    }
    place(scene, woodBench(2.2), 13.2, 10.7, 0, 0);
  }

  private buildZones(): void {
    const layout: Record<string, { pad: [number, number, number, number]; items: [THREE.Object3D, number, number, number?][] }> = {
      barbell: {
        pad: [-17.7, -11.8, -5.0, -4.2],
        items: [
          [squatRack(), -15.8, -10.2],
          [squatRack(), -12.4, -10.2],
          [deadliftPlatform(), -8.6, -9.4, Math.PI / 2],
          [bench(), -15.8, -6.3],
          [inclineBench(), -12.4, -6.0, Math.PI],
          [plateTree(), -9.6, -5.2],
          [plateTree(), -6.2, -5.3],
          [barbellWallRack(), -6.0, -11.5],
        ],
      },
      cable: { pad: [-3.6, -11.8, 7.4, -7.6], items: [[cableCrossover(4.6), 0.9, -10.6], [cableCrossover(2.2), 5.4, -10.6]] },
      machine: {
        pad: [8.2, -11.8, 17.8, 0.2],
        items: [
          [legPress(), 10.6, -9.4],
          [latPulldown(), 15.4, -9.6],
          [chestFly(), 10.6, -3.0, Math.PI],
          [legExtension(), 15.4, -3.0, Math.PI],
        ],
      },
      cardio: {
        pad: [-17.8, -0.6, -11.4, 11.0],
        items: [
          [treadmill(), -15.8, 0.6, Math.PI / 2],
          [treadmill(), -15.8, 2.6, Math.PI / 2],
          [treadmill(), -15.8, 4.6, Math.PI / 2],
          [bike(), -15.9, 6.8, Math.PI / 2],
          [bike(), -15.9, 8.4, Math.PI / 2],
          [bike(), -15.9, 10.0, Math.PI / 2],
          [rower(), -12.8, 2.0],
          [rower(), -12.8, 7.6],
        ],
      },
      bodyweight: { pad: [-10.6, -1.2, -2.8, 7.0], items: [[rig(), -6.8, 0.4], [plyoBoxes(), -4.4, 4.4], [mats(), -8.2, 4.8]] },
      kettlebell: { pad: [-1.8, -0.6, 2.8, 4.8], items: [[kettlebellRack(), 0.4, 1.4, Math.PI / 2]] },
      ball: { pad: [3.6, 0.0, 9.6, 5.4], items: [[balls(), 5.6, 2.6], [slamBalls(), 6.8, 4.6]] },
      band: { pad: [11.4, 4.0, 17.4, 8.8], items: [[bandRack(), 13.6, 6.4], [bandAnchor(), 16.2, 5.6]] },
    };

    for (const zone of GYM_ZONES) {
      const spec = layout[zone.key];
      if (!spec) continue;
      const g = new THREE.Group();
      g.userData['zoneKey'] = zone.key;
      const [x0, z0, x1, z1] = spec.pad;

      // rubber pad + a coloured strip on its front edge
      const pad = box(x1 - x0, 0.04, z1 - z0, mat(0x23272e, { r: 0.95 }), (x0 + x1) / 2, 0.02, (z0 + z1) / 2, g);
      pad.castShadow = false;
      pad.userData['noGlow'] = true;
      const strip = box(x1 - x0, 0.045, 0.08, mat(zone.color, { r: 0.6 }), (x0 + x1) / 2, 0.025, z1 - 0.04, g);
      strip.castShadow = false;
      strip.userData['noGlow'] = true;

      for (const [obj, x, z, ry = 0] of spec.items) {
        obj.position.set(x, 0.04, z);
        obj.rotation.y = ry;
        g.add(obj);
      }

      // pulsing ring for zones used by the next plan (hidden until setHighlighted)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1, 1.12, 64),
        new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(zone.center[0], 0.06, zone.center[2]);
      ring.userData['ringBase'] = Math.min(x1 - x0, z1 - z0) * 0.42;
      ring.visible = false;
      g.add(ring);

      this.scene.add(g);
      this.zoneGroups.push(g);
      this.zoneByKey.set(zone.key, { zone, group: g, size: Math.max(x1 - x0, z1 - z0), ring });
    }
  }

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  private zoneAt(clientX: number, clientY: number): string | null {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    let o: THREE.Object3D | null = this.ray.intersectObjects(this.zoneGroups, true)[0]?.object ?? null;
    while (o && !o.userData['zoneKey']) o = o.parent;
    return (o?.userData['zoneKey'] as string | undefined) ?? null;
  }

  private glow(key: string, on: boolean): void {
    const z = this.zoneByKey.get(key);
    if (!z) return;
    const color = new THREE.Color(z.zone.color);
    z.group.traverse((o) => {
      const m = o as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
      if (!m.isMesh || o.userData['noGlow'] || o === z.ring || !m.material.emissive) return;
      if (o.userData['baseEmissive'] === undefined) {
        o.userData['baseEmissive'] = m.material.emissive.getHex();
        o.userData['baseIntensity'] = m.material.emissiveIntensity;
      }
      if (on) {
        m.material.emissive.copy(color);
        m.material.emissiveIntensity = 0.16;
      } else {
        m.material.emissive.setHex(o.userData['baseEmissive'] as number);
        m.material.emissiveIntensity = o.userData['baseIntensity'] as number;
      }
    });
  }

  private setHover(key: string | null): void {
    if (key === this.hovered) return;
    if (this.hovered && this.hovered !== this.active) this.glow(this.hovered, false);
    this.hovered = key;
    if (key) this.glow(key, true);
    this.canvas.classList.toggle('hovering', !!key);
    this.options.onHover(key);
  }

  private readonly onPointerDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY };
    this.stopIntro();
  };

  private readonly onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') this.setHover(this.zoneAt(e.clientX, e.clientY));
  };

  private readonly onPointerLeave = () => this.setHover(null);

  /** A click is a press + release that barely moved; a drag rotates the camera instead */
  private readonly onPointerUp = (e: PointerEvent) => {
    if (!this.down) return;
    const moved = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y);
    this.down = null;
    if (moved > 6) return;
    this.options.onSelect(this.zoneAt(e.clientX, e.clientY));
  };

  // ---------------------------------------------------------------------------
  // Camera + render loop
  // ---------------------------------------------------------------------------

  private flyTo(pos: THREE.Vector3, target: THREE.Vector3, ms = 900): void {
    if (this.options.reduceMotion) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      return;
    }
    this.flight = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms };
  }

  private stopIntro(): void {
    this.intro = null;
  }

  private resize(): void {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < 640 ? 50 : 38;
    this.camera.updateProjectionMatrix();
  }

  private readonly frame = (now: number) => {
    this.frameId = requestAnimationFrame(this.frame);
    if (!this.onScreen || document.hidden) return;

    const t = this.clock.getElapsedTime();
    if (this.intro) {
      const k = Math.min(1, (now - this.intro.start) / this.intro.ms);
      this.camera.position.lerpVectors(this.intro.from, HOME.pos, ease(k));
      if (k >= 1) this.intro = null;
    }
    if (this.flight) {
      const k = Math.min(1, (now - this.flight.start) / this.flight.ms);
      const e = ease(k);
      this.camera.position.lerpVectors(this.flight.p0, this.flight.p1, e);
      this.controls.target.lerpVectors(this.flight.t0, this.flight.t1, e);
      if (k >= 1) this.flight = null;
    }
    // keep the camera's focus inside the room
    const target = this.controls.target;
    target.x = THREE.MathUtils.clamp(target.x, -W / 2, W / 2);
    target.z = THREE.MathUtils.clamp(target.z, -D / 2, D / 2);
    target.y = THREE.MathUtils.clamp(target.y, 0, 3);
    this.controls.update();

    // pulsing rings
    const p = this.options.reduceMotion ? 0.5 : (t * 0.6) % 1;
    for (const z of this.zoneByKey.values()) {
      if (!z.ring.visible) continue;
      const s = (z.ring.userData['ringBase'] as number) * (0.75 + p * 0.5);
      z.ring.scale.set(s, s, s);
      (z.ring.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - p);
    }

    this.renderer.render(this.scene, this.camera);

    // pins follow their zones on screen
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.options.onFrame(
      GYM_ZONES.map((zone) => {
        this.pinPoint.set(zone.pin[0], zone.pin[1], zone.pin[2]).project(this.camera);
        return {
          key: zone.key,
          x: ((this.pinPoint.x + 1) / 2) * w,
          y: ((1 - this.pinPoint.y) / 2) * h,
          visible: this.pinPoint.z <= 1,
        };
      }),
    );
  };
}

/** Adds an object to the scene at floor position (x, z) with a rotation around y */
function place(scene: THREE.Scene, obj: THREE.Object3D, x: number, z: number, ry = 0, y = 0.05): void {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  scene.add(obj);
}

/** A texture drawn with the 2D canvas API (floor tiles, logo, TV screen, turf) */
function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
