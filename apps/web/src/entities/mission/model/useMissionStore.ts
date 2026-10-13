import { create } from 'zustand'
import { validateStateTransition } from './missionLifecycle'
import type {
  ActivityEvent,
  Mission,
  MissionMetrics,
  MissionStage,
  RuntimeState,
  WorkspaceSurface,
} from './types'

export interface MissionStoreState {
  activeMission: Mission | null
  missionList: Mission[]
  activeStageId: string | null
  activeSurfaceMode: WorkspaceSurface
  isLoading: boolean
  error: string | null

  // Actions
  setActiveMission: (mission: Mission | null) => void
  setMissionList: (missions: Mission[]) => void
  updateMissionStatus: (status: RuntimeState) => boolean
  updateMetrics: (partialMetrics: Partial<MissionMetrics>) => void
  updateStageProgress: (stageId: string, progress: number, status?: MissionStage['status']) => void
  setActiveStage: (stageId: string | null) => void
  setActiveSurfaceMode: (surface: WorkspaceSurface) => void
  addActivityEvent: (event: ActivityEvent) => void
  clearActivityTimeline: () => void
  appendReasoningLog: (text: string) => void
  updateInspectorRow: (id: string, value: string) => void
  tickClock: () => void
  resetMission: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useMissionStore = create<MissionStoreState>((set, get) => ({
  activeMission: null,
  missionList: [],
  activeStageId: null,
  activeSurfaceMode: 'code',
  isLoading: true,
  error: null,

  setActiveMission: (mission) =>
    set({
      activeMission: mission,
      activeStageId: mission?.stages.find((s) => s.status === 'in_progress')?.id || mission?.stages[0]?.id || null,
      isLoading: false,
    }),

  setMissionList: (missions) => set({ missionList: missions }),

  updateMissionStatus: (newStatus) => {
    const currentMission = get().activeMission
    if (!currentMission) return false

    const isValid = validateStateTransition(currentMission.status, newStatus)
    if (!isValid) {
      console.warn(`[MissionStore] Rejected invalid state transition from ${currentMission.status} to ${newStatus}`)
      return false
    }

    set((state) => {
      if (!state.activeMission) return state
      return {
        activeMission: {
          ...state.activeMission,
          status: newStatus,
        },
      }
    })
    return true
  },

  updateMetrics: (partialMetrics) =>
    set((state) => {
      if (!state.activeMission) return state
      return {
        activeMission: {
          ...state.activeMission,
          metrics: {
            ...state.activeMission.metrics,
            ...partialMetrics,
          },
        },
      }
    }),

  updateStageProgress: (stageId, progress, status) =>
    set((state) => {
      if (!state.activeMission) return state
      const updatedStages = state.activeMission.stages.map((stage) => {
        if (stage.id !== stageId) return stage
        return {
          ...stage,
          progress,
          status: status || stage.status,
        }
      })
      return {
        activeMission: {
          ...state.activeMission,
          stages: updatedStages,
        },
      }
    }),

  setActiveStage: (stageId) => set({ activeStageId: stageId }),

  setActiveSurfaceMode: (surface) => set({ activeSurfaceMode: surface }),

  addActivityEvent: (event) =>
    set((state) => {
      if (!state.activeMission) return state
      if (state.activeMission.activityTimeline.some((e) => e.id === event.id)) {
        return state
      }
      return {
        activeMission: {
          ...state.activeMission,
          activityTimeline: [...state.activeMission.activityTimeline, event],
        },
      }
    }),

  clearActivityTimeline: () =>
    set((state) => {
      if (!state.activeMission) return state
      return {
        activeMission: {
          ...state.activeMission,
          activityTimeline: [],
        },
      }
    }),

  appendReasoningLog: (text) =>
    set((state) => {
      if (!state.activeMission) return state
      return {
        activeMission: {
          ...state.activeMission,
          reasoningLog: state.activeMission.reasoningLog + text,
        },
      }
    }),

  updateInspectorRow: (id, value) =>
    set((state) => {
      if (!state.activeMission) return state
      const updatedInspector = state.activeMission.inspector.map((item) => {
        if (item.id !== id && item.label.toLowerCase() !== id.toLowerCase()) return item
        return { ...item, value }
      })
      return {
        activeMission: {
          ...state.activeMission,
          inspector: updatedInspector,
        },
      }
    }),

  tickClock: () =>
    set((state) => {
      if (!state.activeMission || state.activeMission.status !== 'running') return state
      const currentSeconds = state.activeMission.metrics.elapsedSeconds || 0
      const newSeconds = currentSeconds + 1
      const remainingMins = Math.max(1, 15 - Math.floor(newSeconds / 60))

      return {
        activeMission: {
          ...state.activeMission,
          metrics: {
            ...state.activeMission.metrics,
            elapsedSeconds: newSeconds,
            eta: `${remainingMins} min`,
          },
        },
      }
    }),

  resetMission: () =>
    set((state) => {
      if (!state.activeMission) return state
      const resetStages: MissionStage[] = state.activeMission.stages.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'in_progress' : 'pending',
        progress: idx === 0 ? 10 : 0,
      }))

      return {
        activeMission: {
          ...state.activeMission,
          status: 'running',
          metrics: {
            ...state.activeMission.metrics,
            progressPercent: 10,
            stepInfo: 'Step 1 of 9',
            lifecycle: 'Executing',
            elapsedSeconds: 0,
            eta: '15 min',
          },
          stages: resetStages,
          reasoningLog: '[System] Mission runtime reset.\n',
        },
        activeStageId: resetStages[0].id,
        activeSurfaceMode: 'planning',
      }
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}))
