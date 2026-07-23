import { GlobeConfig } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'

interface GlobeLightsProps {
  config?: GlobeConfig
}

export function GlobeLights({ config = DEFAULT_GLOBE_CONFIG }: GlobeLightsProps) {
  const { lighting } = config

  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={lighting.directionalIntensity}
        castShadow={false}
      />
      <directionalLight
        position={[-5, -5, -5]}
        intensity={lighting.rimIntensity}
        color="#7FE8FF"
      />
      <pointLight
        position={[0, 0, 3]}
        intensity={lighting.pointLightIntensity}
        color="#FFFFFF"
        distance={10}
      />
    </>
  )
}
