import ReactDOM from 'react-dom/client'
import { bootstrap } from './bootstrap'
import { AppRouter } from './providers/app-router'
import { conversationManager } from '../shared/ai/ConversationManager'
import { initLocalStorageShim } from '../shared/utils/storageShim'
import { customProviderManager } from '../shared/ai/CustomProviderManager'
import { displaySettings } from '../shared/theme/DisplaySettings'
import { sidebarSettings } from '../shared/theme/SidebarSettings'
import './styles/index.css'

async function initAndMount() {
  console.log('[Boot] Step 1/3: Initializing storage shim...');
  try {
    await initLocalStorageShim();
    console.log('[Boot] Storage shim initialized successfully.');
    // Hydrate DisplaySettings & SidebarSettings NOW — the shim is installed so localStorage reads
    // hit the durable Tauri store (or backend-synced browser store) instead of
    // the ephemeral WebView session storage that existed at module-import time.
    displaySettings.hydrate();
    sidebarSettings.hydrate();
  } catch (err) {
    console.error('[Boot] Storage shim failed to initialize; using fallback memory store:', err);
    // Still hydrate so we apply whatever is in the fallback store
    displaySettings.hydrate();
    sidebarSettings.hydrate();
  }

  console.log('[Boot] Step 2/3: Bootstrapping core managers & provider settings...');
  try {
    bootstrap();
    customProviderManager.reloadFromStorage();
  } catch (err) {
    console.error('[Boot] Bootstrap manager initialization encountered an error:', err);
  }

  try {
    conversationManager.subscribe(() => {
      try {
        localStorage.setItem('jarvis_last_conversation', conversationManager.export());
      } catch (_) {}
    });
  } catch (err) {
    console.error('[Boot] Conversation manager subscription failed:', err);
  }

  console.log('[Boot] Step 3/3: Rendering React root component...');
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    console.error('[Boot] CRITICAL: Root DOM element #root not found in document!');
    return;
  }

  try {
    ReactDOM.createRoot(rootEl).render(<AppRouter />);
    console.log('[Boot] ✓ React Application mounted successfully.');
  } catch (err) {
    console.error('[Boot] CRITICAL: React DOM rendering failed:', err);
    rootEl.innerHTML = `
      <div style="background:#090d16;color:#ff4444;font-family:monospace;padding:20px;height:100vh;box-sizing:border-box;">
        <h2 style="color:#ff6666;">JARVIS OS — Startup Mount Failure</h2>
        <p>React DOM rendering encountered a critical error during startup:</p>
        <pre style="background:#111;padding:15px;border-radius:8px;color:#fff;overflow:auto;">${err instanceof Error ? err.stack || err.message : String(err)}</pre>
        <p style="color:#888;font-size:12px;">Please check developer console for details.</p>
      </div>
    `;
  }
}

initAndMount();