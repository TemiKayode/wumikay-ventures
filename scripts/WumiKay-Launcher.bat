@echo off
title WumiKay Ventures - Starting...
color 0A

echo.
echo  ======================================================
echo       WUMIKAY VENTURES - POINT OF SALE
echo              Starting Application...
echo  ======================================================
echo.

:: Check if PostgreSQL is running
echo [1/3] Checking PostgreSQL Database...
tasklist /FI "IMAGENAME eq postgres.exe" 2>NUL | find /I /N "postgres.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       [OK] PostgreSQL is already running
) else (
    echo       Starting PostgreSQL...
    
    :: Try common PostgreSQL installation paths
    if exist "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" (
        "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\17\data" -w
    ) else if exist "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" (
        "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\16\data" -w
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" (
        "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\15\data" -w
    ) else if exist "C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe" (
        "C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\14\data" -w
    ) else (
        echo       [!] Could not find PostgreSQL. Please start it manually.
    )
    
    :: Wait for PostgreSQL to start
    timeout /t 3 /nobreak >nul
    echo       [OK] PostgreSQL started
)

echo.
echo [2/3] Preparing Application...
timeout /t 1 /nobreak >nul

echo.
echo [3/3] Launching WumiKay Ventures...
echo.

:: Use absolute paths
set "WUMIKAY_DIR=C:\Users\WumiKay Ventures\Downloads\Wumikay"
set "PORTABLE_APP=%WUMIKAY_DIR%\dist\WumiKay Ventures 1.0.0.exe"
set "UNPACKED_APP=%WUMIKAY_DIR%\dist\win-unpacked\WumiKay Ventures.exe"
set "INSTALLED_APP=%LOCALAPPDATA%\Programs\wumikay-ventures\WumiKay Ventures.exe"

if exist "%PORTABLE_APP%" (
    echo       Found: Portable App
    start "" "%PORTABLE_APP%"
    goto :success
)

if exist "%UNPACKED_APP%" (
    echo       Found: Unpacked App
    start "" "%UNPACKED_APP%"
    goto :success
)

if exist "%INSTALLED_APP%" (
    echo       Found: Installed App
    start "" "%INSTALLED_APP%"
    goto :success
)

:: If none found, show error
echo.
echo  ERROR: Could not find WumiKay Ventures application.
echo.
echo  Expected locations:
echo    - %PORTABLE_APP%
echo    - %UNPACKED_APP%
echo    - %INSTALLED_APP%
echo.
echo  Please ensure the application is built or installed.
pause
exit /b 1

:success
echo.
echo  ======================================================
echo          Application Started Successfully!
echo              You may close this window
echo  ======================================================
echo.

:: Auto-close after 3 seconds
timeout /t 3 /nobreak >nul
exit
