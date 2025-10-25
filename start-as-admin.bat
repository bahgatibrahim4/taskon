@echo off
:: التحقق من صلاحيات المسؤول
NET SESSION >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ تشغيل بصلاحيات المسؤول...
    echo.
    echo 🚀 بدء تشغيل السيرفر...
    echo.
    npm start
) else (
    echo ⚠️  يجب تشغيل هذا الملف بصلاحيات المسؤول (Run as Administrator)
    echo.
    echo 💡 اضغط كليك يمين على الملف واختر "Run as administrator"
    echo.
    pause
)
