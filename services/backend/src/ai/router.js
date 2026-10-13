import { applyPersonality } from './personality.js';
import { behaviorEngine } from './BehaviorEngine.js';

/**
 * Intelligent Multi-Provider AI Router with Automatic Fallback
 */
export async function routeAICompletion({ prompt, messages, systemPrompt, preferredProvider = 'nvidia', behaviorSettings, action }) {
  const sourceMessages = messages || (prompt ? [{ role: 'user', content: prompt }] : []);
  const userMessage = prompt || [...sourceMessages].reverse().find(message => message.role === 'user')?.content || '';
  const policy = behaviorEngine.createPolicy(userMessage, behaviorSettings, action);
  const formattedMessages = applyPersonality(sourceMessages, behaviorEngine.buildSystemPrompt(policy, systemPrompt));

  const providersToTry = [];
  if (preferredProvider === 'nvidia' && process.env.NVIDIA_API_KEY) providersToTry.push('nvidia');
  if (process.env.GEMINI_API_KEY) providersToTry.push('gemini');
  if (process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY) providersToTry.push('openai');
  if (process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY) providersToTry.push('claude');

  // Fallback order ensure at least one provider attempt
  if (providersToTry.length === 0) {
    throw new Error('No AI provider API keys configured on server.');
  }

  let lastError = null;
  for (const provider of providersToTry) {
    try {
      console.log(`[AI Router] Attempting completion via provider: ${provider}`);
      if (provider === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedMessages.map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }],
            })),
          }),
        });
        if (!res.ok) throw new Error(`Gemini returned HTTP ${res.status}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { success: true, provider: 'gemini', text: behaviorEngine.finalizeText(text, policy), behavior: { intent: policy.intent, confidence: policy.confidence } };
      }

      if (provider === 'nvidia') {
        const apiKey = process.env.NVIDIA_API_KEY;
        const baseUrl = process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta/llama-3.1-70b-instruct',
            messages: formattedMessages,
            max_tokens: 1024,
          }),
        });
        if (!res.ok) throw new Error(`NVIDIA NIM returned HTTP ${res.status}`);
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        return { success: true, provider: 'nvidia', text: behaviorEngine.finalizeText(text, policy), behavior: { intent: policy.intent, confidence: policy.confidence } };
      }
    } catch (err) {
      console.warn(`[AI Router] Provider ${provider} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}
