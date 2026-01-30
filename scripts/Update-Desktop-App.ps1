# Update-Desktop-App.ps1
# Removes old WumiKay desktop shortcut/exe and creates new shortcut to the built app.
# Run from project root: .\scripts\Update-Desktop-App.ps1

$ErrorActionPreference = "Stop"
$DesktopPath = [Environment]::GetFolderPath("Desktop")

# Project root = parent of scripts folder
$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path -Parent $ScriptDir
$PortableExe = Join-Path $ProjectRoot "dist\WumiKay Ventures 1.0.0.exe"
$UnpackedExe = Join-Path $ProjectRoot "dist\win-unpacked\WumiKay Ventures.exe"
$LiveUnpackedExe = Join-Path $ProjectRoot "dist-live\win-unpacked\WumiKay Ventures.exe"
$IconPath = Join-Path $ProjectRoot "public\icon.ico"
$ShortcutPath = Join-Path $DesktopPath "WumiKay Ventures.lnk"

Write-Host ""
Write-Host "WumiKay Ventures - Desktop shortcut update" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Remove old desktop shortcut
if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath -Force
    Write-Host "[OK] Removed old shortcut: WumiKay Ventures.lnk" -ForegroundColor Yellow
} else {
    Write-Host "[--] No existing shortcut found." -ForegroundColor Gray
}

# 2. Remove any old WumiKay exe copies on Desktop (e.g. copied portable exe)
Get-ChildItem -Path $DesktopPath -Filter "WumiKay Ventures*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "[OK] Removed old exe from Desktop: $($_.Name)" -ForegroundColor Yellow
}

# 3. Determine target: prefer dist-live (latest rebuild), then dist unpacked, then portable
$TargetPath = $null
if (Test-Path $LiveUnpackedExe) {
    $TargetPath = $LiveUnpackedExe
    Write-Host "[OK] Using live app: dist-live\win-unpacked\WumiKay Ventures.exe" -ForegroundColor Green
} elseif (Test-Path $UnpackedExe) {
    $TargetPath = $UnpackedExe
    Write-Host "[OK] Using unpacked app: dist\win-unpacked\WumiKay Ventures.exe" -ForegroundColor Green
} elseif (Test-Path $PortableExe) {
    $TargetPath = $PortableExe
    Write-Host "[OK] Using portable app: WumiKay Ventures 1.0.0.exe" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: No built app found." -ForegroundColor Red
    Write-Host "  Expected: $PortableExe" -ForegroundColor Red
    Write-Host "  Or:      $UnpackedExe" -ForegroundColor Red
    Write-Host "  Or:      $LiveUnpackedExe" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run from project root:" -ForegroundColor Yellow
    Write-Host "  npm run bundle:server" -ForegroundColor White
    Write-Host "  npm run build" -ForegroundColor White
    Write-Host "  npx electron-builder --win --config.win.target=portable" -ForegroundColor White
    Write-Host ""
    exit 1
}

# 4. Create new shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "WumiKay Ventures - Point of Sale System"
$Shortcut.WindowStyle = 1
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}
$Shortcut.Save()

Write-Host "[OK] Created new shortcut: $ShortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "Done. Double-click 'WumiKay Ventures' on your desktop to start the updated app." -ForegroundColor Green
Write-Host ""
