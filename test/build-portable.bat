@echo off
echo =====================================
echo Building Blog Articles Manager
echo =====================================
echo.

cd /d "%~dp0"

echo [1/3] Cleaning old build...
if exist "dist" (
    rmdir /s /q "dist"
    echo Old build cleaned!
) else (
    echo No previous build found.
)
echo.

echo [2/3] Building portable executable...
call npm run build-win
echo.

echo [3/3] Checking output...
if exist "dist\Blog-Articles-Manager-Portable.exe" (
    echo.
    echo =====================================
    echo SUCCESS! Build completed!
    echo =====================================
    echo.
    echo Your portable app is ready at:
    echo %CD%\dist\Blog-Articles-Manager-Portable.exe
    echo.
    echo You can now:
    echo - Run the .exe file directly
    echo - Copy it anywhere you want
    echo - Share it with others
    echo.
    pause
) else (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo Please check the error messages above.
    echo.
    pause
)
