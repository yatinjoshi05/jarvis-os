import { missionApi } from '../api/missionApi'
import { eventBus } from '../model/eventBus'
import { useMissionStore } from '../model/useMissionStore'
import type { ActivityEvent } from '../model/types'

class MissionService {
  /**
   * Initializes the mission service, loads active mission payload, and hooks event listeners.
   */
  public async initializeActiveMission(): Promise<void> {
    const store = useMissionStore.getState()
    store.setLoading(true)

    try {
      const mission = await missionApi.getActiveMission()
      store.setActiveMission(mission)
      this.setupEventSubscriptions()
    } catch (err) {
      console.error('[MissionService] Failed to load active mission:', err)
      store.setError('Failed to initialize active mission domain service.')
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Subscribes Zustand store to eventBus topic channels.
   */
  private setupEventSubscriptions(): void {
    eventBus.subscribe('MISSION_PAUSED', () => {
      useMissionStore.getState().updateMissionStatus('paused')
    })

    eventBus.subscribe('MISSION_RESUMED', () => {
      useMissionStore.getState().updateMissionStatus('running')
    })

    eventBus.subscribe('MISSION_STOPPED', () => {
      useMissionStore.getState().updateMissionStatus('failed')
    })

    eventBus.subscribe('CLEAR_LOGS', () => {
      useMissionStore.getState().clearActivityTimeline()
    })

    eventBus.subscribe<ActivityEvent>('FILE_CREATED', (evt) => {
      if (evt.payload) {
        useMissionStore.getState().addActivityEvent(evt.payload)
      }
    })

    eventBus.subscribe<ActivityEvent>('COMMAND_EXECUTED', (evt) => {
      if (evt.payload) {
        useMissionStore.getState().addActivityEvent(evt.payload)
      }
    })

    eventBus.subscribe<{ text: string }>('REASONING_STREAM', (evt) => {
      if (evt.payload?.text) {
        useMissionStore.getState().appendReasoningLog(evt.payload.text)
      }
    })
  }

  public async pauseActiveMission(): Promise<void> {
    const activeMission = useMissionStore.getState().activeMission
    if (!activeMission) return
    await missionApi.pauseMission(activeMission.id)
  }

  public async resumeActiveMission(): Promise<void> {
    const activeMission = useMissionStore.getState().activeMission
    if (!activeMission) return
    await missionApi.resumeMission(activeMission.id)
  }

  public async stopActiveMission(): Promise<void> {
    const activeMission = useMissionStore.getState().activeMission
    if (!activeMission) return
    await missionApi.stopMission(activeMission.id)
  }

  public async clearTimeline(): Promise<void> {
    const activeMission = useMissionStore.getState().activeMission
    if (!activeMission) return
    await missionApi.clearActivityTimeline(activeMission.id)
  }
}

export const missionService = new MissionService()
