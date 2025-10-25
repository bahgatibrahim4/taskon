# Script to add permissions.js to all HTML files

$files = @(
    "list-extracts.html",
    "add-extract.html",
    "extract.html",
    "list-contractors.html",
    "add-contractor.html",
    "contractor.html",
    "workers.html",
    "store.html",
    "store-report.html",
    "supplies.html",
    "suppliers.html",
    "supplier-details.html",
    "equipments.html",
    "receipts.html",
    "drawings.html",
    "monthly-pay.html",
    "month-details.html",
    "projects.html",
    "project.html"
)

$scriptTag = '<script src="js/permissions.js"></script>'

foreach ($file in $files) {
    $path = Join-Path -Path $PSScriptRoot -ChildPath $file
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        
        # Check if permissions.js is already included
        if ($content -notmatch 'permissions\.js') {
            Write-Host "Adding permissions.js to $file..." -ForegroundColor Yellow
            
            # Try to add before </head>
            if ($content -match '</head>') {
                $content = $content -replace '</head>', "$scriptTag`n</head>"
                Set-Content $path -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✓ Added to $file" -ForegroundColor Green
            }
            # Try to add after <head>
            elseif ($content -match '<head[^>]*>') {
                $content = $content -replace '(<head[^>]*>)', "`$1`n$scriptTag"
                Set-Content $path -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✓ Added to $file" -ForegroundColor Green
            }
            else {
                Write-Host "✗ Could not find <head> in $file" -ForegroundColor Red
            }
        }
        else {
            Write-Host "○ permissions.js already in $file" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
