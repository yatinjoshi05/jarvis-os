import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CUSTOM_KEYS_PATH = path.resolve(__dirname, '../../.env.custom-keys');

export function maskKey(key) {
  if (!key || typeof key !== 'string' || !key.trim()) return null;
  const str = key.trim();
  if (str.length <= 8) return '••••••••';
  const prefix = str.slice(0, 4);
  const suffix = str.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

export function persistCustomKey(envVarKey, providerId, value) {
  try {
    let content = '';
    if (fs.existsSync(CUSTOM_KEYS_PATH)) {
      content = fs.readFileSync(CUSTOM_KEYS_PATH, 'utf-8');
    }
    const regex1 = new RegExp(`^${envVarKey}=.*$`, 'm');
    if (regex1.test(content)) {
      content = content.replace(regex1, `${envVarKey}=${value}`);
    } else {
      content += `${content && !content.endsWith('\n') ? '\n' : ''}${envVarKey}=${value}\n`;
    }
    if (providerId && providerId !== envVarKey) {
      const regex2 = new RegExp(`^${providerId}=.*$`, 'm');
      if (regex2.test(content)) {
        content = content.replace(regex2, `${providerId}=${value}`);
      } else {
        content += `${providerId}=${value}\n`;
      }
    }
    fs.writeFileSync(CUSTOM_KEYS_PATH, content, 'utf-8');
    console.log(`[JARVIS Backend] Custom key persisted to .env.custom-keys: ${envVarKey}`);
  } catch (err) {
    console.error('[JARVIS Backend] Failed to write .env.custom-keys:', err);
  }
}

let nvidiaStatusReason = 'Key missing';

export async function checkNvidiaReachability() {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
  if (!NVIDIA_API_KEY) {
    nvidiaStatusReason = 'API Key missing';
    return false;
  }
  try {
    const baseUrl = process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${NVIDIA_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      nvidiaStatusReason = 'Reachable & active';
      return true;
    } else {
      nvidiaStatusReason = `HTTP ${res.status} ${res.statusText}`;
      return false;
    }
  } catch (err) {
    nvidiaStatusReason = err?.message || 'Network unreachable';
    return false;
  }
}

export async function validateApiKey(providerId, rawKey, baseUrl, customHeaders = {}) {
  if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
    return { valid: false, error: 'API key string cannot be empty.' };
  }

  const trimmedKey = rawKey.trim();
  const startTime = Date.now();

  try {
    if (providerId === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (res && res.ok) {
        return { valid: true, message: 'Google Gemini key verified successfully.', latencyMs: Date.now() - startTime };
      }
      if (res && (res.status === 400 || res.status === 403 || res.status === 401)) {
        return { valid: false, error: 'Authentication failed with Google Gemini — API key is invalid or restricted.' };
      }
      return { valid: false, error: res ? `Google Gemini API returned HTTP ${res.status}.` : 'Network timeout contacting Google Gemini API.' };
    }

    if (providerId === 'nvidia') {
      const targetUrl = `${process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'}/chat/completions`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);

      if (res && (res.ok || res.status === 200)) {
        return { valid: true, message: 'NVIDIA NIM key verified successfully.', latencyMs: Date.now() - startTime };
      }
      if (res && (res.status === 401 || res.status === 403)) {
        return { valid: false, error: 'Authentication failed with NVIDIA NIM — API key is invalid.' };
      }
      return { valid: false, error: res ? `NVIDIA NIM API returned HTTP ${res.status}.` : 'Network timeout contacting NVIDIA NIM API.' };
    }

    if (providerId === 'elevenlabs') {
      const url = 'https://api.elevenlabs.io/v1/user';
      const res = await fetch(url, {
        headers: { 'xi-api-key': trimmedKey },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res && res.ok) {
        return { valid: true, message: 'ElevenLabs Speech TTS key verified successfully.', latencyMs: Date.now() - startTime };
      }
      if (res && (res.status === 401 || res.status === 403)) {
        return { valid: false, error: 'Authentication failed with ElevenLabs — API key is invalid.' };
      }
      return { valid: false, error: res ? `ElevenLabs API returned HTTP ${res.status}.` : 'Network timeout contacting ElevenLabs API.' };
    }

    if (providerId === 'openai') {
      const url = 'https://api.openai.com/v1/models';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${trimmedKey}` },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res && res.ok) {
        return { valid: true, message: 'OpenAI key verified successfully.', latencyMs: Date.now() - startTime };
      }
      if (res && (res.status === 401 || res.status === 403)) {
        return { valid: false, error: 'Authentication failed with OpenAI — API key is invalid.' };
      }
      return { valid: false, error: res ? `OpenAI API returned HTTP ${res.status}.` : 'Network timeout contacting OpenAI API.' };
    }

    if (providerId === 'claude') {
      const url = 'https://api.anthropic.com/v1/messages';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res && (res.ok || res.status === 400)) {
        return { valid: true, message: 'Anthropic Claude key verified successfully.', latencyMs: Date.now() - startTime };
      }
      if (res && (res.status === 401 || res.status === 403)) {
        return { valid: false, error: 'Authentication failed with Anthropic Claude — API key is invalid or unauthorized.' };
      }
      return { valid: false, error: res ? `Anthropic Claude API returned HTTP ${res.status}.` : 'Network timeout contacting Anthropic Claude API.' };
    }

    if (providerId === 'finnhub') {
      const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${trimmedKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.c === 'number' && data.c > 0) {
          return { valid: true, message: 'Finnhub Market Data key verified successfully.', latencyMs: Date.now() - startTime };
        }
      }
      if (res && (res.status === 401 || res.status === 403)) {
        return { valid: false, error: 'Authentication failed with Finnhub — API key is invalid or token restricted.' };
      }
      return { valid: false, error: 'Finnhub API key failed live quote query check.' };
    }

    if (providerId === 'twilio') {
      if (!trimmedKey.startsWith('AC') || trimmedKey.length < 30) {
        return { valid: false, error: 'Twilio Account SID must start with "AC" and be 34 characters long.' };
      }
      return { valid: true, message: 'Twilio Account SID format verified.', latencyMs: Date.now() - startTime };
    }

    if (providerId === 'whatsapp') {
      const url = 'https://graph.facebook.com/v18.0/me';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${trimmedKey}` },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res && res.ok) {
        return { valid: true, message: 'WhatsApp Business API token verified successfully.', latencyMs: Date.now() - startTime };
      }
      if (res && (res.status === 401 || res.status === 400)) {
        return { valid: false, error: 'Authentication failed with Meta WhatsApp API — Token is invalid or expired.' };
      }
      return { valid: false, error: res ? `WhatsApp API returned HTTP ${res.status}.` : 'Network timeout contacting WhatsApp API.' };
    }

    return { valid: false, error: `Unknown providerId: ${providerId}` };
  } catch (err) {
    console.error(`[Validation] Error validating ${providerId}:`, err);
    return { valid: false, error: `Network error reaching ${providerId} API — Check connection and try again.` };
  }
}
