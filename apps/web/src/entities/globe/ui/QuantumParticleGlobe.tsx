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

    // Vary point sizes slightly for depth variation
    const seed = Math.sin(i * 12.9898 + y * 78.233) * 43758.5453
    const noiseFactor = (seed - Math.floor(seed))
    sizes[i] = 0.018 + noiseFactor * 0.024
  }

  return { positions, colors, sizes }
}

export interface QuantumParticleSphereProps {
  pointCount?: number
  radius?: number
  noiseStrength?: number
  noiseSpeed?: number
  noiseScale?: number
  rimBoost?: number
}

function QuantumParticleSphere({
  pointCount = 35000,
  radius = 1.8,
  noiseStrength = 0.06,
  noiseSpeed = 0.5,
  noiseScale = 1.2,
  rimBoost = 1.8,
}: QuantumParticleSphereProps) {
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

  // 2. Custom Shader Material with 3D Simplex Noise + Rim Energy Boost
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uSizeScale: { value: 1.0 },
        uNoiseStrength: { value: noiseStrength },
        uNoiseSpeed: { value: noiseSpeed },
        uNoiseScale: { value: noiseScale },
        uRimBoost: { value: rimBoost },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSizeScale;
        uniform float uNoiseStrength;
        uniform float uNoiseSpeed;
        uniform float uNoiseScale;
        uniform float uRimBoost;

        attribute float size;
        varying vec3 vColor;
        varying float vRim;

        // GLSL Simplex 3D Noise Implementation
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
          
          // 3D Simplex surface noise displacement along normal
          float noiseVal = snoise(position * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, 0.0));
          vec3 displacedPos = position + normalVec * (noiseVal * uNoiseStrength);

          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);

          // View-space normal dot product for rim calculation
          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float ndotv = abs(dot(viewNormal, viewDir));
          
          // Rim factor is high near silhouette edge (1.0 - ndotv)
          vRim = pow(1.0 - ndotv, 2.2);

          // Boost point size at the rim edge
          float sizeFactor = 1.0 + vRim * uRimBoost;
          
          gl_PointSize = size * uSizeScale * sizeFactor * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vRim;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Smooth gaussian circle falloff
          float intensity = pow(1.0 - (dist * 2.0), 1.8);
          
          // Edge rim boost increases opacity and glow
          float rimLuminance = 1.0 + vRim * 1.5;
          
          gl_FragColor = vec4(vColor * rimLuminance, intensity * 0.95);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [noiseStrength, noiseSpeed, noiseScale, rimBoost])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    if (material) {
      material.uniforms.uTime.value += delta
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0012
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

        <QuantumParticleSphere
          pointCount={35000}
          radius={1.8}
          noiseStrength={0.06}
          noiseSpeed={0.5}
          noiseScale={1.2}
          rimBoost={1.8}
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
