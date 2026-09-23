## Quick Install v6.45.0

### Windows (PowerShell)

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v24/v6.45.0/install.ps1 -OutFile install.ps1; .\install.ps1 -TargetDir ".ai-memory/prompts" -Version "v6.45.0"
```

### Unix / Linux / macOS (Bash)

```bash
curl -sL https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v24/v6.45.0/install.sh | bash -s -- ".ai-memory/prompts" "v6.45.0"
```

---

## What's Changed in v6.45.0

### Added
- enhance release orchestrator with automated release notes and GitHub release creation
