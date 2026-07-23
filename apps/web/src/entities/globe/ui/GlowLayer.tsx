import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'

interface GlowLayerProps {
  radius?: number
  state?: GlobeState
  config: GlobeConfig
}

export function GlowLayer({ radius = 1.8, state = 'idle', config }: GlowLayerProps) {
  const glowMaterial = useMemo(() => {
    const palette = config.colors[state] || config.colors.idle
    const cGlow = new THREE.Color(palette.rimGlow)

    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: cGlow },
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
          float intensity = pow(0.7 - dot(normal, viewDir), 2.5);
          gl_FragColor = vec4(uColor * 1.5, intensity * 0.45);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  }, [state, config])

  return (
    <mesh material={glowMaterial}>
      <sphereGeometry args={[radius * 1.08, 32, 32]} />
    </mesh>
  )
}
