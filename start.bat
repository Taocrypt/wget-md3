@echo off
setlocal enabledelayedexpansion
title Wget MD3 Launcher

cls
echo.
echo ====================================
echo    Wget MD3 Website Downloader
echo    Quick Start Script v1.5
echo ====================================
echo.

:: Check Node.js
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo.
    echo Solution:
    echo 1. Visit https://nodejs.org/
    echo 2. Download and install LTS version
    echo 3. Restart terminal and try again
    echo.
    goto error_exit
)

for /f "tokens=*" %%a in ('node --version 2^>nul') do set NODE_VERSION=%%a
echo [OK] Node.js version: %NODE_VERSION%

:: Check npm
echo [2/4] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found
    echo npm is usually installed with Node.js
    goto error_exit
)

for /f "tokens=*" %%a in ('npm --version 2^>nul') do set NPM_VERSION=%%a
echo [OK] npm version: %NPM_VERSION%

:: Check project files
echo [3/4] Checking project files...
if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Please run this script in the project root directory
    echo Current directory: %CD%
    goto error_exit
)
echo [OK] Project files verified

:: Check dependencies
echo [4/4] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] First run, installing dependencies...
    echo This may take a few minutes, please wait...
    echo.
    
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        echo.
        echo Try these solutions:
        echo 1. Check your internet connection
        echo 2. Use China mirror:
        echo    npm config set registry https://registry.npmmirror.com
        echo 3. Clear npm cache:
        echo    npm cache clean --force
        goto error_exit
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

:: Check for existing server
echo.
echo Checking if port 6868 is available...
netstat -an | find "6868" | find "LISTENING" >nul 2>&1
if %errorlevel% == 0 (
    echo [WARNING] Port 6868 is already in use
    echo.
    echo Trying to stop existing Node.js processes...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 >nul
    echo Done.
    echo.
)

if not exist "server.js" (
    echo [ERROR] server.js not found
    echo Please check project integrity
    goto error_exit
)

echo.
echo ====================================
echo    Starting Project
echo ====================================
echo.
echo Project Info:
echo - URL: http://localhost:6868/
echo - Material Design 3 interface
echo - Complete website download support
echo - File merging feature
echo.
echo Note: Browser will open automatically in 3 seconds
echo       Press Ctrl+C to stop the server
echo.

echo Starting server...
echo.

:: Start browser after delay
start /min "" cmd /c "ping localhost -n 4 >nul 2>&1 && start http://localhost:6868/"

echo ====================================
echo   Server Starting...
echo   Browser will open in 3 seconds
echo   URL: http://localhost:6868/
echo ====================================
echo.

:: Start the server
node server.js

:: Normal exit
echo.
echo ====================================
echo Server stopped
echo Thank you for using Wget MD3!
echo ====================================
echo.
pause
exit /b 0

:error_exit
echo.
echo ====================================
echo Startup Failed
echo ====================================
echo Please solve the above issues and try again
echo.
echo For help:
echo 1. Check README.md
echo 2. Visit: https://github.com/taocrypt/wget-md3
echo.
pause
exit /b 1