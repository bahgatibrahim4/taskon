@echo off
echo Adding nour.taskon.local to hosts file...
echo This requires Administrator privileges
echo.

REM Get admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
    echo 127.0.0.1 nour.taskon.local >> C:\Windows\System32\drivers\etc\hosts
    echo SUCCESS: Added nour.taskon.local to hosts file
    ipconfig /flushdns
    echo DNS cache flushed
) else (
    echo ERROR: This script requires Administrator privileges
    echo Please right-click and select "Run as administrator"
)

echo.
echo You can now access: http://nour.taskon.local:4000
pause