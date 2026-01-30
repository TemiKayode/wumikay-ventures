# PowerShell script to clean dist folder (Windows)
# This handles file locks better than Node.js on Windows

Write-Host "Cleaning dist folder..." -ForegroundColor Cyan

$distPath = Join-Path $PSScriptRoot "dist"

if (-not (Test-Path $distPath)) {
    Write-Host "dist folder does not exist - nothing to clean" -ForegroundColor Green
    exit 0
}

# Kill any Electron processes that might be locking files
Write-Host "Checking for running Electron processes..." -ForegroundColor Yellow

# More comprehensive process list
$processes = @(
    "WumiKay-Ventures",
    "WumiKay Ventures",
    "electron",
    "electron.exe",
    "WumiKay-Ventures.exe",
    "WumiKay Ventures.exe"
)

$killedCount = 0
foreach ($proc in $processes) {
    try {
        $procs = Get-Process -Name $proc -ErrorAction SilentlyContinue
        if ($procs) {
            Write-Host "Found $($procs.Count) instance(s) of $proc" -ForegroundColor Yellow
            foreach ($p in $procs) {
                try {
                    Stop-Process -Id $p.Id -Force -ErrorAction Stop
                    $killedCount++
                } catch {
                    # Try taskkill as fallback
                    try {
                        Start-Process -FilePath "taskkill" -ArgumentList "/F", "/PID", $p.Id, "/T" -NoNewWindow -Wait -ErrorAction SilentlyContinue
                        $killedCount++
                    } catch {
                        Write-Host "   Could not kill process $($p.Id)" -ForegroundColor Yellow
                    }
                }
            }
            Write-Host "Killed $proc processes" -ForegroundColor Green
        }
    } catch {
        # Process not found, continue
    }
}

# Also kill any processes that might have handles on dist folder files
Write-Host "Checking for processes with open handles..." -ForegroundColor Yellow
try {
    # Use Get-Process to find processes that might be locking files
    $allProcs = Get-Process | Where-Object { 
        $_.Path -like "*$distPath*" -or 
        $_.MainWindowTitle -like "*WumiKay*" -or
        $_.ProcessName -like "*electron*"
    }
    foreach ($p in $allProcs) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            $killedCount++
        } catch {
            # Ignore errors
        }
    }
} catch {
    # Ignore errors
}

if ($killedCount -gt 0) {
    Write-Host "Killed $killedCount process(es)" -ForegroundColor Green
}

# Wait for processes to fully terminate and file handles to release
Write-Host "Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Function to remove directory with retries
function Remove-DirectoryWithRetry {
    param(
        [string]$Path,
        [int]$MaxRetries = 5
    )
    
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            if (-not (Test-Path $Path)) {
                return $true
            }
            
            Write-Host "Attempt $($attempt)/$($MaxRetries): Removing $($Path)..." -ForegroundColor Yellow
            
            # Method 1: Remove read-only attributes recursively
            try {
                Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
                    try {
                        $_.Attributes = 'Normal'
                    } catch {
                        # Ignore errors on individual files
                    }
                }
            } catch {
                # Continue anyway
            }
            
            # Method 2: Try standard Remove-Item
            try {
                Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
                Write-Host "Successfully cleaned dist folder" -ForegroundColor Green
                return $true
            } catch {
                # If that fails, try robocopy trick (Windows-specific)
                if ($attempt -ge 2) {
                    try {
                        $emptyDir = Join-Path $env:TEMP "empty_$(Get-Random)"
                        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
                        & robocopy $emptyDir $Path /MIR /NFL /NDL /NJH /NJS | Out-Null
                        Remove-Item -Path $emptyDir -Force -ErrorAction SilentlyContinue
                        Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
                        Write-Host "Successfully cleaned dist folder (using robocopy method)" -ForegroundColor Green
                        return $true
                    } catch {
                        # Robocopy method also failed
                    }
                }
            }
            
            # If we get here, deletion failed
            if ($attempt -lt $MaxRetries) {
                Write-Host "   Retrying in 2 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
                
                # Try killing processes again on retry
                if ($attempt -eq 2) {
                    Write-Host "   Killing processes again..." -ForegroundColor Yellow
                    foreach ($proc in $processes) {
                        try {
                            Get-Process -Name $proc -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                        } catch {
                            # Ignore
                        }
                    }
                    Start-Sleep -Seconds 1
                }
            }
        } catch {
            if ($attempt -lt $MaxRetries) {
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
    return $false
}

# Try to remove the folder with retries
$success = Remove-DirectoryWithRetry -Path $distPath -MaxRetries 5

if (-not $success) {
    Write-Host ""
    Write-Host "Failed to clean dist folder after multiple attempts" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try the following:" -ForegroundColor Yellow
    Write-Host "1. Close ALL instances of WumiKay Ventures.exe" -ForegroundColor White
    Write-Host "2. Close Windows Explorer windows showing the dist folder" -ForegroundColor White
    Write-Host "3. Check Task Manager for any Electron processes" -ForegroundColor White
    Write-Host "4. Manually delete the dist folder" -ForegroundColor White
    Write-Host "5. Or restart your computer to release all file locks" -ForegroundColor White
    Write-Host ""
    Write-Host "Build will continue, but electron-builder may fail if files are locked." -ForegroundColor Yellow
    Write-Host "You can manually delete the dist folder and run the build again." -ForegroundColor Yellow
    exit 0
}

exit 0
