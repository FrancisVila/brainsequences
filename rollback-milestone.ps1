#!/usr/bin/env pwsh
# rollback-milestone.ps1
# Rollback to a previous project milestone

Write-Host "`n=== Brainsequences Milestone Rollback ===" -ForegroundColor Cyan
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
    $continue = Read-Host "`nContinue anyway? All uncommitted changes will be lost! (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# Get all tags
Write-Host "Fetching available milestones..." -ForegroundColor Cyan
$tags = git tag --sort=-v:refname

if (-not $tags) {
    Write-Host "Error: No milestones found!" -ForegroundColor Red
    Write-Host "Create a milestone first using: .\create-milestone.ps1" -ForegroundColor Yellow
    exit 1
}

# Get current state
$currentBranch = git rev-parse --abbrev-ref HEAD
$currentCommit = git rev-parse --short HEAD

Write-Host "`nCurrent state:" -ForegroundColor Green
Write-Host "  Branch: $currentBranch"
Write-Host "  Commit: $currentCommit"

# Display available milestones
Write-Host "`nAvailable milestones:" -ForegroundColor Cyan
$tagList = @()
$index = 1
foreach ($tag in $tags) {
    $tagList += $tag
    
    # Get tag details
    $tagInfo = git tag -l --format='%(contents:subject)' $tag
    $tagDate = git log -1 --format=%ai $tag 2>$null
    
    Write-Host "  $index. $tag" -ForegroundColor White
    if ($tagInfo) {
        Write-Host "     $tagInfo" -ForegroundColor Gray
    }
    if ($tagDate) {
        Write-Host "     $(([datetime]$tagDate).ToString('MMM d, yyyy'))" -ForegroundColor DarkGray
    }
    $index++
}

Write-Host ""
$choice = Read-Host "Select milestone number to rollback to (1-$($tagList.Count)), or 'q' to quit"

if ($choice -eq 'q') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

$selectedIndex = [int]$choice - 1
if ($selectedIndex -lt 0 -or $selectedIndex -ge $tagList.Count) {
    Write-Host "Error: Invalid selection!" -ForegroundColor Red
    exit 1
}

$selectedTag = $tagList[$selectedIndex]

# Show milestone details
Write-Host "`nSelected milestone: $selectedTag" -ForegroundColor Green

# Get migration info from tag message
$tagMessage = git tag -l --format='%(contents)' $selectedTag
Write-Host "`nMilestone details:" -ForegroundColor Cyan
Write-Host $tagMessage

# Check if MIGRATIONS.md exists and show compatibility info
if (Test-Path "MIGRATIONS.md") {
    Write-Host "`nChecking migration compatibility..." -ForegroundColor Cyan
    $migrationsContent = Get-Content "MIGRATIONS.md" -Raw
    
    # Look for this version in MIGRATIONS.md
    if ($migrationsContent -match "### $selectedTag[^\n]*\n[^\n]*\n- \*\*Migration\*\*: ``([^``]+)``") {
        $expectedMigration = $matches[1]
        Write-Host "Expected migration: $expectedMigration" -ForegroundColor Yellow
    }
}

# Warning
Write-Host "`n=== WARNING ===" -ForegroundColor Red
Write-Host "This will:"
Write-Host "  1. Discard all uncommitted changes"
Write-Host "  2. Checkout code to milestone $selectedTag"
Write-Host "  3. Optionally restore database backup"
Write-Host ""
Write-Host "Your current work will be lost unless committed!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with rollback? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# Perform rollback
Write-Host "`nRolling back code to $selectedTag..." -ForegroundColor Cyan

# Create a backup branch of current state
$backupBranch = "backup-before-rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating backup branch: $backupBranch" -ForegroundColor Gray
git branch $backupBranch

# Checkout the tag
git checkout $selectedTag

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Checked out code to $selectedTag" -ForegroundColor Green
    Write-Host "Note: You are now in 'detached HEAD' state" -ForegroundColor Yellow
    Write-Host "Your previous state is saved in branch: $backupBranch" -ForegroundColor Yellow
} else {
    Write-Host "Error: Failed to checkout tag!" -ForegroundColor Red
    exit 1
}

# Database rollback
Write-Host "`nRestore Turso database backup? (y/n)" -ForegroundColor Cyan
Write-Host "Note: Turso provides automatic point-in-time recovery for the last 24 hours" -ForegroundColor Gray
$restoreChoice = Read-Host

if ($restoreChoice -eq 'y') {
    Write-Host "`nTurso Database Restore Options:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Point-in-Time Recovery (via Turso Dashboard)" -ForegroundColor Yellow
    Write-Host "  1. Go to https://turso.tech" 
    Write-Host "  2. Select your database"
    Write-Host "  3. Use the point-in-time recovery feature"
    Write-Host "  4. Select a timestamp within the last 24 hours"
    Write-Host ""
    Write-Host "Option 2: Restore from Manual Backup" -ForegroundColor Yellow
    Write-Host "  1. List your manual backup files: ls backup-*.db"
    Write-Host "  2. Create a new database from backup:"
    Write-Host "     turso db create brainsequences-restored --from-file backup-YYYYMMDD.db"
    Write-Host "  3. Update your .env file with the new database URL"
    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Gray
    Read-Host
} else {
    Write-Host "Skipped database restore" -ForegroundColor Yellow
    Write-Host "Warning: Verify database compatibility with this code version" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Rollback Complete! ===" -ForegroundColor Green
Write-Host "Code version: $selectedTag"
Write-Host "Git state: Detached HEAD at $selectedTag"
Write-Host ""
Write-Host "Important next steps:" -ForegroundColor Cyan
Write-Host "  - Your backup is in branch: $backupBranch"
Write-Host "  - To return to latest: git checkout $currentBranch"
Write-Host "  - To continue with this version:"
Write-Host "    git checkout -b working-from-$selectedTag"
Write-Host "  - View backup branch: git log $backupBranch"
Write-Host "  - Delete backup: git branch -D $backupBranch"
Write-Host ""
Write-Host "Database:" -ForegroundColor Cyan
Write-Host "  - Verify database compatibility with this code version"
Write-Host "  - Check MIGRATIONS.md for expected database migration"
Write-Host ""
