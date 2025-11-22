@echo off
echo ========================================
echo   BlogManager NSIS Installer Builder
echo ========================================
echo.

REM Check if NSIS is installed
where makensis >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NSIS is not installed or not in PATH!
    echo.
    echo Please install NSIS from: https://nsis.sourceforge.io/Download
    echo After installation, add NSIS to your PATH or run this script from NSIS directory.
    echo.
    pause
    exit /b 1
)

echo [1/3] Building portable app...
call npm run build-portable
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Compiling NSIS installer...
cd /d "%~dp0"
makensis script.nsi
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NSIS compilation failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Success!
echo.
echo Installer created: BlogManager_1.0.0.exe
echo Location: %~dp0
echo.
pause
