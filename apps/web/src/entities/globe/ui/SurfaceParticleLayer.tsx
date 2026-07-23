import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'
import { GLSL_SIMPLEX_NOISE_CHUNK } from '../utils/noise'

interface SurfaceParticleLayerProps {
  pointCount?: number
  radius?: number
  state?: GlobeState
  config: GlobeConfig
}

export function SurfaceParticleLayer({
  pointCount = 80000,
  radius = 1.8,
  state = 'idle',
  config,
}: SurfaceParticleLayerProps) {
  const surfaceMaterial = useMemo(() => {
    const palette = config.colors[state] || config.colors.idle
    const cInterior = new THREE.Color(palette.interiorDark)

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uVoiceLevel: { value: 0.0 },
        uInterior: { value: cInterior },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uVoiceLevel;
        attribute float size;
        varying vec3 vColor;
        varying float vRimWeight;
        varying float vDepth;

        ${GLSL_SIMPLEX_NOISE_CHUNK}

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float rimFactor = 1.0 - abs(dot(viewNormal, viewDir));

          vRimWeight = pow(rimFactor, ${config.bloom.rimPower.toFixed(1)});

          // Depth calculation: front particles bright, back particles dim
          vDepth = smoothstep(-${(radius * 3.5).toFixed(1)}, -${(radius * 1.5).toFixed(1)}, mvPosition.z);

          // Organic Simplex & Curl Noise displacement
          float wavyNoise = snoise(position * ${config.noise.frequency.toFixed(1)} + vec3(0.0, uTime * ${config.noise.speed.toFixed(2)}, 0.0)) * ${config.noise.amplitude.toFixed(2)} * vRimWeight;
          
          float bottomFrac = smoothstep(-0.35, -0.95, position.y);
          float bottomScatter = snoise(position * 3.5 + vec3(uTime * 0.5, 0.0, 0.0)) * ${config.noise.bottomScatter.toFixed(2)} * bottomFrac * vRimWeight;

          vec3 displacedPos = position + normalVec * (wavyNoise + bottomScatter);
          vec4 finalMvPos = modelViewMatrix * vec4(displacedPos, 1.0);

          float dynamicSize = mix(${config.bloom.corePointSize.toFixed(1)}, ${config.bloom.rimPointSize.toFixed(1)}, vRimWeight) * (1.0 + uVoiceLevel * 0.25);
          gl_PointSize = dynamicSize * (6.0 / -finalMvPos.z);
          gl_Position = projectionMatrix * finalMvPos;
        }
      `,
      fragmentShader: `
        uniform float uVoiceLevel;
        uniform vec3 uInterior;
        varying vec3 vColor;
        varying float vRimWeight;
        varying float vDepth;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 2.2);
          vec3 finalColor = mix(uInterior, vColor * ${config.bloom.emissiveLuminance.toFixed(2)}, vRimWeight);

          // Depth fading: front particles full opacity, back particles dim
          float depthFactor = mix(0.25, 1.0, vDepth);
          float baseAlpha = mix(0.08, 0.96, vRimWeight) * depthFactor * (1.0 + uVoiceLevel * 0.3);

          gl_FragColor = vec4(finalColor, intensity * baseAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [state, config])

  const surfaceGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const sizes = new Float32Array(pointCount)

    const palette = config.colors[state] || config.colors.idle

    const cTop = new THREE.Color(palette.top)
    const cUpperMid = new THREE.Color(palette.upperMid)
    const cMid = new THREE.Color(palette.mid)
    const cLowerMid = new THREE.Color(palette.lowerMid)
    const cRed = new THREE.Color(palette.red)
    const cBottom = new THREE.Color(palette.bottom)
    const cOrange = new THREE.Color(palette.orange)

    const phi = (1 + Math.sqrt(5)) / 2

    for (let i = 0; i < pointCount; i++) {
      // Golden Spiral Spherical coordinates (Latitude, Longitude, Radius)
      const y = 1 - (i / Math.max(1, pointCount - 1)) * 2
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = (2 * Math.PI * i) / phi

      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      positions[i * 3] = x * radius
      positions[i * 3 + 1] = y * radius
      positions[i * 3 + 2] = z * radius

      // Smooth vertical procedural gradient
      const t = y * 0.5 + 0.5 // 1.0 at top, 0.0 at bottom

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
      const noiseFactor = seed - Math.floor(seed)
      sizes[i] = 1.4 + noiseFactor * 1.5
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius, state, config])

  return <points geometry={surfaceGeometry} material={surfaceMaterial} />
}
