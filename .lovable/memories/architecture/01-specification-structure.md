# Memory: architecture/specification-structure

**Updated:** 2026-02-17  
**Version:** 1.0.0  
**Status:** Active

---

## Structure

Core modules are organized as standalone root-level specifications to facilitate portability:

| Module | Location | Status |
|--------|----------|--------|
| GSearch CLI | `spec/20-gsearch-cli/` | ✅ Extracted |
| AI Bridge | `spec/22-ai-bridge-cli/` | ✅ Extracted |
| Nexus Flow | `spec/24-nexus-flow-cli/` | ✅ Extracted |
| BRun CLI | `spec/21-brun-cli/` | ✅ Extracted |

These modules are integrated into the **Spec Management Software** via centralized reference files at:
- `spec/11-spec-management-software/15-external-tools/`

---

## Reference Pattern

Each original location retains a `REFERENCE.md` file pointing to the extracted spec.

---

## WordPress Plugin

The WordPress plugin specification folder is maintained at `spec/30-wp-plugin/` (root of spec directory).

---

*Memory updated 2026-02-17 after v9.0.0 cross-reference remediation*
