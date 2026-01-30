@echo off
REM Build script for Windows that handles file locks better

echo ========================================
echo WumiKay Ventures - Windows Build Script
echo ========================================
echo.

REM Step 1: Try to clean dist folder
echo [1/3] Cleaning dist folder...
call npm run clean:dist:win
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  Warning: Clean failed, but continuing...
    echo    You may need to manually delete the dist folder if build fails
    echo.
)

REM Step 2: Build React app
echo.
echo [2/3] Building React frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed at React build step
    pause
    exit /b %ERRORLEVEL%
)

REM Step 3: Build Electron app
echo.
echo [3/3] Packaging Electron app...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call electron-builder --win
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed at Electron packaging step
    echo.
    echo 💡 If you see "Access is denied" errors:
    echo    1. Close all instances of WumiKay Ventures.exe
    echo    2. Close Windows Explorer windows showing dist folder
    echo    3. Manually delete the dist folder
    echo    4. Run this script again
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ Build completed successfully!
echo    Distribution files are in the dist folder
echo.
pause
