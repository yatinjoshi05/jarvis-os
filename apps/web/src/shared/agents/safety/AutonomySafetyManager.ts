/**
 * AutonomySafetyManager
 * Centralized safety infrastructure for JARVIS OS Stage 4 Full Autonomy.
 * Enforces:
 * 1. Human-readable Audit Trail logging (persistent)
 * 2. Rolling window Rate Limiting for self-expansion & self-updates
 * 3. Immediate Kill Switch toggle ("Jarvis, pause self-modification")
 * 4. Code / Config Snapshotting and Rollback engine
 * 5. Explicit Per-Action Confirmation Queue (Calling & WhatsApp)
 */

export interface AuditEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  actionType: 'AGENT_CREATION' | 'AGENT_SELF_UPDATE' | 'SUPERVISOR_AUTO_FIX' | 'KILL_SWITCH_TOGGLE' | 'CONFIRMATION_REQUEST' | 'CONFIRMATION_EXECUTE' | 'CONFIRMATION_REJECT';
  agentId: string;
  summary: string;
  reasoning: string;
  beforeState?: any;
  afterState?: any;
  snapshotId?: string;
}

export interface AgentSnapshot {
  snapshotId: string;
  agentId: string;
  timestamp: number;
  description: string;
  codeOrConfig: string;
}

export interface PendingConfirmation {
  confirmationId: string;
  type: 'call' | 'whatsapp';
  agentId: string;
  recipient: string;
  content: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
}

class AutonomySafetyManager {
  private auditLogKey = 'jarvis_autonomy_audit_log';
  private snapshotKey = 'jarvis_agent_snapshots';
  
  private inMemoryAuditLog: AuditEntry[] = [];
  private inMemorySnapshots: Map<string, AgentSnapshot> = new Map();
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map();

  // Rate Limiting Config
  private maxActionsPerHour = 5;
  private actionTimestamps: number[] = [];

  // Kill Switch State
  private killSwitchActive = false;
  private killSwitchReason = '';

  constructor() {
    this.loadPersistedData();
  }

  private loadPersistedData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedLog = localStorage.getItem(this.auditLogKey);
        if (storedLog) {
          this.inMemoryAuditLog = JSON.parse(storedLog);
        }
        const storedSnaps = localStorage.getItem(this.snapshotKey);
        if (storedSnaps) {
          const parsed: AgentSnapshot[] = JSON.parse(storedSnaps);
          parsed.forEach((s) => this.inMemorySnapshots.set(s.snapshotId, s));
        }
      }
    } catch (_) {
      // Fallback to in-memory store
    }
  }

  private persistData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.auditLogKey, JSON.stringify(this.inMemoryAuditLog.slice(-200)));
        const snapsArray = Array.from(this.inMemorySnapshots.values()).slice(-100);
        localStorage.setItem(this.snapshotKey, JSON.stringify(snapsArray));
      }
    } catch (_) {
      // Ignore storage errors in restricted contexts
    }
  }

  // ─── 1. AUDIT TRAIL ────────────────────────────────────────────────────────

  public logAudit(entry: {
    actionType: AuditEntry['actionType'];
    agentId: string;
    summary: string;
    reasoning: string;
    beforeState?: any;
    afterState?: any;
    snapshotId?: string;
  }): AuditEntry {
    const now = Date.now();
    const auditRecord: AuditEntry = {
      id: `aud_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      formattedTime: new Date(now).toISOString(),
      actionType: entry.actionType,
      agentId: entry.agentId,
      summary: entry.summary,
      reasoning: entry.reasoning,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      snapshotId: entry.snapshotId,
    };

    this.inMemoryAuditLog.unshift(auditRecord);
    this.persistData();
    console.log(`[AUTONOMY AUDIT LOG] [${auditRecord.actionType}] Agent: ${entry.agentId} | ${entry.summary}`);
    return auditRecord;
  }

  public getAuditLog(limit = 50): AuditEntry[] {
    return this.inMemoryAuditLog.slice(0, limit);
  }

  // ─── 2. RATE LIMITER ───────────────────────────────────────────────────────

  public checkRateLimit(): { allowed: boolean; reason?: string; remainingWindowMs?: number } {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window
    
    // Filter timestamps within current window
    this.actionTimestamps = this.actionTimestamps.filter((t) => now - t < windowMs);

    if (this.actionTimestamps.length >= this.maxActionsPerHour) {
      const oldestInWindow = this.actionTimestamps[0];
      const remainingWindowMs = windowMs - (now - oldestInWindow);
      const remainingMinutes = Math.ceil(remainingWindowMs / (60 * 1000));
      const reason = `Rate limit cap reached (${this.maxActionsPerHour} actions/hour). Autonomous actions paused for ${remainingMinutes} min.`;
      
      this.logAudit({
        actionType: 'KILL_SWITCH_TOGGLE',
        agentId: 'safety_system',
        summary: 'Rate limit cap enforced',
        reasoning: reason,
      });

      return { allowed: false, reason, remainingWindowMs };
    }

    return { allowed: true };
  }

  public recordAutonomousAction() {
    this.actionTimestamps.push(Date.now());
  }

  // ─── 3. KILL SWITCH ────────────────────────────────────────────────────────

  public isKillSwitchActive(): boolean {
    return this.killSwitchActive;
  }

  public getKillSwitchReason(): string {
    return this.killSwitchReason;
  }

  public pauseSelfModification(reason = 'Manual user command or safety trigger'): void {
    this.killSwitchActive = true;
    this.killSwitchReason = reason;
    this.logAudit({
      actionType: 'KILL_SWITCH_TOGGLE',
      agentId: 'safety_system',
      summary: '🛑 Autonomous Self-Modification PAUSED (Kill Switch Active)',
      reasoning: reason,
    });
  }

  public resumeSelfModification(): void {
    this.killSwitchActive = false;
    this.killSwitchReason = '';
    this.logAudit({
      actionType: 'KILL_SWITCH_TOGGLE',
      agentId: 'safety_system',
      summary: '▶️ Autonomous Self-Modification RESUMED (Kill Switch Deactivated)',
      reasoning: 'Explicit user resumption request',
    });
  }

  // ─── 4. SNAPSHOT & ROLLBACK ENGINE ─────────────────────────────────────────

  public createSnapshot(agentId: string, codeOrConfig: string, description: string): string {
    const snapshotId = `snap_${agentId}_${Date.now()}`;
    const snapshot: AgentSnapshot = {
      snapshotId,
      agentId,
      timestamp: Date.now(),
      description,
      codeOrConfig,
    };

    this.inMemorySnapshots.set(snapshotId, snapshot);
    this.persistData();
    return snapshotId;
  }

  public getSnapshot(snapshotId: string): AgentSnapshot | null {
    return this.inMemorySnapshots.get(snapshotId) || null;
  }

  public getSnapshotsForAgent(agentId: string): AgentSnapshot[] {
    return Array.from(this.inMemorySnapshots.values())
      .filter((s) => s.agentId === agentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // ─── 5. PENDING CONFIRMATION QUEUE (Calling & WhatsApp) ────────────────────

  public createConfirmationRequest(
    type: 'call' | 'whatsapp',
    agentId: string,
    recipient: string,
    content: string
  ): PendingConfirmation {
    const confirmationId = `conf_${type}_${Date.now()}`;
    const request: PendingConfirmation = {
      confirmationId,
      type,
      agentId,
      recipient,
      content,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.pendingConfirmations.set(confirmationId, request);
    this.logAudit({
      actionType: 'CONFIRMATION_REQUEST',
      agentId,
      summary: `Pending ${type.toUpperCase()} confirmation generated for ${recipient}`,
      reasoning: `Per-action human confirmation required for 3rd party ${type}`,
      afterState: { recipient, content },
    });

    return request;
  }

  public getPendingConfirmation(type?: 'call' | 'whatsapp'): PendingConfirmation | null {
    const pendingList = Array.from(this.pendingConfirmations.values()).filter(
      (c) => c.status === 'pending' && (!type || c.type === type)
    );
    if (pendingList.length === 0) return null;
    return pendingList[pendingList.length - 1];
  }

  public getLatestConfirmation(type?: 'call' | 'whatsapp'): PendingConfirmation | null {
    const list = Array.from(this.pendingConfirmations.values()).filter(
      (c) => !type || c.type === type
    );
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  public confirmPendingAction(confirmationId: string): PendingConfirmation | null {
    const req = this.pendingConfirmations.get(confirmationId);
    if (!req || req.status !== 'pending') return null;

    req.status = 'confirmed';
    this.logAudit({
      actionType: 'CONFIRMATION_EXECUTE',
      agentId: req.agentId,
      summary: `Confirmed ${req.type.toUpperCase()} to ${req.recipient}`,
      reasoning: `User explicitly approved execution`,
      afterState: { recipient: req.recipient, content: req.content },
    });
    return req;
  }

  public rejectPendingAction(confirmationId: string): PendingConfirmation | null {
    const req = this.pendingConfirmations.get(confirmationId);
    if (!req || req.status !== 'pending') return null;

    req.status = 'rejected';
    this.logAudit({
      actionType: 'CONFIRMATION_REJECT',
      agentId: req.agentId,
      summary: `Rejected ${req.type.toUpperCase()} to ${req.recipient}`,
      reasoning: `User cancelled/rejected request`,
    });
    return req;
  }
}

export const autonomySafetyManager = new AutonomySafetyManager();
export default autonomySafetyManager;
