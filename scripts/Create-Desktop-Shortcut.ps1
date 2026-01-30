# PowerShell script to create a desktop shortcut for WumiKay Ventures
# Run this script to create a one-click launcher on your desktop

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "WumiKay Ventures.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LauncherPath = Join-Path $ScriptDir "WumiKay-Launcher.bat"
$IconPath = Join-Path (Split-Path -Parent $ScriptDir) "public\icon.ico"

# Check if portable app exists
$PortableApp = Join-Path (Split-Path -Parent $ScriptDir) "dist\WumiKay Ventures 1.0.0.exe"
$InstalledApp = "$env:LOCALAPPDATA\Programs\wumikay-ventures\WumiKay Ventures.exe"

if (Test-Path $InstalledApp) {
    $Shortcut.TargetPath = $InstalledApp
    Write-Host "Creating shortcut to installed application..."
} elseif (Test-Path $PortableApp) {
    $Shortcut.TargetPath = $PortableApp
    Write-Host "Creating shortcut to portable application..."
} else {
    # Use the launcher batch file
    $Shortcut.TargetPath = $LauncherPath
    Write-Host "Creating shortcut with launcher script..."
}

$Shortcut.WorkingDirectory = Split-Path -Parent $ScriptDir
$Shortcut.Description = "WumiKay Ventures - Point of Sale System"
$Shortcut.WindowStyle = 1  # Normal window

# Set icon if available
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}

$Shortcut.Save()

Write-Host ""
Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "   Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now double-click 'WumiKay Ventures' on your desktop to start the app."
Write-Host ""
Read-Host "Press Enter to close this window"
