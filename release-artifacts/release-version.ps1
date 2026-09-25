<#
.SYNOPSIS
    Release-Pinned Installer (PowerShell) — installs ONLY the version stamped
    into this script at build time. Never falls back to main or latest.

.DESCRIPTION
    This script is shipped as a GitHub Release asset. The release builder
    (release.sh / release.ps1) replaces the __RELEASE_URL__ token below with
    the fully-qualified asset URL of the release that produced it. At runtime
    the script parses that URL to derive the pinned tag and downloads the
    matching source archive.

    For general / latest installs, use install.ps1 instead.

.PARAMETER Folders
    Folders to extract from the pinned tag's archive.

.PARAMETER Dest
    Install destination (default: current directory).

.PARAMETER DryRun
    Print the plan without writing anything.

.PARAMETER Force
    Overwrite existing files without prompting.

.PARAMETER NoLatest
    Always on. Present for explicitness. Passing -NoLatest:$false is rejected.

.EXAMPLE
    irm https://github.com/alimtvnetwork/coding-guidelines-v15/releases/download/v3.16.0/release-version.ps1 | iex
#>

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  RELEASE-PINNED INSTALLER — AUDIT HEADER (stamped by release.ps1)    ║
# ║  Tag:        v3.18.0
# ║  Repo:       alimtvnetwork/spec-builder-v11
# ║  Built:      2026-09-25T05:56:46Z
# ║  Commit:     38c6e133ebd9
# ║  Builder:    Administrator
# ║  Asset URL:  https://github.com/alimtvnetwork/spec-builder-v11/releases/download/v3.18.0/release-version.ps1
# ╚═══════════════════════════════════════════════════════════════════════╝

[CmdletBinding()]
param(
    [string[]] $Folders = @('spec', 'scripts', '.lovable/memories'),
    [string]   $Dest    = (Get-Location).Path,
    [switch]   $DryRun,
    [switch]   $Force,
    [switch]   $NoLatest = $true
)

$ErrorActionPreference = 'Stop'

# ─── Stamped at build time — DO NOT EDIT MANUALLY ───────────────────────────
$script:ReleaseUrl = 'https://github.com/alimtvnetwork/spec-builder-v11/releases/download/v3.18.0/release-version.ps1'
# ────────────────────────────────────────────────────────────────────────────

$GeneralInstaller = 'https://github.com/alimtvnetwork/spec-builder-v11/raw/main/install.ps1'

function Write-Step { param([string]$Msg) Write-Host "  ▸ $Msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$Msg) Write-Host "  ✅ $Msg" -ForegroundColor Green }
function Fail-Hard {
    param([string]$Msg)
    Write-Host ""
    Write-Host "  ❌ $Msg" -ForegroundColor Red
    Write-Host "     General installer: $GeneralInstaller" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ─── Reject forbidden flags ─────────────────────────────────────────────────
$forbidden = @('Branch', 'Version', 'ListVersions')
foreach ($name in $forbidden) {
    if ($PSBoundParameters.ContainsKey($name)) {
        Fail-Hard "release-version is pinned. Use install.ps1 for other versions or branches (forbidden flag: -$name)."
    }
}
if ($PSBoundParameters.ContainsKey('NoLatest') -and -not $NoLatest) {
    Fail-Hard "release-version is pinned to its stamped tag. -NoLatest:`$false is not allowed."
}

# ─── Validate stamped URL ───────────────────────────────────────────────────
$sentinel = '__RELEASE' + '_URL__'
if ([string]::IsNullOrWhiteSpace($script:ReleaseUrl) -or $script:ReleaseUrl -eq $sentinel) {
    Fail-Hard "This script was not built by release.ps1 / release.sh — version stamp is missing. Use install.ps1 instead."
}
if ($script:ReleaseUrl -match '/releases/latest/download/') {
    Fail-Hard "Refusing to run from /releases/latest/. Download from a specific tag, or use install.ps1 if you want latest."
}

$pattern = '^https://github\.com/(?<owner>[^/]+)/(?<repo>[^/]+)/releases/download/(?<tag>v?[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)/release-version\.ps1$'
if ($script:ReleaseUrl -notmatch $pattern) {
    Fail-Hard "Cannot determine pinned version from URL. Use install.ps1 instead."
}

$Owner   = $Matches['owner']
$Repo    = $Matches['repo']
$Version = $Matches['tag']

# ─── Banner ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ════════════════════════════════════════════════════════"
Write-Host "    Release-Pinned Installer"
Write-Host "    Source:   $Owner/$Repo"
Write-Host "    Version:  $Version   (pinned — will not auto-update)"
Write-Host "    Folders:  $($Folders -join ', ')"
Write-Host "    Dest:     $Dest"
Write-Host "  ════════════════════════════════════════════════════════"
Write-Host ""

# ─── Download archive ───────────────────────────────────────────────────────
$archiveUrl = "https://codeload.github.com/$Owner/$Repo/zip/refs/tags/$Version"
$tmpDir     = Join-Path ([System.IO.Path]::GetTempPath()) ("release-pinned-" + [Guid]::NewGuid().ToString('N'))
$zipPath    = Join-Path $tmpDir 'source.zip'
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

Write-Step "Downloading $Version from $Owner/$Repo..."
try {
    Invoke-WebRequest -Uri $archiveUrl -OutFile $zipPath -UseBasicParsing -ErrorAction Stop
} catch {
    $statusCode = $null
    if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
    if ($statusCode -eq 404) {
        Fail-Hard "Release tag $Version not found on $Owner/$Repo."
    }
    Fail-Hard ("Failed to download {0}: {1}" -f $Version, $_.Exception.Message)
}

Write-Step "Extracting archive..."
Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force
$srcRoot = Get-ChildItem -Path $tmpDir -Directory | Where-Object { $_.Name -like "$Repo-*" } | Select-Object -First 1
if (-not $srcRoot) {
    Fail-Hard "Extracted archive layout unexpected for $Version."
}

# ─── Copy folders ───────────────────────────────────────────────────────────
foreach ($folder in $Folders) {
    $sourcePath = Join-Path $srcRoot.FullName $folder
    $destPath   = Join-Path $Dest $folder
    if (-not (Test-Path $sourcePath)) {
        Write-Host "    ⚠ Skipping (not in archive): $folder" -ForegroundColor Yellow
        continue
    }
    if ($DryRun) {
        Write-Host "    [dry-run] would copy $folder → $destPath"
        continue
    }
    if ((Test-Path $destPath) -and -not $Force) {
        Write-Host "    ⚠ Exists (use -Force to overwrite): $destPath" -ForegroundColor Yellow
        continue
    }
    if (Test-Path $destPath) { Remove-Item $destPath -Recurse -Force }
    Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    Write-OK "Installed $folder"
}

Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

if ($DryRun) {
    Write-Host ""
    Write-OK "Dry run complete — no files written."
} else {
    Write-Host ""
    Write-OK "Pinned install of $Version complete."
}
