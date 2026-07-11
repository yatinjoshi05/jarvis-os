import { useEffect } from 'react'
import { useAssistantState } from '../../ai/AIManager'
import { aiEngine } from './AIEngine'

export default function ListeningController() {
  const { listening } = useAssistantState()

  useEffect(() => {
    aiEngine.listening = listening
  }, [listening])

  return null
}