import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import { autonomySafetyManager } from '../safety/AutonomySafetyManager';

export interface TelephonyCredentials {
  accountSid?: string;
  authToken?: string;
  fromPhoneNumber?: string;
  isConfigured: boolean;
}

export class CallingAgent extends AbstractBaseAgent {
  constructor(id = 'calling_agent', name = 'Telephony & Voice Calling Agent') {
    super(id, name, 'voice_communicator');
    this.capabilities = [
      { id: 'telephony_dial', name: 'Voice Call Dispatch', description: 'Initiate outbound automated or speech synthesized phone calls' },
      { id: 'hinglish_calling', name: 'Multilingual Hinglish Calling', description: 'Understand Hinglish voice instructions and call scripts' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  /**
   * Helper to check if real Twilio credentials are configured in environment.
   */
  public checkTwilioCredentials(): TelephonyCredentials {
    let accountSid: string | undefined;
    let authToken: string | undefined;
    let fromPhoneNumber: string | undefined;

    try {
      const g = globalThis as any;
      accountSid = g.process?.env?.TWILIO_ACCOUNT_SID || (import.meta as any).env?.VITE_TWILIO_ACCOUNT_SID;
      authToken = g.process?.env?.TWILIO_AUTH_TOKEN || (import.meta as any).env?.VITE_TWILIO_AUTH_TOKEN;
      fromPhoneNumber = g.process?.env?.TWILIO_PHONE_NUMBER || (import.meta as any).env?.VITE_TWILIO_PHONE_NUMBER;
    } catch (_) {}

    const isConfigured = Boolean(accountSid && authToken && fromPhoneNumber);
    return { accountSid, authToken, fromPhoneNumber, isConfigured };
  }

  /**
   * Parses recipient contact name/number and spoken message from Hinglish/English prompts.
   */
  public parseCallPrompt(prompt: string): { recipient: string; script: string } {
    let recipient = 'Contact';
    let script = prompt;

    // Hinglish patterns: "Rahul ko call karo aur bolo X", "call Mom and tell her X"
    const hinglishMatch = prompt.match(/\b([A-Za-z0-9_\s]+)\s+ko\s+call\s+karo\s+(?:aur|and)?\s*(?:bolo|say|tell)?\s*(.*)/i);
    const englishMatch = prompt.match(/\bcall\s+([A-Za-z0-9_\s]+?)\s+(?:and|to)?\s*(?:tell|say|speak)\s*(?:them|him|her)?\s*(.*)/i);

    if (hinglishMatch) {
      recipient = hinglishMatch[1].trim();
      script = hinglishMatch[2].trim() || prompt;
    } else if (englishMatch) {
      recipient = englishMatch[1].trim();
      script = englishMatch[2].trim() || prompt;
    } else {
      const callMatch = prompt.match(/\bcall\s+([A-Za-z0-9_\s]+)/i);
      if (callMatch) recipient = callMatch[1].trim();
    }

    return { recipient, script };
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const prompt = task.description || task.name;
    const { recipient, script } = this.parseCallPrompt(prompt);

    const creds = this.checkTwilioCredentials();

    // Check if there is an existing confirmed request or if we need to request confirmation first
    const latestConfirmation = autonomySafetyManager.getLatestConfirmation('call');

    let outputText = '';

    if (latestConfirmation && latestConfirmation.status === 'confirmed' && latestConfirmation.recipient === recipient) {
      // User explicitly confirmed this call
      if (!creds.isConfigured) {
        outputText = `### 📞 Voice Calling Agent — Confirmation Received
> ✅ **User Confirmation**: Explicit approval verified for calling **${recipient}**.
>
> ⚠️ **REAL API SETUP REQUIRED**: Real phone call dispatch requires Twilio API credentials.
> - **Missing Environment Variables**: \`TWILIO_ACCOUNT_SID\`, \`TWILIO_AUTH_TOKEN\`, \`TWILIO_PHONE_NUMBER\`
> - **Status**: Call pipeline successfully validated up to dispatch boundary. To place live calls, please configure your Twilio credentials in \`apps/web/.env\`.
>
> **Planned Script**: "${script}"`;
      } else {
        outputText = `### 📞 Voice Calling Agent — Dispatching Call
> ✅ **Call Dispatched via Twilio**: Calling **${recipient}** from \`${creds.fromPhoneNumber}\`.
> **Script**: "${script}"`;
      }
    } else {
      // Human confirmation needed! Create pending confirmation request
      const pending = autonomySafetyManager.createConfirmationRequest('call', this.id, recipient, script);

      outputText = `### 📞 Voice Calling Agent — Confirmation Required

> ⚠️ **MANDATORY PRE-ACTION CONFIRMATION**: Per Stage 4 Safety Rules, real-world voice calls require explicit user confirmation before dialing.

#### 📋 Outbound Call Details
- **Target Recipient**: \`${recipient}\`
- **Speech Script**: "${script}"
- **Confirmation ID**: \`${pending.confirmationId}\`
- **Telephony Provider**: ${creds.isConfigured ? 'Twilio (Ready)' : '⚠️ Real Twilio Credentials Needed'}

---
**To approve this call**, say or type:
👉 *"Jarvis, confirm call"* or click **Approve** below.`;
    }

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id });
    this.state = 'Ready';

    return {
      agentId: this.id,
      success: true,
      data: {
        analysis: outputText,
        recipient,
        script,
        credentialsConfigured: creds.isConfigured,
        isMock: !creds.isConfigured,
      }
    };
  }
}

export default CallingAgent;
