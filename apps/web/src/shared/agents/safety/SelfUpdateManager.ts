import { autonomySafetyManager } from './AutonomySafetyManager';
import { agentRegistry } from '../AgentRegistry';

export interface SelfUpdateResult {
  success: boolean;
  agentId: string;
  updated: boolean;
  reason?: string;
  snapshotId?: string;
  newKnowledge?: string;
}

export class SelfUpdateManager {
  /**
   * Triggers an autonomous self-update for an agent.
   * Fetches domain updates, snapshots prior state, enforces rate limits and kill switch,
   * and records an audit log entry.
   */
  public async selfUpdateAgent(
    agentId: string,
    topicOrQuery: string,
    proposedKnowledge: string
  ): Promise<SelfUpdateResult> {
    // 1. Check Kill Switch
    if (autonomySafetyManager.isKillSwitchActive()) {
      const reason = `Kill switch is ACTIVE (${autonomySafetyManager.getKillSwitchReason()}). Self-update blocked.`;
      return { success: false, agentId, updated: false, reason };
    }

    // 2. Check Rate Limit
    const rateCheck = autonomySafetyManager.checkRateLimit();
    if (!rateCheck.allowed) {
      return { success: false, agentId, updated: false, reason: rateCheck.reason };
    }

    // 3. Find Agent in Registry
    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      return { success: false, agentId, updated: false, reason: `Agent "${agentId}" not found in registry.` };
    }

    // 4. Capture Before Snapshot
    const beforeState = {
      id: agent.id,
      name: agent.name,
      capabilities: [...agent.capabilities],
      description: agent.role,
    };
    const snapshotId = autonomySafetyManager.createSnapshot(
      agentId,
      JSON.stringify(beforeState, null, 2),
      `Self-update snapshot before updating topic: ${topicOrQuery}`
    );

    // 5. Apply Knowledge/Logic Update
    const updatedCap = {
      id: `self_update_${Date.now()}`,
      name: `Updated Knowledge: ${topicOrQuery.slice(0, 30)}`,
      description: proposedKnowledge.slice(0, 100),
    };
    agent.capabilities.push(updatedCap);

    // Record rate limit consumption
    autonomySafetyManager.recordAutonomousAction();

    // 6. Log Audit Entry
    const afterState = {
      id: agent.id,
      name: agent.name,
      capabilities: [...agent.capabilities],
    };

    autonomySafetyManager.logAudit({
      actionType: 'AGENT_SELF_UPDATE',
      agentId,
      summary: `Agent "${agent.name}" self-updated knowledge on topic: "${topicOrQuery}"`,
      reasoning: `Autonomous domain information search & knowledge expansion`,
      beforeState,
      afterState,
      snapshotId,
    });

    return {
      success: true,
      agentId,
      updated: true,
      snapshotId,
      newKnowledge: proposedKnowledge,
    };
  }

  /**
   * Rolls back an agent to a previous snapshot state.
   */
  public rollbackAgent(agentId: string, snapshotId: string): { success: boolean; reason?: string } {
    const snapshot = autonomySafetyManager.getSnapshot(snapshotId);
    if (!snapshot) {
      return { success: false, reason: `Snapshot "${snapshotId}" not found.` };
    }

    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      return { success: false, reason: `Agent "${agentId}" not found in registry.` };
    }

    try {
      const restored = JSON.parse(snapshot.codeOrConfig);
      if (restored.capabilities) {
        agent.capabilities = restored.capabilities;
      }
      autonomySafetyManager.logAudit({
        actionType: 'SUPERVISOR_AUTO_FIX',
        agentId,
        summary: `Agent "${agent.name}" rolled back to snapshot ${snapshotId}`,
        reasoning: `User or Supervisor requested rollback to snapshot`,
        afterState: restored,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, reason: `Failed to restore snapshot: ${err.message}` };
    }
  }
}

export const selfUpdateManager = new SelfUpdateManager();
export default selfUpdateManager;
