@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   JuleSite process cleaner
echo   Stop the running dev server
echo ============================================
echo.

echo [1/2] Killing process(es) on port 3000 (dev server)...
set "FOUND="
set "LASTPID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    if not "%%p"=="!LASTPID!" (
        set "FOUND=1"
        taskkill /PID %%p /F >nul 2>&1
        if not errorlevel 1 (echo   [OK] killed PID %%p) else (echo   [!!] failed to kill PID %%p)
        set "LASTPID=%%p"
    )
)
if not defined FOUND echo   [--] no process found on port 3000

echo.
echo [2/2] Killing project node process(es)...
powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and ($_.CommandLine -like '*juleSite*' -or $_.CommandLine -like '*npm-cli.js*run dev*') } | Select-Object -ExpandProperty ProcessId; if ($p) { foreach ($id in $p) { try { Stop-Process -Id $id -Force -ErrorAction Stop; Write-Host ('  [OK] killed PID ' + $id) } catch { } } } else { Write-Host '  [--] no project node process found' }"

echo.
echo ============================================
echo   Done!
echo ============================================
echo.
pause
