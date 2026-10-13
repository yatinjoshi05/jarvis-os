import type { Mission } from '../model/types'
import { eventBus } from '../model/eventBus'

export const initialMockMission: Mission = {
  id: 'm1',
  title: 'Build Yatin Advisory Website',
  status: 'running',
  author: 'JARVIS',
  startedAt: '2:14 PM',
  metrics: {
    progressPercent: 61,
    stepInfo: 'Step 5 of 11',
    eta: '12 min',
    priority: 'High',
    lifecycle: 'Executing',
    activeTask: 'Compiling React frontend & checking build output',
    filesCreated: 14,
    commandsExecuted: 8,
    warningsCount: 0,
    errorsCount: 0,
  },
  settings: {
    maxTokenBudget: 500000,
    timeoutMinutes: 60,
    autoVerify: true,
    allowTerminalCommands: true,
    allowBrowserAutomation: true,
  },
  stages: [
    { id: 's1', name: 'Planning', description: 'Requirements and scope', status: 'completed', progress: 100 },
    { id: 's2', name: 'Architecture', description: 'System design', status: 'completed', progress: 100 },
    { id: 's3', name: 'Create files', description: 'Project structure', status: 'completed', progress: 100 },
    { id: 's4', name: 'Coding', description: 'Implementation', status: 'in_progress', progress: 61 },
    { id: 's5', name: 'Dependencies', description: 'Package preparation', status: 'pending', progress: 0 },
    { id: 's6', name: 'Testing', description: 'Test execution', status: 'pending', progress: 0 },
    { id: 's7', name: 'Preview', description: 'Browser review', status: 'pending', progress: 0 },
    { id: 's8', name: 'Verification', description: 'Validation', status: 'pending', progress: 0 },
    { id: 's9', name: 'Completed', description: 'Mission closure', status: 'pending', progress: 0 },
  ],
  inspector: [
    { id: 'task', label: 'Current task', value: 'Awaiting runtime task', iconName: 'ListTree', tone: 'text-cyan-200' },
    { id: 'workspace', label: 'Current workspace', value: 'Awaiting stage selection', iconName: 'LayoutPanelTop', tone: 'text-violet-200' },
    { id: 'next', label: 'Next step', value: 'Awaiting execution plan', iconName: 'Play', tone: 'text-blue-200' },
    { id: 'files', label: 'Files', value: 'Awaiting file events', iconName: 'FolderOpen', tone: 'text-emerald-200' },
    { id: 'commands', label: 'Commands', value: 'Awaiting command events', iconName: 'Command', tone: 'text-fuchsia-200' },
    { id: 'warnings', label: 'Warnings', value: 'Awaiting diagnostics', iconName: 'TriangleAlert', tone: 'text-amber-200' },
    { id: 'errors', label: 'Errors', value: 'Awaiting diagnostics', iconName: 'XCircle', tone: 'text-rose-200' },
    { id: 'verification', label: 'Verification', value: 'Awaiting validation', iconName: 'ShieldCheck', tone: 'text-cyan-200' },
  ],
  activityTimeline: [
    {
      id: 'e1',
      time: '10:41:22 AM',
      title: 'Folder Created',
      subtitle: '/yatin-advisory',
      iconName: 'FolderOpen',
      tone: {
        card: 'border-emerald-500/40 bg-emerald-500/[.05]',
        iconBox: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        line: 'bg-emerald-400/50',
        node: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      },
    },
    {
      id: 'e2',
      time: '10:42:15 AM',
      title: 'Navbar.tsx',
      subtitle: 'Created',
      iconName: 'Braces',
      tone: {
        card: 'border-fuchsia-500/40 bg-fuchsia-500/[.05]',
        iconBox: 'border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
        line: 'bg-fuchsia-400/50',
        node: 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]',
      },
    },
    {
      id: 'e3',
      time: '10:43:01 AM',
      title: 'npm install',
      subtitle: 'Completed',
      iconName: 'TerminalSquare',
      tone: {
        card: 'border-cyan-500/40 bg-cyan-500/[.05]',
        iconBox: 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
        line: 'bg-cyan-400/50',
        node: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
      },
    },
    {
      id: 'e4',
      time: '10:44:10 AM',
      title: 'Browser Preview',
      subtitle: 'Started',
      iconName: 'SearchCode',
      tone: {
        card: 'border-amber-500/40 bg-amber-500/[.05]',
        iconBox: 'border border-amber-500/30 bg-amber-500/10 text-amber-300',
        line: 'bg-amber-400/50',
        node: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      },
    },
    {
      id: 'e5',
      time: '10:45:32 AM',
      title: 'Verification',
      subtitle: 'Running',
      iconName: 'ShieldCheck',
      tone: {
        card: 'border-teal-500/40 bg-teal-500/[.05]',
        iconBox: 'border border-teal-500/30 bg-teal-500/10 text-teal-300',
        line: 'bg-teal-400/50',
        node: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]',
      },
    },
    {
      id: 'e6',
      time: '10:46:05 AM',
      title: 'Login Page',
      subtitle: 'Created',
      iconName: 'Braces',
      tone: {
        card: 'border-purple-500/40 bg-purple-500/[.05]',
        iconBox: 'border border-purple-500/30 bg-purple-500/10 text-purple-300',
        line: 'bg-purple-400/50',
        node: 'bg-purple-400 shadow-[0_0_8px_#c084fc]',
      },
    },
  ],
  reasoningLog: '',
}

class MockBackend {
  private activeMission: Mission = { ...initialMockMission }

  public async getActiveMission(): Promise<Mission> {
    // Simulate slight network latency
    await new Promise((res) => setTimeout(res, 50))
    return { ...this.activeMission }
  }

  public async getMissionList(): Promise<Mission[]> {
    await new Promise((res) => setTimeout(res, 50))
    return [{ ...this.activeMission }]
  }

  public async pauseMission(missionId: string): Promise<boolean> {
    if (this.activeMission.id === missionId) {
      this.activeMission.status = 'paused'
      eventBus.publish('MISSION_PAUSED', missionId, { status: 'paused' })
    }
    return true
  }

  public async resumeMission(missionId: string): Promise<boolean> {
    if (this.activeMission.id === missionId) {
      this.activeMission.status = 'running'
      eventBus.publish('MISSION_RESUMED', missionId, { status: 'running' })
    }
    return true
  }

  public async stopMission(missionId: string): Promise<boolean> {
    if (this.activeMission.id === missionId) {
      this.activeMission.status = 'stopped' as any
      eventBus.publish('MISSION_STOPPED', missionId, { status: 'stopped' })
    }
    return true
  }

  public async clearActivityTimeline(missionId: string): Promise<boolean> {
    if (this.activeMission.id === missionId) {
      this.activeMission.activityTimeline = []
      eventBus.publish('CLEAR_LOGS', missionId, {})
    }
    return true
  }
}

export const mockBackend = new MockBackend()
