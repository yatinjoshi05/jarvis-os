import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'

interface FloatingOrbitLayerProps {
  pointCount?: number
  radius?: number
  state?: GlobeState
  config: GlobeConfig
}

export function FloatingOrbitLayer({
  pointCount = 7000,
  radius = 1.8,
  state = 'idle',
  config,
}: FloatingOrbitLayerProps) {
  const orbitMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(uTime * 0.4 + position.y) * 0.04;
          pos.y += cos(uTime * 0.35 + position.x) * 0.04;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * ${config.bloom.floatingPointSize.toFixed(1)} * (6.0 / -mvPosition.z);
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
  }, [config])

  const orbitGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const sizes = new Float32Array(pointCount)

    const palette = config.colors[state] || config.colors.idle
    const cCyan = new THREE.Color(palette.top)
    const cMagenta = new THREE.Color(palette.lowerMid)
    const cGold = new THREE.Color(palette.orange)

    for (let i = 0; i < pointCount; i++) {
      let x: number, y: number, z: number, col: THREE.Color

      if (i < pointCount * 0.35) {
        x = -radius * (1.04 + Math.random() * 0.35)
        y = radius * (0.65 + Math.random() * 0.42)
        z = (Math.random() - 0.5) * 0.7
        col = cCyan
      } else if (i < pointCount * 0.65) {
        x = radius * (1.04 + Math.random() * 0.32)
        y = radius * (0.55 + Math.random() * 0.45)
        z = (Math.random() - 0.5) * 0.7
        col = cMagenta
      } else {
        x = (Math.random() - 0.5) * radius * 1.6
        y = -radius * (1.04 + Math.random() * 0.38)
        z = (Math.random() - 0.5) * 0.7
        col = cGold
      }

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b

      sizes[i] = 1.4 + Math.random() * 1.4
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius, state, config])

  return <points geometry={orbitGeometry} material={orbitMaterial} />
}
