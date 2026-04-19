 # Memory Classification Flags (IsCritical / IsImportant / IsAttention / IsShortTerm)
 
 > **Version:** 5.0.0  
 > **Updated:** 2026-03-09  
 > **Status:** Active  
 > **Related:** `36-session-scoped-rag-memory.md`, `34-suggestions-system.md`, `37-adaptive-reasoning-flow.md`, `54-memory-retrieval-best-practices.md`
 
 ---
 
 ## 1. Overview
 
 RAG chunks can be marked with **IsCritical**, **IsImportant**, **IsAttention**, and **IsShortTerm** flags to enable tiered memory preservation and retrieval. These flags allow the system to control which contextual data is preserved for future sessions, project generation, or AI handoffs, and which data is prioritized for the current conversation.
 
 ---
 
 ## 2. Core Principle
 
 > **Critical + Important = Project Regeneration Ready**  
 > **Attention + ShortTerm = Conversation Intelligence**
 
 Using these flags, the system maintains a 4-tier memory hierarchy:
 
 | Flag | Purpose | Persistence | Auto-Managed |
 |------|---------|-------------|--------------|
 | **IsAttention** | Marks chunks critical to the **current conversation turn**; highest retrieval boost | Turn-scoped; auto-expires after turn completes | ✅ Yes |
 | **IsShortTerm** | Marks chunks linked to **recent conversation nodes** within a session | Session-scoped; decays with time-decay multiplier | ✅ Yes |
 | **IsCritical** | Cannot be auto-archived or deleted; essential for project regeneration | Permanent until manually cleared | ❌ Manual |
 | **IsImportant** | Prioritized in retrieval; protected from auto-archive thresholds | Retained across sessions | ❌ Manual |
 
 **Note:** Flags are **not mutually exclusive**—a chunk can have any combination of flags set.
 
 ---
 
 ## 3. Schema Update
 
 ### 3.1 RagChunks Table Enhancement
 
 ```sql
 -- Add columns to existing RagChunks table
 ALTER TABLE RagChunks ADD COLUMN IsCritical INTEGER DEFAULT 0;
 ALTER TABLE RagChunks ADD COLUMN IsImportant INTEGER DEFAULT 0;
 ALTER TABLE RagChunks ADD COLUMN IsAttention INTEGER DEFAULT 0;
 ALTER TABLE RagChunks ADD COLUMN IsShortTerm INTEGER DEFAULT 0;
 
 -- Create indexes for efficient retrieval
 CREATE INDEX IdxChunksCritical ON RagChunks(IsCritical);
 CREATE INDEX IdxChunksImportant ON RagChunks(IsImportant);
 CREATE INDEX IdxChunksAttention ON RagChunks(IsAttention);
 CREATE INDEX IdxChunksShortTerm ON RagChunks(IsShortTerm);
 CREATE INDEX IdxChunksPriority ON RagChunks(IsCritical, IsImportant, IsAttention, IsShortTerm);
 ```
 
 ### 3.2 Updated RagChunks Schema
 
 ```sql
 CREATE TABLE IF NOT EXISTS RagChunks (
     Id              INTEGER PRIMARY KEY AUTOINCREMENT,
     ChunkHash       TEXT UNIQUE NOT NULL,
     Content         TEXT NOT NULL,
     Embedding       BLOB,                   -- Vector embedding
     SourceType      TEXT NOT NULL,          -- 'Code', 'Conversation', 'Training', 'Feedback'
     SourcePath      TEXT,                   -- File path if from code
     Tier            TEXT DEFAULT 'Session', -- 'Core' or 'Session'
     IsPinned        INTEGER DEFAULT 0,      -- Protected from auto-archive (legacy)
     IsCritical      INTEGER DEFAULT 0,      -- Cannot be deleted; essential memory
     IsImportant     INTEGER DEFAULT 0,      -- Prioritized retrieval; archive-protected
     IsAttention     INTEGER DEFAULT 0,      -- Current-turn focus (auto-managed)
     IsShortTerm     INTEGER DEFAULT 0,      -- Session-scoped recent memory (auto-managed)
     TokenCount      INTEGER,
     CreatedAt       TEXT DEFAULT (datetime('now')),
     LastAccessedAt  TEXT,
     AccessCount     INTEGER DEFAULT 0,
     Metadata        TEXT                    -- JSON for additional context
 );
 ```
 
 ### 3.3 Attention Memory Lifecycle
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │ ATTENTION MEMORY LIFECYCLE                                   │
 ├─────────────────────────────────────────────────────────────┤
 │                                                              │
 │  1. User sends message                                       │
 │     └── Extract keywords from message                       │
 │     └── Query ChunkTags for matching tags                   │
 │     └── Top-scoring chunks marked IsAttention = 1           │
 │                                                              │
 │  2. During LLM processing                                    │
 │     └── Attention chunks get 4.0x retrieval boost           │
 │     └── Fed first in context assembly                       │
 │                                                              │
 │  3. After response generated                                 │
 │     └── Demote: IsAttention = 0 on all chunks               │
 │     └── Promote top chunks to IsShortTerm = 1               │
 │                                                              │
 │  4. New turn begins                                          │
 │     └── Fresh attention selection based on new message      │
 │                                                              │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ### 3.4 Short-Term Memory Decay
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │ SHORT-TERM MEMORY DECAY STRATEGY                            │
 ├─────────────────────────────────────────────────────────────┤
 │                                                              │
 │  Decay Multiplier = 1.0 / (1.0 + TurnsSinceMarked * 0.2)   │
 │                                                              │
 │  Turn 0 (just marked):  1.0x boost                          │
 │  Turn 1:                0.83x boost                         │
 │  Turn 2:                0.71x boost                         │
 │  Turn 5:                0.50x boost                         │
 │  Turn 10:               0.33x boost                         │
 │                                                              │
 │  Auto-clear ShortTerm flag when:                            │
 │  - Decay multiplier < 0.2 (after ~20 turns)                │
 │  - Session ends                                              │
 │  - Manual reset via CLI/API                                  │
 │                                                              │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 4. Go Structs
 
 ### 4.1 RagChunk Update
 
 ```go
 type RagChunk struct {
     Id             int64     `json:",omitempty"`
     ChunkHash      string
     Content        string
     Embedding      []byte    `json:",omitempty"`
     SourceType     string
     SourcePath     string    `json:",omitempty"`
     Tier           string
     IsPinned       bool
     IsCritical     bool
     IsImportant    bool
     IsAttention    bool                              // Auto-managed: current-turn focus
     IsShortTerm    bool                              // Auto-managed: session-scoped
     TokenCount     int       `json:",omitempty"`
     CreatedAt      time.Time
     LastAccessedAt time.Time `json:",omitempty"`
     AccessCount    int
     Metadata       string    `json:",omitempty"`

     // ORM Relationships
     Tags           []ChunkTag  `gorm:"foreignKey:ChunkId"`
     OutgoingLinks  []ChunkLink `gorm:"foreignKey:SourceChunkId"`
     IncomingLinks  []ChunkLink `gorm:"foreignKey:TargetChunkId"`
 }
 ```
 
 ### 4.2 Classification Update Request
 
 ```go
type ChunkClassificationUpdate struct {
    IsCritical  *bool `json:",omitempty"`  // nil = no change
    IsImportant *bool `json:",omitempty"` // nil = no change
}

type BulkClassificationUpdate struct {
    ChunkIds    []int64
    Update      ChunkClassificationUpdate
}
 ```
 
 ---
 
 ## 5. CLI Interface
 
 ### 5.1 Setting Flags During Ingestion
 
 ```bash
 # Mark as critical during message ingestion
 aibridge chat --message "This is my core business logic" --critical
 
 # Mark as important during ingestion
 aibridge chat --message "This is a key decision" --important
 
 # Mark as both critical and important
 aibridge chat --message "Essential architecture decision" --critical --important
 
 # Short flags
 aibridge chat --message "Core memory" -c -i
 ```
 
 ### 5.2 Retroactive Updates by ID
 
 ```bash
 # Mark existing chunk as critical
 aibridge rag update --id 1234 --critical
 
 # Mark multiple chunks as important
 aibridge rag update --ids 1234,1235,1236 --important
 
 # Mark as both
 aibridge rag update --id 1234 --critical --important
 
 # Remove critical flag (keep important)
 aibridge rag update --id 1234 --critical=false
 
 # Remove both flags
 aibridge rag update --id 1234 --critical=false --important=false
 ```
 
 ### 5.3 Query by Classification
 
 ```bash
 # List all critical chunks
 aibridge rag list --critical
 
 # List all important chunks
 aibridge rag list --important
 
 # List chunks with either flag
 aibridge rag list --critical --important
 
 # Export critical chunks for project regeneration
 aibridge rag export --critical --output critical-memory.json
 ```
 
 ### 5.4 CLI Flag Definitions
 
 ```go
 var ragUpdateCmd = &cobra.Command{
     Use:   "update",
     Short: "Update classification flags on RAG chunks",
     RunE:  runRagUpdate,
 }
 
 func init() {
     ragUpdateCmd.Flags().Int64("id", 0, "Single chunk ID to update")
     ragUpdateCmd.Flags().String("ids", "", "Comma-separated chunk IDs")
     ragUpdateCmd.Flags().Bool("critical", false, "Mark as critical memory")
     ragUpdateCmd.Flags().Bool("important", false, "Mark as important memory")
 }
 ```
 
 ---
 
 ## 6. JSON API
 
 ### 6.1 Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | `PATCH` | `/api/v1/chunks/{id}` | Update single chunk classification |
 | `PATCH` | `/api/v1/chunks/bulk` | Update multiple chunks |
 | `GET` | `/api/v1/chunks?critical=true` | Query critical chunks |
 | `GET` | `/api/v1/chunks?important=true` | Query important chunks |
 | `GET` | `/api/v1/chunks/export?critical=true` | Export critical chunks |
 
 ### 6.2 PATCH /api/v1/chunks/{id}
 
 **Request:**
 ```json
 {
   "IsCritical": true,
   "IsImportant": true
 }
 ```
 
 **Response:**
 ```json
 {
   "Success": true,
   "Chunk": {
     "Id": 1234,
     "ChunkHash": "abc123...",
     "Content": "This is my core business logic...",
     "IsCritical": true,
     "IsImportant": true,
     "UpdatedAt": "2026-02-05T10:30:00Z"
   }
 }
 ```
 
 ### 6.3 PATCH /api/v1/chunks/bulk
 
 **Request:**
 ```json
 {
   "ChunkIds": [1234, 1235, 1236],
   "Update": {
     "IsCritical": true,
     "IsImportant": false
   }
 }
 ```
 
 **Response:**
 ```json
 {
   "Success": true,
   "Updated": 3,
   "Failed": 0,
   "Chunks": [
     {"Id": 1234, "IsCritical": true, "IsImportant": false},
     {"Id": 1235, "IsCritical": true, "IsImportant": false},
     {"Id": 1236, "IsCritical": true, "IsImportant": false}
   ]
 }
 ```
 
 ### 6.4 GET /api/v1/chunks?critical=true
 
 **Response:**
 ```json
 {
   "Chunks": [
     {
       "Id": 1234,
       "Content": "Core business logic...",
       "IsCritical": true,
       "IsImportant": true,
       "SourceType": "Conversation",
       "CreatedAt": "2026-02-05T09:00:00Z"
     }
   ],
   "Total": 1,
   "Page": 1,
   "PageSize": 50
 }
 ```
 
 ---
 
 ## 7. Classification During Message Ingestion
 
 ### 7.1 Chat Request Enhancement
 
 ```go
type ChatRequest struct {
    SessionId   string
    Message     string
    Module      string
    // New classification flags
    IsCritical  bool   `json:",omitempty"`
    IsImportant bool   `json:",omitempty"`
}
 ```
 
 ### 7.2 Ingestion Flow
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │ User sends message with --critical or --important flag      │
 └─────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. Process message normally                                 │
 │ 2. Chunk content into RAG segments                          │
 │ 3. Apply IsCritical/IsImportant flags to all chunks         │
 │ 4. Store with flags set                                     │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 8. Retrieval Priority
 
 ### 8.1 Priority Order
 
 When retrieving RAG chunks for context:
 
 ```
 Priority 1: IsAttention = true (current-turn focus, 4.0x boost)
 Priority 2: IsCritical = true AND IsImportant = true (3.5x boost)
 Priority 3: IsCritical = true (3.0x boost)
 Priority 4: IsShortTerm = true (2.0x boost, with time-decay multiplier)
 Priority 5: IsImportant = true (2.0x boost)
 Priority 6: IsPinned = true (legacy, 1.5x boost)
 Priority 7: Regular chunks by relevance score (1.0x)
 ```
 
 ### 8.2 Retrieval Scoring Formula
 
 ```sql
 SELECT *,
     (
         (CASE WHEN IsAttention = 1 THEN 4.0 ELSE 0 END)
       + (CASE WHEN IsCritical = 1 THEN 3.0 ELSE 0 END)
       + (CASE WHEN IsShortTerm = 1 THEN 2.0 ELSE 0 END)
       + (CASE WHEN IsImportant = 1 THEN 2.0 ELSE 0 END)
       + (CASE WHEN IsPinned = 1 THEN 1.5 ELSE 0 END)
       + RelevanceScore
     ) AS PriorityScore
 FROM RagChunks
 WHERE SessionId = ?
 ORDER BY PriorityScore DESC
 LIMIT ?;
 ```
 
 See `54-memory-retrieval-best-practices.md` for the complete retrieval algorithm including tag matching and link traversal.
 
 ---
 
 ## 9. Archive Protection
 
 ### 9.1 Archive Rules
 
 | Condition | Auto-Archive Behavior |
 |-----------|----------------------|
 | `IsCritical = true` | **Never auto-archived**; requires manual deletion |
 | `IsImportant = true` | **Protected**; only archived after all regular chunks |
 | `IsPinned = true` | **Protected**; legacy behavior maintained |
 | No flags | Standard threshold-based archiving |
 
 ### 9.2 Updated Archive Function
 
 ```go
 func ArchiveOldChunks(sessionId string, retainDays int) *apperror.AppError {
     cutoffTime := time.Now().AddDate(0, 0, -retainDays)
     
     // NEVER archive critical chunks
     // Archive regular chunks first, then important if still over threshold
     _, err := db.Exec(`
         INSERT INTO ArchivedChunks 
         SELECT *, datetime('now') as ArchivedAt 
         FROM RagChunks 
         WHERE CreatedAt < ? 
           AND IsCritical = 0  -- Never archive critical
           AND IsImportant = 0 -- Protect important
           AND IsPinned = 0    -- Legacy protection
     `, cutoffTime)
     if err != nil {
         return apperror.Wrap(
             err,
             ErrArchiveInsertFailed,
             "failed to archive chunks for session %s",
             sessionId,
         )
     }
     
     // Delete archived from active table
     _, err = db.Exec(`
         DELETE FROM RagChunks 
         WHERE CreatedAt < ? 
           AND IsCritical = 0 
           AND IsImportant = 0 
           AND IsPinned = 0
     `, cutoffTime)
     if err != nil {
         return apperror.Wrap(
             err,
             ErrArchiveDeleteFailed,
             "failed to delete archived chunks for session %s",
             sessionId,
         )
     }
     
     return nil
 }
 ```
 
 ---
 
 ## 10. Project Regeneration
 
 ### 10.1 Export Critical Memory
 
 ```bash
 # Export all critical chunks for project handoff
 aibridge rag export --critical --format json --output project-core.json
 
 # Export critical + important for full context
 aibridge rag export --critical --important --output project-full.json
 ```
 
 ### 10.2 Import for New Project
 
 ```bash
 # Import critical memory into new project
 aibridge rag import --file project-core.json --as-critical
 
 # Import as seed memory for new session
 aibridge session start --seed-from project-core.json
 ```
 
 ### 10.3 Export Format
 
 ```json
 {
   "ExportVersion": "1.0",
   "ExportedAt": "2026-02-05T10:30:00Z",
   "SourceProject": "my-project",
   "Filters": {
     "IsCritical": true,
     "IsImportant": false
   },
   "Chunks": [
     {
       "Id": 1234,
       "Content": "Core business logic for user authentication...",
       "SourceType": "Conversation",
       "IsCritical": true,
       "IsImportant": true,
       "Metadata": {
         "OriginalSessionId": "sess_abc123",
         "OriginalCreatedAt": "2026-02-01T09:00:00Z"
       }
     }
   ],
   "TotalChunks": 1
 }
 ```
 
 ---
 
 ## 11. Configuration (Seedable)
 
 Add to `config.seed.json`:
 
 ```json
 {
   "MemoryClassification": {
     "DefaultIsCritical": false,
     "DefaultIsImportant": false,
     "CriticalMaxChunks": 500,
     "ImportantMaxChunks": 2000,
     "AutoMarkCriticalPatterns": [
       "architecture decision",
       "core business logic",
       "essential requirement"
     ],
     "AutoMarkImportantPatterns": [
       "important note",
       "key decision",
       "remember this"
     ],
     "RetrievalPriorityEnabled": true,
     "ExportIncludeEmbeddings": false
   }
 }
 ```
 
 ---
 
 ## 12. Error Codes
 
 | Code | Name | Description |
 |------|------|-------------|
 | 9810 | `ErrChunkNotFound` | Chunk ID does not exist |
 | 9811 | `ErrChunkUpdateFailed` | Failed to update chunk classification |
 | 9812 | `ErrBulkUpdatePartial` | Some chunks in bulk update failed |
 | 9813 | `ErrCriticalLimitExceeded` | Too many critical chunks (exceeds limit) |
 | 9814 | `ErrExportFailed` | Failed to export chunks |
 | 9815 | `ErrImportFailed` | Failed to import chunks |
 
 ---
 
 ## 13. UI Considerations
 
 ### 13.1 Chunk List with Classification Badges
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │  RAG Memory Browser                          [Export] [⚙️]  │
 ├─────────────────────────────────────────────────────────────┤
 │  Filter: [All ▾]  [Critical ○]  [Important ○]               │
 ├─────────────────────────────────────────────────────────────┤
 │                                                              │
 │  #1234  🔴 Critical  🟡 Important                           │
 │  "Core business logic for user authentication..."           │
 │  Source: Conversation  |  2026-02-01 09:00                  │
 │  [Edit Flags]                                                │
 │  ─────────────────────────────────────────────────────────  │
 │                                                              │
 │  #1235  🟡 Important                                        │
 │  "Key decision about database schema..."                    │
 │  Source: Conversation  |  2026-02-02 14:30                  │
 │  [Edit Flags]                                                │
 │                                                              │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ### 13.2 Quick Classification Modal
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │  Edit Classification for Chunk #1234                        │
 ├─────────────────────────────────────────────────────────────┤
 │                                                              │
 │  🔴 Critical Memory                                         │
 │  ☑ Mark as critical (never auto-archived)                   │
 │                                                              │
 │  🟡 Important Memory                                        │
 │  ☑ Mark as important (prioritized retrieval)                │
 │                                                              │
 ├─────────────────────────────────────────────────────────────┤
 │                              [Cancel]  [Save Changes]        │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 14. Related Specifications
 
 | Spec | Relationship |
 |------|--------------|
 | `36-session-scoped-rag-memory.md` | Base RAG architecture |
 | `34-suggestions-system.md` | Suggestions can reference classified chunks |
 | `37-adaptive-reasoning-flow.md` | Reasoning uses classified chunks for context |
 | `26-database-paths-reference.md` | Session DB paths |
 | `08-split-db-integration.md` | Split DB architecture |
 | `12-database-architecture.md` | ChunkLinks and ChunkTags table definitions |
 | `53-enum-architecture.md` | link_type.Variant and memory_tier.Variant enums |
 | `54-memory-retrieval-best-practices.md` | Complete retrieval algorithm and best practices |