import { missionLogger } from './MissionLogger';

export type MissionStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'paused'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  progress: number;
  createdAt: number;
  updatedAt: number;
  eta: number;
  assignedAgents: string[];
  logs: string[];
}

export class MissionEngineService {
  private missions: Map<string, Mission> = new Map();

  constructor() {
    this.initializeSampleMissions();
  }

  private initializeSampleMissions() {
    const defaultMissions: Mission[] = [
      {
        id: 'm-101',
        title: 'JARVIS OS Browser Subsystem Verification',
        description: 'Run automated E2E and stress tests across Browser engine',
        status: 'running',
        priority: 'critical',
        progress: 78,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        eta: 1800,
        assignedAgents: ['Browser Agent', 'Memory Agent', 'Voice Agent'],
        logs: [
          '09:45 - Mission initialized',
          '09:46 - Agent assignment verified',
          '09:48 - Browser preview active on localhost:5173',
        ],
      },
      {
        id: 'm-102',
        title: 'Vector Knowledge Base Neural Indexing',
        description: 'Re-index project telemetry records and user notes into vector database',
        status: 'completed',
        priority: 'high',
        progress: 100,
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 1800000,
        eta: 0,
        assignedAgents: ['Memory Agent', 'Research Agent'],
        logs: [
          '08:00 - Indexing started',
          '08:15 - 384 files parsed cleanly',
          '08:30 - Vector embeddings stored in SQLite index',
        ],
      },
      {
        id: 'm-103',
        title: 'Screen Vision UI Element Detection Pipeline',
        description: 'Parse active workspace elements and extract OCR text',
        status: 'planning',
        priority: 'medium',
        progress: 25,
        createdAt: Date.now() - 1200000,
        updatedAt: Date.now(),
        eta: 3600,
        assignedAgents: ['Vision Agent', 'Automation Agent'],
        logs: ['11:00 - Vision canvas initialized', '11:05 - OCR confidence score 98.4% verified'],
      },
    ];

    defaultMissions.forEach((m) => this.missions.set(m.id, m));
  }

  public getMissions(): Mission[] {
    return Array.from(this.missions.values());
  }

  public getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }

  public createMission(title: string, description: string, priority: MissionPriority = 'medium'): Mission {
    const startTime = performance.now();
    const newMission: Mission = {
      id: `m-${Date.now()}`,
      title,
      description,
      status: 'queued',
      priority,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      eta: 3600,
      assignedAgents: ['Browser Agent', 'Automation Agent'],
      logs: [`${new Date().toLocaleTimeString()} - Mission created`],
    };

    this.missions.set(newMission.id, newMission);
    const duration = Math.round(performance.now() - startTime);
    missionLogger.log('mission created', 'SUCCESS', duration, { id: newMission.id, title });
    return newMission;
  }

  public pauseMission(id: string) {
    const m = this.missions.get(id);
    if (m) {
      m.status = 'paused';
      m.updatedAt = Date.now();
      m.logs.push(`${new Date().toLocaleTimeString()} - Mission paused`);
    }
  }

  public resumeMission(id: string) {
    const m = this.missions.get(id);
    if (m) {
      m.status = 'running';
      m.updatedAt = Date.now();
      m.logs.push(`${new Date().toLocaleTimeString()} - Mission resumed`);
    }
  }

  public retryMission(id: string) {
    const m = this.missions.get(id);
    if (m) {
      m.status = 'running';
      m.progress = 10;
      m.updatedAt = Date.now();
      m.logs.push(`${new Date().toLocaleTimeString()} - Retrying mission execution`);
    }
  }

  public cancelMission(id: string) {
    const m = this.missions.get(id);
    if (m) {
      m.status = 'cancelled';
      m.updatedAt = Date.now();
      m.logs.push(`${new Date().toLocaleTimeString()} - Mission cancelled`);
    }
  }

  public duplicateMission(id: string): Mission | null {
    const m = this.missions.get(id);
    if (!m) return null;
    return this.createMission(`Copy of ${m.title}`, m.description, m.priority);
  }

  public archiveMission(id: string) {
    this.missions.delete(id);
  }
}

export const missionEngine = new MissionEngineService();
