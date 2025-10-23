# سكريبت لتحديث كل صفحات HTML بإضافة projectUtils.js

$files = @(
    "extract.html",
    "add-contractor.html",
    "list-contractors.html",
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

$scriptToAdd = @"
<script src="js/projectUtils.js"></script>
  <script>
    // التحقق من وجود مشروع محدد
    if (!projectUtils.checkAuth()) {
      throw new Error('No project selected');
    }
"@

foreach ($file in $files) {
    $filePath = "c:\Users\acer\Desktop\taskon\docs\$file"
    
    if (Test-Path $filePath) {
        Write-Host "جاري تحديث: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # البحث عن أول <script> tag بعد <body> أو نهاية الـ navbar
        if ($content -match '(<body>.*?<script>)' -or $content -match '(navbar.*?<script>)') {
            # إضافة السكريبت بعد أول <script> tag
            $content = $content -replace '(<body>.*?)(  <script>)', "`$1$scriptToAdd`n`$2"
            
            Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "✅ تم تحديث: $file" -ForegroundColor Green
        } else {
            Write-Host "⚠️  لم يتم العثور على <script> في: $file" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  الملف غير موجود: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ انتهى التحديث!" -ForegroundColor Cyan
Write-Host "⚠️  ملاحظة: يجب مراجعة كل صفحة يدوياً لتحديث fetch calls" -ForegroundColor Yellow
