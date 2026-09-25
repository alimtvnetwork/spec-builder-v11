#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# release.sh — Build the Health Dashboard, zip it, and prepare
#              release artifacts with checksums.
#
# Usage:
#   bash release.sh                       # version from package.json
#   RELEASE_VERSION=3.16.0 bash release.sh # explicit version
# ────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="${REPO:-alimtvnetwork/spec-builder-v11}"
RELEASE_VERSION_INPUT="${RELEASE_VERSION:-}"
REQUIRED_PATHS=("02-spec" "src" "package.json" "readme.md")

step() { printf '\033[0;36m▸ %s\033[0m\n' "$1"; }
ok()   { printf '\033[0;32m✅ %s\033[0m\n' "$1"; }
err()  { printf '\033[0;31m❌ %s\033[0m\n' "$1" >&2; }

# ── Stamp release-pinned installer templates ─────────────────────────────
# Injects:
#   - __RELEASE_URL__      → canonical asset URL for this tag (drives version detection)
#   - audit header banner  → build date, tag, commit SHA, builder identity
# This guarantees that any user (or future auditor) can read the first ~10
# lines of release-version.{ps1,sh} and verify provenance offline.
stamp_release_version_installers() {
  local tag="v$VERSION"
  local base="https://github.com/$REPO/releases/download/$tag"
  local tmpl_ps1="templates/release-version.ps1.tmpl"
  local tmpl_sh="templates/release-version.sh.tmpl"
  local build_date commit_sha builder

  if [[ ! -f "$tmpl_ps1" || ! -f "$tmpl_sh" ]]; then
    err "Missing release-version templates under templates/"
    exit 1
  fi

  build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  commit_sha="$(git rev-parse --short=12 HEAD 2>/dev/null || echo 'unknown')"
  builder="${GITHUB_ACTOR:-${USER:-local}}"

  local audit_ps1="\
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  RELEASE-PINNED INSTALLER — AUDIT HEADER (stamped by release.sh)     ║
# ║  Tag:        $tag
# ║  Repo:       $REPO
# ║  Built:      $build_date
# ║  Commit:     $commit_sha
# ║  Builder:    $builder
# ║  Asset URL:  $base/release-version.ps1
# ╚═══════════════════════════════════════════════════════════════════════╝"

  local audit_sh="\
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  RELEASE-PINNED INSTALLER — AUDIT HEADER (stamped by release.sh)     ║
# ║  Tag:        $tag
# ║  Repo:       $REPO
# ║  Built:      $build_date
# ║  Commit:     $commit_sha
# ║  Builder:    $builder
# ║  Asset URL:  $base/release-version.sh
# ╚═══════════════════════════════════════════════════════════════════════╝"

  # PowerShell: insert audit header after the closing comment of the SYNOPSIS block (#>)
  # Substitution is anchored to the $script:ReleaseUrl assignment so prose
  # references to the placeholder name in comments stay intact for auditors.
  awk -v hdr="$audit_ps1" -v url="$base/release-version.ps1" '
    /^\$script:ReleaseUrl[[:space:]]*=/ { sub(/__RELEASE_URL__/, url) }
    { print }
    /^#>$/ && !done { print ""; print hdr; done=1 }
  ' "$tmpl_ps1" > "$DIST_DIR/release-version.ps1"

  # Bash: insert audit header after the shebang; anchor sub to the RELEASE_URL= line
  awk -v hdr="$audit_sh" -v url="$base/release-version.sh" '
    NR==1 { print; print hdr; next }
    /^RELEASE_URL=/ { sub(/__RELEASE_URL__/, url) }
    { print }
  ' "$tmpl_sh" > "$DIST_DIR/release-version.sh"

  chmod +x "$DIST_DIR/release-version.sh"

  cp "$DIST_DIR/release-version.ps1" "$STAGING_DIR/release-version.ps1"
  cp "$DIST_DIR/release-version.sh"  "$STAGING_DIR/release-version.sh"
}

# ── Resolve version ──────────────────────────────────────────────
resolve_version() {
  local version="${RELEASE_VERSION_INPUT#v}"

  if [[ -n "$version" ]]; then
    printf '%s\n' "$version"
    return 0
  fi

  version="$(sed -nE 's/^[[:space:]]*"version":[[:space:]]*"([^"]+)".*$/\1/p' package.json | head -n 1)"
  if [[ -n "$version" ]]; then
    printf '%s\n' "$version"
    return 0
  fi

  err "Unable to resolve version from RELEASE_VERSION or package.json"
  exit 1
}

VERSION="$(resolve_version)"
DIST_DIR="release-artifacts"
STAGING_DIR="$DIST_DIR/coding-guidelines-v$VERSION"
ARCHIVE_BASENAME="coding-guidelines-v$VERSION"

# ── Validate required paths ──────────────────────────────────────
ensure_required_paths() {
  local missing=false
  for path in "${REQUIRED_PATHS[@]}"; do
    if [[ ! -e "$path" ]]; then
      err "Missing required path: $path"
      missing=true
    fi
  done
  if [[ "$missing" == true ]]; then exit 1; fi
}

# ── Build the Health Dashboard ───────────────────────────────────
build_dashboard() {
  step "Installing dependencies..."
  if command -v bun &>/dev/null; then
    bun install --frozen-lockfile 2>/dev/null || bun install
  else
    npm ci 2>/dev/null || npm install
  fi

  step "Building Health Dashboard..."
  if command -v bun &>/dev/null; then
    bun run build
  else
    npm run build
  fi
}

# ── Stage release files ──────────────────────────────────────────
prepare_staging() {
  rm -rf "$STAGING_DIR"
  mkdir -p "$STAGING_DIR"

  step "Copying spec tree..."
  cp -R 02-spec "$STAGING_DIR/spec"

  step "Copying scripts..."
  [[ -d scripts ]] && cp -R scripts "$STAGING_DIR/scripts"

  step "Copying install scripts..."
  [[ -f install.sh ]]  && cp install.sh  "$STAGING_DIR/install.sh"
  [[ -f install.ps1 ]] && cp install.ps1 "$STAGING_DIR/install.ps1"

  step "Stamping release-pinned installers..."
  stamp_release_version_installers

  step "Copying documentation..."
  [[ -f readme.md ]]       && cp readme.md       "$STAGING_DIR/readme.md"
  [[ -f README.md ]]       && cp README.md       "$STAGING_DIR/README.md"
  [[ -f CONTRIBUTING.md ]] && cp CONTRIBUTING.md "$STAGING_DIR/CONTRIBUTING.md"
  [[ -f changelog.md ]]    && cp changelog.md    "$STAGING_DIR/changelog.md"
  [[ -f CHANGELOG.md ]]    && cp CHANGELOG.md    "$STAGING_DIR/CHANGELOG.md"

  step "Copying Health Dashboard build output..."
  if [[ -d dist ]]; then
    cp -R dist "$STAGING_DIR/dashboard"
  else
    err "dist/ not found — dashboard build may have failed"
    exit 1
  fi
}

# ── Create archives ──────────────────────────────────────────────
create_archives() {
  local zip_path="$DIST_DIR/$ARCHIVE_BASENAME.zip"
  local tar_path="$DIST_DIR/$ARCHIVE_BASENAME.tar.gz"

  rm -f "$zip_path" "$tar_path"

  step "Creating ZIP archive..."
  (cd "$DIST_DIR" && zip -qr "$ARCHIVE_BASENAME.zip" "$ARCHIVE_BASENAME")

  step "Creating TAR.GZ archive..."
  tar -C "$DIST_DIR" -czf "$tar_path" "$ARCHIVE_BASENAME"

  step "Creating dashboard-only ZIP..."
  (cd "$DIST_DIR" && zip -qr "dashboard-v$VERSION.zip" "$ARCHIVE_BASENAME/dashboard")
}

# ── Checksums ────────────────────────────────────────────────────
generate_checksums() {
  step "Generating checksums..."
  (cd "$DIST_DIR" && sha256sum \
    "$ARCHIVE_BASENAME.zip" \
    "$ARCHIVE_BASENAME.tar.gz" \
    "dashboard-v$VERSION.zip" \
    "release-version.ps1" \
    "release-version.sh" \
    > checksums.txt)
}

# ── Summary ──────────────────────────────────────────────────────
print_summary() {
  local full_size tar_size dash_size
  full_size="$(du -sh "$DIST_DIR/$ARCHIVE_BASENAME.zip" 2>/dev/null | cut -f1)"
  tar_size="$(du -sh "$DIST_DIR/$ARCHIVE_BASENAME.tar.gz" 2>/dev/null | cut -f1)"
  dash_size="$(du -sh "$DIST_DIR/dashboard-v$VERSION.zip" 2>/dev/null | cut -f1)"

  cat <<EOF

════════════════════════════════════════════════════════
  Coding Guidelines Release Pack
  Version:           v$VERSION
  Repo:              $REPO

  Artifacts:
    Full (zip):      $ARCHIVE_BASENAME.zip ($full_size)
    Full (tar.gz):   $ARCHIVE_BASENAME.tar.gz ($tar_size)
    Dashboard only:  dashboard-v$VERSION.zip ($dash_size)
    Checksums:       checksums.txt

  Output dir:        $DIST_DIR/
════════════════════════════════════════════════════════
EOF
}

# ── Main ─────────────────────────────────────────────────────────
step "Validating required files..."
ensure_required_paths

build_dashboard

step "Preparing release staging directory..."
prepare_staging

create_archives
generate_checksums

ok "Release artifacts created successfully!"
print_summary
