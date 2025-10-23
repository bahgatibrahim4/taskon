@echo off
echo ============================================
echo  Adding bahgat.taskon.local to hosts file
echo ============================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges!
    echo Right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

REM Add bahgat subdomain
echo Adding: 127.0.0.1 bahgat.taskon.local
echo 127.0.0.1 bahgat.taskon.local >> C:\Windows\System32\drivers\etc\hosts

REM Add taskon.local if not exists
findstr /C:"taskon.local" C:\Windows\System32\drivers\etc\hosts >nul
if %errorLevel% neq 0 (
    echo Adding: 127.0.0.1 taskon.local
    echo 127.0.0.1 taskon.local >> C:\Windows\System32\drivers\etc\hosts
)

REM Flush DNS cache
echo.
echo Flushing DNS cache...
ipconfig /flushdns >nul 2>&1

echo.
echo ============================================
echo  SUCCESS!
echo ============================================
echo.
echo bahgat.taskon.local has been added!
echo.
echo You can now access:
echo   http://bahgat.taskon.local:4000
echo.
echo Make sure the server is running on port 4000
echo.
pause
