import { eventBus } from '../model/eventBus'
import { useMissionStore } from '../model/useMissionStore'
import type { WorkspaceSurface } from '../model/types'

class MissionEngine {
  private timerId: ReturnType<typeof setInterval> | null = null

  /**
   * Starts the live clock ticking every second when running.
   */
  public startClock(): void {
    if (this.timerId) return
    this.timerId = setInterval(() => {
      const store = useMissionStore.getState()
      if (store.activeMission?.status === 'running') {
        store.tickClock()
        this.recalculateProgress()
      }
    }, 1000)
  }

  /**
   * Stops the live clock ticking.
   */
  public stopClock(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  /**
   * Dynamically calculates weighted completion percentage across all stages.
   */
  public recalculateProgress(): void {
    const store = useMissionStore.getState()
    const stages = store.activeMission?.stages
    if (!stages || stages.length === 0) return

    let totalProgress = 0
    let currentStepIdx = 1

    stages.forEach((stage, idx) => {
      if (stage.status === 'completed') {
        totalProgress += 100
        currentStepIdx = Math.max(currentStepIdx, idx + 1)
      } else if (stage.status === 'in_progress') {
        totalProgress += Math.min(99, stage.progress)
        currentStepIdx = idx + 1
      }
    })

    const overallPercent = Math.round(totalProgress / stages.length)
    const stepInfo = `Step ${currentStepIdx} of ${stages.length}`

    store.updateMetrics({
      progressPercent: overallPercent,
      stepInfo,
    })
  }

  /**
   * Transitions active stage and updates the Adaptive Workspace surface automatically.
   */
  public transitionToStage(stageId: string, surfaceMode?: WorkspaceSurface): void {
    const store = useMissionStore.getState()
    const stages = store.activeMission?.stages
    if (!stages) return

    let targetSurface: WorkspaceSurface = surfaceMode || 'code'

    // Map stage to recommended surface mode if not provided
    if (!surfaceMode) {
      const targetStage = stages.find((s) => s.id === stageId)
      if (targetStage) {
        const stageNameLower = targetStage.name.toLowerCase()
        if (stageNameLower.includes('plan')) targetSurface = 'planning'
        else if (stageNameLower.includes('arch') || stageNameLower.includes('code') || stageNameLower.includes('file')) targetSurface = 'code'
        else if (stageNameLower.includes('depend') || stageNameLower.includes('cmd') || stageNameLower.includes('term')) targetSurface = 'terminal'
        else if (stageNameLower.includes('preview') || stageNameLower.includes('browser')) targetSurface = 'browser'
        else if (stageNameLower.includes('test') || stageNameLower.includes('verify')) targetSurface = 'verification'
      }
    }

    // Mark previous stages completed and target stage in_progress
    let foundTarget = false
    stages.forEach((s) => {
      if (s.id === stageId) {
        foundTarget = true
        store.updateStageProgress(s.id, s.progress > 0 ? s.progress : 15, 'in_progress')
      } else if (!foundTarget) {
        store.updateStageProgress(s.id, 100, 'completed')
      }
    })

    store.setActiveStage(stageId)
    store.setActiveSurfaceMode(targetSurface)
    this.recalculateProgress()

    const activeMissionId = store.activeMission?.id || 'm1'
    eventBus.publish('STAGE_TRANSITION', activeMissionId, { stageId, surface: targetSurface })
  }

  public pause(): void {
    const store = useMissionStore.getState()
    if (store.updateMissionStatus('paused')) {
      const missionId = store.activeMission?.id || 'm1'
      eventBus.publish('MISSION_PAUSED', missionId, { status: 'paused' })
    }
  }

  public resume(): void {
    const store = useMissionStore.getState()
    if (store.updateMissionStatus('running')) {
      const missionId = store.activeMission?.id || 'm1'
      eventBus.publish('MISSION_RESUMED', missionId, { status: 'running' })
    }
  }

  public stop(): void {
    const store = useMissionStore.getState()
    if (store.updateMissionStatus('failed')) {
      const missionId = store.activeMission?.id || 'm1'
      eventBus.publish('MISSION_STOPPED', missionId, { status: 'failed' })
    }
  }

  public restart(): void {
    const store = useMissionStore.getState()
    store.resetMission()
    const missionId = store.activeMission?.id || 'm1'
    eventBus.publish('MISSION_RESTARTED', missionId, { status: 'running' })
  }
}

export const missionEngine = new MissionEngine()
