# 🔧 إعداد ملف Hosts تلقائياً لنظام النطاقات الفرعية

## نظرة عامة
هذا الملف يساعدك على إضافة السجلات المطلوبة لملف hosts في Windows بسهولة.

## الطريقة اليدوية

### 1. افتح PowerShell كمسؤول
اضغط بزر الماوس الأيمن على أيقونة PowerShell واختر "Run as Administrator"

### 2. نفذ الأمر التالي
```powershell
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n127.0.0.1 taskon.local`n127.0.0.1 company1.taskon.local`n127.0.0.1 company2.taskon.local`n127.0.0.1 shrk-alkotbar.taskon.local"
```

### 3. امسح DNS Cache
```powershell
ipconfig /flushdns
```

### 4. تحقق من الإضافة
```powershell
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "taskon"
```

---

## الطريقة التفاعلية

### خطوة بخطوة:

1. **افتح PowerShell كمسؤول**

2. **افتح ملف hosts للتعديل:**
   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

3. **أضف في نهاية الملف:**
   ```
   # TASKON Subdomains Configuration
   127.0.0.1 taskon.local
   127.0.0.1 localhost
   
   # Company Subdomains
   127.0.0.1 company1.taskon.local
   127.0.0.1 company2.taskon.local
   127.0.0.1 company3.taskon.local
   127.0.0.1 shrk-alkotbar.taskon.local
   127.0.0.1 acme.taskon.local
   127.0.0.1 test-company.taskon.local
   
   # Add more company subdomains as needed
   # 127.0.0.1 your-company-name.taskon.local
   ```

4. **احفظ الملف:** Ctrl+S

5. **امسح DNS Cache:**
   ```powershell
   ipconfig /flushdns
   ```

---

## سكريبت PowerShell تلقائي

احفظ الكود التالي في ملف `setup-hosts.ps1` ثم شغله كمسؤول:

```powershell
# setup-hosts.ps1
# يجب تشغيله كمسؤول (Run as Administrator)

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

# قراءة محتوى الملف الحالي
$hostsContent = Get-Content $hostsPath -Raw

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
    
    # إضافة التعليقات والسجلات
    Add-Content -Path $hostsPath -Value "`n# TASKON Subdomains Configuration"
    
    foreach ($subdomain in $subdomains) {
        if ($hostsContent -notmatch $subdomain) {
            Add-Content -Path $hostsPath -Value "127.0.0.1 $subdomain"
            Write-Host "✅ تمت إضافة: $subdomain" -ForegroundColor Green
        } else {
            Write-Host "⚠️ موجود بالفعل: $subdomain" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n✅ تم الانتهاء من إضافة السجلات!" -ForegroundColor Green
} else {
    Write-Host "⚠️ سجلات TASKON موجودة بالفعل في ملف hosts" -ForegroundColor Yellow
}

# مسح DNS Cache
Write-Host "`n🔄 مسح DNS Cache..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null
Write-Host "✅ تم مسح DNS Cache بنجاح!" -ForegroundColor Green

# عرض السجلات المضافة
Write-Host "`n📋 السجلات الموجودة:" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String "taskon" | ForEach-Object {
    Write-Host $_.Line -ForegroundColor White
}

Write-Host "`n🎉 الإعداد مكتمل! يمكنك الآن اختبار النطاقات الفرعية." -ForegroundColor Green
Write-Host "🌐 مثال: http://company1.taskon.local:4000/test-subdomain.html" -ForegroundColor Cyan
```

### كيفية تشغيل السكريبت:

1. احفظ الكود أعلاه في ملف: `setup-hosts.ps1`

2. افتح PowerShell كمسؤول

3. انتقل لمجلد المشروع:
   ```powershell
   cd C:\Users\acer\Desktop\taskon\docs
   ```

4. شغل السكريبت:
   ```powershell
   .\setup-hosts.ps1
   ```

---

## سكريبت إضافة نطاق فرعي جديد

إذا أردت إضافة نطاق فرعي لشركة جديدة:

```powershell
# add-subdomain.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$Subdomain
)

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$fullDomain = "$Subdomain.taskon.local"

$hostsContent = Get-Content $hostsPath -Raw

if ($hostsContent -notmatch $fullDomain) {
    Add-Content -Path $hostsPath -Value "127.0.0.1 $fullDomain"
    Write-Host "✅ تمت إضافة: $fullDomain" -ForegroundColor Green
    
    ipconfig /flushdns | Out-Null
    Write-Host "✅ تم مسح DNS Cache" -ForegroundColor Green
    Write-Host "🌐 يمكنك الآن فتح: http://$fullDomain:4000" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ النطاق موجود بالفعل: $fullDomain" -ForegroundColor Yellow
}
```

**الاستخدام:**
```powershell
# إضافة شركة جديدة
.\add-subdomain.ps1 -Subdomain "new-company"

# أو
.\add-subdomain.ps1 -Subdomain "shrk-alkotbar-aljdyd"
```

---

## التحقق من الإعداد

### 1. التحقق من ملف hosts
```powershell
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "taskon"
```

### 2. اختبار النطاق
```powershell
# ping company1.taskon.local
ping company1.taskon.local
```

يجب أن ترى:
```
Pinging company1.taskon.local [127.0.0.1] with 32 bytes of data:
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
```

### 3. اختبار في المتصفح
افتح:
```
http://company1.taskon.local:4000/test-subdomain.html
```

---

## مسح جميع سجلات TASKON

إذا أردت إزالة جميع السجلات:

```powershell
# remove-taskon-hosts.ps1
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

$content = Get-Content $hostsPath
$newContent = $content | Where-Object { $_ -notmatch "taskon" -and $_ -notmatch "TASKON" }

$newContent | Set-Content $hostsPath

Write-Host "✅ تم حذف جميع سجلات TASKON" -ForegroundColor Green
ipconfig /flushdns | Out-Null
Write-Host "✅ تم مسح DNS Cache" -ForegroundColor Green
```

---

## استكشاف الأخطاء

### "Access Denied" عند التشغيل
**السبب:** لم تقم بتشغيل PowerShell كمسؤول
**الحل:** اضغط بزر الماوس الأيمن على PowerShell → "Run as Administrator"

### "Execution Policy" Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### لا يعمل النطاق بعد الإضافة
1. امسح DNS Cache:
   ```powershell
   ipconfig /flushdns
   ```

2. أعد تشغيل المتصفح

3. استخدم Ctrl+Shift+R للتحديث بدون cache

---

## ملاحظات مهمة

### 1. الصلاحيات المطلوبة
- يجب تشغيل PowerShell **كمسؤول** (Administrator)
- ملف hosts يتطلب صلاحيات عالية للتعديل

### 2. DNS Cache
- دائماً امسح DNS Cache بعد التعديل
- بعض المتصفحات لها DNS cache خاص

### 3. Antivirus
- بعض برامج الحماية تمنع تعديل ملف hosts
- قد تحتاج لتعطيل الحماية مؤقتاً

### 4. Port Number
- لا تنس إضافة رقم البورت `:4000` في الرابط
- في الإنتاج: لن تحتاج للبورت (سيكون 80 أو 443)

---

## روابط سريعة للاختبار

بعد الإعداد، اختبر هذه الروابط:

1. **الصفحة الرئيسية:**
   ```
   http://localhost:4000
   http://taskon.local:4000
   ```

2. **صفحة الاختبار:**
   ```
   http://company1.taskon.local:4000/test-subdomain.html
   http://company2.taskon.local:4000/test-subdomain.html
   ```

3. **لوحة التحكم:**
   ```
   http://localhost:4000/admin-dashboard.html
   ```

4. **المشاريع (مع subdomain):**
   ```
   http://company1.taskon.local:4000/projects.html
   ```

---

## 🎉 انتهى الإعداد!

بعد اتباع هذه الخطوات، سيكون لديك نظام subdomains يعمل بكامل طاقته!

**للمزيد من المعلومات:**
- 📖 `QUICK_START_SUBDOMAIN.md` - دليل البدء السريع
- 📖 `SUBDOMAIN_SETUP_GUIDE.md` - الدليل الشامل
- 🧪 `test-subdomain.html` - صفحة الاختبار

**Happy Coding! 🚀**
