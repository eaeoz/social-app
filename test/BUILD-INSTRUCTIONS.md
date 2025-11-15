# 🚀 Build Windows Executable - Step by Step

## Quick Start (Easiest Method)

**Just double-click this file:**
```
test/build-executable.bat
```

That's it! The script will:
1. Install dependencies automatically (first time only)
2. Build the Windows executable
3. Open the dist folder when done

## What You'll Get

After building, you'll find in `test/dist/`:

1. **`Blog Articles Manager Setup 1.0.0.exe`** - Windows installer
   - Double-click to install the app
   - Creates desktop shortcut
   - Adds to Start Menu

2. **`win-unpacked/`** folder - Portable version
   - No installation needed
   - Just run `Blog Articles Manager.exe`
   - Can copy to USB drive

## Manual Build (Alternative)

If you prefer manual commands:

```bash
cd test

# Install dependencies (first time only)
npm install

# Build Windows executable
npm run build-win
```

## First Run Configuration

When you run the executable for the first time:

1. The app will open
2. Enter your Appwrite credentials:
   - **Endpoint**: `https://cloud.appwrite.io/v1`
   - **Project ID**: (from your admin panel's .env file)
3. Click "Save & Connect"
4. Your blog articles will appear!

## Troubleshooting

### "npm is not recognized"
- You need Node.js installed
- Download from: https://nodejs.org/
- Use LTS version (recommended)

### Build takes a long time
- First build downloads Electron (~150MB)
- Subsequent builds are much faster
- Be patient on first run!

### Antivirus warning
- Some antivirus software may flag new .exe files
- This is normal for Electron apps
- Add exception if needed

## Advanced Options

### Build for all platforms
```bash
npm run build-all
```
This creates executables for Windows, Mac, and Linux.

### Test before building
```bash
npm start
```
This runs the app in development mode.

### Customize the app
Edit these files:
- `package.json` - App name, version, etc.
- `electron-main.js` - Window settings
- `blog-articles-standalone.html` - UI and functionality

## File Sizes

- **Installer**: ~120 MB (includes Chromium engine)
- **Unpacked**: ~180 MB
- This is normal for Electron apps

## Distribution

You can share either:
1. The installer (`.exe` file) - Users run setup
2. The entire `win-unpacked` folder - Portable, no installation

Both work the same way!

## Need Help?

Common issues:
- **CORS errors**: Won't happen in executable (only in browser)
- **Connection errors**: Check Appwrite project ID
- **Articles not loading**: Verify your internet connection

The executable is completely standalone and doesn't require your backend server!
