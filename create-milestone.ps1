#!/usr/bin/env pwsh
# create-milestone.ps1
# Creates a project milestone with git tag and database migration tracking

Write-Host "`n=== Brainsequences Milestone Creator ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Warning: You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $status
    $continue = Read-Host "`nContinue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# Get current tags and determine next version
Write-Host "Fetching existing tags..." -ForegroundColor Cyan
$tags = git tag --sort=-v:refname
$latestTag = $tags | Select-Object -First 1

if ($latestTag) {
    Write-Host "Latest tag: $latestTag" -ForegroundColor Green
    
    # Parse version numbers
    if ($latestTag -match '^v?(\d+)\.(\d+)\.(\d+)$') {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        $patch = [int]$matches[3]
        
        # Suggest next versions
        $suggestedPatch = "v$major.$minor.$($patch + 1)"
        $suggestedMinor = "v$major.$($minor + 1).0"
        $suggestedMajor = "v$($major + 1).0.0"
        
        Write-Host "`nSuggested versions:" -ForegroundColor Cyan
        Write-Host "  1. $suggestedPatch (patch - bug fixes)"
        Write-Host "  2. $suggestedMinor (minor - new features)"
        Write-Host "  3. $suggestedMajor (major - breaking changes)"
        Write-Host "  4. Custom version"
        
        $choice = Read-Host "`nSelect version type (1-4)"
        
        switch ($choice) {
            "1" { $newVersion = $suggestedPatch }
            "2" { $newVersion = $suggestedMinor }
            "3" { $newVersion = $suggestedMajor }
            "4" { $newVersion = Read-Host "Enter custom version (e.g., v1.2.3)" }
            default { 
                Write-Host "Invalid choice. Aborted." -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "Could not parse version from tag: $latestTag" -ForegroundColor Yellow
        $newVersion = Read-Host "Enter new version (e.g., v1.0.0)"
    }
} else {
    Write-Host "No existing tags found. This will be the first version." -ForegroundColor Yellow
    $defaultVersion = "v1.0.0"
    $newVersion = Read-Host "Enter version [$defaultVersion]"
    if (-not $newVersion) {
        $newVersion = $defaultVersion
    }
}

# Validate version format
if ($newVersion -notmatch '^v?\d+\.\d+\.\d+$') {
    Write-Host "Error: Invalid version format. Use format: v1.2.3" -ForegroundColor Red
    exit 1
}

# Ensure version starts with 'v'
if ($newVersion -notmatch '^v') {
    $newVersion = "v$newVersion"
}

# Check if tag already exists
$existingTag = git tag -l $newVersion
if ($existingTag) {
    Write-Host "Error: Tag $newVersion already exists!" -ForegroundColor Red
    exit 1
}

# Get current migration
Write-Host "`nDetecting current migration..." -ForegroundColor Cyan
$migrations = Get-ChildItem -Path "drizzle" -Filter "*.sql" | Sort-Object Name -Descending
if ($migrations) {
    $latestMigration = $migrations[0].Name
    Write-Host "Latest migration: $latestMigration" -ForegroundColor Green
} else {
    $latestMigration = "No migrations found"
    Write-Host "Warning: No migration files found in drizzle folder" -ForegroundColor Yellow
}

# Get commit message
Write-Host "`nEnter milestone description:" -ForegroundColor Cyan
Write-Host "(Press Enter twice or Ctrl+Z then Enter to finish)" -ForegroundColor Gray
$messageLines = @()
do {
    $line = Read-Host
    if ($line) {
        $messageLines += $line
    }
} while ($line)

if ($messageLines.Count -eq 0) {
    Write-Host "Error: Message cannot be empty!" -ForegroundColor Red
    exit 1
}

$message = $messageLines -join "`n"

# Summary
Write-Host "`n=== Milestone Summary ===" -ForegroundColor Cyan
Write-Host "Version:      $newVersion"
Write-Host "Migration:    $latestMigration"
Write-Host "Message:      $($messageLines[0])"
if ($messageLines.Count -gt 1) {
    $messageLines[1..($messageLines.Count-1)] | ForEach-Object {
        Write-Host "              $_"
    }
}
Write-Host ""

$confirm = Read-Host "Create this milestone? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# Update MIGRATIONS.md
Write-Host "`nUpdating MIGRATIONS.md..." -ForegroundColor Cyan
$date = Get-Date -Format "MMMM d, yyyy"
$migrationEntry = @"

### $newVersion - $date
- **Migration**: ``$latestMigration``
- **Changes**: 
  $($messageLines -join "`n  ")
- **Rollback Instructions**: 
  1. Checkout code: ``git checkout $newVersion``
  2. Check database migration compatibility in MIGRATIONS.md

"@

if (Test-Path "MIGRATIONS.md") {
    $content = Get-Content "MIGRATIONS.md" -Raw
    
    # Insert after "## Version History" section
    if ($content -match '## Version History') {
        $content = $content -replace '(## Version History\s*)', "`$1$migrationEntry"
    } else {
        # If section doesn't exist, append to end
        $content += "`n## Version History$migrationEntry"
    }
    
    # Update "Current State" section
    $content = $content -replace '- \*\*Code Version\*\*:.*', "- **Code Version**: $newVersion"
    $content = $content -replace '- \*\*Migration\*\*:.*', "- **Migration**: $latestMigration"
    $content = $content -replace '- \*\*Date\*\*:.*', "- **Date**: $date"
    
    Set-Content "MIGRATIONS.md" -Value $content
    Write-Host "OK - Updated MIGRATIONS.md" -ForegroundColor Green
} else {
    Write-Host "Warning: MIGRATIONS.md not found, skipping..." -ForegroundColor Yellow
}

# Create git tag
Write-Host "`nCreating git tag..." -ForegroundColor Cyan
$tagMessage = "$message`n`nMigration: $latestMigration"
git tag -a $newVersion -m $tagMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Created tag $newVersion" -ForegroundColor Green
} else {
    Write-Host "Error: Failed to create git tag!" -ForegroundColor Red
    exit 1
}

# Commit MIGRATIONS.md changes if modified
if (Test-Path "MIGRATIONS.md") {
    $migrationsModified = git status --porcelain MIGRATIONS.md
    if ($migrationsModified) {
        Write-Host "`nCommitting MIGRATIONS.md..." -ForegroundColor Cyan
        git add MIGRATIONS.md
        git commit -m "docs: Update MIGRATIONS.md for $newVersion"
        Write-Host "OK - Committed MIGRATIONS.md" -ForegroundColor Green
    }
}

# Push tag
Write-Host "`nPush to remote?" -ForegroundColor Cyan
Write-Host "  1. Push tag only"
Write-Host "  2. Push tag and commits"
Write-Host "  3. Skip (push manually later)"
$pushChoice = Read-Host "Select option (1-3)"

switch ($pushChoice) {
    "1" { 
        git push origin $newVersion
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK - Pushed tag to remote" -ForegroundColor Green
        }
    }
    "2" { 
        git push
        git push origin $newVersion
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK - Pushed commits and tag to remote" -ForegroundColor Green
        }
    }
    "3" { 
        Write-Host "Skipped push. Run manually later" -ForegroundColor Yellow
    }
}

# Database backup (optional)
Write-Host "`nCreate database backup? (y/n)" -ForegroundColor Cyan
$backupChoice = Read-Host
if ($backupChoice -eq 'y') {
    Write-Host "`nSelect backup type:" -ForegroundColor Cyan
    Write-Host "  1. Local database (data/app.db)"
    Write-Host "  2. Turso database"
    Write-Host "  3. Skip"
    $dbChoice = Read-Host "Select option (1-3)"
    
    $backupName = "backup-$newVersion-$(Get-Date -Format 'yyyyMMdd')"
    
    switch ($dbChoice) {
        "1" {
            if (Test-Path "data/app.db") {
                Copy-Item "data/app.db" "data/$backupName.db"
                Write-Host "OK - Created backup: data/$backupName.db" -ForegroundColor Green
            } else {
                Write-Host "Warning: data/app.db not found" -ForegroundColor Yellow
            }
        }
        "2" {
            $dbName = Read-Host "Enter Turso database name"
            $backupCmd = ".backup $backupName.db"
            Write-Host "Running backup command..." -ForegroundColor Gray
            turso db shell $dbName $backupCmd
            if ($LASTEXITCODE -eq 0) {
                Write-Host "OK - Created Turso backup" -ForegroundColor Green
            } else {
                Write-Host "Warning: Turso backup may have failed" -ForegroundColor Yellow
            }
        }
        "3" {
            Write-Host "Skipped database backup" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n=== Milestone Created Successfully! ===" -ForegroundColor Green
Write-Host "Version: $newVersion"
Write-Host "Tag: $(git tag -l $newVersion)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - View tag details: git show $newVersion"
Write-Host "  - List all tags: git tag"
Write-Host "  - Delete this tag: git tag -d $newVersion"
Write-Host ""
