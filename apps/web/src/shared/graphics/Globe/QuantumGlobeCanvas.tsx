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
// Creates an organized, woven grid of flowing parallel latitude rings without pole pinching.
function gridSphere(ringsCount: number, radius: number) {
  const positions: number[] = [];

  for (let i = 0; i < ringsCount; i++) {
    const v = (i + 0.5) / ringsCount;
    const phi = (v - 0.5) * Math.PI; // Latitude angle [-PI/2, +PI/2]
    const cosPhi = Math.cos(phi);
    const y = Math.sin(phi) * radius;

    // Number of points in this latitude ring proportional to circumference (cosPhi)
    const pointsInRing = Math.max(8, Math.round(240 * cosPhi));
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
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"      array={positions} count={positions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-aBasePosition" array={positions} count={positions.length / 3} itemSize={3} />
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

// ─── Layer 1: Surface Lattice Particles ───────────────────────────────────────
function SurfaceParticles() {
  const R = 1.15;
  const data = useMemo(() => gridSphere(140, R), []);
  return <PointCloud positions={data.positions} shader={SurfaceParticleShader} />;
}

// ─── Layer 2: Inner Sparse Lattice Particles ─────────────────────────────────
function InnerParticles() {
  const R = 0.82;
  const data = useMemo(() => gridSphere(50, R), []);
  return <PointCloud positions={data.positions} shader={InnerParticleShader} />;
}

// ─── Layer 3: Rim Lattice Particles ──────────────────────────────────────────
function RimParticles() {
  const R = 1.16;
  const data = useMemo(() => gridSphere(90, R), []);
  return <PointCloud positions={data.positions} shader={RimParticleShader} />;
}

// ─── Layer 4: Detached Atmospheric Particles (Sparse, 2,000 Nodes, r: 1.03 - 1.12) ────
function AtmosphericParticles() {
  const N = 2000;
  const data = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      // Radius range: 1.03 to 1.12 of base sphere (r: 1.15)
      const shellR = 1.15 * (1.03 + (i % 10) * 0.009);
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
  const [debugMode, setDebugMode] = useState<'FULL' | 'SURFACE' | 'VOLUME' | 'ATMOSPHERE' | 'BLOOM'>('FULL');
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); setDebugMode('SURFACE'); }
      else if (e.key === 'F2') { e.preventDefault(); setDebugMode('VOLUME'); }
      else if (e.key === 'F3') { e.preventDefault(); setDebugMode('ATMOSPHERE'); }
      else if (e.key === 'F4') { e.preventDefault(); setDebugMode('BLOOM'); }
      else if (e.key === 'F5') { e.preventDefault(); setDebugMode('FULL'); }
      else if (e.key === 'F6') { e.preventDefault(); setShowOverlay((prev) => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalParticleCount = 22000;

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

        {/* Layer Visibility Switches */}
        {(debugMode === 'FULL' || debugMode === 'VOLUME') && <InnerParticles />}
        {(debugMode === 'FULL' || debugMode === 'SURFACE') && (
          <>
            <SurfaceParticles />
            <RimParticles />
          </>
        )}
        {(debugMode === 'FULL' || debugMode === 'ATMOSPHERE') && <AtmosphericParticles />}
      </Canvas>

      {/* F6 Statistics Overlay */}
      {showOverlay && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 p-3 rounded-lg font-mono text-xs shadow-xl space-y-1 w-64">
          <div className="text-white font-bold border-b border-cyan-500/20 pb-1 mb-1 flex justify-between">
            <span>GLOBE DEBUG STATS</span>
            <span className="text-emerald-400">{debugMode} MODE</span>
          </div>
          <div className="flex justify-between"><span>Particle Layout:</span> <span className="text-white">Structured Lattice</span></div>
          <div className="flex justify-between"><span>Point Size:</span> <span className="text-white">2.2 px Constant</span></div>
          <div className="flex justify-between"><span>Point Discs:</span> <span className="text-white">OLED Anti-Aliased</span></div>
          <div className="flex justify-between"><span>Camera Position:</span> <span className="text-white">[0, 0, 4.2]</span></div>
          <div className="flex justify-between font-bold border-t border-cyan-500/20 pt-1 mt-1"><span>FPS:</span> <span className="text-emerald-400">{fps}</span></div>
          <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-800 mt-1">Shortcuts: F1-F5 Layers | F6 Overlay</div>
        </div>
      )}
    </div>
  );
}

export default QuantumGlobeCanvas;
