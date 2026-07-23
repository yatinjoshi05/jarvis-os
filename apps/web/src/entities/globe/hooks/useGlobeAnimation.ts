import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GlobeState, GlobeConfig } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'

export interface UseGlobeAnimationOptions {
  state?: GlobeState
  audioAmplitude?: number
  config?: GlobeConfig
  groupRef: React.RefObject<THREE.Group>
  materialRef: React.RefObject<THREE.ShaderMaterial>
}

export function useGlobeAnimation({
  state = 'idle',
  audioAmplitude = 0,
  config = DEFAULT_GLOBE_CONFIG,
  groupRef,
  materialRef,
}: UseGlobeAnimationOptions) {
  const smoothedAudioRef = useRef(0)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta

    // Smooth audio amplitude lerp
    smoothedAudioRef.current = THREE.MathUtils.lerp(
      smoothedAudioRef.current,
      audioAmplitude,
      0.15
    )

    // Calculate rotation speed based on AI state
    const isThinking = state === 'thinking'
    const isError = state === 'error'
    const isSpeaking = state === 'speaking'

    const rotSpeedY = isThinking
      ? config.motion.thinkingRotationSpeed
      : isError
      ? config.motion.errorRotationSpeed
      : config.motion.baseRotationSpeedY

    const rotSpeedX = Math.sin(timeRef.current * 0.5) * config.motion.baseRotationSpeedX * 0.05

    // Scale breathing oscillation & voice amplitude reaction
    const breathingOffset = Math.sin(timeRef.current * config.motion.breathingSpeed) * config.motion.breathingAmplitude
    const audioScaleOffset = isSpeaking ? smoothedAudioRef.current * 0.14 : 0
    const targetScale = (isThinking ? 1.08 : 1.0) + breathingOffset + audioScaleOffset

    if (groupRef.current) {
      groupRef.current.rotation.y += rotSpeedY
      groupRef.current.rotation.x = rotSpeedX
      const currentScale = groupRef.current.scale.x
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08)
      groupRef.current.scale.set(newScale, newScale, newScale)
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current
      materialRef.current.uniforms.uVoiceLevel.value = smoothedAudioRef.current
    }
  })

  return {
    timeRef,
    smoothedAudioRef,
  }
}
