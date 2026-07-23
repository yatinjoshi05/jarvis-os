import { useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Phase 2 JarvisGlobe Generator
 * Creates golden-angle Fibonacci sphere points with a 5-stop vertical color gradient,
 * rim silhouette energy boost, and sparse interior star points.
 */
function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const phi = (1 + Math.sqrt(5)) / 2 // Golden ratio

  // 5-Stop Color Ramp per Phase 2 Spec:
  // Top (y≈1): white/cyan (#E8FFFF / #00C8FF)
  // Upper-mid: cyan -> blue (#00C8FF -> #4A5FE8)
  // Mid: blue -> purple/indigo (#4A5FE8 -> #8B3FD9)
  // Lower-mid: purple -> pink/magenta (#8B3FD9 -> #E8397F)
  // Bottom: pink -> orange/red/yellow (#E8397F -> #FF6B1A -> #FFD700)
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

    // Vertical Y color gradient (5-stop lerp)
    const t = y * 0.5 + 0.5 // 1.0 at top, 0.0 at bottom

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

    // Base point size in pixel units (2.5px to 4.5px)
    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 2.5 + noiseFactor * 2.0
  }

  return { positions, colors, sizes }
}

/**
 * Generate 12 interior star points scattered inside the sphere volume.
 */
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

    // Distinctly larger point size for interior stars
    sizes[i] = 5.5 + Math.random() * 2.5
  }

  return { positions, colors, sizes }
}

export interface JarvisGlobeProps {
  pointCount?: number
  radius?: number
}

function CorePointSphere({ pointCount = 40000, radius = 1.8 }: JarvisGlobeProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const starRef = useRef<THREE.Points>(null)

  // 1. Surface Sphere BufferGeometry
  const mainGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateFibonacciSphere(pointCount, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius])

  // 2. Interior Stars BufferGeometry
  const starGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateInteriorStars(12, radius * 0.75)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [radius])

  // 3. Main Sphere ShaderMaterial (with Rim Silhouette Brightening)
  const mainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vRim;

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float ndotv = abs(dot(viewNormal, viewDir));

          // vRim ranges from 0.0 (center) to 1.0 (silhouette edge)
          vRim = pow(1.0 - ndotv, 2.2);
          float rimSizeBoost = 1.0 + vRim * 0.35;

          gl_PointSize = size * rimSizeBoost * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vRim;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 1.6);
          // Boost rim brightness near silhouette (1.0x to 1.5x)
          float rimLuminance = 1.0 + vRim * 0.5;
          
          gl_FragColor = vec4(vColor * rimLuminance, intensity * 0.96);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

  // 4. Interior Star ShaderMaterial
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
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
          float intensity = pow(1.0 - (dist * 2.0), 1.2);
          gl_FragColor = vec4(vColor * 1.8, intensity * 1.0);
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
      mainMaterial.dispose()
      starMaterial.dispose()
    }
  }, [mainGeometry, starGeometry, mainMaterial, starMaterial])

  return (
    <group>
      {/* Surface Point Cloud Sphere */}
      <points ref={pointsRef} geometry={mainGeometry} material={mainMaterial} />
      {/* Sparse Interior Star Points */}
      <points ref={starRef} geometry={starGeometry} material={starMaterial} />
    </group>
  )
}

export default function JarvisGlobe() {
  return (
    <div className="w-full h-full relative overflow-visible bg-black">
      <Canvas
        camera={{ position: [0, 0, 6.0], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />

        <CorePointSphere pointCount={40000} radius={1.8} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
