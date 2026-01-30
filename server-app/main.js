/**
 * WumiKay Ventures - Server Application
 * Standalone server that runs independently
 * Start this app first, then run the main WumiKay Ventures app
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Disable GPU for compatibility
app.disableHardwareAcceleration();

let mainWindow = null;
let tray = null;
let serverProcess = null;
let serverRunning = false;
let serverPort = 5000;

// Get the bundled server path
function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server-bundle', 'server.js');
  }
  // Development - use the bundled server if it exists, otherwise use original
  const bundledPath = path.join(__dirname, '..', 'server-bundle', 'server.js');
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }
  return path.join(__dirname, '..', 'server', 'index.js');
}

// Check if server is responding
function checkServerHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${serverPort}/api/health`, { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start the server
async function startServer() {
  if (serverRunning) {
    console.log('Server already running');
    return true;
  }

  const serverPath = getServerPath();
  console.log('Starting server from:', serverPath);

  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found:', serverPath);
    sendStatus('error', 'Server file not found');
    return false;
  }

  return new Promise((resolve) => {
    const serverEnv = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(serverPort),
      SERVER_PATH: path.dirname(serverPath)
    };

    serverProcess = spawn('node', [serverPath], {
      cwd: path.dirname(serverPath),
      env: serverEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      console.log('Server:', msg);
      if (msg.includes('Server running') || msg.includes('🚀')) {
        serverRunning = true;
        sendStatus('running', 'Server is running');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      serverRunning = false;
      sendStatus('error', `Failed to start: ${err.message}`);
      resolve(false);
    });

    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code);
      serverRunning = false;
      serverProcess = null;
      sendStatus('stopped', 'Server stopped');
    });

    // Wait for server to be ready
    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = setInterval(async () => {
      attempts++;
      const healthy = await checkServerHealth();
      if (healthy) {
        clearInterval(checkInterval);
        serverRunning = true;
        sendStatus('running', 'Server is running');
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        sendStatus('error', 'Server failed to start');
        resolve(false);
      }
    }, 500);
  });
}

// Stop the server
function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
  serverRunning = false;
  sendStatus('stopped', 'Server stopped');
}

// Send status to renderer
function sendStatus(status, message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('server-status', { status, message, port: serverPort });
  }
  updateTrayMenu();
}

// Update tray menu based on server status
function updateTrayMenu() {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: `WumiKay Server - ${serverRunning ? 'Running' : 'Stopped'}`,
      enabled: false 
    },
    { type: 'separator' },
    {
      label: serverRunning ? 'Stop Server' : 'Start Server',
      click: () => serverRunning ? stopServer() : startServer()
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Quit',
      click: () => {
        stopServer();
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip(`WumiKay Server - ${serverRunning ? 'Running on port ' + serverPort : 'Stopped'}`);
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 500,
    resizable: false,
    maximizable: false,
    frame: true,
    backgroundColor: '#1a1a2e',
    title: 'WumiKay Server',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the server UI
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getServerHTML())}`);

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create system tray
function createTray() {
  // Create a simple tray icon
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'logo.png')
    : path.join(__dirname, '..', 'public', 'logo.png');
  
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } else {
    // Create a simple colored square as fallback
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('WumiKay Server');
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  updateTrayMenu();
}

// Server UI HTML
function getServerHTML() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WumiKay Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 20px;
    }
    .logo {
      font-size: 1.8em;
      font-weight: bold;
      margin-bottom: 5px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #888;
      font-size: 0.9em;
      margin-bottom: 30px;
    }
    .status-card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 30px;
      width: 100%;
      max-width: 380px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .status-indicator {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2em;
      transition: all 0.3s ease;
    }
    .status-indicator.running {
      background: linear-gradient(135deg, #00c853, #69f0ae);
      box-shadow: 0 0 30px rgba(0, 200, 83, 0.4);
    }
    .status-indicator.stopped {
      background: linear-gradient(135deg, #ff5252, #ff8a80);
      box-shadow: 0 0 30px rgba(255, 82, 82, 0.3);
    }
    .status-indicator.starting {
      background: linear-gradient(135deg, #ffc107, #ffeb3b);
      box-shadow: 0 0 30px rgba(255, 193, 7, 0.3);
      animation: pulse 1.5s infinite;
    }
    .status-indicator.error {
      background: linear-gradient(135deg, #d32f2f, #f44336);
      box-shadow: 0 0 30px rgba(211, 47, 47, 0.3);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    .status-text {
      font-size: 1.3em;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .status-message {
      color: #aaa;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .port-info {
      background: rgba(102, 126, 234, 0.2);
      padding: 10px 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      font-family: 'Consolas', monospace;
      font-size: 0.95em;
    }
    .btn {
      padding: 14px 40px;
      border: none;
      border-radius: 10px;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin: 5px;
    }
    .btn-start {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    .btn-start:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    .btn-stop {
      background: linear-gradient(135deg, #ff5252, #d32f2f);
      color: white;
    }
    .btn-stop:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(255, 82, 82, 0.4);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    .info-section {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      width: 100%;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 0.85em;
    }
    .info-label { color: #888; }
    .info-value { color: #fff; font-family: 'Consolas', monospace; }
    .minimize-hint {
      margin-top: 20px;
      font-size: 0.8em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="logo">WumiKay Ventures</div>
  <div class="subtitle">Server Manager</div>
  
  <div class="status-card">
    <div id="statusIndicator" class="status-indicator stopped">⏹</div>
    <div id="statusText" class="status-text">Server Stopped</div>
    <div id="statusMessage" class="status-message">Click Start to begin</div>
    
    <div class="port-info">
      <span>http://localhost:</span><span id="portNumber">5000</span>
    </div>
    
    <button id="startBtn" class="btn btn-start" onclick="startServer()">Start Server</button>
    <button id="stopBtn" class="btn btn-stop" onclick="stopServer()" style="display:none;">Stop Server</button>
    
    <div class="info-section">
      <div class="info-item">
        <span class="info-label">Database:</span>
        <span id="dbStatus" class="info-value">Checking...</span>
      </div>
      <div class="info-item">
        <span class="info-label">API Endpoint:</span>
        <span class="info-value">/api/*</span>
      </div>
    </div>
  </div>
  
  <div class="minimize-hint">Minimize to system tray - server keeps running</div>
  
  <script>
    const { ipcRenderer } = require('electron');
    
    function updateUI(status, message, port) {
      const indicator = document.getElementById('statusIndicator');
      const statusText = document.getElementById('statusText');
      const statusMsg = document.getElementById('statusMessage');
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      const portNum = document.getElementById('portNumber');
      
      portNum.textContent = port || 5000;
      
      indicator.className = 'status-indicator ' + status;
      
      switch(status) {
        case 'running':
          indicator.textContent = '✓';
          statusText.textContent = 'Server Running';
          statusMsg.textContent = message || 'Ready to accept connections';
          startBtn.style.display = 'none';
          stopBtn.style.display = 'inline-block';
          break;
        case 'stopped':
          indicator.textContent = '⏹';
          statusText.textContent = 'Server Stopped';
          statusMsg.textContent = message || 'Click Start to begin';
          startBtn.style.display = 'inline-block';
          stopBtn.style.display = 'none';
          break;
        case 'starting':
          indicator.textContent = '⟳';
          statusText.textContent = 'Starting...';
          statusMsg.textContent = message || 'Please wait';
          startBtn.disabled = true;
          stopBtn.style.display = 'none';
          break;
        case 'error':
          indicator.textContent = '✕';
          statusText.textContent = 'Error';
          statusMsg.textContent = message || 'Something went wrong';
          startBtn.style.display = 'inline-block';
          startBtn.disabled = false;
          stopBtn.style.display = 'none';
          break;
      }
    }
    
    function startServer() {
      updateUI('starting', 'Initializing server...');
      ipcRenderer.send('start-server');
    }
    
    function stopServer() {
      ipcRenderer.send('stop-server');
    }
    
    ipcRenderer.on('server-status', (event, data) => {
      updateUI(data.status, data.message, data.port);
      
      // Check database status when server is running
      if (data.status === 'running') {
        setTimeout(() => {
          fetch('http://localhost:' + (data.port || 5000) + '/api/health')
            .then(r => r.json())
            .then(d => {
              document.getElementById('dbStatus').textContent = 
                d.database && d.database.includes('connected') ? 'Connected' : 'Not Connected';
            })
            .catch(() => {
              document.getElementById('dbStatus').textContent = 'Unknown';
            });
        }, 1000);
      }
    });
    
    // Auto-start server on launch
    window.addEventListener('load', () => {
      setTimeout(() => {
        startServer();
      }, 500);
    });
  </script>
</body>
</html>`;
}

// IPC handlers
ipcMain.on('start-server', () => startServer());
ipcMain.on('stop-server', () => stopServer());

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close - keep running in tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopServer();
});

// Handle single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
