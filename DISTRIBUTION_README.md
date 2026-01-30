# Distribution Guide - WumiKay Ventures Desktop App

## Overview
This guide explains how to build and distribute the WumiKay Ventures desktop application.

## Prerequisites

### For Building:
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (for database)

### For End Users:
- Windows 10/11 (for Windows build)
- macOS 10.13+ (for macOS build)
- Linux (for Linux build)
- PostgreSQL installed and running (required for full functionality)

## Building the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Ensure `server/.env` file exists with correct database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wumikay_ventures
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Build React Frontend
```bash
npm run build
```

### 4. Build Electron App

**For Windows:**
```bash
npm run electron:build:win
```

**For macOS:**
```bash
npm run electron:build:mac
```

**For Linux:**
```bash
npm run electron:build:linux
```

**For All Platforms:**
```bash
npm run electron:build
```

## Distribution Files

After building, distribution files will be in the `dist/` folder:

### Windows:
- `WumiKay Ventures Setup x.x.x.exe` - NSIS installer
- `WumiKay Ventures x.x.x.exe` - Portable executable

### macOS:
- `WumiKay Ventures-x.x.x.dmg` - Disk image installer

### Linux:
- `WumiKay Ventures-x.x.x.AppImage` - AppImage (portable)
- `wumikay-ventures_x.x.x_amd64.deb` - Debian package

## Installation Instructions for End Users

### Windows:
1. Download `WumiKay Ventures Setup x.x.x.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### macOS:
1. Download `WumiKay Ventures-x.x.x.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. Launch from Applications

### Linux:
1. **AppImage**: Make executable and run:
   ```bash
   chmod +x WumiKay\ Ventures-x.x.x.AppImage
   ./WumiKay\ Ventures-x.x.x.AppImage
   ```

2. **Debian Package**: Install with:
   ```bash
   sudo dpkg -i wumikay-ventures_x.x.x_amd64.deb
   ```

## Automatic Startup Features

When the desktop app is launched:

1. **Backend Server**: Automatically starts on port 5000
2. **Database Connection**: Automatically connects to PostgreSQL
3. **Frontend**: Loads the built React application
4. **Window**: Opens automatically after backend is ready

### Startup Process:
1. App detects if it's in development or production mode
2. Backend server starts automatically
3. App waits for backend to be ready (max 30 seconds)
4. Main window opens with the application
5. If backend fails, app still opens with warning (demo mode available)

## Database Setup for End Users

End users need to:

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from postgresql.org
   - macOS: `brew install postgresql` or download installer
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)

2. **Create Database**:
   ```sql
   CREATE DATABASE wumikay_ventures;
   ```

3. **Configure Connection**:
   - The app looks for `server/.env` file
   - In packaged app, this is in `resources/server/.env`
   - Users can edit this file to configure database connection

4. **Run Migrations** (if needed):
   - Database tables are created automatically on first run
   - Or run the setup script provided

## Troubleshooting

### Backend Won't Start:
- Check if PostgreSQL is running
- Verify database credentials in `server/.env`
- Check if port 5000 is available
- Check console logs for errors

### App Shows Blank Screen:
- Check browser console (F12 in dev mode)
- Verify backend is running
- Check network tab for API errors
- Ensure build completed successfully

### Database Connection Errors:
- Verify PostgreSQL service is running
- Check database credentials
- Ensure database exists
- Check firewall settings

### Path Issues (Windows):
- App handles paths with spaces automatically
- If issues persist, check console logs
- Ensure Node.js is in system PATH

## Development vs Production

### Development Mode:
- Frontend runs on React dev server (port 3000)
- Hot reload enabled
- DevTools open automatically
- More verbose logging

### Production Mode:
- Frontend served from built files
- No dev server needed
- Optimized and minified
- Minimal logging

## Build Configuration

The build is configured in `package.json` under the `"build"` section:

- **App ID**: `com.wumikay.ventures`
- **Product Name**: `WumiKay Ventures`
- **Output Directory**: `dist/`
- **Icon**: `public/logo.png`

## File Structure in Packaged App

```
WumiKay Ventures.app (or .exe)
├── resources/
│   ├── server/          # Backend server (outside asar)
│   │   ├── index.js
│   │   ├── .env
│   │   └── ...
│   └── logo.png
├── app.asar            # Packaged frontend and Electron code
└── ...
```

## Security Notes

- Backend runs locally (localhost:5000)
- No external network access required
- Database credentials stored in local .env file
- Electron security best practices implemented

## Support

For issues or questions:
1. Check console logs
2. Review this documentation
3. Check database connection
4. Verify all prerequisites are installed

## Version Information

- Current Version: 1.0.0
- Electron Version: 40.0.0
- React Version: 19.2.0
- Node.js Required: 16+
