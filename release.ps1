<#
.SYNOPSIS
    Build the Health Dashboard, zip it, and create release artifacts.

.DESCRIPTION
    Creates release-artifacts/ containing:
      - coding-guidelines-vX.Y.Z.zip   (full: spec + scripts + dashboard)
      - dashboard-vX.Y.Z.zip           (dashboard only)
      - checksums.txt

.EXAMPLE
    .\release.ps1
    $env:RELEASE_VERSION = "3.16.0"; .\release.ps1
#>

$ErrorActionPreference = "Stop"

function Write-Step  { param([string]$Msg) Write-Host "  ▸ $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "  ✅ $Msg" -ForegroundColor Green }
function Write-Err   { param([string]$Msg) Write-Host "  ❌ $Msg" -ForegroundColor Red }

# ── Resolve version ──────────────────────────────────────────────
$version = $env:RELEASE_VERSION
if ([string]::IsNullOrEmpty($version)) {
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    $version = $pkg.version
}
$version = $version -replace '^v', ''

if ([string]::IsNullOrEmpty($version)) {
    Write-Err "Cannot resolve version"
    exit 1
}

$repo         = if ($env:REPO) { $env:REPO } else { "alimtvnetwork/spec-builder-v11" }
$distDir      = "release-artifacts"
$stagingDir   = "$distDir/coding-guidelines-v$version"
$archiveBase  = "coding-guidelines-v$version"

# ── Validate ─────────────────────────────────────────────────────
$requiredPaths = @("02-spec", "src", "package.json", "readme.md")
foreach ($p in $requiredPaths) {
    if (-not (Test-Path $p)) {
        Write-Err "Missing required path: $p"
        exit 1
    }
}

# ── Build dashboard ──────────────────────────────────────────────
Write-Step "Installing dependencies..."
if (Get-Command bun -ErrorAction SilentlyContinue) {
    bun install
} else {
    npm ci 2>$null; if ($LASTEXITCODE -ne 0) { npm install }
}

Write-Step "Building Health Dashboard..."
if (Get-Command bun -ErrorAction SilentlyContinue) {
    bun run build
} else {
    npm run build
}

if (-not (Test-Path "dist")) {
    Write-Err "dist/ not found — build failed"
    exit 1
}

# ── Stage ────────────────────────────────────────────────────────
if (Test-Path $stagingDir) { Remove-Item $stagingDir -Recurse -Force }
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

Write-Step "Copying spec tree..."
Copy-Item -Path "02-spec" -Destination "$stagingDir/spec" -Recurse

if (Test-Path "scripts")        { Copy-Item -Path "scripts" -Destination "$stagingDir/scripts" -Recurse }
if (Test-Path "install.sh")     { Copy-Item "install.sh"     "$stagingDir/install.sh" }
if (Test-Path "install.ps1")    { Copy-Item "install.ps1"    "$stagingDir/install.ps1" }
if (Test-Path "readme.md")      { Copy-Item "readme.md"      "$stagingDir/readme.md" }
if (Test-Path "CONTRIBUTING.md"){ Copy-Item "CONTRIBUTING.md" "$stagingDir/CONTRIBUTING.md" }
if (Test-Path "changelog.md")   { Copy-Item "changelog.md"   "$stagingDir/changelog.md" }
if (Test-Path "CHANGELOG.md")   { Copy-Item "CHANGELOG.md"   "$stagingDir/CHANGELOG.md" }

Write-Step "Copying dashboard build..."
Copy-Item -Path "dist" -Destination "$stagingDir/dashboard" -Recurse

# ── Stamp release-pinned installers ──────────────────────────────
# Injects URL + audit header (build date, tag, commit, builder) so future
# auditors can verify provenance from the first ~10 lines of the script.
Write-Step "Stamping release-pinned installers..."
$tmplPs1 = "templates/release-version.ps1.tmpl"
$tmplSh  = "templates/release-version.sh.tmpl"
if (-not (Test-Path $tmplPs1) -or -not (Test-Path $tmplSh)) {
    Write-Err "Missing release-version templates under templates/"
    exit 1
}
$tag = "v$version"
$baseUrl = "https://github.com/$repo/releases/download/$tag"
$buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$commitSha = try { (git rev-parse --short=12 HEAD 2>$null).Trim() } catch { "unknown" }
if ([string]::IsNullOrWhiteSpace($commitSha)) { $commitSha = "unknown" }
$builder = if ($env:GITHUB_ACTOR) { $env:GITHUB_ACTOR } elseif ($env:USERNAME) { $env:USERNAME } else { "local" }

function New-AuditHeader {
    param([string]$AssetUrl)
    @"
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  RELEASE-PINNED INSTALLER — AUDIT HEADER (stamped by release.ps1)    ║
# ║  Tag:        $tag
# ║  Repo:       $repo
# ║  Built:      $buildDate
# ║  Commit:     $commitSha
# ║  Builder:    $builder
# ║  Asset URL:  $AssetUrl
# ╚═══════════════════════════════════════════════════════════════════════╝
"@
}

# PowerShell template — replace only the $script:ReleaseUrl assignment, then
# insert the audit header after the closing #> of the SYNOPSIS block.
$ps1Url    = "$baseUrl/release-version.ps1"
$ps1Header = New-AuditHeader -AssetUrl $ps1Url
$ps1Lines  = Get-Content $tmplPs1
$ps1Out    = New-Object System.Collections.Generic.List[string]
$ps1HeaderInserted = $false
foreach ($line in $ps1Lines) {
    if ($line -match '^\$script:ReleaseUrl\s*=') {
        $line = $line -replace '__RELEASE_URL__', [System.Text.RegularExpressions.Regex]::Escape($ps1Url).Replace('\','')
        $line = $line -replace '__RELEASE_URL__', $ps1Url
    }
    $ps1Out.Add($line)
    if (-not $ps1HeaderInserted -and $line -eq '#>') {
        $ps1Out.Add('')
        $ps1Out.Add($ps1Header)
        $ps1HeaderInserted = $true
    }
}
Set-Content -Path "$distDir/release-version.ps1" -Value $ps1Out

# Bash template — replace only the RELEASE_URL= assignment, then insert the
# audit header right after the shebang.
$shUrl    = "$baseUrl/release-version.sh"
$shHeader = New-AuditHeader -AssetUrl $shUrl
$shLines  = Get-Content $tmplSh
$shOut    = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $shLines.Count; $i++) {
    $line = $shLines[$i]
    if ($i -eq 0) {
        $shOut.Add($line)
        $shOut.Add($shHeader)
        continue
    }
    if ($line -match '^RELEASE_URL=') {
        $line = $line -replace '__RELEASE_URL__', $shUrl
    }
    $shOut.Add($line)
}
Set-Content -Path "$distDir/release-version.sh" -Value $shOut

Copy-Item "$distDir/release-version.ps1" "$stagingDir/release-version.ps1" -Force
Copy-Item "$distDir/release-version.sh"  "$stagingDir/release-version.sh"  -Force

# ── Archives ─────────────────────────────────────────────────────
Write-Step "Creating ZIP archives..."
Compress-Archive -Path $stagingDir -DestinationPath "$distDir/$archiveBase.zip" -Force
Compress-Archive -Path "$stagingDir/dashboard" -DestinationPath "$distDir/dashboard-v$version.zip" -Force

# ── Checksums ────────────────────────────────────────────────────
Write-Step "Generating checksums..."
$hashes = @(
    "$distDir/$archiveBase.zip",
    "$distDir/dashboard-v$version.zip",
    "$distDir/release-version.ps1",
    "$distDir/release-version.sh"
) | ForEach-Object {
    $h = Get-FileHash -Path $_ -Algorithm SHA256
    "$($h.Hash)  $(Split-Path $_ -Leaf)"
}
$hashes | Set-Content "$distDir/checksums.txt"

# ── Summary ──────────────────────────────────────────────────────
Write-OK "Release artifacts created!"
Write-Host ""
Write-Host "  ════════════════════════════════════════════════════════"
Write-Host "  Version:          v$version"
Write-Host "  Full archive:     $archiveBase.zip"
Write-Host "  Dashboard only:   dashboard-v$version.zip"
Write-Host "  Checksums:        checksums.txt"
Write-Host "  Output:           $distDir/"
Write-Host "  ════════════════════════════════════════════════════════"
Write-Host ""
