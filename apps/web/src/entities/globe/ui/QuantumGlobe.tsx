import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GlobeState, GlobeQuality, QuantumGlobeProps, QuantumGlobeRef, GlobeConfig, LayerToggleConfig } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'
import { CoreLayer } from './CoreLayer'
import { SurfaceParticleLayer } from './SurfaceParticleLayer'
import { EdgeRimLayer } from './EdgeRimLayer'
import { FloatingOrbitLayer } from './FloatingOrbitLayer'
import { DustLayer } from './DustLayer'
import { GlowLayer } from './GlowLayer'
import { LightingLayer } from './LightingLayer'
import { useGlobeAnimation } from '../hooks/useGlobeAnimation'
import { globeStateController } from '../model/GlobeStateController'
import { voiceStateMachine } from '../../../shared/ai/VoiceStateMachine'
import { useAudioAnalyser } from '../../../shared/audio/useAudioAnalyser'

interface InnerGlobeContentProps {
  state: GlobeState
  quality: GlobeQuality
  audioAmplitude: number
  config: GlobeConfig
}

function InnerGlobeContent({ state, quality, audioAmplitude, config }: InnerGlobeContentProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const dummyShaderRef = useRef<THREE.ShaderMaterial>(null!)

  const profile = config.quality[quality] || config.quality.ultra
  const layers = config.layers

  useGlobeAnimation({
    state,
    audioAmplitude,
    config,
    groupRef,
    materialRef: dummyShaderRef,
  })

  return (
    <group ref={groupRef}>
      {/* Layer 7: Lighting Layer */}
      {layers.lightingEnabled && <LightingLayer config={config} />}

      {/* Layer 1: Core Layer */}
      {layers.coreEnabled && <CoreLayer radius={config.radius} state={state} config={config} />}

      {/* Layer 6: Glow Layer */}
      {layers.glowEnabled && <GlowLayer radius={config.radius} state={state} config={config} />}

      {/* Layer 2: Surface Particle Layer (80,000 particles) */}
      {layers.surfaceEnabled && (
        <SurfaceParticleLayer
          pointCount={profile.surfaceParticles}
          radius={config.radius}
          state={state}
          config={config}
        />
      )}

      {/* Layer 3: Edge Rim Layer (10,000 particles) */}
      {layers.edgeRimEnabled && (
        <EdgeRimLayer
          pointCount={profile.edgeParticles}
          radius={config.radius}
          state={state}
          config={config}
        />
      )}

      {/* Layer 4: Floating Orbit Particle Layer (7,000 particles) */}
      {layers.floatingOrbitEnabled && (
        <FloatingOrbitLayer
          pointCount={profile.floatingParticles}
          radius={config.radius}
          state={state}
          config={config}
        />
      )}

      {/* Layer 5: Dust Layer (3,000 particles) */}
      {layers.dustEnabled && (
        <DustLayer pointCount={profile.dustParticles} config={config} />
      )}
    </group>
  )
}

export const QuantumGlobe = forwardRef<QuantumGlobeRef, QuantumGlobeProps>(
  (
    {
      state: initialPropsState,
      quality: initialQuality = 'ultra',
      autoRotate = true,
      interactive = true,
      className = 'w-full h-full relative overflow-visible bg-black',
      configOverride,
    },
    ref
  ) => {
    const activeConfig = useMemo(() => {
      if (!configOverride) return DEFAULT_GLOBE_CONFIG
      return {
        ...DEFAULT_GLOBE_CONFIG,
        ...configOverride,
        layers: { ...DEFAULT_GLOBE_CONFIG.layers, ...configOverride.layers },
        noise: { ...DEFAULT_GLOBE_CONFIG.noise, ...configOverride.noise },
        motion: { ...DEFAULT_GLOBE_CONFIG.motion, ...configOverride.motion },
        lighting: { ...DEFAULT_GLOBE_CONFIG.lighting, ...configOverride.lighting },
        bloom: { ...DEFAULT_GLOBE_CONFIG.bloom, ...configOverride.bloom },
        camera: { ...DEFAULT_GLOBE_CONFIG.camera, ...configOverride.camera },
      }
    }, [configOverride])

    const [currentState, setCurrentState] = useState<GlobeState>(
      initialPropsState || (voiceStateMachine.state.toLowerCase() as GlobeState) || 'idle'
    )
    const [currentQuality, setCurrentQuality] = useState<GlobeQuality>(initialQuality)
    const [layerToggles, setLayerToggles] = useState<LayerToggleConfig>(activeConfig.layers)
    const [audioAmplitude, setAudioAmplitudeState] = useState<number>(0)
    const [isPaused, setIsPaused] = useState<boolean>(false)

    const { voiceLevel } = useAudioAnalyser()

    // Sync with real VoiceStateMachine
    useEffect(() => {
      const unsubscribe = voiceStateMachine.subscribe((vState) => {
        const mappedState = (vState.toLowerCase() as GlobeState) || 'idle'
        setCurrentState(mappedState)
        globeStateController.setState(mappedState)
      })
      return unsubscribe
    }, [])

    // Sync with live audio level
    useEffect(() => {
      setAudioAmplitudeState(voiceLevel)
    }, [voiceLevel])

    // Expose Public API Methods via ref
    useImperativeHandle(
      ref,
      () => ({
        setState: (newState: GlobeState) => {
          setCurrentState(newState)
          globeStateController.setState(newState)
        },
        setAudioAmplitude: (val: number) => {
          setAudioAmplitudeState(val)
          globeStateController.setAudioAmplitude(val)
        },
        pause: () => {
          setIsPaused(true)
          globeStateController.pause()
        },
        resume: () => {
          setIsPaused(false)
          globeStateController.resume()
        },
        setQuality: (q: GlobeQuality) => {
          setCurrentQuality(q)
          globeStateController.setQuality(q)
        },
        toggleLayer: (layerName: keyof LayerToggleConfig, enabled: boolean) => {
          setLayerToggles((prev) => ({ ...prev, [layerName]: enabled }))
        },
      }),
      []
    )

    const mergedConfig = useMemo(
      () => ({
        ...activeConfig,
        layers: layerToggles,
      }),
      [activeConfig, layerToggles]
    )

    if (isPaused) {
      return <div className={className} />
    }

    return (
      <div className={className}>
        <Canvas
          camera={{
            position: activeConfig.camera.position,
            fov: activeConfig.camera.fov,
            near: activeConfig.camera.near,
            far: activeConfig.camera.far,
          }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <InnerGlobeContent
            state={currentState}
            quality={currentQuality}
            audioAmplitude={audioAmplitude}
            config={mergedConfig}
          />

          {interactive && (
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              autoRotate={autoRotate}
              autoRotateSpeed={activeConfig.camera.autoRotateSpeed}
            />
          )}
        </Canvas>
      </div>
    )
  }
)

QuantumGlobe.displayName = 'QuantumGlobe'
export default QuantumGlobe
