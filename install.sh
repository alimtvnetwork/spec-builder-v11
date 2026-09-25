#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# install.sh — Clone spec tree from GitHub (Bash)
#
# Usage:
#   bash install.sh                              # defaults
#   bash install.sh --version v3.15.0            # specific tag
#   bash install.sh --folders spec               # subset
#   bash install.sh --dest ~/my-project          # custom dest
#   bash install.sh --dry-run                    # preview only
#   bash install.sh --list-versions              # show tags
#   curl -fsSL https://raw.githubusercontent.com/alimtvnetwork/spec-builder-v11/main/install.sh | bash
# ────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="${REPO:-alimtvnetwork/spec-builder-v11}"
BRANCH="${BRANCH:-main}"
VERSION=""
DEST="."
FOLDERS=("02-spec" "scripts" ".ai-memory")
DRY_RUN=false
LIST_VERSIONS=false

step() { printf '\033[0;36m  ▸ %s\033[0m\n' "$1"; }
ok()   { printf '\033[0;32m  ✅ %s\033[0m\n' "$1"; }
err()  { printf '\033[0;31m  ❌ %s\033[0m\n' "$1" >&2; }

# ── Parse flags ───────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)          REPO="$2";    shift 2 ;;
    --branch)        BRANCH="$2";  shift 2 ;;
    --version)       VERSION="$2"; shift 2 ;;
    --dest)          DEST="$2";    shift 2 ;;
    --folders)       IFS=',' read -ra FOLDERS <<< "$2"; shift 2 ;;
    --dry-run)       DRY_RUN=true; shift ;;
    --list-versions) LIST_VERSIONS=true; shift ;;
    *)               err "Unknown flag: $1"; exit 1 ;;
  esac
done

# ── List versions mode ────────────────────────────────────────────
if [[ "$LIST_VERSIONS" == true ]]; then
  step "Fetching releases for $REPO..."
  curl -fsSL "https://api.github.com/repos/$REPO/releases?per_page=30" \
    | grep -oP '"tag_name":\s*"\K[^"]+' \
    | while read -r tag; do printf '  • %s\n' "$tag"; done
  exit 0
fi

REF="${VERSION:-$BRANCH}"

# ── Banner ────────────────────────────────────────────────────────
printf '\n'
printf '  ════════════════════════════════════════════════════════\n'
printf '  Spec & Memories Installer\n'
printf '  Source:   %s @ %s\n' "$REPO" "$REF"
printf '  Folders:  %s\n' "${FOLDERS[*]}"
printf '  Dest:     %s\n' "$(cd "$DEST" 2>/dev/null && pwd || echo "$DEST")"
if [[ "$DRY_RUN" == true ]]; then
  printf '  Mode:     DRY-RUN (no writes)\n'
fi
printf '  ════════════════════════════════════════════════════════\n\n'

# ── Download archive ──────────────────────────────────────────────
TMP_DIR="$(mktemp -d)"
ARCHIVE="$TMP_DIR/repo.tar.gz"

if [[ -n "$VERSION" ]]; then
  ARCHIVE_URL="https://codeload.github.com/$REPO/tar.gz/refs/tags/$VERSION"
else
  ARCHIVE_URL="https://codeload.github.com/$REPO/tar.gz/refs/heads/$BRANCH"
fi

step "Downloading $REPO@$REF..."
curl -fsSL "$ARCHIVE_URL" -o "$ARCHIVE"

step "Extracting..."
tar -xzf "$ARCHIVE" -C "$TMP_DIR"

# Find extracted root (GitHub archives create a single top-level dir)
EXTRACTED="$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

# ── Copy requested folders ────────────────────────────────────────
mkdir -p "$DEST"
COPIED=0

for folder in "${FOLDERS[@]}"; do
  SRC="$EXTRACTED/$folder"
  if [[ ! -d "$SRC" ]]; then
    err "Folder not found in archive: $folder"
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    COUNT="$(find "$SRC" -type f | wc -l)"
    step "[DRY-RUN] Would copy $folder/ ($COUNT files)"
  else
    step "Copying $folder/..."
    cp -R "$SRC" "$DEST/"
    COPIED=$((COPIED + 1))
  fi
done

# ── Cleanup ───────────────────────────────────────────────────────
rm -rf "$TMP_DIR"

if [[ "$DRY_RUN" == true ]]; then
  ok "Dry run complete — no files written."
else
  ok "Installed $COPIED folder(s) into $DEST"
fi
printf '\n'
