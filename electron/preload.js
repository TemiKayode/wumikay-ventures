// Preload script for Electron
// This script runs in a context that has access to both the DOM and Node.js APIs
// but is isolated from the main renderer process for security

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the APIs without exposing the entire Node.js API
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // Allow renderer to register a callback for auto-print results
  onAutoPrintResult: (cb) => {
    ipcRenderer.on('auto-print-result', (event, data) => cb(data));
  },
  // Allow renderer to trigger auto-print directly
  triggerAutoPrint: () => {
    ipcRenderer.send('trigger-print');
  }
});

// Handle IPC-triggered auto-print: run a DOM retry loop inside preload
ipcRenderer.on('trigger-print', async () => {
  try {
    const start = Date.now();
    const timeout = 20000; // 20s
    const tryFind = () => {
      try {
        const btn = document.querySelector('button[title="Print receipt for this order"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => /Print Receipt|🖨️ Print Receipt/i.test(b.textContent || ''));
        if (btn) { btn.click(); return 'clicked'; }
        if (Date.now() - start > timeout) { return 'timeout'; }
      } catch (e) {
        return 'error:'+e.message;
      }
      return null;
    };

    let result = null;
    while ((result = tryFind()) === null) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 500));
    }
    ipcRenderer.send('auto-print-result', result);
  } catch (e) {
    ipcRenderer.send('auto-print-result', 'error:'+e.message);
  }
});

// Log that preload script has loaded
console.log('Electron preload script loaded');
console.log('Platform:', process.platform);
console.log('Node version:', process.versions.node);
console.log('Electron version:', process.versions.electron);
