import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioAnalyser } from '../../../shared/audio/useAudioAnalyser'
import { useGlobeSettings } from '../../../shared/globe/useGlobeSettings'

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra'
export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'warning' | 'error'

export interface QualityConfig {
  mainPoints: number
  detachedPoints: number
  dustPoints: number
}

export const QUALITY_PRESETS: Record<QualityTier, QualityConfig> = {
  low: {
    mainPoints: 20000,
    detachedPoints: 0,
    dustPoints: 0,
  },
  medium: {
    mainPoints: 50000,
    detachedPoints: 3000,
    dustPoints: 1000,
  },
  high: {
    mainPoints: 100000,
    detachedPoints: 6000,
    dustPoints: 2500,
  },
  ultra: {
    mainPoints: 150000,
    detachedPoints: 10000,
    dustPoints: 4000,
  },
}

interface StateMultiplier {
  rotSpeed: number
  noiseStrength: number
  noiseSpeed: number
  rimBoost: number
  pulseSpeed: number
}

const STATE_MULTIPLIERS: Record<AssistantState, StateMultiplier> = {
  idle: {
    rotSpeed: 0.0012,
    noiseStrength: 0.06,
    noiseSpeed: 0.5,
    rimBoost: 1.8,
    pulseSpeed: 0.8,
  },
  listening: {
    rotSpeed: 0.002,
    noiseStrength: 0.10,
    noiseSpeed: 1.2,
    rimBoost: 2.8,
    pulseSpeed: 1.5,
  },
  thinking: {
    rotSpeed: 0.0045,
    noiseStrength: 0.18,
    noiseSpeed: 2.2,
    rimBoost: 3.2,
    pulseSpeed: 3.0,
  },
  speaking: {
    rotSpeed: 0.0018,
    noiseStrength: 0.12,
    noiseSpeed: 1.4,
    rimBoost: 2.4,
    pulseSpeed: 2.0,
  },
  success: {
    rotSpeed: 0.0015,
    noiseStrength: 0.07,
    noiseSpeed: 0.8,
    rimBoost: 2.2,
    pulseSpeed: 1.2,
  },
  warning: {
    rotSpeed: 0.0022,
    noiseStrength: 0.11,
    noiseSpeed: 1.5,
    rimBoost: 2.5,
    pulseSpeed: 2.2,
  },
  error: {
    rotSpeed: 0.0035,
    noiseStrength: 0.22,
    noiseSpeed: 2.8,
    rimBoost: 3.5,
    pulseSpeed: 3.5,
  },
}

function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const phi = (1 + Math.sqrt(5)) / 2

  const cTop = new THREE.Color('#E0FFFF')
  const cUpperMid = new THREE.Color('#00DFFF')
  const cMid = new THREE.Color('#7B1FA2')
  const cLowerMid = new THREE.Color('#FF0055')
  const cBottom = new THREE.Color('#FFD700')

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))

    const theta = (2 * Math.PI * i) / phi

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    positions[i * 3] = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius

    const t = y * 0.5 + 0.5

    const col = new THREE.Color()
    if (t > 0.75) {
      const localT = (t - 0.75) / 0.25
      col.copy(cUpperMid).lerp(cTop, localT)
    } else if (t > 0.5) {
      const localT = (t - 0.5) / 0.25
      col.copy(cMid).lerp(cUpperMid, localT)
    } else if (t > 0.25) {
      const localT = (t - 0.25) / 0.25
      col.copy(cLowerMid).lerp(cMid, localT)
    } else {
      const localT = t / 0.25
      col.copy(cBottom).lerp(cLowerMid, localT)
    }

    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b

    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 0.018 + noiseFactor * 0.024
  }

  return { positions, colors, sizes }
}

function generateDetachedParticles(count: number, baseRadius: number) {
  if (count <= 0) {
    return { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0) }
  }

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const cTop = new THREE.Color('#00DFFF')
  const cMid = new THREE.Color('#FF0055')
  const cBot = new THREE.Color('#FFD700')

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)

    const r = baseRadius * (1.05 + Math.random() * 0.45)

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    const normY = (positions[i * 3 + 1] / r) * 0.5 + 0.5
    const col = new THREE.Color()
    if (normY > 0.5) {
      col.copy(cMid).lerp(cTop, (normY - 0.5) * 2.0)
    } else {
      col.copy(cBot).lerp(cMid, normY * 2.0)
    }

    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b

    sizes[i] = 0.014 + Math.random() * 0.022
  }

  return { positions, colors, sizes }
}

function generateMicroDust(count: number) {
  if (count <= 0) {
    return { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0) }
  }

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)

    const r = 2.8 + Math.random() * 3.5

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    colors[i * 3] = 0.7 + Math.random() * 0.3
    colors[i * 3 + 1] = 0.85 + Math.random() * 0.15
    colors[i * 3 + 2] = 1.0

    sizes[i] = 0.010 + Math.random() * 0.018
  }

  return { positions, colors, sizes }
}

export interface QuantumParticleSphereProps {
  qualityConfig: QualityConfig
  assistantState?: AssistantState
  radius?: number
  onFpsUpdate?: (fps: number) => void
}

function QuantumParticleSphere({
  qualityConfig,
  assistantState = 'idle',
  radius = 1.8,
  onFpsUpdate,
}: QuantumParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const detachedRef = useRef<THREE.Points>(null)
  const dustRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)

  const { voiceLevel } = useAudioAnalyser()
  const storeSettings = useGlobeSettings()

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  const stateConfig = STATE_MULTIPLIERS[assistantState]

  const mainGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const activePoints = storeSettings.particleCount ? Math.min(storeSettings.particleCount, qualityConfig.mainPoints) : qualityConfig.mainPoints
    const { positions, colors, sizes } = generateFibonacciSphere(activePoints, radius)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [qualityConfig.mainPoints, storeSettings.particleCount, radius])

  const detachedGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateDetachedParticles(qualityConfig.detachedPoints, radius)
    if (positions.length > 0) {
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    }
    return geo
  }, [qualityConfig.detachedPoints, radius])

  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateMicroDust(qualityConfig.dustPoints)
    if (positions.length > 0) {
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    }
    return geo
  }, [qualityConfig.dustPoints])

  const mainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uSizeScale: { value: storeSettings.particleSize ?? 1.0 },
        uNoiseStrength: { value: stateConfig.noiseStrength },
        uNoiseSpeed: { value: stateConfig.noiseSpeed },
        uNoiseScale: { value: 1.2 },
        uRimBoost: { value: stateConfig.rimBoost },
        uVoiceLevel: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSizeScale;
        uniform float uNoiseStrength;
        uniform float uNoiseSpeed;
        uniform float uNoiseScale;
        uniform float uRimBoost;
        uniform float uVoiceLevel;

        attribute float size;
        varying vec3 vColor;
        varying float vRim;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));

          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);
          
          float dynamicNoise = uNoiseStrength + uVoiceLevel * 0.15;
          float noiseVal = snoise(position * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, 0.0));
          vec3 displacedPos = position + normalVec * (noiseVal * dynamicNoise);

          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);

          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float ndotv = abs(dot(viewNormal, viewDir));
          
          vRim = pow(1.0 - ndotv, 2.2);
          float sizeFactor = (1.0 + vRim * uRimBoost) * (1.0 + uVoiceLevel * 0.4);
          
          gl_PointSize = size * uSizeScale * sizeFactor * (320.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vRim;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Enhanced gaussian glow intensity & rim luminance for vibrant non-postprocessed rendering
          float intensity = pow(1.0 - (dist * 2.0), 1.6);
          float rimLuminance = 1.0 + vRim * 2.2;
          
          gl_FragColor = vec4(vColor * rimLuminance * 1.2, intensity * 0.98);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [storeSettings.particleSize])

  const detachedMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(uTime * 0.6 + position.y * 2.0) * 0.08;
          pos.y += cos(uTime * 0.4 + position.x * 2.0) * 0.08;
          pos.z += sin(uTime * 0.5 + position.z * 2.0) * 0.08;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vAlpha = 0.4 + 0.4 * sin(uTime * 1.2 + position.x * 5.0);

          gl_PointSize = size * (280.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - (dist * 2.0), 1.8);
          gl_FragColor = vec4(vColor * 1.2, intensity * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  const dustMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(uTime * 0.2 + position.z) * 0.05;
          pos.y += cos(uTime * 0.25 + position.x) * 0.05;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vAlpha = 0.2 + 0.2 * sin(uTime * 0.8 + position.y * 3.0);

          gl_PointSize = size * (250.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(vColor * 1.1, intensity * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  useEffect(() => {
    return () => {
      mainGeometry.dispose()
      detachedGeometry.dispose()
      dustGeometry.dispose()
      mainMaterial.dispose()
      detachedMaterial.dispose()
      dustMaterial.dispose()
    }
  }, [mainGeometry, detachedGeometry, dustGeometry, mainMaterial, detachedMaterial, dustMaterial])

  useFrame((_, delta) => {
    frameCountRef.current += 1
    const now = performance.now()
    if (now - lastTimeRef.current >= 1000) {
      const calculatedFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      if (onFpsUpdate) onFpsUpdate(calculatedFps)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }

    if (mainMaterial) {
      mainMaterial.uniforms.uTime.value += delta
      mainMaterial.uniforms.uNoiseStrength.value = THREE.MathUtils.lerp(
        mainMaterial.uniforms.uNoiseStrength.value,
        stateConfig.noiseStrength,
        0.05
      )
      mainMaterial.uniforms.uNoiseSpeed.value = THREE.MathUtils.lerp(
        mainMaterial.uniforms.uNoiseSpeed.value,
        stateConfig.noiseSpeed,
        0.05
      )
      mainMaterial.uniforms.uRimBoost.value = THREE.MathUtils.lerp(
        mainMaterial.uniforms.uRimBoost.value,
        stateConfig.rimBoost,
        0.05
      )
      mainMaterial.uniforms.uVoiceLevel.value = voiceLevel
    }

    if (detachedMaterial) detachedMaterial.uniforms.uTime.value += delta
    if (dustMaterial) dustMaterial.uniforms.uTime.value += delta

    if (groupRef.current) {
      groupRef.current.rotation.y += stateConfig.rotSpeed
      const time = mainMaterial ? mainMaterial.uniforms.uTime.value : 0
      const basePulse = Math.sin(time * stateConfig.pulseSpeed) * 0.02
      const audioPulse = voiceLevel * 0.15
      const totalScale = 1.0 + basePulse + audioPulse
      groupRef.current.scale.set(totalScale, totalScale, totalScale)
    }
  })

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={mainGeometry} material={mainMaterial} />

      {qualityConfig.detachedPoints > 0 && (
        <points ref={detachedRef} geometry={detachedGeometry} material={detachedMaterial} />
      )}

      {qualityConfig.dustPoints > 0 && (
        <points ref={dustRef} geometry={dustGeometry} material={dustMaterial} />
      )}
    </group>
  )
}

export default function QuantumParticleGlobe() {
  const [qualityTier, setQualityTier] = useState<QualityTier>('high')
  const [assistantState, setAssistantState] = useState<AssistantState>('idle')
  const [fps, setFps] = useState(60)

  const config = QUALITY_PRESETS[qualityTier]
  const totalPoints = config.mainPoints + config.detachedPoints + config.dustPoints

  const handleCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      console.warn('[QuantumParticleGlobe] WebGL context lost. Attempting recovery...')
    }
    const handleContextRestored = () => {
      console.log('[QuantumParticleGlobe] WebGL context restored successfully.')
    }

    canvas.addEventListener('webglcontextlost', handleContextLost, false)
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false)
  }

  return (
    <div className="w-full h-full relative overflow-visible bg-black">
      {/* Dev Control Overlay: Performance Tier & AI State Selector */}
      <div className="absolute top-3 left-3 z-50 flex flex-col gap-2.5 bg-black/80 border border-white/10 rounded-xl p-3 text-xs text-white/90 shadow-2xl backdrop-blur-md max-w-xs">
        <div className="flex items-center justify-between gap-4 font-mono">
          <span className="text-white/60 uppercase tracking-wider text-[10px]">Quality Tier</span>
          <span className="text-[#00DFFF] font-bold">{fps} FPS</span>
        </div>

        <div className="flex items-center gap-1">
          {(['low', 'medium', 'high', 'ultra'] as QualityTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setQualityTier(tier)}
              className={
                qualityTier === tier
                  ? 'px-2.5 py-1 rounded-md bg-[#00DFFF]/20 border border-[#00DFFF] text-[#00DFFF] font-bold text-[10px] uppercase tracking-wider'
                  : 'px-2.5 py-1 rounded-md border border-white/10 text-white/50 hover:text-white text-[10px] uppercase tracking-wider'
              }
            >
              {tier}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 font-mono mt-1">
          <span className="text-white/60 uppercase tracking-wider text-[10px]">AI State Simulation</span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(['idle', 'listening', 'thinking', 'speaking', 'success', 'error'] as AssistantState[]).map((st) => (
            <button
              key={st}
              onClick={() => setAssistantState(st)}
              className={
                assistantState === st
                  ? 'px-2 py-1 rounded bg-white/20 border border-white text-white font-bold text-[9px] uppercase tracking-wider text-center'
                  : 'px-2 py-1 rounded border border-white/10 text-white/50 hover:text-white text-[9px] uppercase tracking-wider text-center'
              }
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-mono text-white/40 mt-0.5 flex flex-col gap-0.5">
          <div>Points: {totalPoints.toLocaleString()}</div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={handleCreated}
      >
        <ambientLight intensity={0.4} />

        <QuantumParticleSphere
          qualityConfig={config}
          assistantState={assistantState}
          radius={1.8}
          onFpsUpdate={setFps}
        />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.035}
        />
      </Canvas>
    </div>
  )
}
