/* ============================================================
   MAREA OS — Neural Core
   Il cervello visivo del sistema: un toro di fibre organiche
   turchesi che ondeggia, una sfera vetrosa con wireframe
   icosaedrico, una costellazione di neuroni che spara impulsi
   e un nucleo bianco-azzurro che respira. Reagisce agli eventi
   reali con pulsazioni di colore.
   Three.js + React Three Fiber + bloom. Fallback 2D se la GPU
   non regge.
   ============================================================ */
import React, { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const CYAN = new THREE.Color("#22d3ee");
const BLUE = new THREE.Color("#60a5fa");
const WHITE = new THREE.Color("#e0f2fe");
const PULSE_COLORS = {
  info: new THREE.Color("#22d3ee"),
  success: new THREE.Color("#34d399"),
  warning: new THREE.Color("#fbbf24"),
  ai: new THREE.Color("#a78bfa"),
};

/* Stato condiviso della pulsazione (aggiornato dal wrapper) */
const pulseState = { kick: 0, color: new THREE.Color("#22d3ee") };

/* ---------- Fibre del toro ---------- */
function TorusFibers({ R = 2.55, fibers = 9, segments = 220 }) {
  const group = useRef();
  const lines = useMemo(() => {
    const arr = [];
    for (let f = 0; f < fibers; f++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
      const mat = new THREE.LineBasicMaterial({
        color: f % 3 === 0 ? BLUE.clone() : CYAN.clone(),
        transparent: true,
        opacity: 0.28 + (f % 3) * 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      arr.push({ line: new THREE.Line(geo, mat), seed: f * 13.7 });
    }
    return arr;
  }, [fibers, segments]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const kick = pulseState.kick;
    for (let f = 0; f < lines.length; f++) {
      const { line, seed } = lines[f];
      const pos = line.geometry.attributes.position.array;
      for (let i = 0; i <= segments; i++) {
        const th = (i / segments) * Math.PI * 2;
        // spostamento organico pseudo-noise: somma di sinusoidi incoerenti
        const w =
          Math.sin(th * 3 + t * 0.5 + seed) * 0.10 +
          Math.sin(th * 7 - t * 0.85 + seed * 2.1) * 0.05 +
          Math.sin(th * 11 + t * 0.33 + seed * 0.7) * 0.028;
        const rr = R + w * (1 + kick * 1.6);
        const tube =
          Math.sin(th * 5 + t * 0.7 + seed * 3.3) * 0.16 +
          Math.sin(th * 2 - t * 0.4 + seed) * 0.10;
        pos[i * 3] = Math.cos(th) * rr;
        pos[i * 3 + 1] = tube * (1 + kick);
        pos[i * 3 + 2] = Math.sin(th) * rr;
      }
      line.geometry.attributes.position.needsUpdate = true;
    }
    if (group.current) {
      group.current.rotation.y = t * 0.05;
      group.current.rotation.x = -0.42 + Math.sin(t * 0.13) * 0.03;
    }
  });

  return (
    <group ref={group}>
      {lines.map((l, i) => <primitive key={i} object={l.line} />)}
    </group>
  );
}

/* ---------- Particelle in deriva attorno al toro ---------- */
function DriftParticles({ count = 260 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 1.9;
      p[i * 3] = Math.cos(th) * r;
      p[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      p[i * 3 + 2] = Math.sin(th) * r;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);
  const mat = useMemo(() => new THREE.PointsMaterial({
    color: CYAN, size: 0.022, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }), []);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.018;
      ref.current.rotation.x = -0.42;
    }
  });
  return <points ref={ref} geometry={geo} material={mat} />;
}

/* ---------- Sfera vetrosa (fresnel) ---------- */
function GlassSphere() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: CYAN.clone() }, uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vN; varying vec3 vV; uniform vec3 uColor;
      void main() {
        float fr = pow(1.0 - abs(dot(vN, vV)), 2.6);
        gl_FragColor = vec4(uColor, fr * 0.3);
      }`,
  }), []);
  return (
    <mesh material={mat}>
      <sphereGeometry args={[1.18, 48, 48]} />
    </mesh>
  );
}

/* ---------- Wireframe icosaedrico ---------- */
function WireShell() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = -clock.elapsedTime * 0.09;
      ref.current.rotation.z = clock.elapsedTime * 0.04;
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.34, 1]} />
      <meshBasicMaterial color={WHITE} wireframe transparent opacity={0.13} depthWrite={false} />
    </mesh>
  );
}

/* ---------- Neuroni + connessioni ---------- */
function fibonacciSphere(n, rMin, rMax) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const r = rMin + Math.random() * (rMax - rMin);
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r));
  }
  return pts;
}

function Neurons({ count = 110 }) {
  const ref = useRef();
  const { pointsGeo, linesGeo, pointsMat, linesMat } = useMemo(() => {
    const pts = fibonacciSphere(count, 0.25, 1.0);
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    pts.forEach((p, i) => { pArr.set([p.x, p.y, p.z], i * 3); phase[i] = Math.random() * Math.PI * 2; });
    pGeo.setAttribute("position", new THREE.BufferAttribute(pArr, 3));
    pGeo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

    // connessioni: per ogni punto, i 2 vicini più prossimi
    const segs = [], segPhase = [];
    for (let i = 0; i < count; i++) {
      const dists = pts.map((p, j) => ({ j, d: i === j ? Infinity : pts[i].distanceTo(p) }))
        .sort((a, b) => a.d - b.d).slice(0, 2);
      for (const { j, d } of dists) {
        if (d < 0.75 && i < j) {
          segs.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
          const ph = Math.random() * Math.PI * 2;
          segPhase.push(ph, ph);
        }
      }
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs), 3));
    lGeo.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(segPhase), 1));

    const pMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uKick: { value: 0 }, uColor: { value: CYAN.clone() } },
      vertexShader: `
        attribute float aPhase; varying float vA; uniform float uTime; uniform float uKick;
        void main() {
          float p = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 1.7 + aPhase), 3.0);
          vA = (p + uKick * 0.8) * 0.9;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.1 + p * 1.7 + uKick * 2.0) * (36.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vA; uniform vec3 uColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(uColor, a);
        }`,
    });
    const lMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uKick: { value: 0 }, uColor: { value: BLUE.clone() } },
      vertexShader: `
        attribute float aPhase; varying float vA; uniform float uTime; uniform float uKick;
        void main() {
          vA = 0.06 + 0.3 * pow(0.5 + 0.5 * sin(uTime * 2.1 + aPhase), 4.0) + uKick * 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying float vA; uniform vec3 uColor;
        void main() { gl_FragColor = vec4(uColor, vA); }`,
    });
    return { pointsGeo: pGeo, linesGeo: lGeo, pointsMat: pMat, linesMat: lMat };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    pointsMat.uniforms.uTime.value = t;
    linesMat.uniforms.uTime.value = t;
    pointsMat.uniforms.uKick.value = pulseState.kick;
    linesMat.uniforms.uKick.value = pulseState.kick;
    pointsMat.uniforms.uColor.value.lerp(pulseState.kick > 0.05 ? pulseState.color : CYAN, 0.06);
    if (ref.current) ref.current.rotation.y = t * 0.12;
  });

  return (
    <group ref={ref}>
      <points geometry={pointsGeo} material={pointsMat} />
      <lineSegments geometry={linesGeo} material={linesMat} />
    </group>
  );
}

/* ---------- Alone tenue al centro (niente "palla di luce") ---------- */
function CoreGlow() {
  const ref = useRef();
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(120,210,240,0.16)");
    g.addColorStop(0.5, "rgba(40,140,190,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 0.9) * 0.08 + pulseState.kick * 0.5;
    if (ref.current) {
      ref.current.scale.setScalar(2.1 * breathe);
      ref.current.material.opacity = 0.7 + Math.sin(t * 1.4) * 0.15 + pulseState.kick * 0.5;
    }
  });
  return (
    <sprite ref={ref}>
      <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

/* ---------- Scena + decadimento pulsazione ---------- */
function Scene() {
  useFrame((_, dt) => {
    pulseState.kick = Math.max(0, pulseState.kick - dt * 1.4);
  });
  return (
    <>
      {/* canvas trasparente: si fonde con lo sfondo della pagina, nessun riquadro */}
      <group rotation={[-0.42, 0, 0]}>
        <TorusFibers />
      </group>
      <DriftParticles />
      <GlassSphere />
      <WireShell />
      <Neurons />
      <CoreGlow />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.22} luminanceSmoothing={0.35} mipmapBlur radius={0.7} />
      </EffectComposer>
    </>
  );
}

/* ---------- Fallback 2D (GPU assente/debole) ---------- */
function Core2D() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden>
      <div className="absolute h-3/4 w-3/4 rounded-full border border-cyan-400/25 animate-[spin_60s_linear_infinite]"
        style={{ borderStyle: "dashed" }} />
      <div className="absolute h-1/2 w-1/2 rounded-full border border-cyan-300/20 animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute h-24 w-24 rounded-full bg-cyan-400/25 blur-2xl animate-pulse" />
      <div className="h-3 w-3 rounded-full bg-cyan-100 shadow-[0_0_30px_8px_rgba(34,211,238,.6)]" />
    </div>
  );
}

class GLBoundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Core2D /> : this.props.children; }
}

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

/* ---------- Componente pubblico ---------- */
export default function NeuralCore({ pulse }) {
  const [gl] = useState(webglOk);
  // pulse: { n, cat } — a ogni evento il core reagisce
  useEffect(() => {
    if (!pulse || pulse.n === 0) return;
    pulseState.kick = Math.min(1, pulseState.kick + 0.55);
    pulseState.color = PULSE_COLORS[pulse.cat] || PULSE_COLORS.info;
  }, [pulse]);

  if (!gl) return <Core2D />;
  return (
    <GLBoundary>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 6.6], fov: 42 }}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </GLBoundary>
  );
}
