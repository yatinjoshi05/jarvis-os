import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../apps/web/.env') });

const CUSTOM_KEYS_PATH = path.resolve(__dirname, '../.env.custom-keys');
if (fs.existsSync(CUSTOM_KEYS_PATH)) {
  const result = dotenv.parse(fs.readFileSync(CUSTOM_KEYS_PATH, 'utf-8'));
  for (const [k, v] of Object.entries(result)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

console.log('=== ENV LOAD DIAGNOSTICS ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 8)}...` : 'MISSING');
console.log('NVIDIA_API_KEY:', process.env.NVIDIA_API_KEY ? `${process.env.NVIDIA_API_KEY.slice(0, 8)}...` : 'MISSING');
console.log('VITE_CLOUDFLARE_GATEWAY_URL:', process.env.VITE_CLOUDFLARE_GATEWAY_URL || 'MISSING');
console.log('CLOUDFLARE_GATEWAY_TOKEN:', process.env.CLOUDFLARE_GATEWAY_TOKEN ? `${process.env.CLOUDFLARE_GATEWAY_TOKEN.slice(0, 8)}...` : 'MISSING');

console.log('\n=== TESTING GEMINI DIRECT UPSTREAM ===');
const geminiKey = process.env.GEMINI_API_KEY || '';
try {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] }),
  });
  console.log('Gemini Direct status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Gemini Direct body:', text.slice(0, 300));
} catch (e) {
  console.error('Gemini Direct error:', e.message);
}

console.log('\n=== TESTING GEMINI CLOUDFLARE GATEWAY UPSTREAM ===');
const cfUrl = process.env.VITE_CLOUDFLARE_GATEWAY_URL;
const cfToken = process.env.CLOUDFLARE_GATEWAY_TOKEN;
if (cfUrl) {
  try {
    const res = await fetch(`${cfUrl}/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-aig-authorization': `Bearer ${cfToken}`,
      },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] }),
    });
    console.log('CF Gateway status:', res.status, res.statusText);
    const text = await res.text();
    console.log('CF Gateway body:', text.slice(0, 300));
  } catch (e) {
    console.error('CF Gateway error:', e.message);
  }
}

console.log('\n=== TESTING NVIDIA NIM UPSTREAM ===');
const nvKey = process.env.NVIDIA_API_KEY || '';
const nvBaseUrl = process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
try {
  const res = await fetch(`${nvBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${nvKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 10,
    }),
  });
  console.log('NVIDIA status:', res.status, res.statusText);
  const text = await res.text();
  console.log('NVIDIA body:', text.slice(0, 300));
} catch (e) {
  console.error('NVIDIA error:', e.message);
}
