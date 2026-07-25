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

// ─── Utility: deterministic hash → [0, 1) ────────────────────────────────────
function dHash(i: number): number {
  return Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1.0;
}

// ─── Utility: Fibonacci sphere distribution ───────────────────────────────────
function fibSphere(count: number, radius: number) {
  const pos   = new Float32Array(count * 3);
  const base  = new Float32Array(count * 3);
  const phi   = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const θ = phi * i;
    const x = Math.cos(θ) * r * radius;
    const z = Math.sin(θ) * r * radius;
    const py = y * radius;

    pos[i * 3]     = x;  pos[i * 3 + 1]  = py; pos[i * 3 + 2]  = z;
    base[i * 3]    = x;  base[i * 3 + 1] = py; base[i * 3 + 2] = z;
  }
  return { positions: pos, basePositions: base };
}

// ─── Utility: deterministic size scales ──────────────────────────────────────
function sizeScales(count: number, smallVal: number, medVal: number, largeVal: number): Float32Array {
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const h = dHash(i);
    scales[i] = h > 0.92 ? largeVal : h > 0.72 ? medVal : smallVal;
  }
  return scales;
}

// ─── Generic point-cloud component ───────────────────────────────────────────
interface PointCloudProps {
  positions:     Float32Array;
  basePositions: Float32Array;
  sizeScales:    Float32Array;
  shader:        object;
}

function PointCloud({ positions, basePositions, sizeScales: scales, shader }: PointCloudProps) {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"      array={positions}     count={positions.length / 3}     itemSize={3} />
        <bufferAttribute attach="attributes-aBasePosition" array={basePositions} count={basePositions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-aSizeScale"    array={scales}        count={scales.length}            itemSize={1} />
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

// ─── Layer 1: Surface Particles ───────────────────────────────────────────────
function SurfaceParticles() {
  const N = 40000;
  const R = 1.15;
  const data = useMemo(() => {
    const { positions, basePositions } = fibSphere(N, R);
    return { positions, basePositions, scales: sizeScales(N, 0.50, 0.90, 1.60) };
  }, []);
  return <PointCloud positions={data.positions} basePositions={data.basePositions} sizeScales={data.scales} shader={SurfaceParticleShader} />;
}

// ─── Layer 2: Inner Sparse Particles ─────────────────────────────────────────
function InnerParticles() {
  const N = 4000;
  const R = 0.82;
  const data = useMemo(() => {
    const { positions, basePositions } = fibSphere(N, R);
    const scales = new Float32Array(N);
    for (let i = 0; i < N; i++) scales[i] = 0.4 + dHash(i * 3) * 0.6;
    return { positions, basePositions, scales };
  }, []);
  return <PointCloud positions={data.positions} basePositions={data.basePositions} sizeScales={data.scales} shader={InnerParticleShader} />;
}

// ─── Layer 3: Rim Particle Clusters ──────────────────────────────────────────
function RimParticles() {
  const N = 8000;
  const R = 1.16;
  const data = useMemo(() => {
    const { positions, basePositions } = fibSphere(N, R);
    const scales = new Float32Array(N);
    for (let i = 0; i < N; i++) scales[i] = 0.7 + dHash(i * 7) * 1.3;
    return { positions, basePositions, scales };
  }, []);
  return <PointCloud positions={data.positions} basePositions={data.basePositions} sizeScales={data.scales} shader={RimParticleShader} />;
}

// ─── Layer 4: Detached Atmospheric Particles ──────────────────────────────────
function AtmosphericParticles() {
  const N = 6000;
  const R = 1.38;
  const data = useMemo(() => {
    const pos   = new Float32Array(N * 3);
    const base  = new Float32Array(N * 3);
    const scales = new Float32Array(N);
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      const shellR = R * (0.88 + dHash(i * 31) * 0.24);
      const y  = 1 - ((i + 0.5) / N) * 2;
      const r  = Math.sqrt(Math.max(0, 1 - y * y));
      const θ  = phi * i;
      const x  = Math.cos(θ) * r * shellR;
      const py = y * shellR;
      const z  = Math.sin(θ) * r * shellR;

      pos[i*3]  = x;  pos[i*3+1]  = py; pos[i*3+2]  = z;
      base[i*3] = x;  base[i*3+1] = py; base[i*3+2] = z;
      scales[i] = 0.3 + dHash(i * 5) * 0.7;
    }
    return { pos, base, scales };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"      array={data.pos}    count={N} itemSize={3} />
        <bufferAttribute attach="attributes-aBasePosition" array={data.base}   count={N} itemSize={3} />
        <bufferAttribute attach="attributes-aSizeScale"    array={data.scales} count={N} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        args={[AtmosphericParticleShader]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
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

  const totalParticleCount = 40000 + 4000 + 8000 + 6000;

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-visible">
      {/* Iteration 1B: Multi-Layer Background Environment */}
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

        {/* Debug Layer Visibility Switches */}
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
          <div className="flex justify-between"><span>Particle Count:</span> <span className="text-white">{totalParticleCount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Point Size (Surface):</span> <span className="text-white">2.1 px</span></div>
          <div className="flex justify-between"><span>Bloom Threshold:</span> <span className="text-white">N/A (Off)</span></div>
          <div className="flex justify-between"><span>Bloom Strength:</span> <span className="text-white">N/A (Off)</span></div>
          <div className="flex justify-between"><span>Bloom Radius:</span> <span className="text-white">N/A (Off)</span></div>
          <div className="flex justify-between"><span>Camera Position:</span> <span className="text-white">[0, 0, 4.2]</span></div>
          <div className="flex justify-between"><span>Camera FOV:</span> <span className="text-white">45°</span></div>
          <div className="flex justify-between"><span>Surface Alpha:</span> <span className="text-white">0.85 + Rim</span></div>
          <div className="flex justify-between"><span>Volume Alpha:</span> <span className="text-white">0.05 - 0.32</span></div>
          <div className="flex justify-between"><span>Atmosphere Alpha:</span> <span className="text-white">0.04 - 0.18</span></div>
          <div className="flex justify-between font-bold border-t border-cyan-500/20 pt-1 mt-1"><span>FPS:</span> <span className="text-emerald-400">{fps}</span></div>
          <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-800 mt-1">Shortcuts: F1-F5 Layers | F6 Overlay</div>
        </div>
      )}
    </div>
  );
}

export default QuantumGlobeCanvas;
