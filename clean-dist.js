// Clean dist folder script
// This script safely removes the dist folder with retries to handle locked files
// On Windows, it also tries to kill Electron processes that might be locking files

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const distPath = path.join(__dirname, 'dist');
const isWindows = process.platform === 'win32';

function killElectronProcesses() {
  if (!isWindows) return;
  
  try {
    console.log('🔍 Checking for running Electron processes...');
    // Try to kill Electron processes that might be locking files
    const processes = [
      'WumiKay-Ventures.exe',
      'electron.exe',
      'WumiKay Ventures.exe',
      'WumiKay-Ventures',
      'electron',
      'WumiKay Ventures'
    ];
    
    let killedCount = 0;
    for (const procName of processes) {
      try {
        // Use taskkill on Windows (more reliable)
        execSync(`taskkill /F /IM "${procName}" /T 2>nul`, { stdio: 'ignore' });
        killedCount++;
        console.log(`   ✅ Killed ${procName} processes`);
      } catch (e) {
        // Process not running, ignore
      }
    }
    
    if (killedCount > 0) {
      console.log(`   ✅ Killed ${killedCount} process type(s)`);
    }
    
    // Wait a bit for processes to fully terminate and file handles to release
    const start = Date.now();
    while (Date.now() - start < 2000) {
      // Busy wait 2 seconds
    }
  } catch (error) {
    // Ignore errors - we'll try to clean anyway
  }
}

function removeDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return true;
  }

  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        removeDirRecursive(filePath);
      } else {
        try {
          // Try to make file writable before deleting
          fs.chmodSync(filePath, 0o666);
          fs.unlinkSync(filePath);
        } catch (e) {
          // If we can't delete, try to rename it first (Windows trick)
          try {
            const tempPath = filePath + '.deleteme';
            fs.renameSync(filePath, tempPath);
            fs.unlinkSync(tempPath);
          } catch (e2) {
            // File is locked, skip for now
          }
        }
      }
    }
    
    // Try to remove the directory itself
    try {
      fs.rmdirSync(dirPath);
    } catch (e) {
      // Directory might not be empty yet, try again
      fs.rmdirSync(dirPath, { recursive: true });
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

function removeDir(dirPath, retries = 5) {
  if (!fs.existsSync(dirPath)) {
    console.log('ℹ️  dist folder does not exist - nothing to clean');
    return true;
  }

  // First, try to kill any Electron processes
  killElectronProcesses();

  for (let i = 0; i < retries; i++) {
    try {
      // Method 1: Try fs.rmSync (Node 14.14+) with more aggressive options
      if (fs.rmSync) {
        try {
          // First, try to remove read-only attributes (Windows)
          if (isWindows) {
            try {
              const { execSync } = require('child_process');
              execSync(`attrib -r "${dirPath}\\*.*" /s /d 2>nul`, { stdio: 'ignore' });
            } catch (e) {
              // Ignore attrib errors
            }
          }
          
          fs.rmSync(dirPath, { 
            recursive: true, 
            force: true,
            maxRetries: 5,
            retryDelay: 1000
          });
          console.log('✅ Successfully cleaned dist folder');
          return true;
        } catch (rmError) {
          // If rmSync fails, try manual recursive deletion
          if (i >= 1) {
            try {
              if (removeDirRecursive(dirPath)) {
                console.log('✅ Successfully cleaned dist folder (manual method)');
                return true;
              }
            } catch (e) {
              // Continue to retry
            }
          }
          throw rmError; // Re-throw to trigger retry
        }
      } else {
        // Fallback for older Node versions
        if (removeDirRecursive(dirPath)) {
          console.log('✅ Successfully cleaned dist folder (manual method)');
          return true;
        }
      }
    } catch (error) {
      // If all methods fail, wait and retry
      if (i < retries - 1) {
        console.log(`⚠️  Attempt ${i + 1}/${retries} failed: ${error.message}`);
        console.log(`   Retrying in 2 seconds...`);
        if (i === 1) {
          console.log('   💡 Tip: Close any file explorers with dist folder open');
        }
        // Wait before retrying
        const start = Date.now();
        while (Date.now() - start < 2000) {
          // Busy wait
        }
        
        // Try killing processes again on later retries
        if (i >= 2) {
          console.log('   🔄 Killing processes again...');
          killElectronProcesses();
        }
      } else {
        // Last attempt failed
        console.error(`❌ Failed on final attempt: ${error.message}`);
      }
    }
  }
  
  console.error('❌ Failed to clean dist folder after', retries, 'attempts');
  console.error('');
  console.error('📋 Please try the following:');
  console.error('   1. Close ALL instances of "WumiKay Ventures.exe"');
  console.error('   2. Close Windows Explorer windows showing the dist folder');
  console.error('   3. Check Task Manager for any Electron processes');
  console.error('   4. Manually delete the dist folder');
  console.error('   5. Or restart your computer to release all file locks');
  console.error('');
  console.error('⚠️  Build will continue, but electron-builder may fail if files are locked.');
  console.error('   You can manually delete the dist folder and run the build again.');
  
  return false; // Don't exit with error - let electron-builder try
}

// Run the cleanup
const success = removeDir(distPath);
// Don't exit with error code - let the build continue
// electron-builder might be able to handle locked files better
process.exit(0);
