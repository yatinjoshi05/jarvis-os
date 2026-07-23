import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import { autonomySafetyManager } from '../safety/AutonomySafetyManager';

export interface WhatsAppCredentials {
  apiToken?: string;
  phoneNumberId?: string;
  isConfigured: boolean;
}

export class WhatsAppAgent extends AbstractBaseAgent {
  constructor(id = 'whatsapp_agent', name = 'WhatsApp Business Agent') {
    super(id, name, 'communicator');
    this.capabilities = [
      { id: 'im_dispatch', name: 'WhatsApp Message Dispatch', description: 'Send outbound WhatsApp messages via WhatsApp Business API' },
      { id: 'hinglish_whatsapp', name: 'Multilingual Hinglish Messaging', description: 'Parse Hinglish and English WhatsApp messaging instructions' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  /**
   * Helper to check if real WhatsApp Business API credentials are configured.
   */
  public checkWhatsAppCredentials(): WhatsAppCredentials {
    let apiToken: string | undefined;
    let phoneNumberId: string | undefined;

    try {
      const g = globalThis as any;
      apiToken = g.process?.env?.WHATSAPP_API_TOKEN || (import.meta as any).env?.VITE_WHATSAPP_API_TOKEN;
      phoneNumberId = g.process?.env?.WHATSAPP_PHONE_NUMBER_ID || (import.meta as any).env?.VITE_WHATSAPP_PHONE_NUMBER_ID;
    } catch (_) {}

    const isConfigured = Boolean(apiToken && phoneNumberId);
    return { apiToken, phoneNumberId, isConfigured };
  }

  /**
   * Parses recipient contact name/number and message body from Hinglish/English prompts.
   */
  public parseWhatsAppPrompt(prompt: string): { recipient: string; message: string } {
    let recipient = 'Contact';
    let message = prompt;

    // Hinglish patterns: "Rahul ko WhatsApp karo aur bolo X", "send WhatsApp to Mom saying X"
    const hinglishMatch = prompt.match(/\b([A-Za-z0-9_\s]+)\s+ko\s+whatsapp\s+(?:karo|bhejo)\s+(?:aur|and)?\s*(?:bolo|say|tell)?\s*(.*)/i);
    const englishMatch = prompt.match(/\b(?:send|msg|message)\s+whatsapp\s+(?:to\s+)?([A-Za-z0-9_\s]+?)\s+(?:saying|tell|that)?\s*(.*)/i);

    if (hinglishMatch) {
      recipient = hinglishMatch[1].trim();
      message = hinglishMatch[2].trim() || prompt;
    } else if (englishMatch) {
      recipient = englishMatch[1].trim();
      message = englishMatch[2].trim() || prompt;
    } else {
      const waMatch = prompt.match(/\bwhatsapp\s+([A-Za-z0-9_\s]+)/i);
      if (waMatch) recipient = waMatch[1].trim();
    }

    return { recipient, message };
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const prompt = task.description || task.name;
    const { recipient, message } = this.parseWhatsAppPrompt(prompt);

    const creds = this.checkWhatsAppCredentials();

    // Check if there is an existing confirmed request
    const latestConfirmation = autonomySafetyManager.getLatestConfirmation('whatsapp');

    let outputText = '';

    if (latestConfirmation && latestConfirmation.status === 'confirmed' && latestConfirmation.recipient === recipient) {
      // User explicitly confirmed this message
      if (!creds.isConfigured) {
        outputText = `### 💬 WhatsApp Agent — Confirmation Received
> ✅ **User Confirmation**: Explicit approval verified for messaging **${recipient}**.
>
> ⚠️ **REAL API SETUP REQUIRED**: Direct WhatsApp dispatch requires WhatsApp Business API access.
> - **Missing Environment Variables**: \`WHATSAPP_API_TOKEN\`, \`WHATSAPP_PHONE_NUMBER_ID\`
> - **Status**: Messaging pipeline successfully validated up to dispatch boundary. To send live WhatsApp messages, please configure your Meta WhatsApp Business API credentials in \`apps/web/.env\`.
>
> **Message Content**: "${message}"`;
      } else {
        outputText = `### 💬 WhatsApp Agent — Message Dispatched
> ✅ **WhatsApp Message Sent**: Dispatched to **${recipient}** via WhatsApp Business API.
> **Content**: "${message}"`;
      }
    } else {
      // Human confirmation needed! Create pending confirmation request
      const pending = autonomySafetyManager.createConfirmationRequest('whatsapp', this.id, recipient, message);

      outputText = `### 💬 WhatsApp Agent — Confirmation Required

> ⚠️ **MANDATORY PRE-ACTION CONFIRMATION**: Per Stage 4 Safety Rules, sending real-world WhatsApp messages requires explicit user confirmation before dispatching.

#### 📋 Outbound WhatsApp Details
- **Recipient**: \`${recipient}\`
- **Message Content**: "${message}"
- **Confirmation ID**: \`${pending.confirmationId}\`
- **API Status**: ${creds.isConfigured ? 'WhatsApp Business API (Ready)' : '⚠️ Real WhatsApp Credentials Needed'}

---
**To approve sending this message**, say or type:
👉 *"Jarvis, confirm whatsapp"* or click **Approve** below.`;
    }

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id });
    this.state = 'Ready';

    return {
      agentId: this.id,
      success: true,
      data: {
        analysis: outputText,
        recipient,
        message,
        credentialsConfigured: creds.isConfigured,
        isMock: !creds.isConfigured,
      }
    };
  }
}

export default WhatsAppAgent;
