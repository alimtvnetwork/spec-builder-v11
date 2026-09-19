# Release-Pinned Installer (`release-version.ps1` / `release-version.sh`)

> **Spec Version:** 1.0.0
> **Status:** Draft — Awaiting Implementation
> **AI Confidence:** Production-Ready
> **Ambiguity:** None
> **Updated:** 2026-04-21
> **Location:** `02-spec/51-upload-scripts/06-release-version-installer.md`
> **Repo:** `alimtvnetwork/coding-guidelines-v15`

---

## Keywords

`installer` · `release-pinned` · `powershell` · `bash` · `github-releases` · `version-lock` · `no-latest`

---

## Purpose

Define a **release-pinned** installer pair (`release-version.ps1` and `release-version.sh`) that is shipped **as a release asset** on each GitHub Release. Unlike the general-purpose `install.ps1` / `install.sh` (which default to `main`), this script:

1. Detects its own version **from the URL it was downloaded from** (the GitHub Release download URL).
2. Installs **only** that exact tag — never `main`, never `latest`, never a newer release.
3. Hard-fails (exit code `1`) with an actionable message if the version cannot be determined or the tag cannot be fetched.

This script is the canonical entry point linked from each Release page.

---

## Non-Goals

- Does **not** support `--branch main`, `--latest`, or any "rolling" mode.
- Does **not** read `package.json` for version resolution.
- Does **not** replace `install.ps1` / `install.sh`. Those remain the dev/general installer.
- Does **not** auto-update itself.

---

## Distribution Model

Each GitHub Release uploads two assets alongside the existing `coding-guidelines-vX.Y.Z.zip`:

| Asset                 | Purpose                            |
|-----------------------|------------------------------------|
| `release-version.ps1` | Windows / PowerShell installer    |
| `release-version.sh`  | Linux / macOS Bash installer      |

Users invoke them via the canonical Release-asset URL, which is what enables URL-based version detection:

```
https://github.com/<owner>/<repo>/releases/download/<TAG>/release-version.ps1
https://github.com/<owner>/<repo>/releases/download/<TAG>/release-version.sh
```

### Canonical Invocation

**PowerShell:**
```powershell
irm https://github.com/alimtvnetwork/coding-guidelines-v15/releases/download/v3.16.0/release-version.ps1 | iex
```

**Bash:**
```bash
curl -fsSL https://github.com/alimtvnetwork/coding-guidelines-v15/releases/download/v3.16.0/release-version.sh | bash
```

---

## Version Resolution Algorithm

### Source of Truth: the Download URL

The script **must** parse the URL it was fetched from. Acceptable patterns:

```
https://github.com/{owner}/{repo}/releases/download/{TAG}/release-version.{ps1|sh}
https://github.com/{owner}/{repo}/releases/latest/download/release-version.{ps1|sh}   ❌ REJECTED
```

| Step | Action                                                                 |
|------|------------------------------------------------------------------------|
| 1    | Read invocation URL from runtime (`$MyInvocation` / `$0` is insufficient — see "URL Capture" below). |
| 2    | Match against the regex `releases/download/(v?[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)/release-version\.(ps1\|sh)$`. |
| 3    | If the URL contains `/releases/latest/download/` → **hard-fail**. |
| 4    | If no match → **hard-fail**. |
| 5    | The captured group is the pinned `$Version`. |

### URL Capture

Because `irm | iex` and `curl | bash` do not natively expose the source URL to the script, the **release build pipeline must stamp the URL into the script** during `release.sh` / `release.ps1`:

```powershell
# Stamped at build time — DO NOT EDIT MANUALLY
$script:ReleaseUrl = 'https://github.com/alimtvnetwork/coding-guidelines-v15/releases/download/v3.16.0/release-version.ps1'
```

```bash
# Stamped at build time — DO NOT EDIT MANUALLY
RELEASE_URL='https://github.com/alimtvnetwork/coding-guidelines-v15/releases/download/v3.16.0/release-version.sh'
```

The stamp is the **single source of version truth** at runtime. Parsing is then deterministic and offline-safe.

---

## Mandatory Flags

| Flag                 | Type   | Default                | Behavior |
|----------------------|--------|------------------------|----------|
| `-Folders` / `--folders`  | list  | `spec,scripts,.lovable/memories` | Folders to extract from the pinned tag's archive |
| `-Dest` / `--dest`        | path  | current working dir    | Install destination |
| `-DryRun` / `--dry-run`   | flag  | off                    | Print plan, write nothing |
| `-Force` / `--force`      | flag  | off                    | Overwrite without prompting |
| `-NoLatest` / `--no-latest` | flag  | **always on, cannot be disabled** | Hard-locks to the stamped version. Present for explicitness; passing `-NoLatest:$false` is rejected. |

### Forbidden Flags

These flags from `install.ps1` / `install.sh` **must not exist** here:

- `-Branch` / `--branch`
- `-Version` / `--version` (version is URL-derived, not user-supplied)
- `-ListVersions` / `--list-versions`

If the user passes any forbidden flag, the script must **hard-fail** with:

```
❌ release-version is pinned to <TAG>. Use install.ps1 / install.sh for other versions.
```

---

## Failure Mode (Hard Fail Policy)

Any of the following conditions cause `exit 1` with a clear, actionable message that **explicitly suggests `install.ps1` / `install.sh`**:

| Condition                                          | Message |
|----------------------------------------------------|---------|
| Stamped URL missing or empty                       | `❌ This script was not built by release.sh — version stamp is missing. Use install.ps1 instead: <url>` |
| URL contains `/releases/latest/download/`          | `❌ Refusing to run from /releases/latest/. Download from a specific tag, or use install.ps1 if you want latest.` |
| URL does not match the release-asset regex         | `❌ Cannot determine pinned version from URL. Use install.ps1 instead.` |
| Tag archive returns 404                            | `❌ Release tag <TAG> not found on <repo>. Use install.ps1 to install from main.` |
| Network failure during archive download            | `❌ Failed to download <TAG>: <reason>. Try install.ps1 (general installer) once network is restored.` |
| Forbidden flag passed                              | (see above) |

**Never** silently fall back to `main`, `HEAD`, or another tag.

---

## Archive Download

Once `$Version` is resolved (e.g. `v3.16.0`), the script downloads:

```
https://codeload.github.com/{owner}/{repo}/zip/refs/tags/{Version}
```

Extract → copy requested `--folders` into `--dest` → cleanup tmp dir. Identical extraction logic to `install.ps1` / `install.sh` (DRY: extract behavior may share helper functions in a future refactor; not required for v1.0.0).

---

## Banner

Every successful run prints:

```
════════════════════════════════════════════════════════
  Release-Pinned Installer
  Source:   alimtvnetwork/coding-guidelines-v15
  Version:  v3.16.0   (pinned — will not auto-update)
  Folders:  spec, scripts, .lovable/memories
  Dest:     /home/user/project
════════════════════════════════════════════════════════
```

The line `Version: vX.Y.Z   (pinned — will not auto-update)` is **mandatory** so users see at a glance that this is locked.

---

## Build Integration (`release.sh` / `release.ps1`)

The release builder must, in addition to its current responsibilities:

1. Copy `templates/release-version.ps1.tmpl` and `templates/release-version.sh.tmpl` to `release-artifacts/`.
2. Replace the placeholder token `__RELEASE_URL__` with the fully-qualified asset URL for the version being built.
3. Output the stamped files alongside the existing zips.
4. Include them in `checksums.txt`.

Stamping is a single string replacement — no templating engine required.

---

## Acceptance Criteria

| ID  | Criterion |
|-----|-----------|
| RVI-001 | Running the stamped script installs exactly the stamped tag, regardless of newer releases. |
| RVI-002 | Removing or blanking the `__RELEASE_URL__` stamp causes `exit 1` with the "not built by release.sh" message. |
| RVI-003 | Passing `-Branch`, `-Version`, or `-ListVersions` causes `exit 1` with the "use install.ps1" message. |
| RVI-004 | Passing `-NoLatest:$false` (PowerShell) or `--no-latest=false` (Bash) causes `exit 1`. |
| RVI-005 | A URL containing `/releases/latest/download/` causes `exit 1`. |
| RVI-006 | Tag-not-found returns `exit 1` and never falls back to `main`. |
| RVI-007 | `--dry-run` prints the planned copy operations and exits `0` without writing. |
| RVI-008 | The banner contains the literal string `(pinned — will not auto-update)`. |
| RVI-009 | `release.sh` and `release.ps1` produce stamped artifacts with the correct version URL. |
| RVI-010 | `checksums.txt` includes both `release-version.ps1` and `release-version.sh`. |

---

## Out of Scope (v1.0.0)

- Signature verification (Sigstore / GPG) — tracked separately.
- Auto-uninstall of older installs.
- Resume of partial downloads.

---

## Related Specs

- `02-spec/51-upload-scripts/00-overview.md` — Upload Scripts overview
- `02-spec/11-powershell-integration/02-script-reference.md` — PowerShell standards
- Root `install.ps1` / `install.sh` — the general (non-pinned) installer this spec is **not** replacing
- Root `release.ps1` / `release.sh` — the release builder that must stamp these files
