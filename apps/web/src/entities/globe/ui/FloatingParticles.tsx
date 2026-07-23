import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'

interface FloatingParticlesProps {
  floatingCount?: number
  microDustCount?: number
  radius?: number
  state?: GlobeState
  config?: GlobeConfig
}

export function FloatingParticles({
  floatingCount = 3000,
  microDustCount = 2000,
  radius = 1.8,
  state = 'idle',
  config = DEFAULT_GLOBE_CONFIG,
}: FloatingParticlesProps) {
  const floatingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(uTime * 0.5 + position.y) * 0.04;
          pos.y += cos(uTime * 0.4 + position.x) * 0.04;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (6.0 / -mvPosition.z);
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
  }, [])

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - (dist * 2.0), 1.6);
          gl_FragColor = vec4(vColor * 2.5, intensity * 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [])

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

          gl_PointSize = size * (6.0 / -mvPosition.z);
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
  }, [])

  const floatingGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(floatingCount * 3)
    const colors = new Float32Array(floatingCount * 3)
    const sizes = new Float32Array(floatingCount)

    const palette = config.colors[state] || config.colors.idle
    const cCyan = new THREE.Color(palette.top)
    const cMagenta = new THREE.Color(palette.lowerMid)
    const cGold = new THREE.Color(palette.orange)

    for (let i = 0; i < floatingCount; i++) {
      let x: number, y: number, z: number, col: THREE.Color

      if (i < floatingCount * 0.35) {
        x = -radius * (1.04 + Math.random() * 0.35)
        y = radius * (0.65 + Math.random() * 0.42)
        z = (Math.random() - 0.5) * 0.7
        col = cCyan
      } else if (i < floatingCount * 0.65) {
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

      sizes[i] = 1.8 + Math.random() * 1.8
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [floatingCount, radius, state, config])

  const starGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const starCount = 12
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    const whiteColor = new THREE.Color('#FFFFFF')

    for (let i = 0; i < starCount; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = 0.3 + Math.random() * (radius * 0.7 - 0.3)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

      colors[i * 3] = whiteColor.r
      colors[i * 3 + 1] = whiteColor.g
      colors[i * 3 + 2] = whiteColor.b

      sizes[i] = config.bloom.starSize + Math.random() * 2.5
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [radius, config])

  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(microDustCount * 3)
    const colors = new Float32Array(microDustCount * 3)
    const sizes = new Float32Array(microDustCount)

    for (let i = 0; i < microDustCount; i++) {
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

      sizes[i] = 1.0 + Math.random() * 1.0
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [microDustCount])

  return (
    <>
      <points geometry={floatingGeometry} material={floatingMaterial} />
      <points geometry={starGeometry} material={starMaterial} />
      <points geometry={dustGeometry} material={dustMaterial} />
    </>
  )
}
