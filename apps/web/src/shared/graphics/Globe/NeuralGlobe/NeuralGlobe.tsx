import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import cameraSettings from '../Camera'
import Lights from '../Lights'

import { MicrophoneController, SpeechRecognitionController } from '../../../ai/AIManager'

import { neuralAnimation } from './NeuralAnimation'

import NeuralNodes from './NeuralNodes'
import NeuralConnections from './NeuralConnections'
import NeuralPackets from './NeuralPackets'

import EffectsController from './effects/EffectsController'

function NeuralController() {
  useFrame((_, delta) => {
    neuralAnimation.update(delta)
  })

  return null
}

export default function NeuralGlobe() {
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

        <MicrophoneController />

        <SpeechRecognitionController />

        <NeuralController />

        <group>
          <NeuralConnections />

          <NeuralNodes />

          <NeuralPackets />
        </group>

        <EffectsController />

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