# Memory: architecture/specification-structure

**Updated:** 2026-02-17  
**Version:** 1.0.0  
**Status:** Active

---

## Structure

Core modules are organized as standalone root-level specifications to facilitate portability:

| Module | Location | Status |
|--------|----------|--------|
| GSearch CLI | `02-spec/20-gsearch-cli/` | ✅ Extracted |
| AI Bridge | `02-spec/22-ai-bridge-cli/` | ✅ Extracted |
| Nexus Flow | `02-spec/24-nexus-flow-cli/` | ✅ Extracted |
| BRun CLI | `02-spec/21-brun-cli/` | ✅ Extracted |

These modules are integrated into the **Spec Management Software** via centralized reference files at:
- `02-spec/11-spec-management-software/15-external-tools/`

---

## Reference Pattern

Each original location retains a `REFERENCE.md` file pointing to the extracted spec.

---

## WordPress Plugin

The WordPress plugin specification folder is maintained at `02-spec/30-wp-plugin/` (root of spec directory).

---

*Memory updated 2026-02-17 after v9.0.0 cross-reference remediation*
