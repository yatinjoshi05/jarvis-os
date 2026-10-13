import { Router } from 'express';
import { BrainService } from '../services/BrainService.js';

const router = Router();

const readError = async (response) => {
  const text = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(text);
    return parsed.error?.message || parsed.error || text || 'Upstream provider returned an unreadable error.';
  } catch (_) {
    return text || 'Upstream provider returned an unreadable error.';
  }
};

router.post('/chat/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const cfUrl = process.env.VITE_CLOUDFLARE_GATEWAY_URL;
  const cfToken = process.env.CLOUDFLARE_GATEWAY_TOKEN;

  if (!apiKey && (!cfUrl || !cfToken)) {
    return res.status(503).json({ error: 'Gemini is not configured on the backend.' });
  }

  const requestedModel = String(req.body?.model || 'gemini-2.0-flash-lite').trim();
  const model = requestedModel === 'gemini-3.5-flash' ? 'gemini-2.0-flash' : requestedModel;
  if (!/^gemini-[a-z0-9.-]+$/i.test(model)) return res.status(400).json({ error: 'Invalid Gemini model.' });

  const wantStream = !!req.body?.stream;
  // Gemini uses different endpoints: generateContent (blocking) vs streamGenerateContent (SSE)
  const action = wantStream ? 'streamGenerateContent' : 'generateContent';
  const geminiBody = JSON.stringify({
    contents: req.body?.contents || [],
    system_instruction: req.body?.system_instruction,
    generationConfig: req.body?.generationConfig
  });

  try {
    let upstream = null;

    if (apiKey) {
      const qs = wantStream ? '?alt=sse&' : '?';
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${action}${qs}key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: geminiBody,
          signal: AbortSignal.timeout(30_000)
        }
      ).catch(() => null);
    }

    if ((!upstream || !upstream.ok) && cfUrl && cfToken) {
      const cleanCfUrl = cfUrl.replace(/\/+$/, '');
      const gatewayUpstream = await fetch(`${cleanCfUrl}/models/${encodeURIComponent(model)}:${action}${wantStream ? '?alt=sse' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-aig-authorization': `Bearer ${cfToken}`
        },
        body: geminiBody,
        signal: AbortSignal.timeout(30_000)
      }).catch(() => null);

      // Keep the direct provider error (for example, a 429 quota response)
      // unless the gateway fallback actually succeeds.
      if (!upstream || gatewayUpstream?.ok) {
        upstream = gatewayUpstream;
      }
    }

    if (!upstream) {
      return res.status(502).json({ error: 'Gemini upstream unavailable: No response from direct or gateway endpoints.' });
    }

    if (!upstream.ok) {
      const errMessage = await readError(upstream);
      return res.status(upstream.status).json({ error: errMessage });
    }

    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      const { Readable } = await import('stream');
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      res.json(await upstream.json());
    }
  } catch (error) {
    res.status(502).json({ error: `Gemini upstream unavailable: ${error.message}` });
  }
});


router.post('/chat/nvidia', async (req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'NVIDIA NIM is not configured on the backend.' });
  const baseUrl = (process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
  const wantStream = !!req.body?.stream;
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.body?.model || 'meta/llama-3.1-8b-instruct',
        messages: req.body?.messages || [],
        stream: wantStream,
        ...(req.body?.temperature !== undefined && { temperature: req.body.temperature }),
        ...(req.body?.max_tokens !== undefined && { max_tokens: req.body.max_tokens }),
      }),
      signal: AbortSignal.timeout(30_000)
    });
    if (!upstream.ok) {
      const errMessage = await readError(upstream);
      return res.status(upstream.status).json({ error: errMessage });
    }
    if (wantStream) {
      // Pipe SSE stream directly to client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      const { Readable } = await import('stream');
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      res.json(await upstream.json());
    }
  } catch (error) {
    res.status(502).json({ error: `NVIDIA upstream unavailable: ${error.message}` });
  }
});


router.get('/models/nvidia', async (_req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'NVIDIA NIM is not configured on the backend.' });
  try {
    const upstream = await fetch(`${(process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5_000)
    });
    if (!upstream.ok) {
      const errMessage = await readError(upstream);
      return res.status(upstream.status).json({ error: errMessage });
    }
    res.json(await upstream.json());
  } catch (error) {
    res.status(502).json({ error: `NVIDIA upstream unavailable: ${error.message}` });
  }
});

router.get('/keys/status', async (_req, res) => {
  const nvidiaStatus = await BrainService.getPrimaryProviderStatus();
  const getGeminiEnabled = () => !!(process.env.VITE_CLOUDFLARE_GATEWAY_URL && process.env.CLOUDFLARE_GATEWAY_TOKEN) || !!process.env.GEMINI_API_KEY;
  const getElevenLabsEnabled = () => !!process.env.ELEVENLABS_API_KEY;
  const getTwilioEnabled = () => !!process.env.TWILIO_ACCOUNT_SID;
  const getWhatsAppEnabled = () => !!process.env.WHATSAPP_API_TOKEN;

  res.json({
    status: 'ok',
    keys: {
      gemini: {
        providerName: 'Google Gemini',
        active: getGeminiEnabled(),
        maskedKey: BrainService.maskProviderKey(process.env.GEMINI_API_KEY),
        envVar: 'GEMINI_API_KEY',
      },
      nvidia: {
        providerName: 'NVIDIA NIM',
        active: nvidiaStatus.active,
        maskedKey: BrainService.maskProviderKey(process.env.NVIDIA_API_KEY),
        envVar: 'NVIDIA_API_KEY',
      },
      elevenlabs: {
        providerName: 'ElevenLabs Speech TTS',
        active: getElevenLabsEnabled(),
        maskedKey: BrainService.maskProviderKey(process.env.ELEVENLABS_API_KEY),
        envVar: 'ELEVENLABS_API_KEY',
      },
      openai: {
        providerName: 'OpenAI (GPT-4o & Audio)',
        active: !!(process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
        maskedKey: BrainService.maskProviderKey(process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
        envVar: 'VITE_OPENAI_API_KEY',
      },
      claude: {
        providerName: 'Anthropic Claude',
        active: !!(process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY),
        maskedKey: BrainService.maskProviderKey(process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY),
        envVar: 'VITE_CLAUDE_API_KEY',
      },
      finnhub: {
        providerName: 'Finnhub Market Data',
        active: !!(process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY),
        maskedKey: BrainService.maskProviderKey(process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY),
        envVar: 'FINNHUB_API_KEY',
      },
      twilio: {
        providerName: 'Twilio Telephony Agent',
        active: getTwilioEnabled(),
        maskedKey: BrainService.maskProviderKey(process.env.TWILIO_ACCOUNT_SID),
        envVar: 'TWILIO_ACCOUNT_SID',
      },
      whatsapp: {
        providerName: 'WhatsApp Business API',
        active: getWhatsAppEnabled(),
        maskedKey: BrainService.maskProviderKey(process.env.WHATSAPP_API_TOKEN),
        envVar: 'WHATSAPP_API_TOKEN',
      },
    },
  });
});

router.post('/keys/validate', async (req, res) => {
  const { providerId, rawKey, baseUrl, customHeaders } = req.body;
  if (!providerId || !rawKey) {
    return res.status(400).json({ success: false, error: 'providerId and rawKey are required.' });
  }

  const result = await BrainService.validateProviderKey(providerId, rawKey, baseUrl, customHeaders);
  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.error, providerId });
  }

  return res.json({ success: true, message: result.message, latencyMs: result.latencyMs, providerId });
});

router.post('/ai/chat', async (req, res) => {
  try {
    const { prompt, messages, systemPrompt, preferredProvider, behaviorSettings, action } = req.body;
    const result = await BrainService.complete({ prompt, messages, systemPrompt, preferredProvider, behaviorSettings, action });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ── Memory Embedding Proxy ────────────────────────────────────────────────────
// Calls Gemini text-embedding-004 server-side — keeps API key out of the browser
router.post('/memory/embed', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ ok: false, error: 'Embedding service not configured (no Gemini API key).' });
  }

  const texts = req.body?.texts;
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ ok: false, error: '`texts` array is required.' });
  }
  if (texts.length > 50) {
    return res.status(400).json({ ok: false, error: 'Maximum 50 texts per batch request.' });
  }

  const model = 'text-embedding-004';
  const requests = texts.map((text) => ({
    model: `models/${model}`,
    content: { parts: [{ text: String(text).slice(0, 8000) }] }, // Gemini 8K char limit
  }));

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({ ok: false, error: `Gemini embedding error: ${errText}` });
    }

    const data = await upstream.json();
    const embeddings = (data.embeddings || []).map((e) => e.values || []);
    return res.json({ ok: true, embeddings, model, dimensions: embeddings[0]?.length ?? 0 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Embedding generation failed.' });
  }
});

export default router;

