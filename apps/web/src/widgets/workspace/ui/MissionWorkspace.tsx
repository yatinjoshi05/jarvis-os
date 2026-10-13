import { useEffect, useRef } from 'react'
import {
  Activity,
  Braces,
  CircleDashed,
  Command,
  FolderOpen,
  LayoutPanelTop,
  ListTree,
  Pause,
  Play,
  RotateCcw,
  SearchCode,
  ShieldCheck,
  Sparkles,
  Square,
  TerminalSquare,
  Trash2,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  missionEngine,
  missionService,
  missionSimulator,
  useMissionStore,
  type ActivityEvent,
  type RuntimeState,
  type WorkspaceSurface,
} from '../../../entities/mission'
import { FloatingOrb } from '../../desktop/FloatingOrb'

const iconMap: Record<string, LucideIcon> = {
  FolderOpen,
  Braces,
  TerminalSquare,
  SearchCode,
  ShieldCheck,
  ListTree,
  LayoutPanelTop,
  Play,
  Command,
  TriangleAlert,
  XCircle,
  Sparkles,
}

const stateTone: Record<RuntimeState, string> = {
  draft: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  queued: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  planning: 'border-blue-400/20 bg-blue-400/10 text-blue-200',
  awaiting: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  running: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200',
  waiting: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  paused: 'border-slate-300/20 bg-slate-300/10 text-slate-200',
  verifying: 'border-teal-400/20 bg-teal-400/10 text-teal-200',
  completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  failed: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
  cancelled: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
  archived: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
}

export function StatusBadge({ state = 'running', label }: { state?: RuntimeState; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${stateTone[state]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? `${state} runtime`}
    </span>
  )
}

export function ProgressBar({ label = 'Runtime progress unavailable' }: { label?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400/40 to-fuchsia-400/40" />
      </div>
      <p className="text-[9px] text-white/35">{label}</p>
    </div>
  )
}

export function ToolbarButton({ label, icon: Icon, disabled = true }: { label: string; icon: LucideIcon; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={`${label} — requires runtime connection`}
      className="flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/[.08] bg-white/[.035] px-3 text-[10px] font-semibold text-white/45 transition-colors enabled:hover:border-cyan-300/40 enabled:hover:text-white disabled:cursor-not-allowed"
    >
      <Icon size={13} />
      {label}
    </button>
  )
}

export function MissionFlow() {
  const stages = useMissionStore((s) => s.activeMission?.stages) || []

  return (
    <section className="mission-surface flex min-h-0 flex-col p-4" aria-label="Mission flow">
      <PanelTitle icon={ListTree} title="Mission flow" description="Stage model" />
      <div className="mt-4 min-h-0 space-y-0 overflow-y-auto pr-1">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed'
          const isInProgress = stage.status === 'in_progress'

          return (
            <div
              className="relative flex gap-3 pb-4 last:pb-0 cursor-pointer transition-opacity hover:opacity-90"
              key={stage.id}
              onClick={() => missionEngine.transitionToStage(stage.id)}
            >
              <div className="flex w-4 flex-col items-center">
                <CircleDashed
                  size={15}
                  className={isInProgress ? 'text-cyan-300 animate-pulse' : isCompleted ? 'text-emerald-400' : 'text-white/25'}
                />
                {index < stages.length - 1 && <span className="mt-1 h-full w-px bg-white/[.12]" />}
              </div>
              <div className="min-w-0 pb-1">
                <p className={`text-[10px] font-bold uppercase tracking-[.1em] ${isInProgress ? 'text-cyan-300' : isCompleted ? 'text-white/85' : 'text-white/50'}`}>
                  {stage.name}
                </p>
                <p className="mt-0.5 text-[9px] text-white/35">
                  {stage.description} &middot; {stage.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PanelTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-cyan-300" />
        <h2 className="text-[10px] font-bold uppercase tracking-[.16em] text-white/85">{title}</h2>
      </div>
      {description && <span className="text-[9px] text-white/30">{description}</span>}
    </div>
  )
}

const workspaces: Array<[WorkspaceSurface, string, LucideIcon]> = [
  ['planning', 'Files', FolderOpen],
  ['code', 'Coding', Braces],
  ['terminal', 'Terminal', TerminalSquare],
  ['browser', 'Browser', SearchCode],
  ['memory', 'Memory', Sparkles],
]

export function WorkspaceSwitcher() {
  const activeSurface = useMissionStore((s) => s.activeSurfaceMode)
  const setSurface = useMissionStore((s) => s.setActiveSurfaceMode)

  return (
    <nav className="grid grid-cols-5 gap-2" aria-label="Workspace switcher">
      {workspaces.map(([surfaceId, label, Icon]) => {
        const isActive = activeSurface === surfaceId
        return (
          <button
            key={label}
            type="button"
            onClick={() => setSurface(surfaceId)}
            className={`rounded-lg border px-2 py-3 text-center transition-colors ${
              isActive
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                : 'border-white/[.07] bg-white/[.025] text-white/50 hover:border-white/20 hover:text-white'
            }`}
          >
            <Icon size={16} className={`mx-auto mb-1.5 ${isActive ? 'text-cyan-300' : 'text-cyan-200/70'}`} />
            <span className="block text-[9px] font-semibold">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function MissionHeader() {
  const activeMission = useMissionStore((s) => s.activeMission)
  const headerRef = useRef<HTMLElement>(null)

  const missionTitle = activeMission?.title || 'Build Yatin Advisory Website'
  const status = activeMission?.status || 'running'
  const startedAt = activeMission?.startedAt || '2:14 PM'
  const author = activeMission?.author || 'JARVIS'
  const metrics = activeMission?.metrics || {
    progressPercent: 61,
    stepInfo: 'Step 5 of 11',
    eta: '12 min',
    priority: 'High',
    lifecycle: 'Executing',
  }

  const isPaused = status === 'paused'

  const handleTogglePause = () => {
    if (isPaused) {
      missionEngine.resume()
    } else {
      missionEngine.pause()
    }
  }

  const handleStop = () => missionEngine.stop()
  const handleRestart = () => missionEngine.restart()

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <header ref={headerRef} className="mission-surface mission-header" aria-label="Mission header">
      {/* 1. MISSION COLUMN */}
      <div className="mission-header__col mission-header__col--mission flex items-center gap-3.5 min-w-0">
        <div className="relative flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full p-[2px] shadow-[0_0_16px_rgba(34,211,238,0.35)]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-cyan-400 p-[2px]">
            <div className="h-full w-full rounded-full bg-[#080d16]" />
          </div>
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-950/30 shadow-[inset_0_0_10px_rgba(34,211,238,0.4)]">
            <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Current mission</p>
          <h1 className="mt-0.5 truncate text-[15px] font-bold tracking-tight text-white" title={missionTitle}>
            {missionTitle}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-fuchsia-300">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_6px_#e879f9]" />
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-white/35 font-normal tracking-wide">
            Started: {startedAt} &bull; by {author}
          </p>
        </div>
      </div>

      {/* 2. PROGRESS COLUMN */}
      <div className="mission-header__col mission-header__col--progress border-l border-white/[.09] pl-5 flex flex-col justify-center min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Progress</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">{metrics.progressPercent}%</p>
        <div className="my-1.5 flex w-full max-w-[140px] gap-1">
          {[...Array(10)].map((_, i) => {
            const filledCount = Math.round((metrics.progressPercent / 100) * 10)
            const isFilled = i < filledCount
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm transition-all ${
                  !isFilled
                    ? 'bg-white/10'
                    : i < 3
                    ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]'
                    : i < 6
                    ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]'
                    : 'bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.6)]'
                }`}
              />
            )
          })}
        </div>
        <p className="text-[10px] text-white/35">{metrics.stepInfo}</p>
      </div>

      {/* 3. ETA COLUMN */}
      <div className="mission-header__col mission-header__col--eta border-l border-white/[.09] pl-5 flex flex-col justify-center min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/40">ETA</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-white">{metrics.eta}</p>
        <p className="mt-1 text-[10px] text-white/35">Estimated</p>
      </div>

      {/* 4. PRIORITY COLUMN */}
      <div className="mission-header__col mission-header__col--priority border-l border-white/[.09] pl-5 flex flex-col justify-center min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Priority</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-rose-500">{metrics.priority}</p>
        <div className="mt-1.5 flex w-[80px] gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-sm ${
                i < 2 ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]' : 'bg-rose-950/60 border border-rose-900/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 5. LIFECYCLE COLUMN */}
      <div className="mission-header__col mission-header__col--lifecycle border-l border-white/[.09] pl-5 flex flex-col justify-center min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Lifecycle</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-white">{metrics.lifecycle}</p>
        <div className="mt-1.5 flex items-center">
          <svg className="h-4 w-24 text-cyan-400" viewBox="0 0 100 20" fill="none" stroke="currentColor">
            <path
              d="M 0 10 L 25 10 L 30 4 L 35 16 L 40 2 L 45 14 L 50 10 L 100 10"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]"
            />
          </svg>
        </div>
      </div>

      {/* 6. BUTTON COLUMN */}
      <div className="mission-header__col mission-header__col--buttons flex flex-col justify-center gap-1.5 w-[120px]">
        <button
          type="button"
          onClick={handleTogglePause}
          className="mission-header__btn flex items-center justify-center gap-2 rounded-lg border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[11px] font-medium text-white/85 transition-all hover:border-white/20 hover:bg-white/[.08] hover:text-white"
        >
          {isPaused ? <Play size={12} className="text-emerald-400" /> : <Pause size={12} />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
        <button
          type="button"
          onClick={handleStop}
          className="mission-header__btn mission-header__btn--stop flex items-center justify-center gap-2 rounded-lg border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[11px] font-medium text-rose-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <Square size={10} className="fill-rose-500 text-rose-500" />
          <span>Stop</span>
        </button>
        <button
          type="button"
          onClick={handleRestart}
          title="Restart Mission Execution Engine"
          className="mission-header__btn flex items-center justify-center gap-2 rounded-lg border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[11px] font-medium text-white/85 transition-all hover:border-white/20 hover:bg-white/[.08] hover:text-white"
        >
          <RotateCcw size={12} />
          <span>Restart</span>
        </button>
      </div>
    </header>
  )
}

export function MissionWorkspacePanel() {
  return (
    <section className="mission-surface flex min-h-0 flex-col p-4" aria-label="Adaptive workspace">
      <PanelTitle icon={LayoutPanelTop} title="Adaptive workspace" description="Runtime-driven" />
      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-dashed border-white/[.12] bg-black/15 p-5">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="rounded-xl bg-cyan-300/[.07] p-3 text-cyan-200">
            <Braces size={24} />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-white/80">Workspace awaiting mission stage</h2>
          <p className="mt-2 max-w-sm text-[10px] leading-5 text-white/40">
            Planning, architecture, files, coding, terminal, browser, testing, verification and completion surfaces will mount here when a connected mission selects them.
          </p>
        </div>
        <div className="mt-5 border-t border-white/[.08] pt-4">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Workspace switcher</p>
          <WorkspaceSwitcher />
        </div>
      </div>
    </section>
  )
}

export function InfoCard({ label, value, icon: Icon, tone = 'text-cyan-200' }: { label: string; value: string; icon: LucideIcon; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/[.07] bg-white/[.025] p-2.5">
      <div className="flex gap-2.5">
        <div className={`rounded-md bg-white/[.05] p-1.5 ${tone}`}>
          <Icon size={13} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] text-white/35">{label}</p>
          <p className="mt-1 truncate text-[10px] font-medium text-white/75">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function MissionInspector() {
  const inspectorRows = useMissionStore((s) => s.activeMission?.inspector) || []
  const reasoningLog = useMissionStore((s) => s.activeMission?.reasoningLog) || ''

  return (
    <aside className="mission-surface flex min-h-0 flex-col p-3" aria-label="Mission inspector">
      <PanelTitle icon={ShieldCheck} title="Mission inspector" />
      <div className="mt-3 space-y-2 overflow-y-auto pr-1">
        {inspectorRows.map((item) => {
          const IconComponent = iconMap[item.iconName] || ShieldCheck
          return <InfoCard key={item.id} label={item.label} value={item.value} icon={IconComponent} tone={item.tone} />
        })}
        <div className="rounded-lg border border-white/[.07] bg-white/[.025] p-3">
          <div className="flex items-center gap-2 text-fuchsia-200">
            <Sparkles size={13} />
            <p className="text-[9px] font-bold uppercase tracking-[.12em]">AI reasoning</p>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-white/40 whitespace-pre-line">
            {reasoningLog || 'Reasoning stream will appear here after a mission runtime is connected.'}
          </p>
        </div>
      </div>
    </aside>
  )
}

function ActivityTimelineCard({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const IconComponent = iconMap[event.iconName] || FolderOpen
  return (
    <div className="flex items-center flex-shrink-0">
      <div className={`relative flex h-[76px] w-[200px] items-center gap-3 rounded-xl border p-3 transition-all hover:border-white/20 ${event.tone.card}`}>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${event.tone.iconBox}`}>
          <IconComponent size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] text-white/40">{event.time}</p>
          <h4 className="truncate text-xs font-semibold tracking-tight text-white mt-0.5" title={event.title}>
            {event.title}
          </h4>
          <p className="truncate text-[10px] text-white/50 mt-0.5" title={event.subtitle}>
            {event.subtitle}
          </p>
        </div>
      </div>

      {!isLast && (
        <div className="relative flex items-center justify-center px-1">
          <div className={`h-[2px] w-7 ${event.tone.line}`} />
          <div className={`absolute h-2 w-2 rounded-full ${event.tone.node}`} />
        </div>
      )}
    </div>
  )
}

export function ActivityDock() {
  const timelineEvents = useMissionStore((s) => s.activeMission?.activityTimeline) || []
  const handleClear = () => missionService.clearTimeline()
  const dockContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to newest event on right
  useEffect(() => {
    if (dockContainerRef.current) {
      dockContainerRef.current.scrollLeft = dockContainerRef.current.scrollWidth
    }
  }, [timelineEvents.length])

  return (
    <section className="mission-surface p-3.5 flex flex-col justify-between" aria-label="Activity dock">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-cyan-300" />
          <h3 className="text-[10px] font-bold uppercase tracking-[.16em] text-white/85">
            Activity dock <span className="normal-case text-white/35 ml-1 font-normal">(Live)</span>
          </h3>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.03] px-2.5 py-1 text-[10px] font-semibold text-white/70 transition-colors hover:border-white/20 hover:bg-white/[.07] hover:text-white"
        >
          <Trash2 size={11} />
          <span>Clear All</span>
        </button>
      </div>

      <div ref={dockContainerRef} className="flex items-center gap-0 overflow-x-auto pb-1 pt-1 hide-scrollbar">
        {timelineEvents.map((event, index) => (
          <ActivityTimelineCard
            key={event.id}
            event={event}
            isLast={index === timelineEvents.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

export default function MissionWorkspace() {
  useEffect(() => {
    missionService.initializeActiveMission()
    missionEngine.startClock()
    missionSimulator.startSimulation()

    return () => {
      missionEngine.stopClock()
      missionSimulator.stopSimulation()
    }
  }, [])

  return (
    <div className="mission-workspace h-full overflow-y-auto pr-1 relative">
      <MissionHeader />
      <div className="mt-3 grid min-h-[540px] gap-4 grid-cols-1 lg:grid-cols-[22%_58%_20%] xl:grid-cols-[22%_58%_20%]">
        <MissionFlow />
        <MissionWorkspacePanel />
        <MissionInspector />
      </div>
      <div className="mt-3">
        <ActivityDock />
      </div>
      <FloatingOrb />
    </div>
  )
}
