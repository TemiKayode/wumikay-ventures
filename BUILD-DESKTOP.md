# Desktop app: Reports & rebuilding

## Reports not showing data?

The Reports & Analytics page **always loads orders from the server** when you open it. If you still see zeros:

1. **Use Refresh** – Click **🔄 Refresh** on the Reports page to reload orders and recalculate.
2. **Open Order History first** – Go to **Order History** once so orders load, then open **Reports**.
3. **Check date range** – Use **All time** so all orders are included.

## Getting the latest app on your desktop

The desktop shortcut must point to a **rebuilt** app. To remove the old one and put the right one on the desktop:

### Full update (rebuild + desktop shortcut)

From the project folder (`Wumikay`):

1. **Bundle the server**
   ```bash
   node scripts/bundle-server.js
   ```

2. **Build the React app**
   ```bash
   npm run build
   ```

3. **Package the desktop app** (updates `dist\win-unpacked` with the latest build)
   ```bash
   npx electron-builder --win --dir
   ```

4. **Update the desktop shortcut** (removes old shortcut, creates new one)
   ```bash
   powershell -ExecutionPolicy Bypass -File scripts\Update-Desktop-App.ps1
   ```

The script removes any old **WumiKay Ventures** shortcut and exe copies from your Desktop, then creates a new shortcut that launches **dist\win-unpacked\WumiKay Ventures.exe** (the version that was just built).

### Optional: portable single-file exe

To also build the portable `.exe` (takes longer):

```bash
npx electron-builder --win --config.win.target=portable
```

Then run `scripts\Update-Desktop-App.ps1` again if you want the shortcut to use the portable exe instead of the unpacked folder.

### Quick test without packaging

1. Start the server: `npm run server`
2. Build: `npm run build`
3. Run: `npm run electron`

This uses your current `build/` folder so Reports and all fixes are included.
