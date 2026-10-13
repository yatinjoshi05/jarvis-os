import type { AbstractBaseAgent } from './BaseAgent';
import type { Capability, Permission } from './interfaces';

export const AGENT_HUB_CATEGORIES = ['AI', 'Automation', 'Research', 'Coding', 'Browser', 'Vision', 'Finance', 'CRM', 'Communication', 'System', 'Memory', 'Custom'] as const;
export type AgentHubCategory = typeof AGENT_HUB_CATEGORIES[number];
export type AgentHubRuntimeState = 'Installed' | 'Starting' | 'Running' | 'Busy' | 'Idle' | 'Stopping' | 'Stopped' | 'Restarting' | 'Error' | 'Disabled' | 'Unresponsive' | 'Paused' | 'Updating';
export type AgentHubStatus = AgentHubRuntimeState;
export type RuntimeLogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface AgentHubManifest { id: string; name: string; version: string; category: AgentHubCategory; description: string; author: string; entryPoint: string; capabilities: Capability[]; permissions: Permission[]; dependencies: string[]; requiredApis: string[]; configuration: Record<string, unknown>; }
export interface AgentHubMetrics { starts: number; restarts: number; startedAt?: string; heartbeatAt?: string; uptimeMs: number; executionCount: number; failureCount: number; averageExecutionMs: number; cpu: number | null; memory: number | null; }
export interface AgentHubRecord extends AgentHubManifest {
  status: AgentHubStatus; runtimeState: AgentHubRuntimeState; health: number; progress: number;
  installationDate: string; createdAt: string; updatedAt: string; lastHeartbeat?: string; lastExecution?: string;
  lastRun?: string; lastActivity?: string; sessionId?: string; runtimeId: string;
  errors: string[]; warnings: string[]; tags: string[]; source: 'runtime' | 'imported';
  activity: Array<{ id: string; timestamp: string; type: 'info' | 'warning' | 'error' | 'update'; message: string }>;
  logs: Array<{ id: string; timestamp: string; level: RuntimeLogLevel; message: string }>; tasks: string[];
  enabled: boolean; installed: boolean; selected: boolean; apiRequirements: string[];
  executionCount: number; logCount: number; errorCount: number; notificationCount: number;
  metrics: AgentHubMetrics; metadata: Record<string, unknown>;
}
export interface AgentHubNotification { id: string; agentId: string; severity: 'error' | 'warning' | 'info' | 'update'; title: string; message: string; timestamp: string; }

type Listener = () => void;
const STORAGE_KEY = 'jarvis_agent_hub_runtime_v3';
const SESSION_KEY = 'jarvis_agent_hub_session_v3';
const now = () => new Date().toISOString();
const runtimeId = () => `runtime-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const progressFor: Record<AgentHubRuntimeState, number> = { Installed: 0, Starting: 25, Running: 50, Busy: 60, Idle: 50, Stopping: 25, Stopped: 0, Restarting: 10, Error: 0, Disabled: 0, Unresponsive: 0, Paused: 50, Updating: 25 };
const categoryFor = (role: string): AgentHubCategory => { const value = role.toLowerCase(); if (value.includes('code')) return 'Coding'; if (value.includes('browser')) return 'Browser'; if (value.includes('research')) return 'Research'; if (value.includes('finance') || value.includes('trading') || value.includes('investment')) return 'Finance'; if (value.includes('crm')) return 'CRM'; if (value.includes('email') || value.includes('call') || value.includes('whatsapp')) return 'Communication'; if (value.includes('knowledge')) return 'Memory'; if (value.includes('automation')) return 'Automation'; if (value.includes('system') || value.includes('terminal') || value.includes('supervisor')) return 'System'; return 'AI'; };

/** Single runtime source of truth. A backend adapter can replace only its hydrate/persist boundary. */
export class RuntimeStore {
  private records = new Map<string, AgentHubRecord>();
  private notifications: AgentHubNotification[] = [];
  private listeners = new Set<Listener>();
  private hydrated = false;
  private snapshot: AgentHubRecord[] = [];

  public rehydrate(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('jarvis_agent_hub_runtime_v2') || '{}') as { records?: AgentHubRecord[]; notifications?: AgentHubNotification[]; selectedId?: string | null };
      saved.records?.forEach(record => { if (record?.id) this.records.set(record.id, this.normalize(record)); });
      this.notifications = (saved.notifications || []).slice(0, 200);
      this.select(saved.selectedId ?? this.getLastSelectedAgent(), false);
    } catch (error) { console.warn('[RuntimeStore] restore failed', error); }
    this.hydrated = true; this.emit();
  }

  public subscribe = (listener: Listener): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  public getRecords = (): AgentHubRecord[] => this.snapshot;
  public getRecord(id: string): AgentHubRecord | undefined { return this.records.get(id); }
  public require(id: string): AgentHubRecord { const record = this.records.get(id); if (!record) throw new Error(`Agent "${id}" is not registered.`); return record; }
  public getNotifications(): AgentHubNotification[] { return [...this.notifications].sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
  public getSelected(): AgentHubRecord | undefined { return [...this.records.values()].find(record => record.selected); }
  public getLastSelectedAgent(): string | null { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}').selectedId ?? null; } catch { return null; } }
  public setLastSelectedAgent(selectedId: string | null): void { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ selectedId })); } catch { /* storage unavailable */ } }
  public select(id: string | null, shouldPersist = true): void { let changed = false; for (const record of this.records.values()) { const selected = record.id === id; if (record.selected !== selected) { this.records.set(record.id, { ...record, selected, updatedAt: now() }); changed = true; } } if (shouldPersist) this.setLastSelectedAgent(id); if (changed) { this.persist(); this.emit(); } }

  public registerRuntimeAgent(agent: AbstractBaseAgent): void {
    const existing = this.records.get(agent.id); if (existing?.source === 'runtime') { this.patch(agent.id, { capabilities: agent.capabilities, permissions: agent.permissions }); return; }
    const timestamp = now(); const record = this.createRecord({ id: agent.id, name: agent.name, version: '1.0.0', category: categoryFor(agent.role), description: `${agent.role.replace(/_/g, ' ')} agent registered by the JARVIS runtime.`, author: 'JARVIS OS', entryPoint: `runtime:${agent.constructor.name}`, capabilities: agent.capabilities, permissions: agent.permissions, dependencies: [], requiredApis: [], configuration: {} }, 'runtime', runtimeId(), timestamp);
    this.records.set(record.id, record); this.event(record.id, 'info', 'Agent Registered', 'Runtime agent registered.');
  }
  public installManifest(manifest: AgentHubManifest): AgentHubRecord { if (this.records.has(manifest.id)) throw new Error(`Agent "${manifest.id}" is already registered.`); const record = this.createRecord(manifest, 'imported', `import-${manifest.id}`, now()); this.records.set(record.id, record); this.event(record.id, 'info', 'Import completed', `${record.name} was imported into the registry.`); return this.require(record.id); }
  public uninstall(id: string): void { const record = this.require(id); this.records.delete(id); this.notifications = this.notifications.filter(notification => notification.agentId !== id); if (record.selected) this.setLastSelectedAgent(null); this.persist(); this.emit(); }
  public setRuntimeState(id: string, state: AgentHubRuntimeState, extra: Partial<AgentHubRecord> = {}): void { const record = this.require(id); const timestamp = now(); const started = state === 'Running' && record.runtimeState !== 'Running'; const metrics = { ...record.metrics, starts: started ? record.metrics.starts + 1 : record.metrics.starts, restarts: state === 'Restarting' ? record.metrics.restarts + 1 : record.metrics.restarts, startedAt: started ? timestamp : record.metrics.startedAt }; this.patch(id, { ...extra, runtimeState: state, status: state, progress: extra.progress ?? progressFor[state], lastRun: started ? timestamp : record.lastRun, lastExecution: started ? timestamp : record.lastExecution, metrics }); this.event(id, state === 'Error' || state === 'Unresponsive' ? 'error' : 'info', `Agent ${state}`, `Runtime state changed to ${state}.`); }
  public recordHeartbeat(id: string, healthy: boolean, cpu: number | null = null, memory: number | null = null): void { const record = this.require(id); const timestamp = now(); const state: AgentHubRuntimeState = healthy ? record.runtimeState : 'Unresponsive'; this.patch(id, { lastHeartbeat: timestamp, runtimeState: state, status: state, metrics: { ...record.metrics, heartbeatAt: timestamp, uptimeMs: record.metrics.startedAt ? Date.now() - new Date(record.metrics.startedAt).getTime() : 0, cpu, memory } }); if (!healthy) this.event(id, 'warning', 'Heartbeat timeout', 'Runtime heartbeat did not pass its health check.'); }
  public recordTask(id: string, task: string, progress: number, completed = false, durationMs?: number): void { const record = this.require(id); const count = completed ? record.metrics.executionCount + 1 : record.metrics.executionCount; const average = completed && durationMs !== undefined ? Math.round(((record.metrics.averageExecutionMs * record.metrics.executionCount) + durationMs) / count) : record.metrics.averageExecutionMs; this.patch(id, { tasks: completed ? [task, ...record.tasks].slice(0, 50) : [task], progress, runtimeState: completed ? 'Idle' : 'Busy', status: completed ? 'Idle' : 'Busy', lastExecution: completed ? now() : record.lastExecution, metrics: { ...record.metrics, executionCount: count, averageExecutionMs: average } }); }
  public recordFailure(id: string, message: string): void { const record = this.require(id); this.patch(id, { errors: [message, ...record.errors].slice(0, 50), runtimeState: 'Error', status: 'Error', progress: 0, metrics: { ...record.metrics, failureCount: record.metrics.failureCount + 1 } }); this.event(id, 'error', 'Runtime Error', message); }
  public log(id: string, level: RuntimeLogLevel, message: string): void { const record = this.require(id); const timestamp = now(); this.patch(id, { logs: [{ id: `${id}:${timestamp}`, timestamp, level, message }, ...record.logs].slice(0, 200) }); }
  public updateRuntimeConfiguration(id: string, configuration: Record<string, unknown>): void { this.patch(id, { configuration }); this.event(id, 'info', 'Configuration updated', 'Live runtime configuration was updated.'); }
  public diagnostic(): { status: 'PASS' | 'WARNING' | 'FAIL'; checks: Record<string, string> } { const records = this.getRecords(); const stale = records.filter(record => record.runtimeState === 'Running' && !record.lastHeartbeat); return { status: stale.length ? 'WARNING' : 'PASS', checks: { registry: 'PASS', runtime: records.length ? 'PASS' : 'WARNING: no registered runtime agents', heartbeat: stale.length ? `WARNING: ${stale.length} missing heartbeat` : 'PASS', persistence: this.hydrated ? 'PASS' : 'WARNING: not hydrated', synchronization: 'PASS' } }; }

  private createRecord(manifest: AgentHubManifest, source: AgentHubRecord['source'], id: string, timestamp: string): AgentHubRecord { return this.normalize({ ...manifest, status: 'Installed', runtimeState: 'Installed', health: 0, progress: 0, installationDate: timestamp, createdAt: timestamp, updatedAt: timestamp, runtimeId: id, errors: [], warnings: [], tags: [...new Set([manifest.category, ...manifest.capabilities.map(capability => capability.name)])], source, activity: [], logs: [], tasks: [], enabled: true, installed: true, selected: false, apiRequirements: manifest.requiredApis, executionCount: 0, logCount: 0, errorCount: 0, notificationCount: 0, metrics: { starts: 0, restarts: 0, uptimeMs: 0, executionCount: 0, failureCount: 0, averageExecutionMs: 0, cpu: null, memory: null }, metadata: {} }); }
  private patch(id: string, patch: Partial<AgentHubRecord>): void { const record = this.require(id); this.records.set(id, this.normalize({ ...record, ...patch, updatedAt: now(), lastActivity: now() })); this.persist(); this.emit(); }
  private event(id: string, severity: AgentHubNotification['severity'], title: string, message: string): void { const record = this.require(id); const timestamp = now(); const level: RuntimeLogLevel = severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info'; const type: AgentHubRecord['activity'][number]['type'] = severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'update'; this.records.set(id, this.normalize({ ...record, updatedAt: timestamp, lastActivity: timestamp, activity: [{ id: `${id}:${timestamp}`, timestamp, type, message }, ...record.activity].slice(0, 100), logs: [{ id: `${id}:log:${timestamp}`, timestamp, level, message }, ...record.logs].slice(0, 200) })); this.notifications = [{ id: `${id}:${title}:${timestamp}`, agentId: id, severity, title, message, timestamp }, ...this.notifications].slice(0, 200); this.persist(); this.emit(); }
  private normalize(record: AgentHubRecord): AgentHubRecord { const timestamp = record.updatedAt || now(); const errors = record.errors || []; const logs = record.logs || []; const notifications = this.notifications.filter(notification => notification.agentId === record.id).length; const metrics: AgentHubMetrics = record.metrics || { starts: 0, restarts: 0, uptimeMs: 0, executionCount: 0, failureCount: 0, averageExecutionMs: 0, cpu: null, memory: null }; const active = ['Running', 'Busy', 'Idle', 'Paused'].includes(record.runtimeState); const health = record.runtimeState === 'Unresponsive' ? 0 : active ? Math.max(0, 100 - errors.length * 15 - record.dependencies.filter(id => !this.records.has(id)).length * 10) : record.runtimeState === 'Installed' ? 0 : record.health; return { ...record, createdAt: record.createdAt || record.installationDate || timestamp, updatedAt: timestamp, installationDate: record.installationDate || record.createdAt || timestamp, requiredApis: record.requiredApis || record.apiRequirements || [], apiRequirements: record.apiRequirements || record.requiredApis || [], installed: record.installed ?? true, selected: record.selected ?? false, errors, warnings: record.warnings || [], logs, tasks: record.tasks || [], activity: record.activity || [], metadata: record.metadata || {}, metrics, executionCount: metrics.executionCount, logCount: logs.length, errorCount: errors.length, notificationCount: notifications, health, runtimeId: record.runtimeId || runtimeId() }; }
  private persist(): void { if (!this.hydrated) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: this.recordsList(), notifications: this.notifications, selectedId: this.getSelected()?.id ?? null })); } catch (error) { console.warn('[RuntimeStore] persist failed', error); } }
  private recordsList(): AgentHubRecord[] { return [...this.records.values()].sort((a, b) => a.name.localeCompare(b.name)); }
  private emit(): void { this.snapshot = this.recordsList(); this.listeners.forEach(listener => listener()); }
}

export const runtimeStore = new RuntimeStore();
