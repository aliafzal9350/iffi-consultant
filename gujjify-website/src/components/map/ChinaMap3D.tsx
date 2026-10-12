'use client';
/**
 * Hero signature: China extruded in 3D. Programme provinces rise in gold by programme count,
 * the other 13 regions stay low and matte navy. City beacons mark where programmes are.
 * Lazy-loaded (three.js lives in its own chunk); HeroMap owns state, the info card and fallbacks.
 *
 * Performance notes (this runs on mid-range phones and laptops):
 *  - renders on demand: ~30 fps while idle, 60 fps only while the pointer is moving or something animates
 *  - one useFrame drives every animation; React never re-renders the scene on hover
 *  - city beacons are 5 instanced meshes (5 draw calls instead of ~150)
 *  - hover/click hit-testing uses flat low-poly province caps, not the extruded geometry
 *  - matcap shading: no lights, no shadows, no environment map, no backdrop blur over the canvas
 *  - shaders compile in the background (compileAsync); the SVG map shows until they are ready
 *  - labels are plain DOM nodes moved with CSS transforms, not one React root per label
 *  - resolution drops automatically if the device cannot keep up
 */
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { provinces } from '@/data';
import { FEATURES, fitProjection, goldFor, type MapFeature } from './geo';

const W = 100;
const H = 80;
const proj = fitProjection(W, H);
const toWorld = (lng: number, lat: number): [number, number] => {
  const [x, y] = proj([lng, lat]) ?? [0, 0];
  return [x - W / 2, y - H / 2];
};

const BASE_DEPTH = 0.6;
const depthFor = (count: number) => (count > 0 ? 1.0 + count * 0.18 : BASE_DEPTH);
const BEVEL = { bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.12, bevelOffset: -0.12, bevelSegments: 1, curveSegments: 1 };
const TARGET = (() => {
  const [x, z] = toWorld(119.5, 30.5);
  return new THREE.Vector3(x, 0, z);
})();
const DEG = Math.PI / 180;
const LABEL_LIFT = 1.5;

/* Geometry ------------------------------------------------------------------ */
function ringToVectors(ring: number[][]): THREE.Vector2[] {
  const pts = ring.map(([lng, lat]) => {
    const [x, z] = toWorld(lng, lat);
    return new THREE.Vector2(x, -z);
  });
  if (pts.length > 2 && pts[0].equals(pts[pts.length - 1])) pts.pop();
  return pts;
}

function buildShapes(f: MapFeature): THREE.Shape[] {
  return f.geometry.coordinates.map((poly) => {
    const [outer, ...holes] = poly;
    const shape = new THREE.Shape(ringToVectors(outer));
    holes.forEach((h) => shape.holes.push(new THREE.Path(ringToVectors(h))));
    return shape;
  });
}

function buildExtrusion(shapes: THREE.Shape[], depth: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shapes, { depth, ...BEVEL });
  g.rotateX(-Math.PI / 2);
  return g;
}

/** Flat top face: a cheap stand-in for hit-testing. */
function buildCap(shapes: THREE.Shape[], y: number): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(shapes, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  g.computeBoundingSphere();
  return g;
}

function buildOutline(f: MapFeature, y: number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const poly of f.geometry.coordinates) {
    const pts = ringToVectors(poly[0]);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      pos.push(a.x, y, -a.y, b.x, y, -b.y);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/**
 * Matcaps: the lighting is painted once into a small sphere texture, so the gold needs no lights,
 * no environment map and only the cheapest shader three.js has. Gold for programme provinces,
 * navy for the rest.
 */
function paintMatcap(stops: [number, string][]): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size * 0.42, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.62);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const goldStops: [number, string][] = [
  [0, '#fff4d4'],
  [0.16, '#f2d68f'],
  [0.42, '#dcb65f'],
  [0.72, '#ab8434'],
  [1, '#5f4718'],
];
const navyStops: [number, string][] = [
  [0, '#33568f'],
  [0.35, '#1c3a6b'],
  [0.7, '#13294f'],
  [1, '#0a1630'],
];

interface ProvinceGeo {
  name: string;
  nameZh: string;
  count: number;
  depth: number;
  mesh: THREE.BufferGeometry;
  cap: THREE.BufferGeometry;
  outline: THREE.BufferGeometry;
  material: THREE.MeshMatcapMaterial;
  /** resting tint; the active province is brightened from this in the frame loop */
  tint: THREE.Color;
  lineMaterial: THREE.LineBasicMaterial;
  centroid: [number, number];
  wide: boolean;
}
interface CityGeo {
  name: string;
  x: number;
  z: number;
  p: number; // index into provinces array
}

/** Built in small slices (yielding to the browser between provinces) so the page never stalls. */
async function buildMapData() {
  const gold = paintMatcap(goldStops);
  const navy = paintMatcap(navyStops);
  const maxCount = Math.max(...FEATURES.map((f) => f.properties.programCount));
  const geos: ProvinceGeo[] = [];
  const cities: CityGeo[] = [];
  const plain: THREE.BufferGeometry[] = [];
  const plainOutlines: THREE.BufferGeometry[] = [];
  let sliceStart = performance.now();
  for (const f of FEATURES) {
    if (performance.now() - sliceStart > 12) {
      await new Promise((r) => setTimeout(r, 0));
      sliceStart = performance.now();
    }
    const count = f.properties.programCount;
    const depth = depthFor(count);
    const shapes = buildShapes(f);
    if (!f.properties.hasPrograms) {
      plain.push(buildExtrusion(shapes, depth));
      plainOutlines.push(buildOutline(f, depth + 0.09));
      continue;
    }
    const prov = provinces.find((p) => p.name === f.properties.name);
    const [cx, cz] = toWorld(f.properties.centroid[0], f.properties.centroid[1]);
    const index = geos.length;
    (prov?.cities ?? []).forEach((c) => {
      const [x, z] = toWorld(c.lng, c.lat);
      cities.push({ name: c.name, x, z, p: index });
    });
    geos.push({
      name: f.properties.name,
      nameZh: prov?.nameZh ?? f.properties.nameZh,
      count,
      depth,
      mesh: buildExtrusion(shapes, depth),
      cap: buildCap(shapes, depth + 0.08),
      outline: buildOutline(f, depth + 0.09),
      material: new THREE.MeshMatcapMaterial({ matcap: gold, toneMapped: false }),
      tint: tintFor(count, maxCount),
      lineMaterial: new THREE.LineBasicMaterial({ color: '#f3dca0', transparent: true, opacity: 0.7, toneMapped: false }),
      centroid: [cx, cz],
      wide: !!prov?.provinceWideProgramIds.length,
    });
  }
  geos.forEach((g) => g.material.color.copy(g.tint));
  const plainMesh = mergeGeometries(plain, false)!;
  const plainLines = mergeGeometries(plainOutlines, false)!;
  [...plain, ...plainOutlines].forEach((g) => g.dispose());
  const plainMaterial = new THREE.MeshMatcapMaterial({ matcap: navy, toneMapped: false });
  return { geos, cities, plainMesh, plainLines, plainMaterial, textures: [gold, navy] };
}

/** Fewer programmes = deeper, browner gold; the most programmes = the brightest (gold-deep -> gold-2). */
function tintFor(count: number, max: number): THREE.Color {
  const t = Math.min(1, Math.max(0, (count - 1) / Math.max(1, max - 1)));
  const c = new THREE.Color(goldFor(count));
  const ref = new THREE.Color(goldFor(max));
  // express the ramp as a multiplier on the gold matcap, kept close to 1 so the metal reads clearly
  return new THREE.Color((c.r / ref.r) * (0.9 + 0.1 * t), (c.g / ref.g) * (0.9 + 0.1 * t), (c.b / ref.b) * (0.9 + 0.1 * t));
}
type MapData = Awaited<ReturnType<typeof buildMapData>>;

function disposeMapData(d: MapData) {
  d.plainMesh.dispose();
  d.plainLines.dispose();
  d.plainMaterial.dispose();
  d.textures.forEach((t) => t.dispose());
  d.geos.forEach((g) => {
    g.mesh.dispose();
    g.cap.dispose();
    g.outline.dispose();
    g.material.dispose();
    g.lineMaterial.dispose();
  });
}

/* Shared props ---------------------------------------------------------------- */
export interface ChinaMap3DProps {
  active: string | null;
  tour: boolean;
  mobile: boolean;
  running: boolean;
  topLabels: string[];
  onHover: (name: string | null) => void;
  onSelect: (name: string, pointerType: string) => void;
  onCity: (city: string) => void;
  onContextLost: () => void;
  /** called once the shaders are compiled and the first frame can be drawn without a stall */
  onReady: () => void;
}

interface Live {
  active: string | null;
  tour: boolean;
  /** render at full frame rate until this time (ms, performance.now) */
  busyUntil: number;
  pointer: { x: number; y: number };
  labels: Map<string, HTMLDivElement>;
  activeLabel: HTMLDivElement | null;
  handlers: Pick<ChinaMap3DProps, 'onHover' | 'onSelect' | 'onCity'>;
}

/* Beacons: five instanced meshes for all cities ----------------------------------- */
const beamMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color('#e0bd6b') } },
  vertexShader:
    'varying vec2 vUv; void main(){ vUv = uv; vec4 p = vec4(position,1.0); \n#ifdef USE_INSTANCING\n p = instanceMatrix * p; \n#endif\n gl_Position = projectionMatrix * modelViewMatrix * p; }',
  fragmentShader: 'uniform vec3 uColor; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 1.6) * 0.85; gl_FragColor = vec4(uColor, a); }',
});

function useInstancedSet(count: number, wideCount: number) {
  return useMemo(() => {
    const ringGeo = new THREE.RingGeometry(0.42, 0.56, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const wideGeo = new THREE.RingGeometry(0.62, 0.78, 40);
    wideGeo.rotateX(-Math.PI / 2);
    const make = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number) => {
      const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
      m.count = n;
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      return m;
    };
    const core = make(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff6dc', toneMapped: false }), count);
    const halo = make(
      new THREE.SphereGeometry(0.62, 12, 8),
      new THREE.MeshBasicMaterial({ color: '#e0bd6b', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      count,
    );
    const beam = make(new THREE.CylinderGeometry(0.07, 0.07, 6, 8, 1, true), beamMaterial, count);
    const ring = make(ringGeo, new THREE.MeshBasicMaterial({ color: '#e0bd6b', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }), count);
    ring.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, count) * 3), 3);
    ring.instanceColor.setUsage(THREE.DynamicDrawUsage);
    const wide = make(wideGeo, new THREE.MeshBasicMaterial({ color: '#fff3d1', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), wideCount);
    const hit = make(new THREE.SphereGeometry(1.1, 6, 4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }), count);
    return { core, halo, beam, ring, wide, hit };
  }, [count, wideCount]);
}

/* Static province meshes: rendered once, animated from the single frame loop ---------- */
const Provinces = memo(function Provinces({ data, groups, live }: { data: MapData; groups: MutableRefObject<(THREE.Group | null)[]>; live: MutableRefObject<Live> }) {
  const over = (name: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    if (e.pointerType === 'mouse') live.current.handlers.onHover(name);
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = '';
    if (e.pointerType === 'mouse') live.current.handlers.onHover(null);
  };
  return (
    <>
      <mesh geometry={data.plainMesh} material={data.plainMaterial} raycast={() => null} />
      <lineSegments geometry={data.plainLines} raycast={() => null}>
        <lineBasicMaterial color="#2a4a80" transparent opacity={0.6} toneMapped={false} />
      </lineSegments>
      {data.geos.map((g, i) => (
        <group
          key={g.name}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh geometry={g.mesh} material={g.material} raycast={() => null} />
          <lineSegments geometry={g.outline} material={g.lineMaterial} raycast={() => null} />
          <mesh
            geometry={g.cap}
            visible={false}
            onPointerOver={over(g.name)}
            onPointerOut={out}
            onClick={(e) => {
              e.stopPropagation();
              live.current.handlers.onSelect(g.name, (e.nativeEvent as PointerEvent).pointerType || 'mouse');
            }}
          />
        </group>
      ))}
    </>
  );
});

/* Everything that moves, in one frame callback ---------------------------------------- */
const Animator = memo(function Animator({ data, live, mobile }: { data: MapData; live: MutableRefObject<Live>; mobile: boolean }) {
  const sway = useRef<THREE.Group>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const lifts = useMemo(() => new Float32Array(data.geos.length), [data]);
  const wideIdx = useMemo(() => data.geos.map((g, i) => (g.wide ? i : -1)).filter((i) => i >= 0), [data]);
  const inst = useInstancedSet(data.cities.length, wideIdx.length);
  const { camera, size, setDpr, viewport } = useThree();
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), v: new THREE.Vector3(), c: new THREE.Color() }), []);
  const parallax = useRef({ x: 0, y: 0 });
  const perf = useRef({ slow: 0, frames: 0 });

  useEffect(
    () => () => {
      Object.values(inst).forEach((m) => {
        m.geometry.dispose();
        if (m.material !== beamMaterial) (m.material as THREE.Material).dispose();
        m.dispose();
      });
    },
    [inst],
  );

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const now = performance.now();
    const L = live.current;
    const t = clock.elapsedTime;

    // adaptive resolution: if full-speed frames stay slow, render fewer pixels
    if (now < L.busyUntil && dt > 0) {
      const pf = perf.current;
      pf.frames++;
      if (dt > 0.032) pf.slow++;
      if (pf.frames >= 45) {
        if (pf.slow > 30 && viewport.dpr > 1) setDpr(Math.max(1, Math.round((viewport.dpr - 0.25) * 100) / 100));
        pf.frames = 0;
        pf.slow = 0;
      }
    }

    // sway + parallax
    const P = parallax.current;
    P.x = THREE.MathUtils.damp(P.x, mobile ? 0 : L.pointer.x, 3, d);
    P.y = THREE.MathUtils.damp(P.y, mobile ? 0 : L.pointer.y, 3, d);
    if (sway.current) {
      sway.current.rotation.y = (mobile ? 0 : Math.sin((t / 12) * Math.PI * 2) * 3 * DEG) + P.x * 4 * DEG;
      sway.current.rotation.x = P.y * 1.5 * DEG;
    }

    // province lift + glow
    let settling = false;
    data.geos.forEach((g, i) => {
      const on = L.active === g.name;
      const target = on ? (L.tour ? 0.6 : 0.5) : 0;
      lifts[i] = THREE.MathUtils.damp(lifts[i], target, 9, d);
      if (Math.abs(lifts[i] - target) > 0.002) settling = true;
      const grp = groups.current[i];
      if (grp) grp.position.y = lifts[i];
      const glow = (g.material.userData.glow = THREE.MathUtils.damp((g.material.userData.glow as number) ?? 0, on ? 1 : 0, 8, d));
      g.material.color.copy(g.tint).multiplyScalar(1 + glow * 0.28);
      g.lineMaterial.opacity = THREE.MathUtils.damp(g.lineMaterial.opacity, on ? 1 : 0.7, 8, d);
    });
    if (settling) L.busyUntil = Math.max(L.busyUntil, now + 120);

    // beacons follow their province's lift
    const { m, q, p, s } = tmp;
    data.cities.forEach((c, j) => {
      const y = data.geos[c.p].depth + 0.08 + lifts[c.p];
      s.set(1, 1, 1);
      m.compose(p.set(c.x, y + 0.32, c.z), q, s);
      inst.core.setMatrixAt(j, m);
      inst.halo.setMatrixAt(j, m);
      m.compose(p.set(c.x, y + 3.2, c.z), q, s);
      inst.beam.setMatrixAt(j, m);
      m.compose(p.set(c.x, y + 0.4, c.z), q, s);
      inst.hit.setMatrixAt(j, m);
      const k = ((t + j * 0.31) % 2.4) / 2.4;
      const sc = 1 + k * 1.2;
      m.compose(p.set(c.x, y + 0.08, c.z), q, s.set(sc, 1, sc));
      inst.ring.setMatrixAt(j, m);
      inst.ring.setColorAt(j, tmp.c.setScalar(0.6 * (1 - k)));
    });
    wideIdx.forEach((gi, j) => {
      const g = data.geos[gi];
      m.compose(p.set(g.centroid[0], g.depth + 0.14 + lifts[gi], g.centroid[1]), q, s.set(1, 1, 1));
      inst.wide.setMatrixAt(j, m);
    });
    for (const im of [inst.core, inst.halo, inst.beam, inst.ring, inst.hit, inst.wide]) im.instanceMatrix.needsUpdate = true;
    inst.hit.boundingSphere = null; // recomputed lazily by the next raycast, so lifted beacons stay clickable
    if (inst.ring.instanceColor) inst.ring.instanceColor.needsUpdate = true;

    // DOM labels: project anchors to screen, move with transforms only
    if (sway.current && (L.labels.size || L.activeLabel)) {
      sway.current.updateMatrixWorld();
      const place = (name: string, el: HTMLDivElement) => {
        const i = data.geos.findIndex((g) => g.name === name);
        if (i < 0) return;
        const g = data.geos[i];
        const v = tmp.v.set(g.centroid[0], g.depth + LABEL_LIFT + lifts[i], g.centroid[1]);
        // positions are authored relative to TARGET inside the sway pivot
        v.sub(TARGET).applyMatrix4(sway.current!.matrixWorld);
        v.project(camera);
        const x = ((v.x + 1) / 2) * size.width;
        const y = ((1 - v.y) / 2) * size.height;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      };
      L.labels.forEach((el, name) => place(name, el));
      if (L.activeLabel && L.active && !L.labels.has(L.active)) place(L.active, L.activeLabel);
    }
  });

  return (
    <group position={TARGET.toArray()}>
      <group ref={sway}>
        <group position={TARGET.clone().negate().toArray()}>
          <Provinces data={data} groups={groups} live={live} />
          <primitive object={inst.core} raycast={() => null} />
          <primitive object={inst.halo} raycast={() => null} />
          <primitive object={inst.beam} raycast={() => null} />
          <primitive object={inst.ring} raycast={() => null} />
          <primitive object={inst.wide} raycast={() => null} />
          <primitive
            object={inst.hit}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              const c = e.instanceId != null ? data.cities[e.instanceId] : undefined;
              if (c) live.current.handlers.onCity(c.name);
            }}
          />
        </group>
      </group>
    </group>
  );
});

/* Camera, controls and the frame scheduler --------------------------------------------- */
const Rig = memo(function Rig({ mobile, running, live }: { mobile: boolean; running: boolean; live: MutableRefObject<Live> }) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);

  useLayoutEffect(() => {
    const radius = mobile ? 92 : 86;
    const polar = 50 * DEG;
    camera.position.set(TARGET.x, TARGET.y + radius * Math.cos(polar), TARGET.z + radius * Math.sin(polar));
    camera.lookAt(TARGET);
    camera.updateProjectionMatrix();
    if (mobile) return;
    const c = new OrbitControls(camera, gl.domElement);
    c.target.copy(TARGET);
    c.enableZoom = false;
    c.enablePan = false;
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.rotateSpeed = 0.5;
    c.minAzimuthAngle = -20 * DEG;
    c.maxAzimuthAngle = 20 * DEG;
    c.minPolarAngle = 35 * DEG;
    c.maxPolarAngle = 65 * DEG;
    c.update();
    c.saveState();
    const busy = () => (live.current.busyUntil = performance.now() + 600);
    c.addEventListener('change', busy);
    const reset = () => {
      c.reset();
      busy();
    };
    gl.domElement.addEventListener('dblclick', reset);
    controls.current = c;
    return () => {
      c.removeEventListener('change', busy);
      gl.domElement.removeEventListener('dblclick', reset);
      c.dispose();
      controls.current = null;
    };
  }, [camera, gl, mobile, live]);

  useFrame(() => controls.current?.update());

  // render on demand: full speed while busy, a calm ~30 fps for the idle pulse and sway
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = 0;
    const idleFps = mobile ? 24 : 30;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const fps = t < live.current.busyUntil ? 60 : idleFps;
      if (t - last >= 1000 / fps - 2) {
        last = t;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, mobile, invalidate, live]);

  return null;
});

/**
 * Compile every shader in the background before the first frame. Without this, three.js blocks
 * the main thread while the GPU driver compiles (seconds on integrated GPUs with ANGLE/D3D11).
 */
function Warmup({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let alive = true;
    gl.debug.checkShaderErrors = import.meta.env.DEV;
    const done = () => alive && onReady();
    // wait one frame so every mesh is in the scene graph before compiling
    const id = requestAnimationFrame(() => {
      gl.compileAsync(scene, camera).then(done, done);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

/* Public component ----------------------------------------------------------------------- */
function LabelPill({ name, nameZh, count }: { name: string; nameZh: string; count: number }) {
  return (
    <>
      <span className="font-display text-[14px] font-semibold">{name}</span>
      <span className="font-cjk ml-1.5 text-[11px] text-mist" lang="zh">
        {nameZh}
      </span>
      <span className="tabular ml-2 font-semibold text-gold-2">{count}</span>
    </>
  );
}
const pillClass =
  'pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full border border-white/15 bg-navy/90 px-3 py-1 text-[12.5px] leading-none text-white shadow-lg will-change-transform';

export default function ChinaMap3D(props: ChinaMap3DProps) {
  const { mobile, running, onContextLost, active, tour, topLabels, onReady } = props;
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => {
    setReady(true);
    onReady();
  }, [onReady]);
  const [data, setData] = useState<MapData | null>(null);
  useEffect(() => {
    let alive = true;
    let built: MapData | null = null;
    buildMapData().then((d) => {
      built = d;
      if (alive) setData(d);
      else disposeMapData(d);
    });
    return () => {
      alive = false;
      if (built) disposeMapData(built);
    };
  }, []);

  const live = useRef<Live>({
    active,
    tour,
    busyUntil: 0,
    pointer: { x: 0, y: 0 },
    labels: new Map(),
    activeLabel: null,
    handlers: props,
  });
  // keep the frame loop's view of props current without re-rendering the scene
  live.current.active = active;
  live.current.tour = tour;
  live.current.handlers = props;
  useEffect(() => {
    live.current.busyUntil = performance.now() + 900;
  }, [active]);

  const geoByName = useMemo(() => new Map((data?.geos ?? []).map((g) => [g.name, g])), [data]);
  const activeGeo = active && !topLabels.includes(active) ? geoByName.get(active) : undefined;
  const dpr = useMemo(() => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, mobile ? 1.25 : 1.5), [mobile]);

  return (
    <div
      className="absolute inset-0"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        live.current.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        live.current.pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
        live.current.busyUntil = performance.now() + 700;
      }}
      onPointerLeave={() => {
        live.current.pointer.x = 0;
        live.current.pointer.y = 0;
        live.current.busyUntil = performance.now() + 900;
        document.body.style.cursor = '';
      }}
    >
      {data && (
        <Canvas
          frameloop={ready ? 'demand' : 'never'}
          dpr={dpr}
          camera={{ fov: 35, near: 1, far: 600, position: [0, 80, 60] }}
          gl={{ antialias: dpr < 1.5, alpha: true, powerPreference: 'high-performance', stencil: false }}
          style={{ touchAction: mobile ? 'pan-y' : 'none' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              onContextLost();
            });
          }}
          onPointerMissed={() => live.current.handlers.onHover(null)}
        >
          <Animator data={data} live={live} mobile={mobile} />
          <Rig mobile={mobile} running={running && ready} live={live} />
          <Warmup onReady={markReady} />
        </Canvas>
      )}

      {!mobile && ready && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {topLabels.map((name) => {
            const g = geoByName.get(name);
            if (!g) return null;
            return (
              <div
                key={name}
                className={pillClass}
                style={{ transform: 'translate3d(-999px,-999px,0)' }}
                ref={(el) => {
                  if (el) live.current.labels.set(name, el);
                  else live.current.labels.delete(name);
                }}
              >
                <LabelPill name={g.name} nameZh={g.nameZh} count={g.count} />
              </div>
            );
          })}
          <div
            className={pillClass}
            hidden={!activeGeo}
            style={{ transform: 'translate3d(-999px,-999px,0)' }}
            ref={(el) => {
              live.current.activeLabel = el;
            }}
          >
            {activeGeo && <LabelPill name={activeGeo.name} nameZh={activeGeo.nameZh} count={activeGeo.count} />}
          </div>
        </div>
      )}
    </div>
  );
}
