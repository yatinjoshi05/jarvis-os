import type { ExecutionContext } from './interfaces';
import { agentRegistry } from './AgentRegistry';
import { agentEventEmitter, AgentEvents } from './events';
import { agentHubRegistry } from './AgentHubRegistry';
import { runtimeEventBus, type RuntimeEventType } from './RuntimeEventBus';

const systemContext = (agentId: string): ExecutionContext => ({
  userId: 'jarvis-system', conversationId: `runtime:${agentId}`, workspaceId: 'jarvis-os', variables: {},
});

/** Owns one in-process runtime instance for each registered agent. It never imports UI code. */
export class AgentRuntime {
  private inFlight = new Set<string>();
  private heartbeat?: number;
  private restored = false;

  public async restore(): Promise<void> {
    if (this.restored) return;
    this.restored = true;
    for (const record of agentHubRegistry.getRecords()) {
      if (record.enabled && ['Running', 'Busy', 'Idle'].includes(record.runtimeState)) {
        await this.start(record.id).catch((error) => agentHubRegistry.recordFailure(record.id, error instanceof Error ? error.message : String(error)));
      }
    }
    this.startBackgroundWorker();
  }

  public async start(id: string): Promise<void> {
    await this.withInstance(id, async () => {
      const record = agentHubRegistry.require(id);
      if (!record.enabled) throw new Error(`${record.name} is disabled.`);
      const agent = agentRegistry.getAgent(id);
      if (!agent) throw new Error(`No runtime implementation is registered for "${id}".`);
      agentHubRegistry.setRuntimeState(id, 'Starting');
      await agent.initialize(systemContext(id));
      agent.state = 'Running';
      agentHubRegistry.setRuntimeState(id, 'Running', { lastRun: new Date().toISOString() });
      this.event(AgentEvents.AGENT_STARTED, id, 'Agent started.');
    });
  }

  public async stop(id: string): Promise<void> { await this.withAgent(id, async (agent) => { agentHubRegistry.setRuntimeState(id, 'Stopping'); await agent.stop(); agentHubRegistry.setRuntimeState(id, 'Stopped'); this.event(AgentEvents.AGENT_STOPPED, id, 'Agent stopped.'); }); }
  public async pause(id: string): Promise<void> { await this.withAgent(id, async (agent) => { await agent.pause(); agentHubRegistry.setRuntimeState(id, 'Paused'); this.event(AgentEvents.AGENT_PAUSED, id, 'Agent paused.'); }); }
  public async resume(id: string): Promise<void> { await this.withAgent(id, async (agent) => { await agent.resume(); agentHubRegistry.setRuntimeState(id, 'Running'); this.event(AgentEvents.AGENT_RESUMED, id, 'Agent resumed.'); }); }
  public async restart(id: string): Promise<void> { agentHubRegistry.setRuntimeState(id, 'Restarting'); await this.stop(id); await this.start(id); runtimeEventBus.publish('AgentRestarted', id); }
  public async enable(id: string): Promise<void> { const record = agentHubRegistry.require(id); agentHubRegistry.setRuntimeState(id, 'Stopped', { enabled: true, progress: 0 }); if (!record.enabled) { agentHubRegistry.log(id, 'info', 'Agent enabled.'); runtimeEventBus.publish('AgentEnabled', id); } }
  public async disable(id: string): Promise<void> { const state = agentHubRegistry.require(id).runtimeState; if (state !== 'Stopped' && state !== 'Disabled') await this.stop(id); agentHubRegistry.setRuntimeState(id, 'Disabled', { enabled: false }); runtimeEventBus.publish('AgentDisabled', id); }
  public async update(id: string, configuration: Record<string, unknown>): Promise<void> { agentHubRegistry.setRuntimeState(id, 'Updating'); agentHubRegistry.updateRuntimeConfiguration(id, configuration); agentHubRegistry.setRuntimeState(id, 'Idle'); }

  private async withAgent(id: string, fn: (agent: NonNullable<ReturnType<typeof agentRegistry.getAgent>>) => Promise<void>): Promise<void> {
    await this.withInstance(id, async () => { const agent = agentRegistry.getAgent(id); if (!agent) throw new Error(`No runtime implementation is registered for "${id}".`); await fn(agent); });
  }
  private async withInstance(id: string, fn: () => Promise<void>): Promise<void> {
    if (this.inFlight.has(id)) throw new Error(`Agent "${id}" already has a lifecycle operation in progress.`);
    this.inFlight.add(id); try { await fn(); } catch (error) { agentHubRegistry.recordFailure(id, error instanceof Error ? error.message : String(error)); this.event('agent:failed', id, 'Agent failed.'); throw error; } finally { this.inFlight.delete(id); }
  }
  private startBackgroundWorker(): void {
    if (this.heartbeat) return;
    this.heartbeat = window.setInterval(() => void this.tick(), 15_000);
    void this.tick();
  }
  private async tick(): Promise<void> {
    for (const record of agentHubRegistry.getRecords()) {
      const agent = agentRegistry.getAgent(record.id);
      if (!agent) continue;
      if (!record.enabled || record.runtimeState === 'Disabled') { if (agent.state !== 'Stopped') await agent.stop(); continue; }
      const healthy = await agent.healthCheck().catch(() => false);
      const performanceMemory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      agentHubRegistry.recordHeartbeat(record.id, healthy, null, performanceMemory ? Math.round(performanceMemory.usedJSHeapSize / 1024 / 1024) : null);
    }
  }
  private event(type: string, agentId: string, message: string): void { agentEventEmitter.emit(type, { agentId }); agentHubRegistry.log(agentId, type === 'agent:failed' ? 'error' : 'info', message); const runtimeType: Record<string, RuntimeEventType> = { [AgentEvents.AGENT_STARTED]: 'AgentStarted', [AgentEvents.AGENT_STOPPED]: 'AgentStopped', [AgentEvents.AGENT_PAUSED]: 'AgentPaused', [AgentEvents.AGENT_RESUMED]: 'AgentResumed', 'agent:failed': 'TaskFailed' }; runtimeEventBus.publish(runtimeType[type] ?? 'Heartbeat', agentId, { message }); }
}

export const agentRuntime = new AgentRuntime();
