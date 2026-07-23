import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Fibonacci Sphere Point Generator
 * Produces an evenly spaced distribution of points on a sphere surface of given radius.
 */
function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const phi = (1 + Math.sqrt(5)) / 2 // Golden ratio

  // Gradient stops: Top (Cyan/White) -> Upper-Mid (Blue/Indigo) -> Lower-Mid (Purple/Magenta) -> Bottom (Orange/Gold)
  const cTop = new THREE.Color('#E0FFFF')       // Light Cyan/White
  const cUpperMid = new THREE.Color('#00DFFF')  // Vivid Cyan/Blue
  const cMid = new THREE.Color('#7B1FA2')       // Indigo/Purple
  const cLowerMid = new THREE.Color('#FF0055')  // Pink/Magenta
  const cBottom = new THREE.Color('#FFD700')    // Gold/Orange

  for (let i = 0; i < count; i++) {
    // Normalized height y from +1 to -1
    const y = 1 - (i / (count - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))

    const theta = (2 * Math.PI * i) / phi

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    positions[i * 3] = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius

    // Map normalized Y (-1 to +1 -> 0 to 1) to multi-stop color gradient
    const t = y * 0.5 + 0.5 // 1 at top pole, 0 at bottom pole

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

    // Slightly vary point sizes for natural depth variation
    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 0.02 + noiseFactor * 0.025
  }

  return { positions, colors, sizes }
}

export interface QuantumParticleSphereProps {
  pointCount?: number
  radius?: number
}

function QuantumParticleSphere({ pointCount = 30000, radius = 1.8 }: QuantumParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // 1. Allocate buffer geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, colors, sizes } = generateFibonacciSphere(pointCount, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius])

  // 2. Custom Shader Material for Gaussian Soft Particle Falloff
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSizeScale: { value: 1.0 },
      },
      vertexShader: `
        uniform float uSizeScale;
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          gl_PointSize = size * uSizeScale * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular point distance from center (0,0) to (1,1)
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Gaussian-like soft edge falloff
          float intensity = pow(1.0 - (dist * 2.0), 1.8);
          
          gl_FragColor = vec4(vColor, intensity * 0.95);
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
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001
    }
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
    />
  )
}

export default function QuantumParticleGlobe() {
  return (
    <div className="w-full h-full relative overflow-visible bg-black">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />

        <QuantumParticleSphere pointCount={30000} radius={1.8} />

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
