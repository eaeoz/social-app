@echo off
echo ========================================
echo Blog Articles Manager - Build Executable
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    echo This may take a few minutes on first run...
    call npm install
    echo.
) else (
    echo [1/3] Dependencies already installed
    echo.
)

echo [2/3] Building Windows executable...
echo This will create a .exe file in the dist folder...
echo.
call npm run build-win

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Your executable is ready at:
echo test\dist\Blog Articles Manager Setup 1.0.0.exe
echo.
echo You can:
echo 1. Run the installer to install the app
echo 2. Or find the unpacked app in: test\dist\win-unpacked\
echo.
echo Press any key to open the dist folder...
pause > nul
start dist
