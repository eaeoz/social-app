@echo off
setlocal EnableDelayedExpansion
title Crypto Donation Address Check

REM ============================================================
REM  Default codes - defined at the start of the script
REM ============================================================
set "BTC_CODE=14S98pyuGk6t6G43hDpYFQ9vUhhGQZvbuF"
set "USDT_CODE=0xf840b7e4ea2d0123e35d4e32c8b2179b9db5e9d2"
set "ETH_CODE=0xf840b7e4ea2d0123e35d4e32c8b2179b9db5e9d2"

REM ============================================================
REM  If arguments are given, use them instead of the defaults.
REM  Usage: check.bat [BTC] [USDT] [ETH]
REM  Order: 1 = BTC, 2 = USDT/BNB, 3 = ETH
REM ============================================================
if not "%~1"=="" set "BTC_CODE=%~1"
if not "%~2"=="" set "USDT_CODE=%~2"
if not "%~3"=="" set "ETH_CODE=%~3"

REM ---- Locate the site source file (Donate.tsx) ----
set "SITE_FILE=%~dp0blog\src\pages\Donate.tsx"
if not exist "%SITE_FILE%" set "SITE_FILE=%~dp0..\blog\src\pages\Donate.tsx"
if not exist "%SITE_FILE%" set "SITE_FILE=%~dp0src\pages\Donate.tsx"

echo.
echo ============================================================
echo            CRYPTO DONATION ADDRESS CHECK
echo ============================================================
echo.

if not exist "%SITE_FILE%" (
  echo [ERROR] Donate.tsx was not found.
  echo         Looked for: %SITE_FILE%
  echo.
  pause
  exit /b 1
)

echo Source file : %SITE_FILE%
echo.

REM ---- Extract the 3 addresses from the site source code ----
set /a idx=0
for /f "tokens=2 delims='" %%A in ('findstr /c:"address: '" "%SITE_FILE%"') do (
  set /a idx+=1
  set "SITE_!idx!=%%A"
)

if !idx! LSS 3 (
  echo [ERROR] Expected 3 addresses in the source but found !idx!.
  echo.
  pause
  exit /b 1
)

set "MATCHES=0"
set "TOTAL=0"

call :check "BTC"      "%BTC_CODE%"  "!SITE_1!"
call :check "BNB/USDT" "%USDT_CODE%" "!SITE_2!"
call :check "ETH"      "%ETH_CODE%"  "!SITE_3!"

echo ============================================================
if "!MATCHES!"=="!TOTAL!" (
  echo   RESULT : ALL CODES MATCH THE SITE        [ OK ]
) else (
  echo   RESULT : SOME CODES DO NOT MATCH THE SITE [ MISMATCH ]
)
echo   MATCHED: !MATCHES! / !TOTAL!
echo ============================================================
echo.
pause
exit /b 0

REM ------------------------------------------------------------
REM  Subroutine: compare one expected code with the site code
REM ------------------------------------------------------------
:check
set /a TOTAL+=1
set "NAME=%~1"
set "EXPECT=%~2"
set "ACTUAL=%~3"
echo ------------------------------------------------------------
echo   %NAME%
echo     To check : %EXPECT%
echo     On site  : %ACTUAL%
if /i "%EXPECT%"=="%ACTUAL%" (
  echo     Status   : MATCH
  set /a MATCHES+=1
) else (
  echo     Status   : *** MISMATCH ***
)
echo.
exit /b
