import { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  SurfaceParticleShader,
  InnerParticleShader,
  RimParticleShader,
  AtmosphericParticleShader,
} from './QuantumGlobeShader';
import { QuantumGlobeBackground } from './QuantumGlobeBackground';

// ─── Structured Latitude/Longitude Digital Lattice Generator ─────────────────
function gridSphere(ringsCount: number, radius: number, pointsPerCircumference: number = 240) {
  const positions: number[] = [];

  for (let i = 0; i < ringsCount; i++) {
    const v = (i + 0.5) / ringsCount;
    const phi = (v - 0.5) * Math.PI; // Latitude angle [-PI/2, +PI/2]
    const cosPhi = Math.cos(phi);
    const y = Math.sin(phi) * radius;

    const pointsInRing = Math.max(8, Math.round(pointsPerCircumference * cosPhi));
    for (let j = 0; j < pointsInRing; j++) {
      const u = j / pointsInRing;
      const theta = u * Math.PI * 2;
      const x = cosPhi * Math.cos(theta) * radius;
      const z = cosPhi * Math.sin(theta) * radius;

      positions.push(x, y, z);
    }
  }

  const posArray = new Float32Array(positions);
  return { positions: posArray, basePositions: posArray };
}

// ─── Generic Point Cloud Component ───────────────────────────────────────────
interface PointCloudProps {
  positions: Float32Array;
  shader:    object;
}

function PointCloud({ positions, shader }: PointCloudProps) {
  const count = positions.length / 3;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"      array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-aBasePosition" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        args={[shader]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Layer 1: Surface Lattice Particles (42,000 Points) ───────────────────────
function SurfaceParticles() {
  const R = 1.15;
  // ringsCount = 270, pointsPerCircumference = 480 yields ~42,000 surface points
  const data = useMemo(() => gridSphere(270, R, 480), []);
  return <PointCloud positions={data.positions} shader={SurfaceParticleShader} />;
}

// ─── Layer 2: Inner Sparse Lattice Particles (7,000 Points) ───────────────────
function InnerParticles() {
  const R = 0.82;
  // ringsCount = 110, pointsPerCircumference = 200 yields ~7,000 interior points
  const data = useMemo(() => gridSphere(110, R, 200), []);
  return <PointCloud positions={data.positions} shader={InnerParticleShader} />;
}

// ─── Layer 3: Rim Corona Particles (+25% Density = ~17,500 Points) ───────────
function RimParticles() {
  const R = 1.16;
  const data = useMemo(() => gridSphere(115, R, 240), []);
  return <PointCloud positions={data.positions} shader={RimParticleShader} />;
}

// ─── Layer 4: Detached Atmospheric Satellites (450 Points, r: 1.08R - 1.18R) ──
function AtmosphericParticles() {
  const N = 450; // Locked Atmosphere Particle Target
  const data = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      // Radius range: 1.08R to 1.18R of base sphere (R = 1.15 -> 1.24 to 1.35)
      const shellR = 1.15 * (1.08 + (i % 10) * 0.010);
      const y  = 1 - ((i + 0.5) / N) * 2;
      const r  = Math.sqrt(Math.max(0, 1 - y * y));
      const θ  = phi * i;

      pos[i * 3]     = Math.cos(θ) * r * shellR;
      pos[i * 3 + 1] = y * shellR;
      pos[i * 3 + 2] = Math.sin(θ) * r * shellR;
    }
    return { positions: pos };
  }, []);

  return <PointCloud positions={data.positions} shader={AtmosphericParticleShader} />;
}

// ─── FPS Counter Helper ───────────────────────────────────────────────────────
function FPSMonitor({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current += 1;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      onFpsUpdate(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

// ─── Surface Dynamics Frame Animation Controller ────────────────────────────
function SurfaceDynamicsController() {
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    SurfaceParticleShader.uniforms.uTime.value = elapsedTime;
    RimParticleShader.uniforms.uTime.value = elapsedTime;
    AtmosphericParticleShader.uniforms.uTime.value = elapsedTime;
  });
  return null;
}

// ─── Canvas Component ─────────────────────────────────────────────────────────
export function QuantumGlobeCanvas() {
  const [debugKey, setDebugKey] = useState<number>(6); // Default 6: Final Composite (Debug mode off)
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') { setDebugKey(1); SurfaceParticleShader.uniforms.uDebugMode.value = 1; }
      else if (e.key === '2') { setDebugKey(2); SurfaceParticleShader.uniforms.uDebugMode.value = 2; }
      else if (e.key === '3') { setDebugKey(3); SurfaceParticleShader.uniforms.uDebugMode.value = 3; }
      else if (e.key === '4') { setDebugKey(4); SurfaceParticleShader.uniforms.uDebugMode.value = 4; }
      else if (e.key === '5') { setDebugKey(5); SurfaceParticleShader.uniforms.uDebugMode.value = 5; }
      else if (e.key === '6') { setDebugKey(6); SurfaceParticleShader.uniforms.uDebugMode.value = 6; }
      else if (e.key === 'F6') { e.preventDefault(); setShowOverlay((prev) => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const debugLabels: Record<number, string> = {
    1: '1: SURFACE LATTICE ONLY',
    2: '2: ATMOSPHERE SATELLITES ONLY',
    3: '3: ENERGY FIELD HEATMAP',
    4: '4: COMPRESSION BANDS HEATMAP',
    5: '5: RIM PERTURBATION VISUALIZATION',
    6: '6: FINAL COMPOSITE (PRODUCTION RENDERER)',
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-visible">
      {/* Background Environment */}
      <QuantumGlobeBackground />

      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          precision: 'highp',
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        className="w-full h-full overflow-visible relative z-10"
      >
        <FPSMonitor onFpsUpdate={setFps} />
        <SurfaceDynamicsController />

        {/* Layer Visibility Controls per Debug Mode */}
        {debugKey === 6 && (
          <>
            <InnerParticles />
            <SurfaceParticles />
            <RimParticles />
            <AtmosphericParticles />
          </>
        )}
        {debugKey === 1 && <SurfaceParticles />}
        {debugKey === 2 && <AtmosphericParticles />}
        {debugKey === 3 && <SurfaceParticles />}
        {debugKey === 4 && <SurfaceParticles />}
        {debugKey === 5 && (
          <>
            <SurfaceParticles />
            <RimParticles />
          </>
        )}
      </Canvas>

      {/* Debug Mode HUD Panel (shown when debugKey !== 6 or showOverlay is true) */}
      {(debugKey !== 6 || showOverlay) && (
        <div className="absolute top-4 left-4 z-50 bg-black/85 backdrop-blur-md border border-cyan-500/40 text-cyan-400 p-3 rounded-lg font-mono text-xs shadow-2xl space-y-1.5 w-72">
          <div className="text-white font-bold border-b border-cyan-500/30 pb-1 flex justify-between items-center">
            <span>GLOBE SHADER DEBUG</span>
            <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">MODE {debugKey}</span>
          </div>
          <div className="text-emerald-400 font-semibold">{debugLabels[debugKey]}</div>
          <div className="text-[10px] text-gray-300 space-y-0.5 pt-1 border-t border-gray-800">
            <div><span className="text-cyan-300 font-bold">1</span> Surface Lattice | <span className="text-cyan-300 font-bold">2</span> Satellites</div>
            <div><span className="text-cyan-300 font-bold">3</span> Energy Flow  | <span className="text-cyan-300 font-bold">4</span> Compression</div>
            <div><span className="text-cyan-300 font-bold">5</span> Rim Breakup  | <span className="text-cyan-300 font-bold">6</span> Composite</div>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-gray-400 border-t border-gray-800 pt-1">
            <span>FPS: <strong className="text-emerald-400">{fps}</strong></span>
            <span>Key 6 to exit debug</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuantumGlobeCanvas;
