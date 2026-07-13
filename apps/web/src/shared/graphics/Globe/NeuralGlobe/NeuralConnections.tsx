import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { neuralGraph } from './NeuralGraph'
import { neuralAnimation } from './NeuralAnimation'

const CURVE_HEIGHT = 0.03
// Each edge is a bezier curve sampled at 25 points.
// Each point is 3 floats (x, y, z).
const POINTS_PER_EDGE = 25
const FLOATS_PER_POINT = 3

export default function NeuralConnections() {
  const edgeCount = neuralGraph.edges.length

  // ─── Geometry allocated ONCE ───────────────────────────────────────────────
  // Buffer is sized for the maximum possible data (all edges × all points).
  // We write into the underlying Float32Array in-place every frame and set
  // needsUpdate = true — no allocations happen after mount.
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(
      edgeCount * POINTS_PER_EDGE * FLOATS_PER_POINT
    )
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, FLOATS_PER_POINT)
    )
    geo.setDrawRange(0, edgeCount * POINTS_PER_EDGE)
    return geo
  }, [edgeCount])

  // ─── Material allocated ONCE ───────────────────────────────────────────────
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#FFE38A'),
        transparent: true,
        opacity: 0.12,
      }),
    []
  )

  // ─── LineSegments object allocated ONCE ───────────────────────────────────
  // Wrapping in useMemo so <primitive object={...}> receives a stable reference
  // and never re-mounts the Three.js object on re-renders.
  const lineSegments = useMemo(
    () => new THREE.LineSegments(geometry, material),
    [geometry, material]
  )

  // ─── Reusable scratch objects — zero per-frame allocations ────────────────
  const scratchCurve = useRef(
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3()
    )
  )
  const scratchMid = useRef(new THREE.Vector3())
  const scratchPoint = useRef(new THREE.Vector3())

  const pointScratch = useRef<THREE.Vector3[]>(
    Array.from({ length: POINTS_PER_EDGE }, () => new THREE.Vector3())
  )

  // ─── Dispose on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  // ─── Per-frame update — zero allocations ──────────────────────────────────
  useFrame(() => {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array

    // Update material color/opacity from voice state
    const glow = 0.12 + neuralAnimation.voiceStrength * 0.55
    material.opacity = glow
    material.color.setRGB(
      1,
      0.88 + neuralAnimation.voiceStrength * 0.12,
      0.45 + neuralAnimation.voiceStrength * 0.25
    )

    neuralGraph.edges.forEach((edge, edgeIndex) => {
      const start = neuralGraph.nodes[edge.from].position
      const end = neuralGraph.nodes[edge.to].position

      // Compute bezier midpoint — reuse scratchMid, no `new`
      scratchMid.current.addVectors(start, end).multiplyScalar(0.5)
      scratchMid.current
        .normalize()
        .multiplyScalar(scratchMid.current.length() + CURVE_HEIGHT)

      // Update the pre-allocated curve control points in place
      scratchCurve.current.v0.copy(start)
      scratchCurve.current.v1.copy(scratchMid.current)
      scratchCurve.current.v2.copy(end)

      // Sample curve into pre-allocated Vector3 scratch array — no `new`
      for (let i = 0; i < POINTS_PER_EDGE; i++) {
        scratchCurve.current.getPoint(
          i / (POINTS_PER_EDGE - 1),
          scratchPoint.current
        )
        pointScratch.current[i].copy(scratchPoint.current)
      }

      // Write directly into the Float32Array — no geometry rebuild
      const offset = edgeIndex * POINTS_PER_EDGE * FLOATS_PER_POINT
      for (let i = 0; i < POINTS_PER_EDGE; i++) {
        const p = pointScratch.current[i]
        posArray[offset + i * FLOATS_PER_POINT + 0] = p.x
        posArray[offset + i * FLOATS_PER_POINT + 1] = p.y
        posArray[offset + i * FLOATS_PER_POINT + 2] = p.z
      }
    })

    // Single needsUpdate for the entire buffer — one GPU upload per frame total
    posAttr.needsUpdate = true
  })

  // primitive keeps the Three.js object identity stable across React renders
  return <primitive object={lineSegments} />
}