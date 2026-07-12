export interface PromptConfig {
  systemPrompt?: string;
  history?: Array<{ role: string; content: string }>;
  userPrompt: string;
  tools?: any[];
  memory?: string;
  plugins?: any[];
}

export class PromptBuilder {
  public static buildPrompt(config: PromptConfig): string {
    let prompt = '';

    if (config.systemPrompt) {
      prompt += `System: ${config.systemPrompt}\n\n`;
    }

    if (config.memory) {
      prompt += `Context/Memory:\n${config.memory}\n\n`;
    }

    if (config.history && config.history.length > 0) {
      prompt += `Conversation History:\n`;
      for (const msg of config.history) {
        const roleName = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${roleName}: ${msg.content}\n`;
      }
      prompt += `\n`;
    }

    if (config.tools && config.tools.length > 0) {
      prompt += `Available Tools:\n${JSON.stringify(config.tools, null, 2)}\n\n`;
    }

    if (config.plugins && config.plugins.length > 0) {
      prompt += `Available Plugins:\n${JSON.stringify(config.plugins, null, 2)}\n\n`;
    }

    prompt += `User Input: ${config.userPrompt}`;

    return prompt;
  }
}
