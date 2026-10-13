/**
 * Shared utility to copy text to the clipboard.
 * Uses Tauri's native clipboard API when running inside the desktop shell,
 * falling back to the standard browser clipboard API.
 */
export async function copyToClipboard(text: string): Promise<void> {
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
  if (isTauri) {
    try {
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
      console.log('[Clipboard] Copied via native clipboard manager');
      return;
    } catch (e) {
      console.error('[Clipboard] Tauri clipboard failed, falling back to browser:', e);
    }
  }
  await navigator.clipboard.writeText(text);
  console.log('[Clipboard] Copied via browser navigator.clipboard');
}
