// WumiKay Ventures - Electron Main Process
// CRITICAL: Logging setup before anything else

const fs = require('fs');
const path = require('path');
const os = require('os');

// Use temp directory for logs (guaranteed writable)
const LOG_FILE = path.join(os.tmpdir(), 'WumiKay-app.log');
// Also keep a copy inside the project root for easier access during debugging
const ALT_LOG_FILE = path.join(__dirname, '..', 'WumiKay-app.log');

// Write log immediately at startup
try {
  fs.writeFileSync(LOG_FILE, `=== WumiKay Ventures Starting at ${new Date().toISOString()} ===\n`);
  fs.appendFileSync(LOG_FILE, `Log file: ${LOG_FILE}\n`);
  fs.appendFileSync(LOG_FILE, `Node version: ${process.version}\n`);
  fs.appendFileSync(LOG_FILE, `Platform: ${process.platform}\n`);
  fs.appendFileSync(LOG_FILE, `__dirname: ${__dirname}\n`);
  fs.appendFileSync(LOG_FILE, `argv: ${process.argv.join(' ')}\n\n`);
} catch (e) {
  // Continue anyway
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch(e) {}
  try { fs.appendFileSync(ALT_LOG_FILE, line); } catch(e) {}
  console.log(msg);
}

// Log process exit and signals to help capture unexpected termination reasons
process.on('exit', (code) => {
  try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] process.exit: ${code}\n`); } catch(e) {}
  try { fs.appendFileSync(ALT_LOG_FILE, `[${new Date().toISOString()}] process.exit: ${code}\n`); } catch(e) {}
  console.log(`process.exit: ${code}`);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM');
});

process.on('SIGINT', () => {
  log('Received SIGINT');
});

log('Starting imports...');

const { app, BrowserWindow, screen, dialog, nativeImage } = require('electron');
const { spawn } = require('child_process');
const http = require('http');

log('Imports complete');

// Disable GPU for compatibility
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

log('GPU disabled');

let mainWindow = null;
let serverProcess = null;

// Get paths
function getPaths() {
  const isPackaged = app.isPackaged;
  log(`isPackaged: ${isPackaged}`);
  
  if (isPackaged) {
    // In packaged mode:
    // - app.getAppPath() returns path to app.asar (contains build/, electron/, package.json)
    // - process.resourcesPath returns resources folder (contains extraResources like server-bundle/)
    const appPath = app.getAppPath(); // e.g., C:\...\resources\app.asar
    const resourcesPath = process.resourcesPath; // e.g., C:\...\resources
    
    log(`appPath: ${appPath}`);
    log(`resourcesPath: ${resourcesPath}`);
    
    // Use bundled server (single file with all dependencies)
    return {
      server: path.join(resourcesPath, 'server-bundle', 'server.js'),
      serverEnv: path.join(resourcesPath, 'server-bundle', '.env'),
      build: path.join(appPath, 'build'), // Inside asar
      icon: path.join(resourcesPath, 'logo.png')
    };
  } else {
    // Development mode - use original server
    const root = path.join(__dirname, '..');
    return {
      server: path.join(root, 'server', 'index.js'),
      serverEnv: path.join(root, 'server', '.env'),
      build: path.join(root, 'build'),
      icon: path.join(root, 'public', 'logo.png')
    };
  }
}

// Wait for server to be ready (health check)
function waitForServer(port = 5000, maxAttempts = 30, delayMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkHealth = () => {
      attempts++;
      log(`Health check attempt ${attempts}/${maxAttempts}...`);
      
      const req = http.get(`http://localhost:${port}/api/health`, { timeout: 2000 }, (res) => {
        if (res.statusCode === 200) {
          log('✅ Server health check passed!');
          resolve(true);
        } else {
          if (attempts >= maxAttempts) {
            log(`❌ Server health check failed after ${maxAttempts} attempts`);
            reject(new Error(`Server returned status ${res.statusCode}`));
          } else {
            setTimeout(checkHealth, delayMs);
          }
        }
      });
      
      req.on('error', (err) => {
        if (attempts >= maxAttempts) {
          log(`❌ Server health check failed after ${maxAttempts} attempts: ${err.message}`);
          reject(err);
        } else {
          setTimeout(checkHealth, delayMs);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          log(`❌ Server health check timed out after ${maxAttempts} attempts`);
          reject(new Error('Health check timeout'));
        } else {
          setTimeout(checkHealth, delayMs);
        }
      });
    };
    
    // Start checking after a brief delay to let server start
    setTimeout(checkHealth, delayMs);
  });
}

// Find node executable
function findNodeExecutable() {
  // In packaged mode, try to use the bundled node if available
  // Otherwise, use system node
  if (app.isPackaged) {
    // Check if Electron's node is available (it should be)
    const electronNode = process.execPath; // Electron executable
    // For spawn, we need actual node.exe, not electron.exe
    // Try common locations
    const possiblePaths = [
      path.join(process.resourcesPath, '..', 'node.exe'),
      'node.exe',
      'node'
    ];
    
    for (const nodePath of possiblePaths) {
      try {
        // Try to spawn a test to see if it works
        const testProc = spawn(nodePath, ['--version'], { stdio: 'ignore', windowsHide: true });
        testProc.on('error', () => {
          // This path doesn't work, try next
        });
        testProc.on('exit', (code) => {
          if (code === 0) {
            log(`Found node at: ${nodePath}`);
            return nodePath;
          }
        });
      } catch (e) {
        // Continue to next path
      }
    }
  }
  
  // Default: use system node
  return 'node';
}

// Start server
function startServer(paths) {
  log(`startServer called`);
  
  try {
    log(`Checking server at: ${paths.server}`);
    
    // For packaged app, server is in extraResources (not in asar)
    if (!paths.server || !fs.existsSync(paths.server)) {
      log(`❌ Server not found: ${paths.server}`);
      return { ready: Promise.resolve({ server: null, inProcess: false }) };
    }
    
    log(`Starting server: ${paths.server}`);
    
    // Set environment variables
    process.env.PORT = process.env.PORT || '5000';
    log(`Environment set: PORT=${process.env.PORT}`);

    let serverPromise = null;
    
    // In packaged mode, ALWAYS use spawn with bundled server (no external dependencies needed)
    if (app.isPackaged) {
      log('Packaged mode: using bundled server spawn...');
      serverPromise = startServerSpawn(paths);
    } else {
      // Development mode: try in-process first
      try {
        log('Dev mode: attempting in-process server start...');
        
        const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
        process.env.NODE_PATH = nodeModulesPath;
        process.env.SERVER_PATH = path.dirname(paths.server);
        require('module').Module._initPaths();
        
        const serverPath = paths.server;
        try {
          delete require.cache[require.resolve(serverPath)];
        } catch (e) {}
        
        const serverModule = require(serverPath);
        
        if (serverModule && typeof serverModule.startServer === 'function') {
          serverPromise = serverModule.startServer({ host: 'localhost', port: process.env.PORT || 5000 })
            .then((srv) => {
              log('✅ Server started in-process!');
              return { server: srv, inProcess: true };
            })
            .catch((err) => {
              log(`❌ Server start failed: ${err.message}`);
              return { server: null, inProcess: false };
            });
        } else {
          throw new Error('Server module missing startServer function');
        }
      } catch (err) {
        log(`❌ In-process failed: ${err.message}, using spawn...`);
        serverPromise = startServerSpawn(paths);
      }
    }
    
    if (!serverPromise) {
      serverPromise = Promise.resolve({ server: null, inProcess: false });
    }
    
    return { ready: serverPromise };
    
  } catch (outerErr) {
    log(`❌ startServer outer catch: ${outerErr.message}`);
    return { ready: Promise.resolve({ server: null, inProcess: false }) };
  }
}

// Spawn server as external process
// In production, uses the bundled server (self-contained, no external dependencies)
function startServerSpawn(paths) {
  return new Promise((resolve) => {
    log(`Spawning server...`);
    log(`Server path: ${paths.server}`);
    log(`Server dir: ${path.dirname(paths.server)}`);
    
    // The bundled server is self-contained - no NODE_PATH needed
    const serverEnv = {
      ...process.env,
      NODE_ENV: 'production',
      SERVER_PATH: path.dirname(paths.server),
      PORT: process.env.PORT || '5000'
    };
    
    try {
      // Use shell: false - handles paths with spaces correctly on Windows
      const proc = spawn('node', [paths.server], {
        cwd: path.dirname(paths.server),
        env: serverEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        shell: false
      });

      serverProcess = proc; // Store reference for cleanup

      proc.stdout.on('data', d => log(`Server: ${d.toString().trim()}`));
      proc.stderr.on('data', d => log(`Server ERR: ${d.toString().trim()}`));
      proc.on('error', e => log(`❌ Server spawn error: ${e.message}`));
      proc.on('exit', (code) => {
        log(`Server exited with code: ${code}`);
        if (code !== 0 && code !== null) {
          log(`⚠️ Server crashed - will not auto-restart`);
        }
      });

      log('Server process spawned, waiting for health check...');
      
      waitForServer(process.env.PORT || 5000, 40, 500)
        .then(() => {
          log('✅ Server is ready!');
          resolve({ process: proc, inProcess: false });
        })
        .catch((err) => {
          log(`⚠️ Server health check failed: ${err.message}`);
          resolve({ process: proc, inProcess: false });
        });
    } catch (e) {
      log(`❌ Failed to spawn server: ${e.message}`);
      resolve({ server: null, inProcess: false });
    }
  });
}

// Create window
function createWindow(paths) {
  log('Creating window...');
  
  let displayWidth = 1920;
  let displayHeight = 1080;
  
  try {
    const display = screen.getPrimaryDisplay();
    displayWidth = display.workAreaSize.width;
    displayHeight = display.workAreaSize.height;
    log(`Display size: ${displayWidth}x${displayHeight}`);
  } catch (e) {
    log(`Could not get display size: ${e.message}`);
  }
  
  const w = Math.min(1400, displayWidth - 100);
  const h = Math.min(900, displayHeight - 100);
  const x = Math.floor((displayWidth - w) / 2);
  const y = Math.floor((displayHeight - h) / 2);
  
  log(`Window dimensions: ${w}x${h} at (${x},${y})`);
  
  const config = {
    width: w,
    height: h,
    x: x,
    y: y,
    show: true, // Show immediately
    frame: true,
    backgroundColor: '#667eea',
    title: 'WumiKay Ventures',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  };
  
  // Add icon if exists
  try {
    if (fs.existsSync(paths.icon)) {
      config.icon = nativeImage.createFromPath(paths.icon);
      log(`Icon loaded: ${paths.icon}`);
    }
  } catch (e) {
    log(`Icon load failed: ${e.message}`);
  }
  
  try {
    mainWindow = new BrowserWindow(config);
    log('BrowserWindow created');
    
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      log('ready-to-show event');
      mainWindow.show();
      mainWindow.focus();
      log('Window shown and focused');
    });
    
    // Fallback: show after timeout even if ready-to-show doesn't fire
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        log('Forcing window show after timeout');
        mainWindow.show();
        mainWindow.focus();
      }
    }, 3000);
    
    // Load content
    loadContent(paths);
    
    mainWindow.on('closed', () => {
      log('Window closed');
      mainWindow = null;
    });
    
    mainWindow.webContents.on('did-finish-load', () => {
      log('did-finish-load');
      // Development helper: auto-trigger Print Receipt for demo when requested
      try {
        if (process.env.PRINT_DEMO === '1') {
          // First try IPC trigger (preload will run a DOM retry loop)
          try {
            mainWindow.webContents.send('trigger-print');
          } catch (e) {
            log(`IPC trigger-print send failed: ${e.message}`);
          }

          // Also execute a robust JS fallback (longer timeout)
          const js = `(() => {
            return new Promise((resolve) => {
              const start = Date.now();
              const tryFind = () => {
                try {
                  const btn = document.querySelector('button[title="Print receipt for this order"]') ||
                              Array.from(document.querySelectorAll('button')).find(b => /Print Receipt|🖨️ Print Receipt/i.test(b.textContent || ''));
                  if (btn) { btn.click(); resolve('clicked'); return; }
                  if (Date.now() - start > 20000) { resolve('timeout'); return; }
                } catch (e) {
                  resolve('error:'+e.message); return;
                }
                setTimeout(tryFind, 500);
              };
              tryFind();
            })
          })()`;
          mainWindow.webContents.executeJavaScript(js, true).then(result => {
            log(`Auto-print demo fallback result: ${result}`);
          }).catch(err => log(`Auto-print exec error: ${err.message}`));
        }
      } catch (e) {
        log(`Auto-print hook failed: ${e.message}`);
      }
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log(`did-fail-load: ${errorCode} ${errorDescription} ${validatedURL}`);
    });
    
    mainWindow.webContents.on('crashed', (event) => {
      log('Renderer crashed!');
    });
    
  } catch (e) {
    log(`Window creation error: ${e.message}\n${e.stack}`);
    dialog.showErrorBox('Error', `Failed to create window: ${e.message}\n\nLog file: ${LOG_FILE}`);
  }
}

// Listen for preload auto-print results
try {
  const { ipcMain } = require('electron');
  ipcMain.on('auto-print-result', (event, data) => {
    log(`Auto-print result from renderer: ${data}`);
  });
} catch (e) {
  log(`Failed to register ipcMain auto-print listener: ${e.message}`);
}

function loadContent(paths) {
  if (!mainWindow) {
    log('loadContent: mainWindow is null, aborting');
    return;
  }
  
  const indexPath = path.join(paths.build, 'index.html');
  log(`Loading content from: ${indexPath}`);
  
  // Skip loading screen in packaged mode (can cause issues), load main app directly
  if (app.isPackaged) {
    log('Packaged mode: loading main app directly...');
    loadMainApp(paths);
    return;
  }
  
  // Development mode: show loading screen first
  const loadingHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>WumiKay Ventures</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white}
.logo{font-size:3em;font-weight:bold;margin-bottom:20px;text-shadow:0 2px 10px rgba(0,0,0,0.2)}
.spinner{width:50px;height:50px;border:4px solid rgba(255,255,255,0.3);border-top-color:white;
border-radius:50%;animation:spin 1s linear infinite;margin:20px}
@keyframes spin{to{transform:rotate(360deg)}}
p{opacity:0.9;margin:5px 0}
</style></head>
<body>
<div class="logo">WumiKay Ventures</div>
<div class="spinner"></div>
<p>Loading...</p>
</body></html>`;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`)
    .then(() => {
      log('Loading screen displayed');
      setTimeout(() => loadMainApp(paths), 500);
    })
    .catch((err) => {
      log(`Failed to load loading screen: ${err.message}`);
      loadMainApp(paths);
    });
}

function loadMainApp(paths) {
  if (!mainWindow) {
    log('loadMainApp: mainWindow is null, aborting');
    return;
  }
  
  const indexPath = path.join(paths.build, 'index.html');
  log(`Attempting to load main app from: ${indexPath}`);
  
  // Try to load the file directly - Electron handles asar paths automatically
  mainWindow.loadFile(indexPath)
    .then(() => {
      log('Main app loaded successfully');
    })
    .catch((err) => {
      log(`Failed to load main app: ${err.message}`);
      if (!mainWindow) return;
      
      // Try dev server as fallback
      log('Trying dev server fallback...');
      mainWindow.loadURL('http://localhost:3000')
        .then(() => log('Dev server connected'))
        .catch((devErr) => {
          log(`Dev server also failed: ${devErr.message}`);
          if (mainWindow) {
            loadErrorPage(`Could not load the application.\n\nError: ${err.message}\n\nCheck log: ${LOG_FILE}`);
          }
        });
    });
}

function loadErrorPage(message) {
  log('Loading error page');
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>WumiKay Ventures - Error</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;padding:40px}
h1{font-size:2.5em;margin-bottom:20px}
.error-box{background:rgba(255,255,255,0.1);padding:30px;border-radius:12px;max-width:600px;text-align:center}
pre{background:rgba(0,0,0,0.2);padding:15px;border-radius:8px;margin:20px 0;text-align:left;white-space:pre-wrap;word-break:break-word;font-size:0.9em}
button{background:white;color:#667eea;border:none;padding:12px 30px;border-radius:8px;font-size:1em;cursor:pointer;margin-top:10px}
button:hover{background:#f0f0f0}
</style></head>
<body>
<div class="error-box">
<h1>WumiKay Ventures</h1>
<p>An error occurred while loading the application.</p>
<pre>${message}</pre>
<button onclick="location.reload()">Retry</button>
</div>
</body></html>`;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// Check if server is already running (e.g., started by WumiKay Server app)
function checkExistingServer(port = 5000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// App lifecycle
app.whenReady().then(async () => {
  log('=== App ready event ===');
  
  let paths;
  try {
    paths = getPaths();
    log(`Paths resolved:`);
    log(`  server: ${paths.server}`);
    log(`  build: ${paths.build}`);
    log(`  icon: ${paths.icon}`);
    log(`Server exists: ${fs.existsSync(paths.server)}`);
  } catch (err) {
    log(`❌ getPaths failed: ${err.message}`);
    paths = {
      server: '',
      build: path.join(__dirname, '..', 'build'),
      icon: ''
    };
  }
  
  // CRITICAL: Create window IMMEDIATELY - don't wait for server
  // This ensures the user always sees something
  log('Creating window immediately...');
  try {
    createWindow(paths);
    log('Window creation initiated');
  } catch (err) {
    log(`❌ createWindow failed: ${err.message}\n${err.stack}`);
  }
  
  // Check if server is already running (from WumiKay Server app)
  const port = process.env.PORT || 5000;
  log(`Checking for existing server on port ${port}...`);
  
  const serverAlreadyRunning = await checkExistingServer(port);
  
  if (serverAlreadyRunning) {
    log('✅ Server already running (external) - using existing server');
    // Server is managed externally, don't start our own
    serverProcess = { external: true };
  } else {
    // Start server in background
    log('🚀 No existing server found, starting bundled server...');
    setTimeout(() => {
      try {
        serverProcess = startServer(paths);
        log('Server start initiated');
      } catch (err) {
        log(`❌ startServer threw: ${err.message}\n${err.stack}`);
        serverProcess = null;
      }
    }, 100);
  }
  
  app.on('activate', () => {
    log('activate event');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(paths);
    }
  });
});

app.on('window-all-closed', () => {
  log('window-all-closed event');
  // Only kill server if we started it (not external)
  if (serverProcess && !serverProcess.external) {
    try {
      if (serverProcess.process) {
        serverProcess.process.kill('SIGTERM');
        log('Server process killed');
      } else if (serverProcess.server) {
        // In-process server - try to close gracefully
        log('Closing in-process server...');
        try {
          serverProcess.server.close(() => {
            log('In-process server closed');
          });
        } catch (e) {
          log(`Error closing in-process server: ${e.message}`);
        }
      }
    } catch(e) {
      log(`Error killing server: ${e.message}`);
    }
    serverProcess = null;
  } else if (serverProcess && serverProcess.external) {
    log('External server - leaving running for other apps');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log('before-quit event');
  // Only kill server if we started it (not external)
  if (serverProcess && !serverProcess.external) {
    try {
      if (serverProcess.process) {
        serverProcess.process.kill('SIGTERM');
      } else if (serverProcess.server) {
        try {
          serverProcess.server.close();
        } catch (e) {
          // Ignore
        }
      }
    } catch(e) {
      log(`Error killing server on quit: ${e.message}`);
    }
  }
});

app.on('quit', () => {
  log('quit event');
});

// Error handlers
process.on('uncaughtException', (e) => {
  log(`UNCAUGHT EXCEPTION: ${e.message}\n${e.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});

log('=== Setup complete, waiting for ready event... ===');
