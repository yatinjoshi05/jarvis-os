import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { microphoneManager } from './MicrophoneManager'

export default function MicrophoneController() {
  useEffect(() => {
    // Request permission if not already active
    if (!microphoneManager.hasActiveStream) {
      microphoneManager.requestPermission().catch(() => {})
    }
  }, [])

  useFrame(() => {
    microphoneManager.update()
  })

  return null
}