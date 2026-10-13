import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';

const states = new Set(['Installed', 'Starting', 'Running', 'Busy', 'Idle', 'Stopping', 'Stopped', 'Restarting', 'Error', 'Disabled', 'Unresponsive', 'Paused']);
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,95}$/;
const now = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));

export class JsonRuntimeRepository {
  constructor(filePath) { this.filePath = filePath; this.data = { agents: {}, apiKeys: {} }; }
  async load() { try { this.data = { ...this.data, ...JSON.parse(await fs.readFile(this.filePath, 'utf8')) }; } catch (error) { if (error.code !== 'ENOENT') throw error; await this.save(); } }
  async save() { await fs.mkdir(path.dirname(this.filePath), { recursive: true }); await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8'); }
  list() { return Object.values(this.data.agents).map(clone); }
  get(id) { return this.data.agents[id] ? clone(this.data.agents[id]) : null; }
  async put(agent) { this.data.agents[agent.id] = clone(agent); await this.save(); return clone(agent); }
  async remove(id) { delete this.data.agents[id]; await this.save(); }
}

export class RuntimeManager {
  constructor(repository) { this.repository = repository; this.events = new EventEmitter(); this.timers = new Map(); }
  async initialize() { await this.repository.load(); for (const agent of this.repository.list()) this.schedule(agent); }
  list() { return this.repository.list(); }
  get(id) { const agent = this.repository.get(id); if (!agent) throw Object.assign(new Error(`Unknown agent: ${id}`), { status: 404 }); return agent; }
  async install(manifest) { this.validateManifest(manifest); if (this.repository.get(manifest.id)) throw Object.assign(new Error(`Agent "${manifest.id}" already exists.`), { status: 409 }); const timestamp = now(); const agent = { ...manifest, runtimeId: `runtime-${manifest.id}`, installed: true, enabled: true, status: 'Installed', health: 0, progress: 0, createdAt: timestamp, updatedAt: timestamp, lastHeartbeat: null, lastExecution: null, logs: [], tasks: [], metrics: { cpu: 0, memory: 0, executionCount: 0, failureCount: 0, averageExecutionMs: 0, uptimeMs: 0 }, notifications: [], permissions: manifest.permissions || [], dependencies: manifest.dependencies || [], capabilities: manifest.capabilities || [], configuration: manifest.configuration || {}, apiRequirements: manifest.apiRequirements || manifest.requiredApis || [] }; await this.repository.put(agent); this.publish('AgentInstalled', agent); return agent; }
  async remove(id) { const agent = this.get(id); this.stopTimer(id); await this.repository.remove(id); this.publish('AgentRemoved', agent); }
  async transition(id, action) { const agent = this.get(id); if (!agent.installed && action !== 'install') throw Object.assign(new Error('Agent is not installed.'), { status: 409 }); const map = { start: 'Starting', stop: 'Stopping', restart: 'Restarting', enable: 'Stopped', disable: 'Disabled', pause: 'Paused', resume: 'Running' }; const target = map[action]; if (!target) throw Object.assign(new Error(`Unsupported lifecycle action: ${action}`), { status: 400 }); if (action === 'enable') agent.enabled = true; if (action === 'disable') agent.enabled = false; agent.status = target; agent.updatedAt = now(); await this.persistAndPublish(`Agent${action[0].toUpperCase()}${action.slice(1)}ed`, agent); if (action === 'start' || action === 'restart' || action === 'resume') { agent.status = 'Running'; agent.lastExecution = now(); agent.metrics.executionCount += 1; await this.persistAndPublish('AgentRunning', agent); this.schedule(agent); } if (action === 'stop' || action === 'disable') { agent.status = action === 'disable' ? 'Disabled' : 'Stopped'; this.stopTimer(id); await this.persistAndPublish('AgentStopped', agent); } return agent; }
  async updateConfig(id, configuration) { if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) throw Object.assign(new Error('Configuration must be an object.'), { status: 400 }); const agent = this.get(id); agent.configuration = configuration; agent.updatedAt = now(); await this.persistAndPublish('ConfigurationChanged', agent); return agent; }
  logs(id) { return this.get(id).logs; } metrics(id) { return this.get(id).metrics; } tasks(id) { return this.get(id).tasks; }
  validateManifest(manifest) { if (!manifest || typeof manifest !== 'object' || !idPattern.test(manifest.id || '') || typeof manifest.name !== 'string' || !manifest.name.trim()) throw Object.assign(new Error('Manifest requires a safe id and a name.'), { status: 400 }); }
  schedule(agent) { this.stopTimer(agent.id); if (!agent.enabled || !['Running', 'Busy', 'Idle'].includes(agent.status)) return; const started = Date.now(); this.timers.set(agent.id, setInterval(async () => { const latest = this.repository.get(agent.id); if (!latest || !latest.enabled || !['Running', 'Busy', 'Idle'].includes(latest.status)) return this.stopTimer(agent.id); latest.lastHeartbeat = now(); latest.health = 100; latest.metrics.uptimeMs += Math.max(0, Date.now() - started); latest.metrics.cpu = Math.round(Math.random() * 10); latest.metrics.memory = process.memoryUsage().rss; latest.updatedAt = now(); await this.persistAndPublish('Heartbeat', latest); }, 15000)); }
  stopTimer(id) { const timer = this.timers.get(id); if (timer) clearInterval(timer); this.timers.delete(id); }
  async persistAndPublish(type, agent) { agent.logs.unshift({ timestamp: now(), level: 'info', source: 'runtime-manager', message: type }); agent.logs = agent.logs.slice(0, 500); await this.repository.put(agent); this.publish(type, agent); }
  publish(type, agent) { this.events.emit('event', { id: `${Date.now()}-${Math.random()}`, type, agentId: agent.id, timestamp: now(), agent: clone(agent) }); }
}
