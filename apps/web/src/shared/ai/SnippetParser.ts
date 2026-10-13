export interface ParsedProviderSnippet {
  name?: string;
  baseUrl?: string;
  modelName?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  formatDetected: 'python' | 'langchain' | 'node' | 'curl' | 'generic';
  warnings: string[];
}

export function inferProviderName(url: string): string {
  if (!url) return 'Custom Provider';
  const lower = url.toLowerCase();

  if (lower.includes('nvidia.com')) return 'NVIDIA NIM';
  if (lower.includes('groq.com')) return 'Groq AI';
  if (lower.includes('together')) return 'Together AI';
  if (lower.includes('openrouter.ai')) return 'OpenRouter';
  if (lower.includes('deepseek.com')) return 'DeepSeek AI';
  if (lower.includes('mistral.ai')) return 'Mistral AI';
  if (lower.includes('perplexity.ai')) return 'Perplexity AI';
  if (lower.includes('fireworks.ai')) return 'Fireworks AI';
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) return 'LM Studio / Local Endpoint';

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^api\./, '').replace(/^integrate\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1) + ' Provider';
    }
  } catch (_) {}

  return 'Custom Provider';
}

export function parseProviderSnippet(code: string): ParsedProviderSnippet {
  const warnings: string[] = [];
  if (!code || !code.trim()) {
    return { formatDetected: 'generic', warnings: ['Empty code snippet provided.'] };
  }

  const snippet = code.trim();
  let formatDetected: ParsedProviderSnippet['formatDetected'] = 'generic';

  let baseUrl: string | undefined = undefined;
  let apiKey: string | undefined = undefined;
  let modelName: string | undefined = undefined;
  let customHeaders: Record<string, string> | undefined = undefined;

  // 1. Check for cURL format
  if (snippet.startsWith('curl') || snippet.includes('curl ')) {
    formatDetected = 'curl';

    const urlMatch = snippet.match(/curl\s+(?:-X\s+[A-Z]+\s+)?["']?(https?:\/\/[^\s"'\\]+)/i);
    if (urlMatch) {
      let rawUrl = urlMatch[1];
      if (rawUrl.endsWith('/chat/completions')) {
        baseUrl = rawUrl.replace(/\/chat\/completions$/, '');
      } else {
        baseUrl = rawUrl;
      }
    }

    const bearerMatch = snippet.match(/-H\s+["']Authorization:\s*Bearer\s+([^"'\s]+)["']/i);
    if (bearerMatch) {
      apiKey = bearerMatch[1];
    }

    const headerMatches = snippet.matchAll(/-H\s+["']([^:]+):\s*([^"']+)["']/gi);
    for (const hm of headerMatches) {
      const hName = hm[1].trim();
      const hVal = hm[2].trim();
      if (hName.toLowerCase() !== 'authorization' && hName.toLowerCase() !== 'content-type') {
        if (!customHeaders) customHeaders = {};
        customHeaders[hName] = hVal;
      }
    }

    const bodyMatch = snippet.match(/-d\s+["']?(\{[\s\S]*?\})["']?\s*$/m) || snippet.match(/--data(?:-raw)?\s+["']?(\{[\s\S]*?\})["']?/m);
    if (bodyMatch) {
      try {
        const parsedBody = JSON.parse(bodyMatch[1]);
        if (parsedBody.model) {
          modelName = parsedBody.model;
        }
      } catch (_) {
        const modelStrMatch = bodyMatch[1].match(/["']model["']\s*:\s*["']([^"']+)["']/);
        if (modelStrMatch) modelName = modelStrMatch[1];
      }
    }
  }

  // 2. Check for Node.js / JS SDK (new OpenAI({ baseURL, apiKey }))
  if (formatDetected === 'generic' && (snippet.includes('new OpenAI') || snippet.includes('import OpenAI from') || snippet.includes('baseURL:') || snippet.includes('apiKey:'))) {
    formatDetected = 'node';

    const baseUrlMatch = snippet.match(/(?:baseURL|base_url)\s*:\s*["']([^"']+)["']/i) || snippet.match(/(?:baseURL|base_url)\s*=\s*["']([^"']+)["']/i);
    if (baseUrlMatch) baseUrl = baseUrlMatch[1];

    const apiKeyMatch = snippet.match(/(?:apiKey|api_key)\s*:\s*["']([^"']+)["']/i) || snippet.match(/(?:apiKey|api_key)\s*=\s*["']([^"']+)["']/i);
    if (apiKeyMatch && !apiKeyMatch[1].includes('process.env')) {
      apiKey = apiKeyMatch[1];
    }

    const modelMatch = snippet.match(/model\s*:\s*["']([^"']+)["']/i) || snippet.match(/model\s*=\s*["']([^"']+)["']/i);
    if (modelMatch) modelName = modelMatch[1];
  }

  // 3. Check for Python / LangChain
  if (formatDetected === 'generic' && (snippet.includes('OpenAI(') || snippet.includes('ChatOpenAI(') || snippet.includes('from openai') || snippet.includes('def ') || snippet.includes('base_url =') || snippet.includes('api_key ='))) {
    formatDetected = snippet.includes('ChatOpenAI') ? 'langchain' : 'python';

    const baseUrlMatch = snippet.match(/(?:base_url|openai_api_base)\s*=\s*["']([^"']+)["']/i);
    if (baseUrlMatch) baseUrl = baseUrlMatch[1];

    const apiKeyMatch = snippet.match(/(?:api_key|openai_api_key)\s*=\s*["']([^"']+)["']/i);
    if (apiKeyMatch && !apiKeyMatch[1].includes('os.environ')) {
      apiKey = apiKeyMatch[1];
    }

    const modelMatch = snippet.match(/(?:model|model_name)\s*=\s*["']([^"']+)["']/i);
    if (modelMatch) modelName = modelMatch[1];

    const headersMatch = snippet.match(/(?:default_headers|extra_headers)\s*=\s*(\{[\s\S]*?\})/i);
    if (headersMatch) {
      try {
        const jsonLike = headersMatch[1].replace(/'/g, '"');
        customHeaders = JSON.parse(jsonLike);
      } catch (_) {}
    }
  }

  // 4. Generic Regex Fallback if format not detected
  if (!baseUrl) {
    const genericUrl = snippet.match(/https?:\/\/[^\s"'`)]+/i);
    if (genericUrl) baseUrl = genericUrl[0];
  }

  if (!apiKey) {
    const genericKey = snippet.match(/(?:sk-|nvapi-|gsk_)[a-zA-Z0-9_-]{20,}/);
    if (genericKey) apiKey = genericKey[0];
  }

  // Build Warnings & Verification Feedback
  if (!baseUrl) warnings.push('Could not detect Base API URL. Please verify/enter it manually.');
  if (!modelName) warnings.push('Could not detect Default Model Name. Please enter the target model ID.');
  if (!apiKey) warnings.push('Could not detect raw API Key in snippet. You can paste or enter it manually.');

  const inferredName = baseUrl ? inferProviderName(baseUrl) : 'Custom Provider';

  return {
    name: inferredName,
    baseUrl,
    modelName,
    apiKey,
    customHeaders,
    formatDetected,
    warnings,
  };
}
