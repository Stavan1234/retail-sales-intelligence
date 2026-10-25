@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Retail Sales Intelligence - Run

echo.
echo ===============================================================
echo        RETAIL SALES INTELLIGENCE - QUICK START
echo ===============================================================
echo.

rem --- First-time checks: setup.bat creates both of these ---------
if not exist "backend\.venv\Scripts\python.exe" (
    echo The Python environment is missing.
    echo Run setup.bat once first, then use run.bat afterwards.
    echo.
    pause
    exit /b 1
)
if not exist ".env.local" (
    copy /y ".env.example" ".env.local" >nul
    echo Created .env.local so the website talks to the local API.
)
if not exist "node_modules" (
    echo Installing website dependencies (first run only^)...
    call npm ci --no-audit --no-fund
    if errorlevel 1 (
        echo npm install failed. Run setup.bat for a full diagnosis.
        pause
        exit /b 1
    )
)

rem --- Start the analytics API (port 8000) in its own window -------
echo Starting the analytics API on http://127.0.0.1:8000 ...
start "Retail Sales Intelligence - API" cmd /k ""%~dp0backend\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

rem --- Start the website (port 3000) in its own window -------------
echo Starting the website on http://localhost:3000 ...
start "Retail Sales Intelligence - Website" cmd /k "npm run dev"

rem --- Give both servers a moment, then open the browser -----------
echo Waiting for the servers to start...
timeout /t 8 /nobreak >nul
start "" "http://localhost:3000/overview"

echo.
echo ===============================================================
echo  Running. Two windows were opened: API and Website.
echo  To stop, close those two windows (or press Ctrl+C in them).
echo ===============================================================
echo.
pause
