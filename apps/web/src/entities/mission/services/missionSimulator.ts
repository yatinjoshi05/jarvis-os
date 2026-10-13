import { eventBus } from '../model/eventBus'
import { useMissionStore } from '../model/useMissionStore'
import { missionEngine } from './missionEngine'
import { missionOrchestrator } from '../orchestrator/MissionOrchestrator'
import type { ActivityEvent } from '../model/types'

class MissionSimulator {
  private isSimulating = false
  private simTimeoutId: ReturnType<typeof setTimeout> | null = null

  /**
   * Triggers a live simulation sequence exercising stage transitions across all lifecycle states,
   * timeline event pushes, AI reasoning stream output, and adaptive workspace switching.
   */
  public startSimulation(): void {
    if (this.isSimulating) return
    this.isSimulating = true

    missionOrchestrator.initializeFramework()

    const store = useMissionStore.getState()
    const activeMission = store.activeMission
    if (!activeMission) return

    const stages = activeMission.stages
    let currentStageIndex = 0

    const runStep = () => {
      if (!this.isSimulating) return
      const state = useMissionStore.getState()
      if (state.activeMission?.status !== 'running') {
        this.simTimeoutId = setTimeout(runStep, 2000)
        return
      }

      if (currentStageIndex >= stages.length) {
        // Transition to Completed state
        state.updateMissionStatus('completed')
        state.updateMetrics({ progressPercent: 100, stepInfo: 'Mission Completed', lifecycle: 'Completed', eta: '0 min' })
        eventBus.publish('MISSION_COMPLETED', activeMission.id, {})
        this.isSimulating = false
        return
      }

      const stage = stages[currentStageIndex]

      // Update lifecycle metric based on stage
      let lifecycleLabel: 'Planning' | 'Executing' | 'Verifying' | 'Completed' = 'Executing'
      if (stage.name.toLowerCase().includes('plan')) {
        lifecycleLabel = 'Planning'
      } else if (stage.name.toLowerCase().includes('verify') || stage.name.toLowerCase().includes('test')) {
        lifecycleLabel = 'Verifying'
        state.updateMissionStatus('verifying')
      } else {
        state.updateMissionStatus('running')
      }

      state.updateMetrics({ lifecycle: lifecycleLabel })
      missionEngine.transitionToStage(stage.id)

      // Emit telemetry & activity event matching stage
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const simulatedEvent: ActivityEvent = {
        id: `sim-evt-${Date.now()}`,
        time: timeString,
        title: `${stage.name} Stage`,
        subtitle: `Executing ${stage.description}`,
        iconName: currentStageIndex % 2 === 0 ? 'Braces' : 'TerminalSquare',
        tone: {
          card: 'border-cyan-500/40 bg-cyan-500/[.05]',
          iconBox: 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
          line: 'bg-cyan-400/50',
          node: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
        },
      }

      state.addActivityEvent(simulatedEvent)
      state.appendReasoningLog(`\n[Stage: ${stage.name}] Analyzing requirements and generating artifacts...`)
      state.updateInspectorRow('Current task', `Executing ${stage.name} stage`)

      currentStageIndex++
      this.simTimeoutId = setTimeout(runStep, 4000)
    }

    this.simTimeoutId = setTimeout(runStep, 1000)
  }

  public stopSimulation(): void {
    this.isSimulating = false
    if (this.simTimeoutId) {
      clearTimeout(this.simTimeoutId)
      this.simTimeoutId = null
    }
  }
}

export const missionSimulator = new MissionSimulator()
