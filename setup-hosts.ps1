# setup-hosts.ps1
# TASKON Subdomain System - Hosts File Setup Script
# يجب تشغيله كمسؤول (Run as Administrator)

Write-Host "`n" -NoNewline
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     TASKON Subdomain System Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n"

# التحقق من صلاحيات المسؤول
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ خطأ: يجب تشغيل هذا السكريبت كمسؤول (Administrator)" -ForegroundColor Red
    Write-Host "`n💡 اضغط بزر الماوس الأيمن على PowerShell واختر 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "`n"
    pause
    exit
}

Write-Host "✅ تم التحقق من الصلاحيات" -ForegroundColor Green
Write-Host "`n"

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

# قراءة محتوى الملف الحالي
try {
    $hostsContent = Get-Content $hostsPath -Raw -ErrorAction Stop
} catch {
    Write-Host "❌ خطأ في قراءة ملف hosts: $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit
}

# النطاقات الفرعية المراد إضافتها
$subdomains = @(
    "taskon.local",
    "company1.taskon.local",
    "company2.taskon.local",
    "company3.taskon.local",
    "shrk-alkotbar.taskon.local",
    "acme.taskon.local",
    "test-company.taskon.local"
)

# التحقق من وجود سجلات TASKON
if ($hostsContent -notmatch "TASKON Subdomains") {
    Write-Host "🔧 إضافة سجلات TASKON إلى ملف hosts..." -ForegroundColor Cyan
    Write-Host "`n"
    
    # إضافة التعليقات والسجلات
    try {
        Add-Content -Path $hostsPath -Value "`n# TASKON Subdomains Configuration - Added $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ErrorAction Stop
        
        $addedCount = 0
        $existingCount = 0
        
        foreach ($subdomain in $subdomains) {
            if ($hostsContent -notmatch [regex]::Escape($subdomain)) {
                Add-Content -Path $hostsPath -Value "127.0.0.1 $subdomain" -ErrorAction Stop
                Write-Host "  ✅ تمت إضافة: $subdomain" -ForegroundColor Green
                $addedCount++
            } else {
                Write-Host "  ⚠️  موجود بالفعل: $subdomain" -ForegroundColor Yellow
                $existingCount++
            }
        }
        
        Write-Host "`n"
        Write-Host "📊 النتيجة:" -ForegroundColor Cyan
        Write-Host "   • تمت إضافة: $addedCount نطاق" -ForegroundColor Green
        Write-Host "   • موجود مسبقاً: $existingCount نطاق" -ForegroundColor Yellow
        
    } catch {
        Write-Host "`n❌ خطأ في الكتابة إلى ملف hosts: $($_.Exception.Message)" -ForegroundColor Red
        pause
        exit
    }
} else {
    Write-Host "⚠️  سجلات TASKON موجودة بالفعل في ملف hosts" -ForegroundColor Yellow
    Write-Host "💡 إذا أردت إعادة الإضافة، احذف السطر الذي يحتوي على 'TASKON Subdomains' من ملف hosts" -ForegroundColor Cyan
}

Write-Host "`n"

# مسح DNS Cache
Write-Host "🔄 مسح DNS Cache..." -ForegroundColor Cyan
try {
    $result = ipconfig /flushdns 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم مسح DNS Cache بنجاح!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  تحذير: قد لا يكون DNS Cache قد تم مسحه بالكامل" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  تحذير: فشل مسح DNS Cache" -ForegroundColor Yellow
}

Write-Host "`n"

# عرض السجلات المضافة
Write-Host "📋 السجلات المضافة في ملف hosts:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor DarkGray
$taskonEntries = Get-Content $hostsPath | Select-String "taskon"
foreach ($entry in $taskonEntries) {
    if ($entry.Line -match "^127\.0\.0\.1") {
        Write-Host "   $($entry.Line)" -ForegroundColor White
    } elseif ($entry.Line -match "^#") {
        Write-Host "   $($entry.Line)" -ForegroundColor DarkGray
    }
}
Write-Host "================================================" -ForegroundColor DarkGray

Write-Host "`n"
Write-Host "🎉 الإعداد مكتمل! يمكنك الآن اختبار النطاقات الفرعية." -ForegroundColor Green
Write-Host "`n"

Write-Host "🌐 روابط للاختبار:" -ForegroundColor Cyan
Write-Host "   • صفحة الاختبار:" -ForegroundColor White
Write-Host "     http://company1.taskon.local:4000/test-subdomain.html" -ForegroundColor Yellow
Write-Host "`n   • لوحة التحكم:" -ForegroundColor White
Write-Host "     http://localhost:4000/admin-dashboard.html" -ForegroundColor Yellow
Write-Host "`n   • المشاريع (مع subdomain):" -ForegroundColor White
Write-Host "     http://company1.taskon.local:4000/projects.html" -ForegroundColor Yellow

Write-Host "`n"
Write-Host "💡 تلميحات:" -ForegroundColor Cyan
Write-Host "   1. تأكد من تشغيل السيرفر: node server.js" -ForegroundColor White
Write-Host "   2. إذا لم يعمل النطاق، أعد تشغيل المتصفح" -ForegroundColor White
Write-Host "   3. استخدم Ctrl+Shift+R للتحديث بدون cache" -ForegroundColor White

Write-Host "`n"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     Happy Coding! 🚀" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n"

pause
