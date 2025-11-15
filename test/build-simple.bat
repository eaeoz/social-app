@echo off
echo =====================================
echo Building Blog Articles Manager
echo (Using electron-packager - simpler)
echo =====================================
echo.

cd /d "%~dp0"

echo [1/3] Cleaning old build...
if exist "dist\BlogManager-win32-x64" (
    rmdir /s /q "dist\BlogManager-win32-x64"
    echo Old build cleaned!
) else (
    echo No previous build found.
)
echo.

echo [2/3] Building with electron-packager...
call npm run pack
echo.

echo [3/3] Checking output...
if exist "dist\BlogManager-win32-x64\BlogManager.exe" (
    echo.
    echo =====================================
    echo SUCCESS! Build completed!
    echo =====================================
    echo.
    echo Your app is ready at:
    echo %CD%\dist\BlogManager-win32-x64\BlogManager.exe
    echo.
    echo The folder contains everything needed to run the app.
    echo You can:
    echo - Run BlogManager.exe directly
    echo - Copy the entire folder anywhere
    echo - Zip it and share
    echo.
    echo To create a single .exe installer, use NSIS (see NSIS-INSTALLER-GUIDE.md)
    echo.
) else (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo Please check the error messages above.
    echo.
)
pause
