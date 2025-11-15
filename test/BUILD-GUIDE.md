# Blog Articles Manager - Build Guide

## 📦 Building the Electron App

### Prerequisites
Make sure you have Node.js installed and dependencies are installed:
```bash
cd test
npm install
```

### Build Commands

#### 1. **Development Mode** (Test the app)
```bash
npm start
```
This will launch the app in development mode.

#### 2. **Build Portable Executable** (Recommended)
```bash
npm run build-win
```
**Output**: `test/dist/Blog Articles Manager.exe` (portable, no installation needed)

This creates a single portable .exe file that can run without installation.

#### 3. **Build with Electron Packager**
```bash
npm run pack
```
**Output**: `test/dist/BlogManager-win32-x64/` folder

This creates an unpacked application folder.

#### 4. **Build All Platforms**
```bash
npm run build-all
```
Builds for Windows, Mac, and Linux.

## 📁 Output Locations

After building, your application will be in:
- **electron-builder**: `test/dist/Blog Articles Manager.exe`
- **electron-packager**: `test/dist/BlogManager-win32-x64/BlogManager.exe`

## 🚀 Quick Start

**Easiest method for a portable app:**
```bash
cd test
npm run build-win
```

Then find your app at: `test/dist/Blog Articles Manager.exe`

## 📝 What Gets Packaged

The build includes:
- ✅ `blog-articles-standalone.html` - Your standalone app
- ✅ `electron-main.js` - Electron main process
- ✅ All Appwrite SDK dependencies (loaded from CDN)
- ✅ Window state persistence

## 🔧 Configuration

All configuration is saved to localStorage in the app:
- Appwrite endpoint
- Project ID
- Database ID
- Collection ID
- Theme preference

You can backup/restore configuration using the built-in config manager.

## 💡 Tips

1. **First Launch**: Click "⚙️ Config" to set up your Appwrite connection
2. **Portable**: The .exe file can be copied anywhere and run directly
3. **Updates**: Rebuild the app whenever you update the HTML file
4. **Dev Mode**: Use `npm start` to test changes before building

## 🐛 Troubleshooting

**Build fails:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Try `npm run build-win` again

**App won't start:**
- Check if antivirus is blocking it
- Run as administrator if needed
- Check Appwrite configuration

**Changes not showing:**
- Make sure you edited `blog-articles-standalone.html`
- Rebuild with `npm run build-win`
- Delete old .exe and use the new one
