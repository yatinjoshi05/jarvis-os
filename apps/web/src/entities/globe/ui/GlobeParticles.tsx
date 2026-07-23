import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'
import { useSurfaceMaterial } from './GlobeMaterials'

interface GlobeParticlesProps {
  pointCount?: number
  radius?: number
  state?: GlobeState
  config?: GlobeConfig
}

export function GlobeParticles({
  pointCount = 80000,
  radius = 1.8,
  state = 'idle',
  config = DEFAULT_GLOBE_CONFIG,
}: GlobeParticlesProps) {
  const surfaceMaterial = useSurfaceMaterial(state, config)

  const surfaceGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const sizes = new Float32Array(pointCount)

    const phi = (1 + Math.sqrt(5)) / 2
    const palette = config.colors[state] || config.colors.idle

    const cTop = new THREE.Color(palette.top)
    const cUpperMid = new THREE.Color(palette.upperMid)
    const cMid = new THREE.Color(palette.mid)
    const cLowerMid = new THREE.Color(palette.lowerMid)
    const cRed = new THREE.Color(palette.red)
    const cBottom = new THREE.Color(palette.bottom)
    const cOrange = new THREE.Color(palette.orange)

    for (let i = 0; i < pointCount; i++) {
      const y = 1 - (i / Math.max(1, pointCount - 1)) * 2
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = (2 * Math.PI * i) / phi

      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      positions[i * 3] = x * radius
      positions[i * 3 + 1] = y * radius
      positions[i * 3 + 2] = z * radius

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
      sizes[i] = 1.6 + noiseFactor * 1.5
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [pointCount, radius, state, config])

  return <points geometry={surfaceGeometry} material={surfaceMaterial} />
}
