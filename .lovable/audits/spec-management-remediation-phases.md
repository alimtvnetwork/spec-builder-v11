# Spec Management Software Enum Remediation Phases

**Goal:** Achieve 50/50 compliance score  
**Initial Score:** 11/50  
**Final Score:** 50/50 ✅  
**Status:** COMPLETE

---

## Phase Overview

| Phase | Description | Score Impact | Status |
|-------|-------------|--------------|--------|
| **Phase 1** | Create enum architecture specification with all 29 enums | +24 | ✅ Complete |
| **Phase 2** | Update `07-database-design/01-schema.md` to use enum types | +6 | ✅ Complete |
| **Phase 3** | Update `03-data-models/01-core-entities.md` to use enum types | +4 | ✅ Complete |
| **Phase 4** | Update `03-data-models/02-ai-types.md` to use enum types | +4 | ✅ Complete |
| **Phase 5** | Verify cross-references and imports | +2 | ✅ Complete |
| **Phase 6** | Final audit report with score 50/50 | +4 | ✅ Complete |

---

## Phase 1: Create Enum Architecture ✅ COMPLETE

**Objective:** Create `spec/11-spec-management-software/07-database-design/05-enum-architecture.md` with all 29 compliant enums.

**Enums to Define (29 total):**

### Project & Visibility (3)
1. `project_type.Variant` - Category, Project
2. `visibility.Variant` - User, Global
3. `file_type.Variant` - Folder, File

### Configuration (2)
4. `config_source.Variant` - Seed, User
5. `seed_event_type.Variant` - Seed, Reseed, Reset, Update, PresetSeed

### Model & Slot (2)
6. `model_type.Variant` - Reasoning, Voice
7. `slot_status.Variant` - Idle, Loading, Active, Error, Unloading

### Content (2)
8. `content_type.Variant` - Idea, Feature, Task, CodingGuideline, Instruction
9. `override_mode.Variant` - Append, Replace

### Instruction System (4)
10. `instruction_status.Variant` - Transcribed, Proofreading, Proofread, Planning, Planned, Reviewing, Ready, Executing, Completed, Failed, Cancelled
11. `instruction_scope.Variant` - Global, Backend, Frontend, File
12. `execution_mode.Variant` - Automatic, Approval
13. `input_type.Variant` - Voice, Text

### Task System (3)
14. `task_type.Variant` - Create, Update, Delete, Refactor, Review, Verify
15. `task_status.Variant` - Pending, InProgress, Completed, Failed, Skipped
16. `change_type.Variant` - Created, Updated, Deleted, Renamed

### Inconsistency Detection (6)
17. `report_status.Variant` - Pending, Open, Resolved, Ignored
18. `issue_phase.Variant` - A, B, C, D
19. `issue_category.Variant` - MissingData, Conflict, Ambiguity, Enhancement
20. `issue_severity.Variant` - Critical, High, Medium, Low
21. `issue_status.Variant` - Open, Resolved, Ignored
22. `answer_type.Variant` - Radio, Checkbox, Text, Dropdown, MultiSelect

### User & Spec (2)
23. `user_role.Variant` - Admin, Editor, Viewer
24. `spec_status.Variant` - Draft, Planned, InProgress, Complete, Deprecated

### AI Types (6)
25. `model_provider.Variant` - Ollama, LlamaCpp, OpenAi, Anthropic
26. `model_category.Variant` - Thinking, Writing, Voice, Coding, Embedding
27. `model_capability.Variant` - Streaming, FunctionCalling, Vision, Audio, JsonMode
28. `finish_reason.Variant` - Stop, Length, ToolCalls, ContentFilter
29. `output_format.Variant` - Text, Json, Markdown, Code

**Deliverables:**
- [x] `spec/11-spec-management-software/07-database-design/05-enum-architecture.md` created
- [x] All 29 enums with `type Variant byte` pattern
- [x] All enums have `Unknown` zero value
- [x] All enums have `variantStrings` and `variantLabels` arrays
- [x] All 7 mandatory methods implemented
- [x] JSON Marshal/Unmarshal support
- [x] Domain-specific helper methods where applicable
- [x] Central registry defined

---

## Phase 2: Database Schema Cleanup ✅ COMPLETE

**Objective:** Update `spec/11-spec-management-software/07-database-design/01-schema.md` to replace inline string-based enums.

**Changes Made:**
- Replaced all 22 inline `type XxxType string` + `const (...)` enum blocks with comments referencing `05-enum-architecture.md`
- Updated all struct field types to use `enum_package.Variant` pattern
- Updated query pattern references (e.g., `ArtifactStatusActive` → `artifact_status.Active`)
- Added `05-enum-architecture.md` cross-reference to Related Specs
- Discovered and added 8 additional enums not in original plan: `trigger_type`, `artifact_type`, `artifact_status`, `chunk_type`, `match_source`, `promotion_event_status`, `loop_stop_reason`, `segment_status`, `index_type`

**Fields Updated (30 total):**
| Field | Old Type | New Type |
|-------|----------|----------|
| `Projects.Type` | `ProjectType` | `project_type.Variant` |
| `Projects.Visibility` | `Visibility` | `visibility.Variant` |
| `Files.Type` | `FileType` | `file_type.Variant` |
| `Config.Source` | `ConfigSource` | `config_source.Variant` |
| `ConfigSeedEvent.EventType` | `SeedEventType` | `seed_event_type.Variant` |
| `ModelRegistry.ModelType` | `ModelType` | `model_type.Variant` |
| `ModelSlot.Status` | `SlotStatus` | `slot_status.Variant` |
| `PromptPreset.ContentType` | `ContentType` | `content_type.Variant` |
| `UserPromptOverride.OverrideMode` | `OverrideMode` | `override_mode.Variant` |
| `Instruction.ContentType` | `*ContentType` | `*content_type.Variant` |
| `Instruction.InputType` | `InputType` | `input_type.Variant` |
| `Instruction.Scope` | `InstructionScope` | `instruction_scope.Variant` |
| `Instruction.Status` | `InstructionStatus` | `instruction_status.Variant` |
| `Instruction.ExecutionMode` | `ExecutionMode` | `execution_mode.Variant` |
| `InstructionTask.TaskType` | `TaskType` | `task_type.Variant` |
| `InstructionTask.Status` | `TaskStatus` | `task_status.Variant` |
| `FileChange.ChangeType` | `ChangeType` | `change_type.Variant` |
| `InconsistencyReport.Status` | `ReportStatus` | `report_status.Variant` |
| `InconsistencyIssue.Phase` | `IssuePhase` | `issue_phase.Variant` |
| `InconsistencyIssue.Category` | `IssueCategory` | `issue_category.Variant` |
| `InconsistencyIssue.Severity` | `IssueSeverity` | `issue_severity.Variant` |
| `InconsistencyIssue.Status` | `IssueStatus` | `issue_status.Variant` |
| `ClarificationQuestion.Phase` | `IssuePhase` | `issue_phase.Variant` |
| `ClarificationQuestion.AnswerType` | `AnswerType` | `answer_type.Variant` |
| `RegenerationEvent.TriggerType` | `TriggerType` | `trigger_type.Variant` |
| `Artifact.ArtifactType` | `ArtifactType` | `artifact_type.Variant` |
| `Artifact.Status` | `ArtifactStatus` | `artifact_status.Variant` |
| `Chunk.ChunkType` | `ChunkType` | `chunk_type.Variant` |
| `RetrievalSessionChunk.MatchSource` | `MatchSource` | `match_source.Variant` |
| `PromotionEvent.Status` | `PromotionEventStatus` | `promotion_event_status.Variant` |
| `ConsistencyLoop.StopReason` | `LoopStopReason` | `loop_stop_reason.Variant` |
| `VectorIndexMetadata.IndexType` | `string` | `index_type.Variant` |
| `InstructionSegment.Status` | `SegmentStatus` | `segment_status.Variant` |

---

## Phase 3: Core Entities Cleanup ✅ COMPLETE

**Objective:** Update `spec/11-spec-management-software/03-data-models/01-core-entities.md` TypeScript types to use enum references.

**Status:** Completed — all 4 fields updated to `Variant` references. Score: 50/50.

---

## Phase 4: AI Types Cleanup ✅ COMPLETE

**Objective:** Update `spec/11-spec-management-software/03-data-models/02-ai-types.md` TypeScript types to use enum references.

**Status:** Completed — all 5 fields updated to `Variant` references.

---

## Phase 5: Cross-Reference Verification ✅ COMPLETE

**Objective:** Ensure all specs reference the enum architecture and imports are correct.

**Status:** Completed — all cross-references validated.

---

## Phase 6: Final Audit ✅ COMPLETE

**Objective:** Update audit report with final compliance score.

**Deliverables:**
- [x] Updated `.lovable/audits/spec-management-enum-compliance-audit-2026-02-06.md`
- [x] Final score: 50/50

---

*Spec Management Software enum remediation tracking document.*
