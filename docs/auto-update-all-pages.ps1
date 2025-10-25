# سكريبت تحديث تلقائي لكل صفحات HTML مع projectUtils.js
# يضيف projectUtils ويستبدل fetch calls

Write-Host "🚀 بدء تحديث كل الصفحات..." -ForegroundColor Cyan

$files = @(
    "contractor.html",
    "workers.html",
    "store.html",
    "supplies.html",
    "suppliers.html",
    "supplier-details.html",
    "purchases.html",
    "equipments.html",
    "receipts.html",
    "monthly-pay.html",
    "month-details.html",
    "store-report.html",
    "drawings.html"
)

$updated = 0
$failed = 0

foreach ($file in $files) {
    $filePath = "c:\Users\acer\Desktop\taskon\docs\$file"
    
    if (!(Test-Path $filePath)) {
        Write-Host "⚠️  الملف غير موجود: $file" -ForegroundColor Red
        $failed++
        continue
    }
    
    try {
        Write-Host "📝 معالجة: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # تحقق إذا كان السكريبت موجود بالفعل
        if ($content -match 'projectUtils\.js') {
            Write-Host "   ⏭️  تم بالفعل: $file (projectUtils موجود)" -ForegroundColor Gray
            continue
        }
        
        # البحث عن <body> وإضافة السكريبت بعده
        if ($content -match '(<body[^>]*>)') {
            $bodyTag = $Matches[1]
            $replacement = @"
$bodyTag
  <script src="js/projectUtils.js"></script>
  <script>
    // التحقق من وجود مشروع محدد
    if (!projectUtils.checkAuth()) {
      throw new Error('No project selected');
    }
  </script>
"@
            $content = $content -replace $bodyTag, $replacement
            
            Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "   ✅ تم تحديث: $file" -ForegroundColor Green
            $updated++
        }
        else {
            Write-Host "   ⚠️  لم يتم العثور على <body> في: $file" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "   ❌ خطأ في معالجة: $file - $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 ملخص التحديث:" -ForegroundColor Cyan
Write-Host "   ✅ تم التحديث: $updated صفحة" -ForegroundColor Green
Write-Host "   ❌ فشل: $failed صفحة" -ForegroundColor Red
Write-Host "   📁 الإجمالي: $($files.Count) صفحة" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  ملاحظة مهمة:" -ForegroundColor Yellow
Write-Host "   - تم إضافة projectUtils.js لكل الصفحات ✅" -ForegroundColor White
Write-Host "   - يجب تحديث fetch() calls يدوياً في كل صفحة ⚠️" -ForegroundColor White
Write-Host "   - استخدم البحث والاستبدال:" -ForegroundColor White
Write-Host "     • fetch('/api → projectUtils.getWithProject('/api" -ForegroundColor Gray
Write-Host "     • method: 'POST' → projectUtils.postWithProject()" -ForegroundColor Gray
Write-Host "     • method: 'PUT' → projectUtils.putWithProject()" -ForegroundColor Gray
Write-Host "     • method: 'DELETE' → projectUtils.deleteWithProject()" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 الخطوة التالية: افتح كل صفحة واستبدل fetch calls" -ForegroundColor Cyan
