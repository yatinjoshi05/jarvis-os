export type GlobeState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'success'
  | 'warning'
  | 'error'

export type GlobeQuality = 'ultra' | 'high' | 'medium' | 'low'

export interface QualityProfile {
  surfaceParticleCount: number
  edgeParticleCount: number
  floatingParticleCount: number
  microDustCount: number
}

export interface StateColorPalette {
  top: string
  upperMid: string
  mid: string
  lowerMid: string
  red: string
  bottom: string
  orange: string
  interiorDark: string
}

export interface GlobeConfig {
  quality: Record<GlobeQuality, QualityProfile>
  radius: number
  colors: Record<GlobeState, StateColorPalette>
  noise: {
    frequency: number
    amplitude: number
    speed: number
    octaves: number
    rimDisplacement: number
    bottomScatter: number
  }
  motion: {
    baseRotationSpeed: number
    thinkingRotationSpeed: number
    errorRotationSpeed: number
    breathingAmplitude: number
    breathingSpeed: number
    audioVibrationMultiplier: number
  }
  lighting: {
    ambientIntensity: number
    directionalIntensity: number
    rimIntensity: number
    pointLightIntensity: number
  }
  bloom: {
    emissiveLuminance: number
    rimPower: number
    corePointSize: number
    rimPointSize: number
    starSize: number
  }
  camera: {
    position: [number, number, number]
    fov: number
    near: number
    far: number
  }
}

export interface QuantumGlobeProps {
  state?: GlobeState
  quality?: GlobeQuality
  autoRotate?: boolean
  interactive?: boolean
  className?: string
}

export interface QuantumGlobeRef {
  setState: (state: GlobeState) => void
  setAudioAmplitude: (value: number) => void
  pause: () => void
  resume: () => void
  setQuality: (quality: GlobeQuality) => void
}
