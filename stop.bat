@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo Stopping Retail Sales Intelligence services...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"
if not "%ERRORLEVEL%"=="0" (
  echo Stop script failed.
  pause
  exit /b %ERRORLEVEL%
)
echo Done.
pause
