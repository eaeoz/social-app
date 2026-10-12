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

REM ---- Live site to scrape (no local files needed) ----
set "SITE_URL=https://sedat.netlify.app/donate"

echo.
echo ============================================================
echo            CRYPTO DONATION ADDRESS CHECK
echo ============================================================
echo.

echo Source URL  : %SITE_URL%
echo Fetching live addresses from the deployed site...
echo.

REM ---- Scrape the deployed React app ----
REM  The /donate page is a single-page app, so the raw HTML only
REM  contains the JS bundle reference. We download that bundle and
REM  pull the wallet addresses out of it live.
set /a idx=0
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$h=(Invoke-WebRequest -UseBasicParsing '%SITE_URL%').Content;$m=[regex]::Match($h,'/assets/index-[^/]+\.js');if(-not $m.Success){exit 1};$u='https://sedat.netlify.app'+$m.Value;$j=(Invoke-WebRequest -UseBasicParsing $u).Content;$a=[regex]::Matches($j,'address:\x22([0-9A-Za-z]+)\x22');foreach($x in $a){$x.Groups[1].Value}"`) do (
  set /a idx+=1
  set "SITE_!idx!=%%A"
)

if !idx! LSS 3 (
  echo [ERROR] Could not read 3 addresses from the live site ^(found !idx!^).
  echo         Check your internet connection or the site: %SITE_URL%
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
  echo   RESULT : SOME CODES DO NOT MATCH THE SITE [ X ]
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
  echo     Status   : [ OK ] MATCH
  set /a MATCHES+=1
) else (
  echo     Status   : [ X ]  *** MISMATCH ***
)
echo.
exit /b
