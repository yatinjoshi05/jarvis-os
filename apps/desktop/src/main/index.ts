import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// Maintain a global reference of the window object to prevent it from being
// garbage collected when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main browser window with secure default configurations.
 */
function createWindow(): void {
  // Define security and window preferences
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // 1. Enable context isolation: ensures the preload script and renderer code
      // run in separate execution contexts, preventing renderer-side attacks.
      contextIsolation: true,

      // 2. Disable Node integration: renderer process will not have access to
      // Node.js APIs (like require, fs, process), preventing RCE.
      nodeIntegration: false,

      // 3. Configure the preload script path: point to the compiled JS output
      // of preload.ts.
      preload: path.join(__dirname, '../preload/preload.js'),

      // 4. Enable sandbox: runs the renderer process in a restricted OS sandbox,
      // similar to Google Chrome tab rendering, for maximum security.
      sandbox: true,
    },
  });

  // Load a blank window as requested for the minimum production-ready build.
  mainWindow.loadURL('about:blank');

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object.
    mainWindow = null;
  });
}

// ==========================================
// Application Lifecycle Event Handling
// ==========================================

// This event is fired when Electron has finished initialization and is ready
// to create browser windows. Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. On macOS, it is common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
