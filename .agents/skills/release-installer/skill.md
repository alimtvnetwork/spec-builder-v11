---
name: release-installer
description: Manage and audit release-pinned installer scripts and validation workflows
---

# Release Installer Skill

Governs `release.sh`, `release.ps1`, and templates:

1. **Release-Pinned Installers:**
   - URL-anchored replacement of `$script:ReleaseUrl` and `RELEASE_URL=`.
   - Injects audit header (Tag, Repo, Built date, Commit SHA, Builder, Asset URL).
   - Rejects unpinned invocations, `/releases/latest/` URLs, and forbidden flags (`--branch`, `--version`).
2. **CI Regression Guard:**
   - `.github/workflows/release-version-installer-tests.yml` validates no-fallback behavior across platforms.
