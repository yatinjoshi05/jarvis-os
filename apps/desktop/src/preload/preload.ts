// Preload script runs before the renderer process (the web page) loads.
// It has access to both DOM APIs and a restricted Node.js environment.
// Since contextIsolation is enabled, variables/functions defined here are NOT
// directly accessible to the web page. If needed in the future, we will use
// contextBridge to expose safe, custom APIs to the renderer.

window.addEventListener('DOMContentLoaded', () => {
  // Safe execution indicator in the browser window console.
  console.log('Jarvis Desktop: Preload script loaded and secure execution context established.');
});
