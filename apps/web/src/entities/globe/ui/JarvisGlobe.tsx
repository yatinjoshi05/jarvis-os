import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Fibonacci Sphere Point Generator (Phase 1: Core Point Cloud)
 * Generates an even golden-spiral distribution of points on a sphere surface.
 */
function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const phi = (1 + Math.sqrt(5)) / 2 // Golden ratio

  const cTop = new THREE.Color('#E0FFFF')       // Light Cyan/White
  const cUpperMid = new THREE.Color('#00DFFF')  // Vivid Cyan
  const cMid = new THREE.Color('#7B1FA2')       // Indigo/Purple
  const cLowerMid = new THREE.Color('#FF0055')  // Pink/Magenta
  const cBottom = new THREE.Color('#FFD700')    // Gold/Orange

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = (2 * Math.PI * i) / phi

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    positions[i * 3] = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius

    // Vertical Y color gradient
    const t = y * 0.5 + 0.5 // 1.0 at top, 0.0 at bottom

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
  }

  return { positions, colors }
}

export interface JarvisGlobeProps {
  pointCount?: number
  radius?: number
  basePointSize?: number
}

function CorePointSphere({ pointCount = 40000, radius = 1.8, basePointSize = 3.2 }: JarvisGlobeProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // 1. BufferGeometry with positions and colors
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors } = generateFibonacciSphere(pointCount, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return geo
  }, [pointCount, radius])

  // 2. Custom GLSL ShaderMaterial with correct pixel-sized point attenuation
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uBaseSize: { value: basePointSize },
      },
      vertexShader: `
        uniform float uBaseSize;
        varying vec3 vColor;
        varying float vRim;

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float ndotv = abs(dot(viewNormal, viewDir));
          
          vRim = pow(1.0 - ndotv, 2.2);

          // Correct attenuation formula: base pixel size * distance factor (300.0 / -mvPosition.z)
          gl_PointSize = uBaseSize * (1.0 + vRim * 1.5) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vRim;

        void main() {
          // Circular particle shape with soft gaussian falloff
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 1.6);
          float rimLuminance = 1.0 + vRim * 1.8;
          
          gl_FragColor = vec4(vColor * rimLuminance * 1.2, intensity * 0.95);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [basePointSize])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0015
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

export default function JarvisGlobe() {
  return (
    <div className="w-full h-full relative overflow-visible bg-black">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />

        <CorePointSphere pointCount={40000} radius={1.8} basePointSize={3.2} />

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
