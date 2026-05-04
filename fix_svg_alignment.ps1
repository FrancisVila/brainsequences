# probably useless, attempt to fix textpath alignment issues between Inkscape and browser renderint
# the solution was to remove from path / put on path 
# (Inkscape: you must set text centered before setting the text on path, otherwise it will not work, causing visualisation problems in Inkscape and browsers, but if you set it after, it will work in Inkscape but not in browsers, so we need to move the text-anchor to style attribute to make it work in both) 
# Fix SVG textPath alignment by moving text-anchor to style attribute
$filePath = "c:\projects\brainsequences\brainsequences\app\images\ba_combined.svg"
$content = Get-Content $filePath -Raw

# Pattern to find: text-anchor="middle" as attribute before dominant-baseline
# Replace with: move it to style attribute
$pattern = '(\s+)text-anchor="middle"(\r?\n\s+dominant-baseline="middle"\r?\n\s+id="[^"]+"\r?\n\s+style="stroke-width:0\.264583)">'
$replacement = '$1dominant-baseline="middle"$2;text-anchor:middle">'
$newContent = $content -replace $pattern, $replacement

# Also handle cases where text-anchor comes after startOffset but before id (no dominant-baseline yet)
$pattern2 = '(\s+startOffset="50%")(\r?\n\s+)text-anchor="middle"(\r?\n\s+id="[^"]+"\r?\n\s+style="stroke-width:0\.264583)">'
$replacement2 = '$1$2$3;text-anchor:middle">'
$newContent = $newContent -replace $pattern2, $replacement2

# Write back
$newContent | Set-Content $filePath -NoNewline

Write-Host "Fixed textPath alignment issues in ba_combined.svg"
