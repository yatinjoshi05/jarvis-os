import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeConfig } from '../types/globe.types'

interface DustLayerProps {
  pointCount?: number
  config: GlobeConfig
}

export function DustLayer({ pointCount = 3000, config }: DustLayerProps) {
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

          gl_PointSize = size * ${config.bloom.dustPointSize.toFixed(1)} * (6.0 / -mvPosition.z);
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
  }, [config])

  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const sizes = new Float32Array(pointCount)

    for (let i = 0; i < pointCount; i++) {
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

      sizes[i] = 1.0 + Math.random() * 0.8
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount])

  return <points geometry={dustGeometry} material={dustMaterial} />
}
