import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GlobeState, GlobeQuality, QuantumGlobeProps, QuantumGlobeRef } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'
import { GlobeParticles } from './GlobeParticles'
import { EdgeParticles } from './EdgeParticles'
import { FloatingParticles } from './FloatingParticles'
import { GlobeLights } from './GlobeLights'
import { useGlobeAnimation } from '../hooks/useGlobeAnimation'
import { globeStateController } from '../model/GlobeStateController'
import { voiceStateMachine } from '../../../shared/ai/VoiceStateMachine'
import { useAudioAnalyser } from '../../../shared/audio/useAudioAnalyser'

interface InnerGlobeContentProps {
  state: GlobeState
  quality: GlobeQuality
  audioAmplitude: number
}

function InnerGlobeContent({ state, quality, audioAmplitude }: InnerGlobeContentProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const dummyShaderRef = useRef<THREE.ShaderMaterial>(null!)

  const profile = DEFAULT_GLOBE_CONFIG.quality[quality] || DEFAULT_GLOBE_CONFIG.quality.ultra

  useGlobeAnimation({
    state,
    audioAmplitude,
    config: DEFAULT_GLOBE_CONFIG,
    groupRef,
    materialRef: dummyShaderRef,
  })

  return (
    <group ref={groupRef}>
      <GlobeLights config={DEFAULT_GLOBE_CONFIG} />
      <GlobeParticles
        pointCount={profile.surfaceParticleCount}
        radius={DEFAULT_GLOBE_CONFIG.radius}
        state={state}
        config={DEFAULT_GLOBE_CONFIG}
      />
      <EdgeParticles
        pointCount={profile.edgeParticleCount}
        radius={DEFAULT_GLOBE_CONFIG.radius}
        state={state}
        config={DEFAULT_GLOBE_CONFIG}
      />
      <FloatingParticles
        floatingCount={profile.floatingParticleCount}
        microDustCount={profile.microDustCount}
        radius={DEFAULT_GLOBE_CONFIG.radius}
        state={state}
        config={DEFAULT_GLOBE_CONFIG}
      />
    </group>
  )
}

export const QuantumGlobe = forwardRef<QuantumGlobeRef, QuantumGlobeProps>(
  (
    {
      state: initialPropsState,
      quality: initialQuality = 'ultra',
      autoRotate = false,
      interactive = true,
      className = 'w-full h-full relative overflow-visible bg-black',
    },
    ref
  ) => {
    const [currentState, setCurrentState] = useState<GlobeState>(
      initialPropsState || (voiceStateMachine.state.toLowerCase() as GlobeState) || 'idle'
    )
    const [currentQuality, setCurrentQuality] = useState<GlobeQuality>(initialQuality)
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
      }),
      []
    )

    if (isPaused) {
      return <div className={className} />
    }

    return (
      <div className={className}>
        <Canvas
          camera={{
            position: DEFAULT_GLOBE_CONFIG.camera.position,
            fov: DEFAULT_GLOBE_CONFIG.camera.fov,
            near: DEFAULT_GLOBE_CONFIG.camera.near,
            far: DEFAULT_GLOBE_CONFIG.camera.far,
          }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <InnerGlobeContent
            state={currentState}
            quality={currentQuality}
            audioAmplitude={audioAmplitude}
          />

          {interactive && (
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              autoRotate={autoRotate}
              autoRotateSpeed={0.8}
            />
          )}
        </Canvas>
      </div>
    )
  }
)

QuantumGlobe.displayName = 'QuantumGlobe'
export default QuantumGlobe
