import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'

interface CoreLayerProps {
  radius?: number
  state?: GlobeState
  config: GlobeConfig
}

export function CoreLayer({ radius = 1.8, state = 'idle', config }: CoreLayerProps) {
  const coreMaterial = useMemo(() => {
    const palette = config.colors[state] || config.colors.idle
    const cCore = new THREE.Color(palette.mid)

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: cCore },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float intensity = pow(0.6 - dot(normal, viewDir), 2.0);
          gl_FragColor = vec4(uColor * 0.8, intensity * 0.25);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  }, [state, config])

  return (
    <mesh material={coreMaterial}>
      <sphereGeometry args={[radius * 0.72, 32, 32]} />
    </mesh>
  )
}
