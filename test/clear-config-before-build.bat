@echo off
echo =====================================
echo Clearing Configuration Before Build
echo =====================================
echo.

cd /d "%~dp0"

echo This will:
echo 1. Clear localStorage (your config won't be in the app)
echo 2. Build a fresh portable .exe
echo.
echo Your configuration will be safe - it's stored separately
echo in your Windows user folder, not in the app.
echo.
pause

echo.
echo [1/4] Starting Electron to clear localStorage...
echo (The app will open and close automatically)
echo.

:: Create a temporary script to clear localStorage
echo const { app, BrowserWindow } = require('electron'); > clear-storage.js
echo app.whenReady().then(() => { >> clear-storage.js
echo   const win = new BrowserWindow({ show: false }); >> clear-storage.js
echo   win.webContents.session.clearStorageData().then(() => { >> clear-storage.js
echo     console.log('LocalStorage cleared!'); >> clear-storage.js
echo     app.quit(); >> clear-storage.js
echo   }); >> clear-storage.js
echo }); >> clear-storage.js

:: Run the script
electron clear-storage.js

:: Delete the temporary script
del clear-storage.js

echo LocalStorage cleared!
echo.

echo [2/4] Cleaning old build...
if exist "dist" (
    rmdir /s /q "dist"
    echo Old build cleaned!
)
echo.

echo [3/4] Building portable executable...
echo (This requires administrator privileges)
echo.
call npm run build-win
echo.

echo [4/4] Checking output...
if exist "dist\Blog-Articles-Manager-Portable.exe" (
    echo.
    echo =====================================
    echo SUCCESS! Clean build completed!
    echo =====================================
    echo.
    echo Your portable app is ready at:
    echo %CD%\dist\Blog-Articles-Manager-Portable.exe
    echo.
    echo This .exe file has NO configuration stored.
    echo Users will need to enter their own Appwrite details.
    echo.
    echo Your personal configuration is safe in:
    echo %LOCALAPPDATA%\blog-articles-manager
    echo.
) else (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo Try running this batch file as Administrator
    echo.
)
pause
