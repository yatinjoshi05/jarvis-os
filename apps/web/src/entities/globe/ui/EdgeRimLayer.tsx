import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'

interface EdgeRimLayerProps {
  pointCount?: number
  radius?: number
  state?: GlobeState
  config: GlobeConfig
}

export function EdgeRimLayer({
  pointCount = 10000,
  radius = 1.8,
  state = 'idle',
  config,
}: EdgeRimLayerProps) {
  const rimMaterial = useMemo(() => {
    const palette = config.colors[state] || config.colors.idle
    const cRim = new THREE.Color(palette.rimGlow)

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uRimColor: { value: cRim },
      },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(uTime * 0.5 + position.y * 3.0) * 0.025;
          pos.y += cos(uTime * 0.5 + position.x * 3.0) * 0.025;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * ${config.bloom.rimPointSize.toFixed(1)} * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 1.6);
          gl_FragColor = vec4(vColor * 1.6, intensity * 0.98);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [state, config])

  const rimGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const sizes = new Float32Array(pointCount)

    const palette = config.colors[state] || config.colors.idle
    const cCyan = new THREE.Color(palette.top)
    const cMagenta = new THREE.Color(palette.lowerMid)
    const cGold = new THREE.Color(palette.orange)

    for (let i = 0; i < pointCount; i++) {
      // Concentrated on grazing angle silhouette ring
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() - 0.5) * 0.18)

      const x = Math.sin(phi) * Math.cos(theta) * radius
      const y = Math.cos(phi) * radius
      const z = Math.sin(phi) * Math.sin(theta) * radius

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      const normY = (y / radius) * 0.5 + 0.5
      const col = new THREE.Color()
      if (normY > 0.6) {
        col.copy(cCyan).lerp(cMagenta, (1.0 - normY) * 2.5)
      } else {
        col.copy(cMagenta).lerp(cGold, (0.6 - normY) * 1.6)
      }

      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b

      sizes[i] = 1.8 + Math.random() * 1.8
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius, state, config])

  return <points geometry={rimGeometry} material={rimMaterial} />
}
