import { useEffect } from 'react'
import { useAssistantState } from '../../ai/AIManager'
import { aiEngine } from './AIEngine'

export default function ThinkingController() {
  const { thinking } = useAssistantState()

  useEffect(() => {
    aiEngine.thinking = thinking
  }, [thinking])

  return null
}