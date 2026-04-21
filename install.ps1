<#
.SYNOPSIS
    Download spec/memories/scripts from the coding-guidelines repo.

.DESCRIPTION
    Power-user flags:
      -Repo owner/repo            Override source repo
      -Branch main                Override branch (ignored if -Version given)
      -Version vX.Y.Z             Install a specific release tag
      -Folders spec,scripts       Explicit folder list
      -Dest C:\path               Install destination (default: cwd)
      -DryRun                     Show what would change; write nothing
      -ListVersions               List available release tags and exit
      -Force                      Overwrite without prompting

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Version v3.15.0 -Folders spec
    .\install.ps1 -DryRun
    irm https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v15/main/install.ps1 | iex
#>

param(
    [string]$Repo         = "alimtvnetwork/coding-guidelines-v15",
    [string]$Branch       = "main",
    [string]$Version      = "",
    [string]$Dest         = "",
    [string[]]$Folders    = @("spec", "scripts", ".lovable/memories"),
    [switch]$DryRun,
    [switch]$Force,
    [switch]$ListVersions
)

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

$Indent = "    "
function Write-Step  { param([string]$Msg) Write-Host "$Indent`▸ $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "$Indent`✅ $Msg" -ForegroundColor Green }
function Write-Err   { param([string]$Msg) Write-Host "$Indent`❌ $Msg" -ForegroundColor Red }

if ([string]::IsNullOrEmpty($Dest)) { $Dest = (Get-Location).Path }
$ref = if ($Version) { $Version } else { $Branch }

# ── List versions ─────────────────────────────────────────────────
if ($ListVersions) {
    Write-Step "Fetching releases for $Repo..."
    try {
        $rels = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases?per_page=30"
        $rels | ForEach-Object { Write-Host "$Indent  • $($_.tag_name)" }
    } catch {
        Write-Err "Could not fetch releases: $($_.Exception.Message)"
    }
    exit 0
}

# ── Banner ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "$Indent════════════════════════════════════════════════════════"
Write-Host "$Indent  Spec & Memories Installer"
Write-Host "$Indent  Source:   $Repo @ $ref"
Write-Host "$Indent  Folders:  $($Folders -join ', ')"
Write-Host "$Indent  Dest:     $Dest"
if ($DryRun) { Write-Host "$Indent  Mode:     DRY-RUN (no writes)" }
Write-Host "$Indent════════════════════════════════════════════════════════"
Write-Host ""

# ── Download archive ──────────────────────────────────────────────
$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("install-" + [guid]::NewGuid().ToString("N").Substring(0,8))
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$archivePath = Join-Path $tmpDir "repo.zip"

$archiveUrl = if ($Version) {
    "https://codeload.github.com/$Repo/zip/refs/tags/$Version"
} else {
    "https://codeload.github.com/$Repo/zip/refs/heads/$Branch"
}

Write-Step "Downloading $Repo@$ref..."
Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath -UseBasicParsing

Write-Step "Extracting..."
Expand-Archive -Path $archivePath -DestinationPath $tmpDir -Force

$extracted = Get-ChildItem -Path $tmpDir -Directory | Where-Object { $_.Name -ne "__MACOSX" } | Select-Object -First 1

# ── Copy requested folders ────────────────────────────────────────
$copied = 0
foreach ($folder in $Folders) {
    $src = Join-Path $extracted.FullName $folder
    if (-not (Test-Path $src)) {
        Write-Err "Folder not found in archive: $folder"
        continue
    }

    $destFolder = Join-Path $Dest $folder
    if ($DryRun) {
        $count = (Get-ChildItem -Path $src -Recurse -File).Count
        Write-Step "[DRY-RUN] Would copy $folder/ ($count files)"
    } else {
        if ((Test-Path $destFolder) -and -not $Force) {
            Write-Step "Overwriting $folder/..."
        }
        Copy-Item -Path $src -Destination $Dest -Recurse -Force
        $copied++
    }
}

# ── Cleanup ───────────────────────────────────────────────────────
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

if ($DryRun) {
    Write-OK "Dry run complete — no files written."
} else {
    Write-OK "Installed $copied folder(s) into $Dest"
}
Write-Host ""
