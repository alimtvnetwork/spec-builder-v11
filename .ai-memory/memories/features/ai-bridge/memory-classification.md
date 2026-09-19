 # Memory: features/ai-bridge/memory-classification


**Version:** 1.0.0  

 
 **Updated:** 2026-02-05
 
 ---
 
 ## Summary
 
 AI Bridge RAG chunks include `IsCritical` and `IsImportant` boolean columns to support tiered memory preservation. Users can set these flags via CLI or JSON API during ingestion or update them retroactively by ID, enabling granular control over which contextual data is preserved for future sessions or project generation.
 
 ---
 
 ## Key Points
 
 - **IsCritical**: Cannot be auto-archived; essential for project regeneration
 - **IsImportant**: Prioritized retrieval; protected from threshold-based archiving
 - **Non-exclusive**: A chunk can be both Critical AND Important
 - **CLI Flags**: `--critical` / `-c` and `--important` / `-i` during ingestion
 - **Retroactive Updates**: `aibridge rag update --id 1234 --critical --important`
 - **API**: `PATCH /api/v1/chunks/{id}` and `PATCH /api/v1/chunks/bulk`
 - **Export**: `aibridge rag export --critical --output project-core.json`
 - **Error Codes**: 9810-9815 for chunk classification operations
 
 ---
 
 ## Related Specs
 
 - `02-spec/22-ai-bridge-cli/01-backend/41-memory-classification-flags.md`
 - `02-spec/22-ai-bridge-cli/01-backend/36-session-scoped-rag-memory.md`