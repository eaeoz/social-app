const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Path to store window state
const stateFilePath = path.join(app.getPath('userData'), 'window-state.json');

// Load window state
function loadWindowState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading window state:', err);
  }
  
  // Default window state
  return {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined
  };
}

// Save window state
function saveWindowState() {
  try {
    const bounds = mainWindow.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    };
    fs.writeFileSync(stateFilePath, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving window state:', err);
  }
}

function createWindow() {
  const windowState = loadWindowState();
  
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'blog-icon.png'),
    title: 'Blog Articles Manager',
    backgroundColor: '#00000000',
    show: false
  });

  mainWindow.loadFile('blog-articles-json.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window state on resize and move
  mainWindow.on('resize', () => {
    saveWindowState();
  });

  mainWindow.on('move', () => {
    saveWindowState();
  });

  // Open DevTools in development (optional - comment out for production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
