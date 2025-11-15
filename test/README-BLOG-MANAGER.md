# Blog Articles Manager - Standalone App

## 📝 Overview
This is a standalone blog articles manager that connects directly to your Appwrite database (same as admin panel). It displays and manages the exact same blog articles.

## 🚀 How to Use

### Option 1: For Testing (Simple HTTP Server)

Since browsers block direct file access to external APIs (CORS), you need to serve the HTML file through a server:

**Using Python:**
```bash
cd test
python -m http.server 8080
```
Then open: http://localhost:8080/blog-articles-standalone.html

**Using Node.js (npx):**
```bash
cd test
npx serve .
```

**Using VS Code:**
- Install "Live Server" extension
- Right-click on `blog-articles-standalone.html`
- Select "Open with Live Server"

### Option 2: Convert to Desktop Executable (Recommended)

The HTML file is ready to be packaged as a desktop application. Here are your options:

#### A. Using Electron (Most Popular)
```bash
npm install -g electron-packager
electron-packager . BlogManager --platform=win32 --arch=x64
```

#### B. Using Tauri (Smaller Size, Rust-based)
```bash
npm install -g @tauri-apps/cli
tauri init
tauri build
```

#### C. Using NW.js (Node-Webkit)
```bash
npm install -g nw-builder
nwbuild -p win64 .
```

## ⚙️ Configuration

On first run, enter:
- **Appwrite Endpoint**: `https://cloud.appwrite.io/v1`
- **Project ID**: Your Appwrite project ID (same as admin panel)

These credentials are saved in browser localStorage.

## ✨ Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Search by title, author, or tags
- ✅ Tag management
- ✅ Markdown content editor
- ✅ Character counters (excerpt: 500, content: 50000)
- ✅ Beautiful modern UI
- ✅ Real-time sync with admin panel
- ✅ Offline-ready after first load
- ✅ ESC to close modals

## 📊 Database Info

- Database ID: `6901d5f00010cd2a48f1`
- Collection: `blog_articles`
- Same articles as your admin panel

## 🔧 Technical Details

- Pure HTML/CSS/JavaScript
- Appwrite Web SDK v14.0.1 (loaded from CDN)
- No backend server required
- Works offline after SDK is cached
- localStorage for configuration

## 🎯 Why CORS Error on Direct File Open?

When you open an HTML file directly (`file://protocol`), browsers block requests to external APIs for security. This is normal behavior.

**Solutions:**
1. Serve through HTTP server (for testing)
2. Package as desktop app (for production use)
3. Deploy to web hosting (if you want web access)

## 📦 Recommended: Electron Packaging

For easiest conversion to executable, use Electron:

1. Create `package.json`:
```json
{
  "name": "blog-manager",
  "version": "1.0.0",
  "main": "main.js"
}
```

2. Create `main.js`:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('blog-articles-standalone.html');
}

app.whenReady().then(createWindow);
```

3. Install and package:
```bash
npm install electron --save-dev
npm install electron-packager --save-dev
npx electron-packager . BlogManager --platform=win32 --arch=x64 --out=dist
```

Your executable will be in the `dist` folder!

## 🌐 Alternative: Deploy as Web App

If you want web access instead of executable, you can deploy the HTML file to:
- Netlify
- Vercel
- GitHub Pages
- Any web host

Just upload `blog-articles-standalone.html` and it will work perfectly!
