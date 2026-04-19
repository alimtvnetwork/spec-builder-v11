# Folder Prefix Disambiguation

**Updated:** 2026-04-01  
**Version:** 4.0.0  

---

## v37.0.0 Grouped Resequencing

All spec modules were resequenced into logical groups (2026-04-01):

### Foundation & Standards (01–08)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `01-` | `01-` | general-spec (unchanged) |
| `03-` | `02-` | coding-guidelines |
| `07-` | `03-` | error-code-registry |
| `18-` | `04-` | error-resolution |
| `08-` | `05-` | spec-authoring-guide |
| `04-` | `06-` | split-db-architecture |
| `05-` | `07-` | seedable-config-architecture |
| `31-` | `08-` | generic-enforce |

### Core Application (10–11)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `01-` | `10-` | app |
| `02-` | `11-` | spec-management-software |

### CLI Tools (20–28)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `09-` | `20-` | gsearch-cli |
| `10-` | `21-` | brun-cli |
| `11-` | `22-` | ai-bridge-cli |
| `33-` | `23-` | ai-bridge-non-vector-rag |
| `12-` | `24-` | nexus-flow-cli |
| `15-` | `25-` | spec-reverse-cli |
| `16-` | `26-` | ai-transcribe-cli |
| `19-` | `27-` | license-manager |
| `20-` | `28-` | shared-cli-frontend |

### WordPress (30–33)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `13-` | `30-` | wp-plugin |
| `14-` | `31-` | wp-plugin-builder |
| `21-` | `32-` | wp-seo-publish-cli |
| `28-` | `33-` | wp-plugin-development |

### Time Log System (40–42)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `34-` | `40-` | time-log-cli |
| `35-` | `41-` | time-log-ui |
| `36-` | `42-` | time-log-combined |

### Utilities & Tools (50–53)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `06-` | `50-` | powershell-integration |
| `29-` | `51-` | upload-scripts |
| `32-` | `52-` | shared-preset-data |
| `30-` | `53-` | e2-activity-feed |

### Research & Tracking (60–61)

| Old Prefix | New Prefix | Module |
|---|---|---|
| `17-` | `60-` | ai-research |
| `23-` | `61-` | how-app-issues-track |

---

## Historical Notes

Previous prefix disambiguation records (v1.0–v3.0) tracked individual conflicts:
- Former `02-` duplicate (error-resolution vs spec-management-software)
- Former `03-` repurpose (shared-cli-frontend → coding-guidelines consolidation)
- v34.0.0 +1 shift for spec-authoring-guide insertion

All of these are now superseded by the v37.0.0 grouped resequencing above.
