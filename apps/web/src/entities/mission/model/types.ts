export type RuntimeState =
  | 'draft'
  | 'queued'
  | 'planning'
  | 'awaiting'
  | 'running'
  | 'paused'
  | 'waiting'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'archived'

export type MissionStatus = RuntimeState

export type MissionPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type MissionLifecycle =
  | 'Initializing'
  | 'Planning'
  | 'Executing'
  | 'Verifying'
  | 'Finalizing'
  | 'Completed'
  | 'Failed'

export type WorkspaceSurface = 'planning' | 'code' | 'terminal' | 'browser' | 'testing' | 'verification' | 'memory'

export type WorkspaceMode = 'auto' | 'manual'

export type MissionStageStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'

export interface MissionStage {
  id: string
  name: string
  description: string
  status: MissionStageStatus
  progress: number
  startedAt?: string
  completedAt?: string
  weight?: number
}

export interface InspectorItem {
  id: string
  label: string
  value: string
  iconName: string
  tone?: string
}

export interface ActivityEvent {
  id: string
  time: string
  title: string
  subtitle: string
  iconName: string
  tone: {
    card: string
    iconBox: string
    line: string
    node: string
  }
}

export interface MissionMetrics {
  progressPercent: number
  stepInfo: string
  eta: string
  priority: MissionPriority
  lifecycle: MissionLifecycle
  activeTask: string
  filesCreated: number
  commandsExecuted: number
  warningsCount: number
  errorsCount: number
  elapsedSeconds?: number
}

export interface MissionSettings {
  maxTokenBudget: number
  timeoutMinutes: number
  autoVerify: boolean
  allowTerminalCommands: boolean
  allowBrowserAutomation: boolean
}

export interface Mission {
  id: string
  title: string
  status: RuntimeState
  author: string
  startedAt: string
  metrics: MissionMetrics
  settings: MissionSettings
  stages: MissionStage[]
  inspector: InspectorItem[]
  activityTimeline: ActivityEvent[]
  reasoningLog: string
}

export type MissionEventType =
  | 'MISSION_STARTED'
  | 'MISSION_PAUSED'
  | 'MISSION_RESUMED'
  | 'MISSION_STOPPED'
  | 'MISSION_RESTARTED'
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'
  | 'STAGE_TRANSITION'
  | 'FILE_CREATED'
  | 'COMMAND_EXECUTED'
  | 'VERIFICATION_COMPLETED'
  | 'REASONING_STREAM'
  | 'CLEAR_LOGS'
  | 'WORKSPACE_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'MISSION_SUMMARY_READY'

export interface MissionEvent<T = unknown> {
  id: string
  missionId: string
  timestamp: string
  type: MissionEventType
  payload: T
}
