import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

import { microphoneManager } from './MicrophoneManager'
import { aiEngine } from '../graphics/Globe/AIEngine'

export default function MicrophoneController() {
  useEffect(() => {
    microphoneManager.requestPermission()

    return () => {
      microphoneManager.stop()
    }
  }, [])

  useFrame(() => {
    microphoneManager.update()

    aiEngine.voiceLevel = microphoneManager.voiceLevel

    aiEngine.listening =
      microphoneManager.voiceLevel > 0.02
  })

  return null
}