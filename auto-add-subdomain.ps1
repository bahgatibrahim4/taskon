# auto-add-subdomain.ps1
# سكريبت يضيف النطاق الفرعي تلقائياً بعد إنشاء الشركة
# يجب تشغيله كمسؤول (Run as Administrator)

param(
    [Parameter(Mandatory=$true)]
    [string]$Subdomain
)

Write-Host "`n🚀 إضافة النطاق الفرعي تلقائياً..." -ForegroundColor Cyan

# التحقق من الصلاحيات
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ يجب تشغيل PowerShell كمسؤول!" -ForegroundColor Red
    exit 1
}

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$fullDomain = "$Subdomain.taskon.local"

# قراءة محتوى hosts
$hostsContent = Get-Content $hostsPath -Raw

# التحقق من عدم التكرار
if ($hostsContent -match [regex]::Escape($fullDomain)) {
    Write-Host "⚠️  النطاق موجود بالفعل: $fullDomain" -ForegroundColor Yellow
    exit 0
}

# إضافة النطاق
try {
    Add-Content -Path $hostsPath -Value "127.0.0.1 $fullDomain"
    Write-Host "✅ تمت إضافة: $fullDomain" -ForegroundColor Green
    
    # مسح DNS Cache
    ipconfig /flushdns | Out-Null
    Write-Host "✅ تم مسح DNS Cache" -ForegroundColor Green
    
    Write-Host "`n🌐 الرابط جاهز: http://$fullDomain:4000" -ForegroundColor Cyan
    
    exit 0
} catch {
    Write-Host "❌ خطأ: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
