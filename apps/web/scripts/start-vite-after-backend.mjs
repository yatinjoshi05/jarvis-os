import { spawn } from 'node:child_process';

const healthUrl = 'http://localhost:3001/api/health';
const maxAttempts = 30;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1000) });
    if (response.ok) {
      console.log('[web] Backend is healthy; starting Vite.');
      const vite = spawn('vite', { stdio: 'inherit', shell: true });
      vite.on('exit', (code) => process.exit(code ?? 0));
      break;
    }
  } catch {
    // The backend is still starting.
  }

  if (attempt === maxAttempts) {
    console.error('[web] Backend did not become healthy within 15 seconds.');
    process.exit(1);
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
}
