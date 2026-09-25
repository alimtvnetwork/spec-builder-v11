#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  RELEASE-PINNED INSTALLER — AUDIT HEADER (stamped by release.ps1)    ║
# ║  Tag:        v3.18.0
# ║  Repo:       alimtvnetwork/spec-builder-v11
# ║  Built:      2026-09-25T05:56:46Z
# ║  Commit:     38c6e133ebd9
# ║  Builder:    Administrator
# ║  Asset URL:  https://github.com/alimtvnetwork/spec-builder-v11/releases/download/v3.18.0/release-version.sh
# ╚═══════════════════════════════════════════════════════════════════════╝
# ────────────────────────────────────────────────────────────────────────────
# release-version.sh — Release-Pinned Installer (Bash)
#
# Installs ONLY the version stamped into this script at build time.
# Never falls back to main or latest.
#
# This script is shipped as a GitHub Release asset. The release builder
# (release.sh / release.ps1) replaces the __RELEASE_URL__ token with the
# fully-qualified asset URL of the release that produced it. At runtime
# the script parses that URL to derive the pinned tag.
#
# For general / latest installs, use install.sh instead.
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Stamped at build time — DO NOT EDIT MANUALLY ──────────────────────────
RELEASE_URL='https://github.com/alimtvnetwork/spec-builder-v11/releases/download/v3.18.0/release-version.sh'
# ───────────────────────────────────────────────────────────────────────────

GENERAL_INSTALLER='https://github.com/alimtvnetwork/spec-builder-v11/raw/main/install.sh'

# ─── Defaults ──────────────────────────────────────────────────────────────
FOLDERS_DEFAULT='spec,scripts,.lovable/memories'
FOLDERS="$FOLDERS_DEFAULT"
DEST="$(pwd)"
DRY_RUN=false
FORCE=false
NO_LATEST=true

c_cyan='\033[0;36m'; c_green='\033[0;32m'; c_red='\033[0;31m'; c_yellow='\033[0;33m'; c_off='\033[0m'
step() { printf "${c_cyan}  ▸ %s${c_off}\n" "$1"; }
ok()   { printf "${c_green}  ✅ %s${c_off}\n" "$1"; }

fail_hard() {
  printf "\n${c_red}  ❌ %s${c_off}\n" "$1" >&2
  printf "${c_yellow}     General installer: %s${c_off}\n\n" "$GENERAL_INSTALLER" >&2
  exit 1
}

# ─── Parse args ────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --folders)        FOLDERS="$2"; shift 2 ;;
    --folders=*)      FOLDERS="${1#*=}"; shift ;;
    --dest)           DEST="$2"; shift 2 ;;
    --dest=*)         DEST="${1#*=}"; shift ;;
    --dry-run)        DRY_RUN=true; shift ;;
    --force)          FORCE=true; shift ;;
    --no-latest)      NO_LATEST=true; shift ;;
    --no-latest=true) NO_LATEST=true; shift ;;
    --no-latest=false)
      fail_hard "release-version is pinned to its stamped tag. --no-latest=false is not allowed." ;;
    --branch|--branch=*|--version|--version=*|--list-versions)
      fail_hard "release-version is pinned. Use install.sh for other versions or branches (forbidden flag: $1)." ;;
    *)
      fail_hard "Unknown argument: $1" ;;
  esac
done

# ─── Validate stamped URL ──────────────────────────────────────────────────
SENTINEL='__RELEASE'"_URL__"
if [[ -z "$RELEASE_URL" || "$RELEASE_URL" == "$SENTINEL" ]]; then
  fail_hard "This script was not built by release.sh / release.ps1 — version stamp is missing. Use install.sh instead."
fi
if [[ "$RELEASE_URL" == *"/releases/latest/download/"* ]]; then
  fail_hard "Refusing to run from /releases/latest/. Download from a specific tag, or use install.sh if you want latest."
fi

URL_REGEX='^https://github\.com/([^/]+)/([^/]+)/releases/download/(v?[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?)/release-version\.sh$'
if [[ ! "$RELEASE_URL" =~ $URL_REGEX ]]; then
  fail_hard "Cannot determine pinned version from URL. Use install.sh instead."
fi

OWNER="${BASH_REMATCH[1]}"
REPO="${BASH_REMATCH[2]}"
VERSION="${BASH_REMATCH[3]}"

# ─── Banner ────────────────────────────────────────────────────────────────
cat <<EOF

  ════════════════════════════════════════════════════════
    Release-Pinned Installer
    Source:   $OWNER/$REPO
    Version:  $VERSION   (pinned — will not auto-update)
    Folders:  $FOLDERS
    Dest:     $DEST
  ════════════════════════════════════════════════════════

EOF

# ─── Download archive ──────────────────────────────────────────────────────
ARCHIVE_URL="https://codeload.github.com/$OWNER/$REPO/zip/refs/tags/$VERSION"
TMP_DIR="$(mktemp -d -t release-pinned.XXXXXXXX)"
ZIP_PATH="$TMP_DIR/source.zip"
trap 'rm -rf "$TMP_DIR"' EXIT

step "Downloading $VERSION from $OWNER/$REPO..."
HTTP_CODE="$(curl -sSL -w '%{http_code}' -o "$ZIP_PATH" "$ARCHIVE_URL" || echo 000)"
if [[ "$HTTP_CODE" == "404" ]]; then
  fail_hard "Release tag $VERSION not found on $OWNER/$REPO."
fi
if [[ "$HTTP_CODE" != 2* ]]; then
  fail_hard "Failed to download $VERSION (HTTP $HTTP_CODE). Try install.sh once network is restored."
fi

step "Extracting archive..."
if command -v unzip >/dev/null 2>&1; then
  unzip -q "$ZIP_PATH" -d "$TMP_DIR"
else
  fail_hard "unzip is required but not installed."
fi

SRC_ROOT="$(find "$TMP_DIR" -maxdepth 1 -mindepth 1 -type d -name "$REPO-*" | head -n 1)"
if [[ -z "$SRC_ROOT" ]]; then
  fail_hard "Extracted archive layout unexpected for $VERSION."
fi

# ─── Copy folders ──────────────────────────────────────────────────────────
IFS=',' read -ra FOLDER_LIST <<< "$FOLDERS"
for folder in "${FOLDER_LIST[@]}"; do
  folder="${folder// /}"
  src="$SRC_ROOT/$folder"
  dst="$DEST/$folder"

  if [[ ! -e "$src" ]]; then
    printf "${c_yellow}    ⚠ Skipping (not in archive): %s${c_off}\n" "$folder"
    continue
  fi
  if [[ "$DRY_RUN" == true ]]; then
    echo "    [dry-run] would copy $folder → $dst"
    continue
  fi
  if [[ -e "$dst" && "$FORCE" != true ]]; then
    printf "${c_yellow}    ⚠ Exists (use --force to overwrite): %s${c_off}\n" "$dst"
    continue
  fi
  rm -rf "$dst"
  mkdir -p "$(dirname "$dst")"
  cp -R "$src" "$dst"
  ok "Installed $folder"
done

if [[ "$DRY_RUN" == true ]]; then
  echo
  ok "Dry run complete — no files written."
else
  echo
  ok "Pinned install of $VERSION complete."
fi
