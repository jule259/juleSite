@echo off
cd /d "%~dp0"

echo ============================================
echo   JuleSite dev server
echo   Starting local development server
echo ============================================
echo.

npm run dev

echo.
echo Server stopped.
pause
