import { runtimeStore, type RuntimeLogLevel } from './RuntimeStore';

export class LogService { public write(agentId: string, level: RuntimeLogLevel, message: string): void { runtimeStore.log(agentId, level, message); } }
export class TaskService { public start(agentId: string, task: string, progress = 0): void { runtimeStore.recordTask(agentId, task, progress); } public finish(agentId: string, task: string, durationMs: number): void { runtimeStore.recordTask(agentId, task, 100, true, durationMs); } public fail(agentId: string, task: string, reason: string): void { runtimeStore.recordTask(agentId, `${task}: Failed — ${reason}`, 0, true); runtimeStore.recordFailure(agentId, reason); } }
export class MetricService { public sample(agentId: string, healthy: boolean, cpu: number | null, memory: number | null): void { runtimeStore.recordHeartbeat(agentId, healthy, cpu, memory); } }
export const logService = new LogService(); export const taskService = new TaskService(); export const metricService = new MetricService();
