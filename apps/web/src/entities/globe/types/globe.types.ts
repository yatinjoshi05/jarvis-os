export type GlobeState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'success'
  | 'warning'
  | 'error'

export type GlobeQuality = 'ultra' | 'high' | 'medium' | 'low'

export interface LayerToggleConfig {
  coreEnabled: boolean
  surfaceEnabled: boolean
  edgeRimEnabled: boolean
  floatingOrbitEnabled: boolean
  dustEnabled: boolean
  glowEnabled: boolean
  lightingEnabled: boolean
  postProcessingEnabled: boolean
  audioReactiveEnabled: boolean
  aiStateEnabled: boolean
}

export interface QualityProfile {
  totalParticles: number
  surfaceParticles: number // 80%
  edgeParticles: number    // 10%
  floatingParticles: number// 7%
  dustParticles: number    // 3%
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
  rimGlow: string
}

export interface GlobeConfig {
  layers: LayerToggleConfig
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
    curlFrequency: number
  }
  motion: {
    baseRotationSpeedY: number
    baseRotationSpeedX: number
    thinkingRotationSpeed: number
    errorRotationSpeed: number
    breathingAmplitude: number
    breathingSpeed: number
    audioVibrationMultiplier: number
    microVibrationFrequency: number
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
    floatingPointSize: number
    dustPointSize: number
    starSize: number
    depthFadingFactor: number
  }
  camera: {
    position: [number, number, number]
    lookAt: [number, number, number]
    fov: number
    near: number
    far: number
    autoRotate: boolean
    autoRotateSpeed: number
  }
}

export interface QuantumGlobeProps {
  state?: GlobeState
  quality?: GlobeQuality
  autoRotate?: boolean
  interactive?: boolean
  className?: string
  configOverride?: Partial<GlobeConfig>
}

export interface QuantumGlobeRef {
  setState: (state: GlobeState) => void
  setAudioAmplitude: (value: number) => void
  pause: () => void
  resume: () => void
  setQuality: (quality: GlobeQuality) => void
  toggleLayer: (layerName: keyof LayerToggleConfig, enabled: boolean) => void
}
