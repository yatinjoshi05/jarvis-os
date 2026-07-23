import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { voiceStateMachine, VoiceState } from '../../../shared/ai/VoiceStateMachine'
import { useAudioAnalyser } from '../../../shared/audio/useAudioAnalyser'

/**
 * Refined JarvisGlobe Component
 * - 22,000 Crisp Fibonacci Point-Cloud Sphere (distinct dots with visible black space between them)
 * - 5-Stop Vertical Color Ramp
 * - View-Space Rim Brightening & Organic Faceted Silhouette Noise
 * - Clean Wave Rings (No streak/line artifacts)
 * - REAL Voice & Audio Analyser Reactivity
 */

function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const phi = (1 + Math.sqrt(5)) / 2

  const cTop = new THREE.Color('#E8FFFF')
  const cUpperMid = new THREE.Color('#00C8FF')
  const cMid = new THREE.Color('#4A5FE8')
  const cLowerMid = new THREE.Color('#8B3FD9')
  const cPink = new THREE.Color('#E8397F')
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
    if (t >= 0.8) {
      const localT = (t - 0.8) / 0.2
      col.copy(cUpperMid).lerp(cTop, localT)
    } else if (t >= 0.6) {
      const localT = (t - 0.6) / 0.2
      col.copy(cMid).lerp(cUpperMid, localT)
    } else if (t >= 0.4) {
      const localT = (t - 0.4) / 0.2
      col.copy(cLowerMid).lerp(cMid, localT)
    } else if (t >= 0.2) {
      const localT = (t - 0.2) / 0.2
      col.copy(cPink).lerp(cLowerMid, localT)
    } else {
      const localT = t / 0.2
      col.copy(cBottom).lerp(cPink, localT)
    }

    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b

    // Crisp point size in pixel units (1.8px to 3.2px for distinct dots)
    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 1.8 + noiseFactor * 1.4
  }

  return { positions, colors, sizes }
}

function generateInteriorStars(count = 12, maxRadius = 1.4) {
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

    sizes[i] = 4.5 + Math.random() * 2.0
  }

  return { positions, colors, sizes }
}

function generateRecycledDetachedBuffer(count = 2500, radius = 1.8) {
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const lifetimes = new Float32Array(count * 2)
  const sizes = new Float32Array(count)

  const cTop = new THREE.Color('#00C8FF')
  const cMid = new THREE.Color('#8B3FD9')
  const cBot = new THREE.Color('#FFD700')

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)

    const nx = Math.sin(phi) * Math.cos(theta)
    const ny = Math.cos(phi)
    const nz = Math.sin(phi) * Math.sin(theta)

    positions[i * 3] = nx * radius
    positions[i * 3 + 1] = ny * radius
    positions[i * 3 + 2] = nz * radius

    normals[i * 3] = nx
    normals[i * 3 + 1] = ny
    normals[i * 3 + 2] = nz

    const normY = ny * 0.5 + 0.5
    const col = new THREE.Color()
    if (normY > 0.5) {
      col.copy(cMid).lerp(cTop, (normY - 0.5) * 2.0)
    } else {
      col.copy(cBot).lerp(cMid, normY * 2.0)
    }

    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b

    lifetimes[i * 2] = Math.random() * 6.0
    lifetimes[i * 2 + 1] = 3.5 + Math.random() * 2.5

    sizes[i] = 1.6 + Math.random() * 1.4
  }

  return { positions, normals, colors, lifetimes, sizes }
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

interface RingState {
  age: number
  duration: number
  rotation: THREE.Euler
  color: THREE.Color
  active: boolean
}

/**
 * Clean Wave Ring Component (No streak/plane artifacts)
 * Uses billboarded ring particles rendered cleanly on radial rings.
 */
function ExpandingWaveRings({ intensity = 0.0, radius = 1.8 }: { intensity?: number; radius?: number }) {
  const MAX_RINGS = 5
  const ringsRef = useRef<THREE.Group>(null)
  const spawnTimerRef = useRef(0)

  const ringStatesRef = useRef<RingState[]>(
    Array.from({ length: MAX_RINGS }, () => ({
      age: 0,
      duration: 3.5,
      rotation: new THREE.Euler(),
      color: new THREE.Color('#00DFFF'),
      active: false,
    }))
  )

  const ringGeometry = useMemo(() => {
    return new THREE.RingGeometry(radius, radius + 0.05, 48)
  }, [radius])

  const ringMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uIntensity: { value: 0.0 },
        uColor: { value: new THREE.Color('#00DFFF') },
      },
      vertexShader: `
        uniform float uProgress;
        varying vec3 vViewNormal;

        void main() {
          float scale = 1.0 + uProgress * 1.0;
          vec3 scaledPos = position * vec3(scale, scale, 1.0);

          vec4 mvPosition = modelViewMatrix * vec4(scaledPos, 1.0);
          vViewNormal = normalize(normalMatrix * normal);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uIntensity;
        uniform vec3 uColor;
        varying vec3 vViewNormal;

        void main() {
          // Fade rings smooth at edge-on viewing angles to prevent streak lines
          float viewAngle = abs(vViewNormal.z);
          float angleFade = smoothstep(0.1, 0.4, viewAngle);

          float fadeIn = smoothstep(0.0, 0.1, uProgress);
          float fadeOut = 1.0 - smoothstep(0.1, 1.0, uProgress);
          float alpha = fadeIn * fadeOut * (0.35 + uIntensity * 0.4) * angleFade;

          vec3 glowingColor = uColor * (1.3 + uIntensity * 0.7);

          gl_FragColor = vec4(glowingColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  }, [])

  useEffect(() => {
    return () => {
      ringGeometry.dispose()
      ringMaterial.dispose()
    }
  }, [ringGeometry, ringMaterial])

  useFrame((_, delta) => {
    spawnTimerRef.current += delta
    const spawnInterval = Math.max(0.5, 4.0 - intensity * 3.2)

    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0

      const slot = ringStatesRef.current.find((r) => !r.active)
      if (slot) {
        slot.active = true
        slot.age = 0
        slot.duration = Math.max(1.1, 3.5 - intensity * 1.8)
        slot.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )

        if (intensity > 0.5) {
          slot.color.set('#00DFFF').lerp(new THREE.Color('#FF007F'), (intensity - 0.5) * 2.0)
        } else {
          slot.color.set('#00DFFF')
        }
      }
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((mesh, index) => {
        const state = ringStatesRef.current[index]
        if (state.active) {
          state.age += delta
          const progress = Math.min(1.0, state.age / state.duration)

          if (progress >= 1.0) {
            state.active = false
            mesh.visible = false
          } else {
            mesh.visible = true
            mesh.rotation.copy(state.rotation)

            const ringMesh = mesh as THREE.Mesh<THREE.RingGeometry, THREE.ShaderMaterial>
            if (ringMesh.material) {
              ringMesh.material.uniforms.uProgress.value = progress
              ringMesh.material.uniforms.uIntensity.value = intensity
              ringMesh.material.uniforms.uColor.value.copy(state.color)
            }
          }
        } else {
          mesh.visible = false
        }
      })
    }
  })

  const ringMeshes = useMemo(() => {
    return Array.from({ length: MAX_RINGS }).map((_, i) => (
      <mesh key={i} geometry={ringGeometry} material={ringMaterial.clone()} visible={false} />
    ))
  }, [ringGeometry, ringMaterial])

  return <group ref={ringsRef}>{ringMeshes}</group>
}

export interface JarvisGlobeProps {
  pointCount?: number
  radius?: number
  voiceState?: VoiceState
}

function CorePointSphere({ pointCount = 22000, radius = 1.8, voiceState = 'IDLE' }: JarvisGlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())

  // Connect REAL audio analyser hook
  const { voiceLevel } = useAudioAnalyser()

  const isListening = voiceState === 'LISTENING'
  const isThinking = ['THINKING', 'TRANSCRIBING', 'GENERATING'].includes(voiceState)
  const isSpeaking = ['SPEAKING', 'STREAMING'].includes(voiceState)
  const isError = voiceState === 'ERROR' || voiceState === 'PERMISSION_DENIED'

  let stateIntensity = 0.0
  if (isSpeaking) {
    stateIntensity = Math.min(1.0, 0.35 + voiceLevel * 1.5)
  } else if (isListening) {
    stateIntensity = Math.min(1.0, 0.25 + voiceLevel * 1.2)
  } else if (isThinking) {
    stateIntensity = 0.75
  }

  const rotSpeed = isThinking ? 0.0045 : isError ? 0.0035 : 0.0012
  const targetScale = isThinking ? 1.08 : isSpeaking ? 1.0 + voiceLevel * 0.12 : 1.0

  // 1. Surface Sphere Geometry (22,000 Fibonacci Points for distinct point-cloud texture)
  const mainGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateFibonacciSphere(pointCount, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius])

  // 2. Interior Stars Geometry
  const starGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateInteriorStars(12, radius * 0.75)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [radius])

  // 3. Recycled Detached Drift Buffer Geometry
  const detachedGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, normals, colors, lifetimes, sizes } = generateRecycledDetachedBuffer(2500, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('spawnNormal', new THREE.BufferAttribute(normals, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 2))
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

  // 5. Main Surface ShaderMaterial (Crisp Point Falloff & Faceted Rim Silhouette Noise)
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
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);

          // Calculate view-space rim normal dot product
          vec4 tempMvPos = modelViewMatrix * vec4(position, 1.0);
          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-tempMvPos.xyz);
          float ndotv = abs(dot(viewNormal, viewDir));
          vRim = pow(1.0 - ndotv, 2.2);

          // Problem 3 Polish: Subtle rim noise displacement to break perfectly smooth circle edge
          float rimDisplace = snoise(position * 2.2 + vec3(0.0, uTime * 0.4, 0.0)) * 0.045 * vRim;
          vec3 displacedPos = position + normalVec * rimDisplace;

          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);

          float rimSizeBoost = (1.0 + vRim * 0.35) * (1.0 + uVoiceLevel * 0.25);
          gl_PointSize = size * rimSizeBoost * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uVoiceLevel;
        varying vec3 vColor;
        varying float vRim;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Problem 1 Fix: Crisp, distinct particle profile (no blurred outer halo merging points)
          float intensity = pow(1.0 - (dist * 2.0), 2.2);

          float rimLuminance = (1.0 + vRim * 0.65) * (1.0 + uVoiceLevel * 0.45);
          vec3 glowColor = vColor * rimLuminance * 1.25;
          
          gl_FragColor = vec4(glowColor, intensity * 0.95);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  // 6. Interior Star ShaderMaterial
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

          float intensity = pow(1.0 - (dist * 2.0), 1.8);
          gl_FragColor = vec4(vColor * 2.2, intensity * 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  // 7. Detached Particle ShaderMaterial
  const detachedMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        uniform float uTime;
        attribute vec3 spawnNormal;
        attribute vec2 lifetime;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          float birthOffset = lifetime.x;
          float duration = lifetime.y;

          float age = mod(uTime + birthOffset, duration);
          float progress = age / duration;

          float driftDistance = progress * 0.65;

          vec3 wander = vec3(
            sin(uTime * 0.8 + position.y * 3.0) * 0.05 * progress,
            cos(uTime * 0.6 + position.x * 3.0) * 0.05 * progress,
            sin(uTime * 0.7 + position.z * 3.0) * 0.05 * progress
          );

          vec3 currentPos = position + spawnNormal * driftDistance + wander;

          float fadeIn = smoothstep(0.0, 0.15, progress);
          float fadeOut = 1.0 - smoothstep(0.65, 1.0, progress);
          vAlpha = fadeIn * fadeOut * 0.75;

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_PointSize = size * (1.0 + progress * 0.25) * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 2.0);
          gl_FragColor = vec4(vColor * 1.3, intensity * vAlpha);
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
          vAlpha = 0.15 + 0.20 * sin(uTime * 0.7 + position.y * 3.0);

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
      starGeometry.dispose()
      detachedGeometry.dispose()
      dustGeometry.dispose()
      mainMaterial.dispose()
      starMaterial.dispose()
      detachedMaterial.dispose()
      dustMaterial.dispose()
    }
  }, [
    mainGeometry,
    starGeometry,
    detachedGeometry,
    dustGeometry,
    mainMaterial,
    starMaterial,
    detachedMaterial,
    dustMaterial,
  ])

  // Real-time Audio & State Animation Loop
  useFrame((_, delta) => {
    frameCountRef.current += 1
    const now = performance.now()
    if (now - lastFpsTimeRef.current >= 3000) {
      const calculatedFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current))
      console.log(`[Refined Globe Performance] FPS: ${calculatedFps} | Points: ${pointCount} | Distinct Point Cloud Active`)
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

    if (starMaterial) starMaterial.uniforms.uTime.value += delta
    if (detachedMaterial) detachedMaterial.uniforms.uTime.value += delta
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
      {/* 1. Surface Point Cloud Sphere with Crisp Distinct Point Profile */}
      <points geometry={mainGeometry} material={mainMaterial} />
      {/* 2. Super-Luminous Interior Star Points */}
      <points geometry={starGeometry} material={starMaterial} />
      {/* 3. Energy-Shedding Detached Drift Particles */}
      <points geometry={detachedGeometry} material={detachedMaterial} />
      {/* 4. Subtle Background Micro-Dust */}
      <points geometry={dustGeometry} material={dustMaterial} />
      {/* 5. Expanding Wave Rings */}
      <ExpandingWaveRings intensity={stateIntensity} radius={radius} />
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

        <CorePointSphere pointCount={22000} radius={1.8} voiceState={currentVoiceState} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
