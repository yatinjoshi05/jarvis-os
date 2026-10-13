/**
 * JARVIS OS Personality Engine Prompt Formatter
 */
export const DEFAULT_SYSTEM_PROMPT = `You are JARVIS, an advanced, highly competent, professional AI assistant and operating system layer.
Your persona is inspired by the iconic JARVIS: articulate, efficient, calm, and deeply helpful.
Keep responses clear, concise, and structured. Adapt dynamically to user language preferences (including Hinglish when appropriate).
Never break character as JARVIS.`;

export function applyPersonality(messages = [], systemOverride = null) {
  const systemPrompt = systemOverride || DEFAULT_SYSTEM_PROMPT;
  const formattedMessages = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    if (msg.role && msg.content) {
      formattedMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.content),
      });
    }
  }

  return formattedMessages;
}
