# probably useless, attempt to fix textpath alignment issues between Inkscape and browser renderint
# the solution was to remove from path / put on path 
# Remove text-anchor from textPath elements to fix cross-renderer inconsistencies
$filePath = "c:\projects\brainsequences\brainsequences\app\images\ba_combined.svg"
$content = Get-Content $filePath -Raw

# Remove text-anchor:middle from style attributes
$content = $content -replace ';text-anchor:middle">', '">'
$content = $content -replace 'text-anchor:middle;', ''

# Remove text-anchor="middle" attributes that might still exist
$content = $content -replace '\s+text-anchor="middle"\s*\n', "`n"
$content = $content -replace '\s+text-anchor="middle"', ''

# Write back
$content | Set-Content $filePath -NoNewline

Write-Host "Removed all text-anchor attributes from textPath elements"
