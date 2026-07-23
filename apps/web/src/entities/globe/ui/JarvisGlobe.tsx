import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { voiceStateMachine, VoiceState } from '../../../shared/ai/VoiceStateMachine'
import { useAudioAnalyser } from '../../../shared/audio/useAudioAnalyser'

/**
 * Pixel-Perfect Reference-Matched JARVIS Quantum Globe
 * - Golden-spiral Fibonacci point grid (45,000 points)
 * - Wavy organic Simplex noise rim crests on top & bottom
 * - Circumferential 5-stop color ramp matching reference:
 *   Top: Electric Ice-Blue/Cyan (#7FE8FF)
 *   Upper Sides: Deep Purple/Magenta (#8B5CF6 / #D946EF)
 *   Lower Sides: Crimson Coral-Red (#F43F5E)
 *   Bottom Ring: Dense Fiery Orange & Gold (#F97316 / #FACC15)
 * - Dark midnight-blue sparse interior with subtle face-shadow void
 * - 12 Interior bright white star points
 * - Asymmetric breakaway particle streams at upper-left, upper-right, and bottom
 * - 100% clean 3D point cloud architecture (0 line/mesh artifacts)
 */

function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const phi = (1 + Math.sqrt(5)) / 2

  const cTop = new THREE.Color('#7FE8FF')       // Ice Blue / Cyan
  const cUpperMid = new THREE.Color('#00DFFF')  // Electric Cyan
  const cMid = new THREE.Color('#8B5CF6')       // Deep Purple / Violet
  const cLowerMid = new THREE.Color('#D946EF')  // Magenta
  const cRed = new THREE.Color('#F43F5E')       // Crimson Coral Red
  const cBottom = new THREE.Color('#FACC15')    // Warm Golden Yellow
  const cOrange = new THREE.Color('#F97316')    // Fiery Amber Orange

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = (2 * Math.PI * i) / phi

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    positions[i * 3] = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius

    // Circumferential height-based color mapping strictly matching reference image
    const t = y * 0.5 + 0.5 // 1.0 at top pole, 0.0 at bottom pole

    const col = new THREE.Color()
    if (t >= 0.82) {
      const localT = (t - 0.82) / 0.18
      col.copy(cUpperMid).lerp(cTop, localT)
    } else if (t >= 0.60) {
      const localT = (t - 0.60) / 0.22
      col.copy(cMid).lerp(cUpperMid, localT)
    } else if (t >= 0.38) {
      const localT = (t - 0.38) / 0.22
      col.copy(cLowerMid).lerp(cMid, localT)
    } else if (t >= 0.20) {
      const localT = (t - 0.20) / 0.18
      col.copy(cRed).lerp(cLowerMid, localT)
    } else if (t >= 0.08) {
      const localT = (t - 0.08) / 0.12
      col.copy(cOrange).lerp(cRed, localT)
    } else {
      const localT = t / 0.08
      col.copy(cBottom).lerp(cOrange, localT)
    }

    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b

    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 1.6 + noiseFactor * 1.5
  }

  return { positions, colors, sizes }
}

/**
 * Generate Asymmetric Breakaway Stream Particles (Top-Left, Top-Right & Bottom-Splash)
 */
function generateAsymmetricBreakaways(count = 80, radius = 1.8) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const cIceCyan = new THREE.Color('#7FE8FF')
  const cMagenta = new THREE.Color('#D946EF')
  const cFieryOrange = new THREE.Color('#F97316')

  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number, col: THREE.Color

    if (i < count * 0.35) {
      // Top-Left Cyan Breakaways
      x = -radius * (1.04 + Math.random() * 0.35)
      y = radius * (0.65 + Math.random() * 0.42)
      z = (Math.random() - 0.5) * 0.7
      col = cIceCyan
    } else if (i < count * 0.65) {
      // Top-Right Magenta/Blue Breakaways
      x = radius * (1.04 + Math.random() * 0.32)
      y = radius * (0.55 + Math.random() * 0.45)
      z = (Math.random() - 0.5) * 0.7
      col = cMagenta
    } else {
      // Bottom Fiery Orange Splash Breakaways
      x = (Math.random() - 0.5) * radius * 1.6
      y = -radius * (1.04 + Math.random() * 0.38)
      z = (Math.random() - 0.5) * 0.7
      col = cFieryOrange
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b

    sizes[i] = 1.8 + Math.random() * 1.8
  }

  return { positions, colors, sizes }
}

/**
 * Generate 12 Interior White Star Points
 */
function generateInteriorStars(count = 12, maxRadius = 1.3) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const whiteColor = new THREE.Color('#FFFFFF')

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = 0.3 + Math.random() * (maxRadius - 0.3)

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    colors[i * 3] = whiteColor.r
    colors[i * 3 + 1] = whiteColor.g
    colors[i * 3 + 2] = whiteColor.b

    sizes[i] = 5.2 + Math.random() * 2.6
  }

  return { positions, colors, sizes }
}

function generateMicroDust(count = 1500) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = 2.8 + Math.random() * 3.4

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    colors[i * 3] = 0.75 + Math.random() * 0.25
    colors[i * 3 + 1] = 0.88 + Math.random() * 0.12
    colors[i * 3 + 2] = 1.0

    sizes[i] = 1.0 + Math.random() * 1.0
  }

  return { positions, colors, sizes }
}

export interface JarvisGlobeProps {
  pointCount?: number
  radius?: number
  voiceState?: VoiceState
}

function CorePointSphere({ pointCount = 45000, radius = 1.8, voiceState = 'IDLE' }: JarvisGlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())

  const { voiceLevel } = useAudioAnalyser()

  const isThinking = ['THINKING', 'TRANSCRIBING', 'GENERATING'].includes(voiceState)
  const isSpeaking = ['SPEAKING', 'STREAMING'].includes(voiceState)
  const isError = voiceState === 'ERROR' || voiceState === 'PERMISSION_DENIED'

  const rotSpeed = isThinking ? 0.0045 : isError ? 0.0035 : 0.0012
  const targetScale = isThinking ? 1.08 : isSpeaking ? 1.0 + voiceLevel * 0.12 : 1.0

  // 1. Core Fibonacci Point Cloud Geometry
  const mainGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateFibonacciSphere(pointCount, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius])

  // 2. Asymmetric Breakaway Streams Geometry
  const breakawayGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateAsymmetricBreakaways(80, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [radius])

  // 3. Interior White Stars Geometry
  const starGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateInteriorStars(12, radius * 0.70)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [radius])

  // 4. Background Micro-Dust Geometry
  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateMicroDust(1500)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [])

  // 5. Reference-Matched GLSL ShaderMaterial
  const mainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uVoiceLevel: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uVoiceLevel;
        attribute float size;
        varying vec3 vColor;
        varying float vRimWeight;
        varying float vFaceMask;

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
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);

          // Calculate view-space rimFactor
          vec4 tempMvPos = modelViewMatrix * vec4(position, 1.0);
          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-tempMvPos.xyz);
          float rimFactor = 1.0 - abs(dot(viewNormal, viewDir));

          // Steep rim weight curve
          vRimWeight = pow(rimFactor, 3.6);

          // Wavy organic rim noise displacement matching reference image's ruffled edges
          float wavyNoise = snoise(position * 2.6 + vec3(0.0, uTime * 0.35, 0.0)) * 0.12 * vRimWeight;

          // Extra bottom-center fiery fragmentation (y < -0.5)
          float bottomFrac = smoothstep(-0.35, -0.95, position.y);
          float bottomScatter = snoise(position * 3.5 + vec3(uTime * 0.5, 0.0, 0.0)) * 0.18 * bottomFrac * vRimWeight;

          vec3 displacedPos = position + normalVec * (wavyNoise + bottomScatter);
          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);

          // Dynamic point sizing: small inside (1.3px), large on rim (4.8px)
          float dynamicSize = mix(1.3, 4.8, vRimWeight) * (1.0 + uVoiceLevel * 0.25);
          gl_PointSize = dynamicSize * (6.0 / -mvPosition.z);

          // Subtle Abstract Face Density Mask for interior points
          float eyeLeft = smoothstep(0.08, 0.0, length(vec2(position.x + 0.35, position.y - 0.28)));
          float eyeRight = smoothstep(0.08, 0.0, length(vec2(position.x - 0.35, position.y - 0.28)));
          float mouth = smoothstep(0.07, 0.0, abs(position.y - (-0.35 + position.x * position.x * 0.4)));
          vFaceMask = 1.0 - (eyeLeft * 0.6 + eyeRight * 0.6 + mouth * 0.5) * (1.0 - vRimWeight);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uVoiceLevel;
        varying vec3 vColor;
        varying float vRimWeight;
        varying float vFaceMask;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 2.2);

          // Dark midnight-blue interior fading to near-black
          vec3 darkInteriorColor = vec3(0.015, 0.04, 0.11);
          vec3 finalColor = mix(darkInteriorColor, vColor * 1.35, vRimWeight);

          float baseAlpha = mix(0.07, 0.96, vRimWeight) * vFaceMask * (1.0 + uVoiceLevel * 0.3);
          
          gl_FragColor = vec4(finalColor, intensity * baseAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  // 6. Asymmetric Breakaways ShaderMaterial
  const breakawayMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(uTime * 0.6 + position.y) * 0.035;
          pos.y += cos(uTime * 0.5 + position.x) * 0.035;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - (dist * 2.0), 1.8);
          gl_FragColor = vec4(vColor * 1.4, intensity * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  // 7. Interior White Stars ShaderMaterial
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - (dist * 2.0), 1.6);
          gl_FragColor = vec4(vColor * 2.5, intensity * 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  // 8. Micro-Dust ShaderMaterial
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
          pos.x += sin(uTime * 0.2 + position.z) * 0.04;
          pos.y += cos(uTime * 0.25 + position.x) * 0.04;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vAlpha = 0.12 + 0.18 * sin(uTime * 0.7 + position.y * 3.0);

          gl_PointSize = size * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - (dist * 2.0), 1.5);
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
      breakawayGeometry.dispose()
      starGeometry.dispose()
      dustGeometry.dispose()
      mainMaterial.dispose()
      breakawayMaterial.dispose()
      starMaterial.dispose()
      dustMaterial.dispose()
    }
  }, [
    mainGeometry,
    breakawayGeometry,
    starGeometry,
    dustGeometry,
    mainMaterial,
    breakawayMaterial,
    starMaterial,
    dustMaterial,
  ])

  useFrame((_, delta) => {
    frameCountRef.current += 1
    const now = performance.now()
    if (now - lastFpsTimeRef.current >= 3000) {
      const calculatedFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current))
      console.log(`[JARVIS Globe] Reference Matched | FPS: ${calculatedFps} | 45k Points`)
      frameCountRef.current = 0
      lastFpsTimeRef.current = now
    }

    if (mainMaterial) {
      mainMaterial.uniforms.uTime.value += delta
      mainMaterial.uniforms.uVoiceLevel.value = THREE.MathUtils.lerp(
        mainMaterial.uniforms.uVoiceLevel.value,
        voiceLevel,
        0.1
      )
    }

    if (breakawayMaterial) breakawayMaterial.uniforms.uTime.value += delta
    if (starMaterial) starMaterial.uniforms.uTime.value += delta
    if (dustMaterial) dustMaterial.uniforms.uTime.value += delta

    if (groupRef.current) {
      groupRef.current.rotation.y += rotSpeed
      
      const currentScale = groupRef.current.scale.x
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08)
      groupRef.current.scale.set(newScale, newScale, newScale)
    }
  })

  return (
    <group ref={groupRef}>
      {/* 1. Core Reference-Matched Rim Sphere */}
      <points geometry={mainGeometry} material={mainMaterial} />
      {/* 2. Asymmetric Breakaway Particles */}
      <points geometry={breakawayGeometry} material={breakawayMaterial} />
      {/* 3. 12 Interior White Stars */}
      <points geometry={starGeometry} material={starMaterial} />
      {/* 4. Background Micro-Dust */}
      <points geometry={dustGeometry} material={dustMaterial} />
    </group>
  )
}

export default function JarvisGlobe() {
  const [currentVoiceState, setCurrentVoiceState] = useState<VoiceState>(voiceStateMachine.state)

  const showDebugPanel = import.meta.env.VITE_GLOBE_DEBUG_PANEL === 'true'

  useEffect(() => {
    const unsubscribe = voiceStateMachine.subscribe((state) => {
      setCurrentVoiceState(state)
    })
    return unsubscribe
  }, [])

  return (
    <div className="w-full h-full relative overflow-visible bg-black">
      {showDebugPanel && (
        <div className="absolute top-3 left-3 z-50 flex flex-col gap-2 bg-black/80 border border-white/10 rounded-xl p-3 text-xs text-white/90 shadow-2xl backdrop-blur-md max-w-xs">
          <div className="flex items-center justify-between gap-4 font-mono">
            <span className="text-white/60 uppercase tracking-wider text-[10px]">Real Voice State</span>
            <span className="text-[#00DFFF] font-bold">{currentVoiceState}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 mt-1">
            {(['IDLE', 'LISTENING', 'THINKING', 'SPEAKING', 'ERROR'] as VoiceState[]).map((st) => (
              <button
                key={st}
                onClick={() => voiceStateMachine.transitionTo(st)}
                className={
                  currentVoiceState === st
                    ? 'px-2 py-1 rounded bg-[#00DFFF]/20 border border-[#00DFFF] text-[#00DFFF] font-bold text-[9px] uppercase tracking-wider text-center'
                    : 'px-2 py-1 rounded border border-white/10 text-white/50 hover:text-white text-[9px] uppercase tracking-wider text-center'
                }
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 6.0], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />

        <CorePointSphere pointCount={45000} radius={1.8} voiceState={currentVoiceState} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
