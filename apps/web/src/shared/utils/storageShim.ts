let storageData: Record<string, string> = {}
let wasDirty = false
const TAURI_STORAGE_LOAD_TIMEOUT_MS = 3000

// Cache the original native localStorage to prevent infinite recursion
const nativeLocalStorage = typeof window !== 'undefined' ? window.localStorage : null

/**
 * Initializes the localStorage shim.
 * Loads persisted settings and data from the Tauri native JSON store asynchronously,
 * then overrides window.localStorage so that all subsequent web code reads/writes
 * from this native-backed cache synchronously.
 */
export async function initLocalStorageShim(): Promise<void> {
  const isTauri = typeof window !== 'undefined' && (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__)

  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      let timeoutId: number | undefined
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error(`Timed out waiting for the Tauri storage service after ${TAURI_STORAGE_LOAD_TIMEOUT_MS}ms.`))
        }, TAURI_STORAGE_LOAD_TIMEOUT_MS)
      })
      const payload = await Promise.race([
        invoke<{ data: string; was_dirty: boolean }>('load_storage_state'),
        timeout,
      ])
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      storageData = JSON.parse(payload.data)
      wasDirty = payload.was_dirty
      console.log('[StorageShim] Native storage loaded successfully. was_dirty =', wasDirty)
    } catch (e) {
      console.error('[StorageShim] Failed to load native storage state; continuing with an empty in-memory store:', e)
    }
  } else {
    // Browser fallback: sync from nativeLocalStorage then hydrate from backend durable store
    console.log('[StorageShim] Web environment. Synchronizing actual browser localStorage.')
    if (nativeLocalStorage) {
      for (let i = 0; i < nativeLocalStorage.length; i++) {
        const key = nativeLocalStorage.key(i)
        if (key) {
          storageData[key] = nativeLocalStorage.getItem(key) || ''
        }
      }
    }
    try {
      const backendUrl = typeof window !== 'undefined' && (window.location?.origin === 'http://localhost:3000' || window.location?.origin === 'http://127.0.0.1:3000')
        ? '/api/settings/get'
        : 'http://localhost:3001/api/settings/get';
      const res = await fetch(backendUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.settings) {
          Object.assign(storageData, json.settings);
          console.log('[StorageShim] Hydrated durable settings from backend store.');
        }
      }
    } catch (_) {}
  }

  // Create the localStorage API compatible object
  const localStorageShim = {
    getItem(key: string): string | null {
      return key in storageData ? storageData[key] : null
    },
    setItem(key: string, value: string): void {
      storageData[key] = String(value)
      saveState()
    },
    removeItem(key: string): void {
      delete storageData[key]
      saveState()
    },
    clear(): void {
      storageData = {}
      saveState()
    },
    key(index: number): string | null {
      const keys = Object.keys(storageData)
      return keys[index] || null
    },
    get length(): number {
      return Object.keys(storageData).length
    }
  }

  // Overwrite window.localStorage using descriptor definition
  try {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageShim,
      writable: false,
      configurable: true
    })
  } catch (e) {
    console.error('[StorageShim] Failed to redefine window.localStorage descriptor:', e)
  }
}

// Debounce writing state to disk to prevent disk thrashing during rapid updates
let saveTimer: any = null
function saveState() {
  const isTauri = typeof window !== 'undefined' && (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__)
  
  if (!isTauri) {
    if (nativeLocalStorage) {
      // Sync browser fallback localStorage using the original native object directly
      try {
        nativeLocalStorage.clear()
        for (const [k, v] of Object.entries(storageData)) {
          nativeLocalStorage.setItem(k, v)
        }
      } catch (e) {
        console.error('[StorageShim] Failed to sync fallback localStorage:', e)
      }
    }
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      try {
        const backendUrl = typeof window !== 'undefined' && (window.location?.origin === 'http://localhost:3000' || window.location?.origin === 'http://127.0.0.1:3000')
          ? '/api/settings/save'
          : 'http://localhost:3001/api/settings/save';
        await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: storageData })
        });
        console.log('[StorageShim] Synchronized settings to durable backend storage.');
      } catch (e) {
        console.error('[StorageShim] Failed to sync settings to backend store:', e);
      }
    }, 300)
    return
  }

  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('save_storage_state', { data: JSON.stringify(storageData) })
      console.log('[StorageShim] Auto-saved storage state to disk')
    } catch (e) {
      console.error('[StorageShim] Failed to save state to native:', e)
    }
  }, 300)
}

/**
 * Returns whether the previous session terminated unexpectedly (crashed).
 */
export function getWasDirty(): boolean {
  return wasDirty
}
