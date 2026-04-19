---
name: spec-management/file-structure-conventions
description: Spec folder numbering ranges and grouped module organization
type: preference
---

Root spec structure: `spec/` with grouped numbering. **01-08** Foundation & Standards (general-spec, coding-guidelines, error-code-registry, error-resolution, spec-authoring-guide, split-db-architecture, seedable-config-architecture, generic-enforce). **10-11** Core Application (app, spec-management-software). **20-28** CLI Tools (gsearch, brun, ai-bridge, non-vector-rag, nexus-flow, spec-reverse, ai-transcribe, license-manager, shared-cli-frontend). **30-33** WordPress (wp-plugin, wp-plugin-builder, wp-seo-publish, wp-plugin-development). **40-42** Time Log (cli, ui, combined). **50-53** Utilities (powershell, upload-scripts, shared-preset-data, e2-activity-feed). **60-61** Research & Tracking (ai-research, how-app-issues-track). **99** Archive. Standard naming: lowercase-hyphenated with numeric prefixes. `00-overview.md` indexes each folder. `99-*` reserved for meta files. Cross-references use relative paths.
