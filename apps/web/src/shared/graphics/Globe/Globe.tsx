import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import cameraSettings from './Camera'
import Lights from './Lights'

import BackgroundParticles from './BackgroundParticles'
import ParticleField from './ParticleField'
import NetworkConnections from './NetworkConnections'
import FlowLines from './FlowLines'
import DataPackets from './DataPackets'

import ThinkingController from './ThinkingController'
import ListeningController from './ListeningController'

import { MicrophoneController } from '../../ai/AIManager'
import { nodeAnimation } from './NodeAnimation'

function NodeAnimationController() {
  useFrame((_, delta) => {
    nodeAnimation.update(delta)
  })

  return null
}

export default function Globe() {
  return (
    <div className="w-full h-full relative overflow-visible">
      <Canvas
        camera={cameraSettings}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Lights />

        <ThinkingController />

        <ListeningController />

        <MicrophoneController />

        <NodeAnimationController />

        <group>
          <BackgroundParticles />

          <NetworkConnections />

          <FlowLines />

          <ParticleField />

          <DataPackets />
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.035}
        />
      </Canvas>
    </div>
  )
}