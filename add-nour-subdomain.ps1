# add-nour-subdomain.ps1
# يجب تشغيله كمسؤول (Run as Administrator)

Write-Host "`n🔧 إضافة النطاق الفرعي nour.taskon.local..." -ForegroundColor Cyan

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

# التحقق من الصلاحيات
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ خطأ: يجب تشغيل هذا السكريبت كمسؤول!" -ForegroundColor Red
    Write-Host "💡 اضغط بزر الماوس الأيمن على PowerShell واختر 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

# قراءة الملف
$hostsContent = Get-Content $hostsPath -Raw

# التحقق من وجود النطاق
if ($hostsContent -match "nour.taskon.local") {
    Write-Host "⚠️  النطاق موجود بالفعل في ملف hosts" -ForegroundColor Yellow
} else {
    # إضافة النطاق
    Add-Content -Path $hostsPath -Value "127.0.0.1 nour.taskon.local"
    Write-Host "✅ تمت إضافة: nour.taskon.local" -ForegroundColor Green
}

# إضافة النطاقات الأساسية إذا لم تكن موجودة
if ($hostsContent -notmatch "taskon.local") {
    Add-Content -Path $hostsPath -Value "127.0.0.1 taskon.local"
    Write-Host "✅ تمت إضافة: taskon.local" -ForegroundColor Green
}

# مسح DNS Cache
Write-Host "`n🔄 مسح DNS Cache..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null
Write-Host "✅ تم مسح DNS Cache بنجاح!" -ForegroundColor Green

Write-Host "`n📋 محتوى ملف hosts (TASKON entries):" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String "taskon" | ForEach-Object {
    Write-Host "   $($_.Line)" -ForegroundColor White
}

Write-Host "`n🎉 الإعداد مكتمل!" -ForegroundColor Green
Write-Host "🌐 يمكنك الآن فتح: http://nour.taskon.local:4000" -ForegroundColor Cyan
Write-Host "`n💡 تأكد من:" -ForegroundColor Yellow
Write-Host "   1. إغلاق المتصفح تماماً وإعادة فتحه" -ForegroundColor White
Write-Host "   2. استخدام Ctrl+Shift+R للتحديث بدون cache" -ForegroundColor White
Write-Host "   3. التأكد من أن السيرفر يعمل على port 4000" -ForegroundColor White

Write-Host "`n"
pause