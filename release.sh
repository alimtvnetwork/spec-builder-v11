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

REPO="alimtvnetwork/coding-guidelines-v14"
RELEASE_VERSION_INPUT="${RELEASE_VERSION:-}"
REQUIRED_PATHS=("spec" "src" "package.json" "README.md")

step() { printf '\033[0;36m▸ %s\033[0m\n' "$1"; }
ok()   { printf '\033[0;32m✅ %s\033[0m\n' "$1"; }
err()  { printf '\033[0;31m❌ %s\033[0m\n' "$1" >&2; }

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
  cp -R spec "$STAGING_DIR/spec"

  step "Copying scripts..."
  [[ -d scripts ]] && cp -R scripts "$STAGING_DIR/scripts"

  step "Copying install scripts..."
  [[ -f install.sh ]]  && cp install.sh  "$STAGING_DIR/install.sh"
  [[ -f install.ps1 ]] && cp install.ps1 "$STAGING_DIR/install.ps1"

  step "Copying documentation..."
  cp README.md "$STAGING_DIR/README.md"
  [[ -f CONTRIBUTING.md ]] && cp CONTRIBUTING.md "$STAGING_DIR/CONTRIBUTING.md"
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
