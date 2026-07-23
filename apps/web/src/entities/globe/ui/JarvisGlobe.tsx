import { useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Minimal Phase 1 Core Point-Cloud Sphere
 * Golden-angle Fibonacci distribution with solid cyan color and pixel-attenuated point sizing.
 */
function generateFibonacciSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const phi = (1 + Math.sqrt(5)) / 2 // Golden ratio

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = (2 * Math.PI * i) / phi

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    positions[i * 3] = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius

    // Base point size in pixel units (range 2.5px to 4.5px)
    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 2.5 + noiseFactor * 2.0
  }

  return { positions, sizes }
}

export interface JarvisGlobeProps {
  pointCount?: number
  radius?: number
}

function CorePointSphere({ pointCount = 40000, radius = 1.8 }: JarvisGlobeProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // 1. BufferGeometry with positions and sizes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { positions, sizes } = generateFibonacciSphere(pointCount, radius)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Phase 1 Diagnostic Logging
    let minSize = Infinity, maxSize = -Infinity
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] < minSize) minSize = sizes[i]
      if (sizes[i] > maxSize) maxSize = sizes[i]
    }

    // At camera z=6.0, distance ranges from 4.2 (front) to 7.8 (back)
    const minComputedPointSize = (minSize * (6.0 / 7.8)).toFixed(2)
    const maxComputedPointSize = (maxSize * (6.0 / 4.2)).toFixed(2)

    console.log('[Phase 1 Globe Diagnostic]', {
      pointCount,
      radius,
      rawSizeRange: [minSize.toFixed(2) + 'px', maxSize.toFixed(2) + 'px'],
      computedScreenPointSizeRange: [minComputedPointSize + 'px', maxComputedPointSize + 'px'],
      cameraPosition: [0, 0, 6.0],
      cameraFov: 50,
      nearFar: [0.1, 1000],
    })

    return geo
  }, [pointCount, radius])

  // 2. Custom ShaderMaterial with pixel-attenuated point sizing and solid Cyan color
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#00DFFF') },
      },
      vertexShader: `
        uniform vec3 uColor;
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = uColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Perspective attenuation: at camera z=6.0, size attribute equals screen pixels
          gl_PointSize = size * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          // Circular particle shape with soft gaussian falloff
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 1.5);
          gl_FragColor = vec4(vColor, intensity * 0.95);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return <points ref={pointsRef} geometry={geometry} material={material} />
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
