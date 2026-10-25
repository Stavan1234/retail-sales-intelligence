@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist "logs" mkdir "logs"

title Retail Sales Intelligence - Setup

echo.
echo ===============================================================
echo       RETAIL SALES INTELLIGENCE - ONE CLICK SETUP
echo ===============================================================
echo.
echo Checking the complete project, installing dependencies,
echo running truth and quality gates, building, starting services,
echo writing logs, and opening the dashboard.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
    echo ===============================================================
    echo SETUP COMPLETE
    echo Dashboard: http://localhost:3000/overview
    echo API docs:  http://127.0.0.1:8000/docs
    echo Logs:      %~dp0logs
    echo ===============================================================
) else (
    echo ===============================================================
    echo SETUP FAILED
    echo Check the newest setup-*.log in:
    echo %~dp0logs
    echo ===============================================================
)
echo.
pause
exit /b %EXIT_CODE%
