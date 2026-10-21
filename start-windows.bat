@echo off
cd /d "%~dp0"
cls
echo.
echo   Starting ITEMO...
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed.
  echo   Install the LTS version from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo   First run - installing. This takes a few minutes. Please wait.
  echo.
  call npm install --no-audit --no-fund || (echo   Install failed. & pause & exit /b 1)
)
call npm run demo
pause
