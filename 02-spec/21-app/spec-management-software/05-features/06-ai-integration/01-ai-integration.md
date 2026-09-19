# AI Integration Backend

**Version:** 1.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The AI integration backend manages the local LLaMA server configuration, model selection, and provides API endpoints for the multi-stage AI chain: Voice Transcription → RAG Context Retrieval → Reasoning → Idea/Spec Generation.

**Cross-References:**
- [RAG System](../09-knowledge-memory/01-rag-system.md) - Retrieval-Augmented Generation for context injection
- [Instruction System](./03-instruction-system.md) - Idea promotion and instruction lifecycle
- [Database Schema](../../07-database-design/01-schema.md) - ModelRegistry, ModelSlot entities

---

## 7.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI Integration Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Voice  │───▶│  Voice      │───▶│  Reasoning  │───▶│  Generate   │  │
│  │  Input  │    │  Model      │    │    Model    │    │  Idea/Spec  │  │
│  └─────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│       │               │                   │                  │          │
│       │               ▼                   ▼                  ▼          │
│       │         Transcription      Questions/           Markdown       │
│       │            Text            Validation           Output          │
│       │                                  │                              │
│       │                                  ▼                              │
│       │                           User Answers                          │
│       │                                  │                              │
│       └──────────────────────────────────┘                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7.2 LLaMA Server Configuration

### Database Schema (Config Table Entries)

```sql
-- Seeded configuration for LLaMA server
INSERT INTO Config (Key, Value, Description) VALUES
('llama.server.path', '/usr/local/bin/llama-server', 'Path to llama.cpp server executable'),
('llama.server.host', '127.0.0.1', 'LLaMA server bind host'),
('llama.server.port', '8080', 'LLaMA server port'),
('llama.models.dir', '/models', 'Directory containing model files'),
('llama.voice.model', 'whisper-large-v3.gguf', 'Model for voice transcription'),
('llama.reasoning.model', 'mixtral-8x7b-instruct.gguf', 'Model for reasoning/generation'),
('llama.context.size', '8192', 'Context window size'),
('llama.gpu.layers', '35', 'Number of layers to offload to GPU');
```

### Configuration Service

```go
// internal/services/config_service.go
package services

type LLaMAConfig struct {
    ServerPath     string
    Host           string
    Port           int
    ModelsDir      string
    VoiceModel     string
    ReasoningModel string
    ContextSize    int
    GpuLayers      int
}

type ConfigService struct {
    db *sql.DB
}

func (s *ConfigService) GetLLaMAConfig(context stdctx.Context) appfault.Result[*LLaMAConfig] {
    config := &LLaMAConfig{}
    
    rows, err := s.db.QueryContext(context, `
        SELECT Key, Value FROM Config WHERE Key LIKE 'llama.%'
    `)
    if err != nil {
        return appfault.FailWrap[*LLaMAConfig](
            err,
            "failed to query LLaMA config",
        )
    }
    defer rows.Close()
    
    for rows.Next() {
        var key, value string
        if err := rows.Scan(&key, &value); err != nil {
            continue
        }
        
        switch key {
        case "llama.server.path":
            config.ServerPath = value
        case "llama.server.host":
            config.Host = value
        case "llama.server.port":
            config.Port, _ = strconv.Atoi(value)
        case "llama.models.dir":
            config.ModelsDir = value
        case "llama.voice.model":
            config.VoiceModel = value
        case "llama.reasoning.model":
            config.ReasoningModel = value
        case "llama.context.size":
            config.ContextSize, _ = strconv.Atoi(value)
        case "llama.gpu.layers":
            config.GPULayers, _ = strconv.Atoi(value)
        }
    }
    
    return appfault.Ok(config)
}

func (s *ConfigService) UpdateLLaMAConfig(context stdctx.Context, updates map[string]string) error {
    tx, err := s.db.BeginTx(context, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    stmt, err := tx.PrepareContext(context, `
        INSERT INTO Config (Key, Value, UpdatedAt)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(Key) DO UPDATE SET Value = excluded.Value, UpdatedAt = excluded.UpdatedAt
    `)
    if err != nil {
        return err
    }
    defer stmt.Close()
    
    for key, value := range updates {
        if _, err := stmt.ExecContext(context, "llama."+key, value); err != nil {
            return err
        }
    }
    
    return tx.Commit()
}

func (s *ConfigService) ListAvailableModels(context stdctx.Context) appfault.Result[[]ModelInfo] {
    configResult := s.GetLLaMAConfig(context)
    if configResult.HasError() {
        return appfault.Fail[[]ModelInfo](configResult.Error())
    }
    config := configResult.Value()
    
    entries, err := pathutil.ReadDir(config.ModelsDir)
    if err != nil {
        return appfault.FailWrap[[]ModelInfo](
            err,
            "failed to read models directory",
        )
    }
    
    var models []ModelInfo
    for _, entry := range entries {
        if entry.IsFile() && strings.HasSuffix(entry.Name(), ".gguf") {
            info, _ := entry.Info()
            models = append(models, ModelInfo{
                Name:     entry.Name(),
                Size:     info.Size(),
                Modified: info.ModTime(),
            })
        }
    }
    
    return appfault.Ok(models)
}

type ModelInfo struct {
    Name     string
    Size     int64
    Modified time.Time
}
```

---

## 7.3 Model Registry Service

The Model Registry manages discovery, registration, and selection of AI models.

### Model Discovery

```go
// internal/services/model_registry_service.go
package services

import (
    stdctx "context"
    "os"
    "path/filepath"
    "strings"
)

type ModelRegistryService struct {
    db            *sql.DB
    configService *ConfigService
}

func NewModelRegistryService(db *sql.DB, configService *ConfigService) *ModelRegistryService {
    return &ModelRegistryService{db: db, configService: configService}
}

// ScanModels discovers models from configured root paths
func (s *ModelRegistryService) ScanModels(context stdctx.Context) appfault.Result[[]ModelInfo] {
    // Get model root paths from config
    rootPaths, err := s.configService.GetConfigAsArray(context, "llama.models.rootPaths")
    if err != nil {
        return appfault.FailWrap[[]ModelInfo](
            err,
            "failed to get model root paths",
        )
    }
    
    var discovered []ModelInfo
    
    for _, rootPath := range rootPaths {
        entries, err := pathutil.ReadDir(rootPath)
        if err != nil {
            continue // Skip inaccessible paths
        }
        
        for _, entry := range entries {
            if entry.IsDir() || stringutil.IsMissingSuffix(entry.Name(), ".gguf") {
                continue
            }
            
            info, _ := entry.Info()
            modelPath := filepath.Join(rootPath, entry.Name())
            
            // Infer model type from filename
            modelType := inferModelType(entry.Name())
            
            discovered = append(discovered, ModelInfo{
                FileName:      entry.Name(),
                DisplayName:   generateDisplayName(entry.Name()),
                ModelType:     modelType,
                ModelPath:     modelPath,
                FileSizeBytes: info.Size(),
            })
        }
    }
    
    return appfault.Ok(discovered)
}

// ModelCategory defines the 4 primary categories for model selection
type ModelCategory string

const (
    ModelCategoryThinking ModelCategory = "thinking"  // Long-chain reasoning, planning
    ModelCategoryWriting  ModelCategory = "writing"   // Content generation, drafting
    ModelCategoryVoice    ModelCategory = "voice"     // Speech-to-text transcription
    ModelCategoryCoding   ModelCategory = "coding"    // Code generation, refactoring
)

var AllModelCategories = []ModelCategory{
    ModelCategoryThinking, ModelCategoryWriting, ModelCategoryVoice, ModelCategoryCoding,
}

// inferModelCategory determines category based on filename patterns
func inferModelCategory(filename string) ModelCategory {
    lowerName := strings.ToLower(filename)
    
    // Voice detection
    if containsAny(lowerName, "whisper", "speech", "voice", "transcribe", "audio") {
        return ModelCategoryVoice
    }
    
    // Coding detection
    if containsAny(lowerName, "code", "coder", "starcoder", "codellama", "deepseek-coder", "qwen-coder") {
        return ModelCategoryCoding
    }
    
    // Thinking/Reasoning detection
    if containsAny(lowerName, "reasoning", "think", "o1", "r1", "qwq", "deepseek-r", "reflection") {
        return ModelCategoryThinking
    }
    
    // Default to writing for general-purpose models (llama, mistral, etc.)
    return ModelCategoryWriting
}

func containsAny(s string, substrs ...string) bool {
    for _, sub := range substrs {
        if strings.Contains(s, sub) {
            return true
        }
    }
    return false
}

// SyncRegistry updates database with discovered models
func (s *ModelRegistryService) SyncRegistry(context stdctx.Context) *appfault.AppError {
    scanResult := s.ScanModels(context)
    if scanResult.HasError() {
        return scanResult.Error()
    }
    discovered := scanResult.Value()
    
    tx, _ := s.db.BeginTx(context, nil)
    defer tx.Rollback()
    
    for _, model := range discovered {
        _, err := tx.ExecContext(context, `
            INSERT INTO ModelRegistry (Id, DisplayName, FileName, ModelCategory, ModelPath, FileSizeBytes, LastScannedAt, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
            ON CONFLICT(FileName) DO UPDATE SET
                ModelPath = excluded.ModelPath,
                FileSizeBytes = excluded.FileSizeBytes,
                ModelCategory = excluded.ModelCategory,
                LastScannedAt = datetime('now'),
                UpdatedAt = datetime('now')
        `, uuid.NewString(), model.DisplayName, model.FileName, model.Category, model.ModelPath, model.FileSizeBytes)
        
        if err != nil {
            return appfault.Wrap(
                err,
                appfault.ErrDbWrite,
                "failed to sync model registry",
            )
        }
    }
    
    if err := tx.Commit(); err != nil {
        return appfault.Wrap(
            err,
            appfault.ErrDbWrite,
            "failed to commit registry sync",
        )
    }

    return nil
}
```

### Model Selection Hierarchy

Model selection follows a priority hierarchy for each of the 4 categories:

```
┌─────────────────────────────────────────────────────────────────┐
│              Model Selection Hierarchy (Per Category)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Categories: thinking | writing | voice | coding               │
│                                                                  │
│   Priority 1: Per-Instruction Override                          │
│   ─────────────────────────────────                             │
│   When launching an AI task, user can explicitly select a       │
│   model to use for that specific instruction and category.      │
│                                                                  │
│   Priority 2: Per-Project Default                                │
│   ────────────────────────                                      │
│   Each project can specify default models per category:         │
│   ProjectSettings.DefaultThinkingModelId                        │
│   ProjectSettings.DefaultWritingModelId                         │
│   ProjectSettings.DefaultVoiceModelId                           │
│   ProjectSettings.DefaultCodingModelId                          │
│                                                                  │
│   Priority 3: Per-User Default                                   │
│   ───────────────────────                                       │
│   User preferences stored per category:                         │
│   User.DefaultThinkingModelId                                   │
│   User.DefaultWritingModelId                                    │
│   User.DefaultVoiceModelId                                      │
│   User.DefaultCodingModelId                                     │
│                                                                  │
│   Priority 4: System Default                                     │
│   ─────────────────────                                         │
│   Config keys:                                                   │
│   llm.defaults.thinkingModelId                                  │
│   llm.defaults.writingModelId                                   │
│   llm.defaults.voiceModelId                                     │
│   llm.defaults.codingModelId                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Model Resolution Logic

```go
// CategoryModelOverrides holds per-category model overrides
type CategoryModelOverrides struct {
    ThinkingModelId *string `json:",omitempty"`
    WritingModelId  *string `json:",omitempty"`
    VoiceModelId    *string `json:",omitempty"`
    CodingModelId   *string `json:",omitempty"`
}

// ResolveModelByCategory returns the model to use based on hierarchy and category
func (s *ModelRegistryService) ResolveModelByCategory(
    context stdctx.Context,
    category ModelCategory,
    instructionOverrides *CategoryModelOverrides,
    projectId *string,
    userId string,
) appfault.Result[*ModelInfo] {
    
    // Priority 1: Per-instruction override
    if instructionOverrides != nil {
        modelId := s.getOverrideForCategory(instructionOverrides, category)
        if modelId != nil && *modelId != "" {
            return s.GetModelById(context, *modelId)
        }
    }
    
    // Priority 2: Per-project default
    if projectId != nil {
        projectSettings, _ := s.getProjectSettings(context, *projectId)
        if projectSettings != nil {
            modelId := s.getProjectDefaultForCategory(projectSettings, category)
            if modelId != nil && *modelId != "" {
                return s.GetModelById(context, *modelId)
            }
        }
    }
    
    // Priority 3: Per-user default
    user, _ := s.getUserWithPreferences(context, userId)
    if user != nil {
        modelId := s.getUserDefaultForCategory(user, category)
        if modelId != nil && *modelId != "" {
            return s.GetModelById(context, *modelId)
        }
    }
    
    // Priority 4: System default
    configKey := fmt.Sprintf("llm.defaults.%sModelId", category)
    defaultModelId, _ := s.configService.GetConfig(context, configKey)
    if defaultModelId != "" {
        return s.GetModelById(context, defaultModelId)
    }
    
    // Fallback: First enabled model of requested category
    return s.GetFirstEnabledModelByCategory(context, category)
}

func (s *ModelRegistryService) getOverrideForCategory(overrides *CategoryModelOverrides, category ModelCategory) *string {
    switch category {
    case ModelCategoryThinking:
        return overrides.ThinkingModelId
    case ModelCategoryWriting:
        return overrides.WritingModelId
    case ModelCategoryVoice:
        return overrides.VoiceModelId
    case ModelCategoryCoding:
        return overrides.CodingModelId
    }
    return nil
}

func (s *ModelRegistryService) getProjectDefaultForCategory(settings *ProjectSettings, category ModelCategory) *string {
    switch category {
    case ModelCategoryThinking:
        return settings.DefaultThinkingModelId
    case ModelCategoryWriting:
        return settings.DefaultWritingModelId
    case ModelCategoryVoice:
        return settings.DefaultVoiceModelId
    case ModelCategoryCoding:
        return settings.DefaultCodingModelId
    }
    return nil
}

func (s *ModelRegistryService) getUserDefaultForCategory(user *User, category ModelCategory) *string {
    switch category {
    case ModelCategoryThinking:
        return user.DefaultThinkingModelId
    case ModelCategoryWriting:
        return user.DefaultWritingModelId
    case ModelCategoryVoice:
        return user.DefaultVoiceModelId
    case ModelCategoryCoding:
        return user.DefaultCodingModelId
    }
    return nil
}

// GetFirstEnabledModelByCategory returns the first available model for a category
func (s *ModelRegistryService) GetFirstEnabledModelByCategory(context stdctx.Context, category ModelCategory) appfault.Result[*ModelInfo] {
    row := s.db.QueryRowContext(context, `
        SELECT Id, DisplayName, FileName, ModelCategory, ModelPath, FileSizeBytes
        FROM ModelRegistry 
        WHERE ModelCategory = ? AND IsEnabled = 1
        ORDER BY Priority ASC, DisplayName ASC
        LIMIT 1
    `, string(category))
    
    var model ModelInfo
    err := row.Scan(&model.Id, &model.DisplayName, &model.FileName, &model.Category, &model.ModelPath, &model.FileSizeBytes)
    if err != nil {
        return appfault.FailWrap[*ModelInfo](
            err,
            "no enabled model found for category",
        )
    }

    return appfault.Ok(&model)
}
```

---

## 7.4 Multi-Model Slot Manager

The Slot Manager handles running multiple models concurrently on different ports.

### Slot Manager Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Multi-Model Slot Manager                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                       Slot Pool                                   │  │
│   ├─────────┬─────────┬─────────┬─────────┬─────────┬───────────────┤  │
│   │ Slot 0  │ Slot 1  │ Slot 2  │ Slot 3  │ ...     │ Slot N        │  │
│   │ :8080   │ :8081   │ :8082   │ :8083   │         │ :808N         │  │
│   │ whisper │ llama3  │ (idle)  │ (idle)  │         │ (idle)        │  │
│   │ active  │ active  │ idle    │ idle    │         │ idle          │  │
│   └─────────┴─────────┴─────────┴─────────┴─────────┴───────────────┘  │
│                                                                          │
│   Max Concurrent Models: llama.server.maxConcurrentModels (default: 3)  │
│   LRU Eviction: Oldest lastAccessedAt slot evicted when full            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Slot Manager Service

```go
// internal/services/slot_manager.go
package services

import (
    stdctx "context"
    "fmt"
    "os/exec"
    "sync"
    "time"
)

type SlotManager struct {
    db             *sql.DB
    configService  *ConfigService
    registryService *ModelRegistryService
    mutex          sync.RWMutex
    processes      map[int]*exec.Cmd  // slotIndex -> process
}

func NewSlotManager(db *sql.DB, configService *ConfigService, registryService *ModelRegistryService) *SlotManager {
    return &SlotManager{
        db:              db,
        configService:   configService,
        registryService: registryService,
        processes:       make(map[int]*exec.Cmd),
    }
}

// InitializeSlots creates slot records on startup
func (sm *SlotManager) InitializeSlots(context stdctx.Context) error {
    basePort, _ := sm.configService.GetConfigAsInt(context, "llama.server.basePort")
    portRangeStart, _ := sm.configService.GetConfigAsInt(context, "llama.server.portRangeStart")
    portRangeEnd, _ := sm.configService.GetConfigAsInt(context, "llama.server.portRangeEnd")
    
    tx, _ := sm.db.BeginTx(context, nil)
    defer tx.Rollback()
    
    // Create base slot (index 0)
    tx.ExecContext(context, `
        INSERT OR IGNORE INTO ModelSlot (Id, SlotIndex, Port, Status, CreatedAt, UpdatedAt)
        VALUES (?, 0, ?, 'idle', datetime('now'), datetime('now'))
    `, uuid.NewString(), basePort)
    
    // Create additional slots
    slotIndex := 1
    for port := portRangeStart; port <= portRangeEnd; port++ {
        tx.ExecContext(context, `
            INSERT OR IGNORE INTO ModelSlot (Id, SlotIndex, Port, Status, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, 'idle', datetime('now'), datetime('now'))
        `, uuid.NewString(), slotIndex, port)
        slotIndex++
    }
    
    return tx.Commit()
}

// RequestModel ensures a model is loaded and returns its port
func (sm *SlotManager) RequestModel(context stdctx.Context, modelId string) appfault.Result[int] {
    sm.mutex.Lock()
    defer sm.mutex.Unlock()
    
    // Check if model already loaded
    var existingSlot struct {
        Port   int
        Status string
    }
    err := sm.db.QueryRowContext(context, `
        SELECT Port, Status FROM ModelSlot WHERE ModelId = ?
    `, modelId).Scan(&existingSlot.Port, &existingSlot.Status)
    
    if err == nil && existingSlot.Status == "active" {
        // Update last accessed time
        sm.db.ExecContext(context, `
            UPDATE ModelSlot SET LastAccessedAt = datetime('now') WHERE ModelId = ?
        `, modelId)
        return appfault.Ok(existingSlot.Port)
    }
    
    // Find available slot or evict LRU
    slotResult := sm.findOrEvictSlot(context)
    if slotResult.HasError() {
        return appfault.Fail[int](slotResult.Error())
    }
    slot := slotResult.Value()
    
    // Load model into slot
    if err := sm.loadModelIntoSlot(context, modelId, slot); err != nil {
        return appfault.Fail[int](err)
    }
    
    return appfault.Ok(slot.Port)
}

// findOrEvictSlot finds an idle slot or evicts the least recently used
func (sm *SlotManager) findOrEvictSlot(context stdctx.Context) appfault.Result[*ModelSlot] {
    maxConcurrent, _ := sm.configService.GetConfigAsInt(context, "llama.server.maxConcurrentModels")
    
    // Count active slots
    var activeCount int
    sm.db.QueryRowContext(context, `
        SELECT COUNT(*) FROM ModelSlot WHERE Status = 'active'
    `).Scan(&activeCount)
    
    // Find idle slot
    var idleSlot ModelSlot
    err := sm.db.QueryRowContext(context, `
        SELECT Id, SlotIndex, Port FROM ModelSlot WHERE Status = 'idle' LIMIT 1
    `).Scan(&idleSlot.Id, &idleSlot.SlotIndex, &idleSlot.Port)
    
    if err == nil {
        return appfault.Ok(&idleSlot)
    }
    
    // No idle slots - check if we can evict
    if activeCount >= maxConcurrent {
        // Find LRU slot
        var lruSlot ModelSlot
        err := sm.db.QueryRowContext(context, `
            SELECT Id, SlotIndex, Port, ModelId, ProcessId
            FROM ModelSlot
            WHERE Status = 'active'
            ORDER BY LastAccessedAt ASC
            LIMIT 1
        `).Scan(&lruSlot.Id, &lruSlot.SlotIndex, &lruSlot.Port, &lruSlot.ModelId, &lruSlot.ProcessId)
        
        if err != nil {
            return appfault.FailWrap[*ModelSlot](
                err,
                "no available slots",
            )
        }
        
        // Evict the LRU model
        if err := sm.unloadSlot(context, &lruSlot); err != nil {
            return appfault.Fail[*ModelSlot](err)
        }
        
        return appfault.Ok(&lruSlot)
    }
    
    return appfault.FailNew[*ModelSlot](
        appfault.ErrAllSlotsFull,
        "no available slots",
    )
}

// loadModelIntoSlot starts a model process and updates slot status
func (sm *SlotManager) loadModelIntoSlot(context stdctx.Context, modelId string, slot *ModelSlot) error {
    // Update slot status to loading
    sm.db.ExecContext(context, `
        UPDATE ModelSlot SET Status = 'loading', ModelId = ?, UpdatedAt = datetime('now')
        WHERE Id = ?
    `, modelId, slot.Id)
    
    // Get model info
    model, err := sm.registryService.GetModelById(context, modelId)
    if err != nil {
        sm.db.ExecContext(context, `
            UPDATE ModelSlot SET Status = 'error', ErrorMessage = ?, UpdatedAt = datetime('now')
            WHERE Id = ?
        `, err.Error(), slot.Id)
        return err
    }
    
    // Build shell command from template
    cmd, err := sm.buildStartCommand(context, model, slot.Port)
    if err != nil {
        return err
    }
    
    // Start process
    if err := cmd.Start(); err != nil {
        sm.db.ExecContext(context, `
            UPDATE ModelSlot SET Status = 'error', ErrorMessage = ?, UpdatedAt = datetime('now')
            WHERE Id = ?
        `, err.Error(), slot.Id)
        return err
    }
    
    sm.processes[slot.SlotIndex] = cmd
    
    // Wait for health check
    if err := sm.waitForHealth(context, slot.Port); err != nil {
        cmd.Process.Kill()
        sm.db.ExecContext(context, `
            UPDATE ModelSlot SET Status = 'error', ErrorMessage = ?, UpdatedAt = datetime('now')
            WHERE Id = ?
        `, err.Error(), slot.Id)
        return err
    }
    
    // Update slot to active
    sm.db.ExecContext(context, `
        UPDATE ModelSlot 
        SET Status = 'active', 
            ProcessId = ?, 
            StartedAt = datetime('now'),
            LastAccessedAt = datetime('now'),
            ErrorMessage = NULL,
            UpdatedAt = datetime('now')
        WHERE Id = ?
    `, cmd.Process.Pid, slot.Id)
    
    return nil
}

// buildStartCommand constructs the shell command from template
func (sm *SlotManager) buildStartCommand(context stdctx.Context, model *ModelInfo, port int) appfault.Result[*exec.Cmd] {
    template, _ := sm.configService.GetConfig(context, "llama.server.shellCommandTemplate")
    executable, _ := sm.configService.GetConfig(context, "llama.server.executablePath")
    bindAddress, _ := sm.configService.GetConfig(context, "llama.server.bindAddress")
    contextSize, _ := sm.configService.GetConfigAsInt(context, "llama.models.contextSize")
    gpuLayers, _ := sm.configService.GetConfigAsInt(context, "llama.models.gpuLayers")
    
    // Use model-specific overrides if set
    if model.ContextSize != nil {
        contextSize = *model.ContextSize
    }
    if model.GpuLayers != nil {
        gpuLayers = *model.GpuLayers
    }
    
    // Replace placeholders in template
    cmdStr := strings.ReplaceAll(template, "{executable}", executable)
    cmdStr = strings.ReplaceAll(cmdStr, "{modelPath}", model.ModelPath)
    cmdStr = strings.ReplaceAll(cmdStr, "{host}", bindAddress)
    cmdStr = strings.ReplaceAll(cmdStr, "{port}", fmt.Sprintf("%d", port))
    cmdStr = strings.ReplaceAll(cmdStr, "{contextSize}", fmt.Sprintf("%d", contextSize))
    cmdStr = strings.ReplaceAll(cmdStr, "{gpuLayers}", fmt.Sprintf("%d", gpuLayers))
    
    return appfault.Ok(exec.CommandContext(context, "sh", "-c", cmdStr))
}

// unloadSlot gracefully stops a model and frees the slot
func (sm *SlotManager) unloadSlot(context stdctx.Context, slot *ModelSlot) error {
    sm.db.ExecContext(context, `
        UPDATE ModelSlot SET Status = 'unloading', UpdatedAt = datetime('now')
        WHERE Id = ?
    `, slot.Id)
    
    if proc, ok := sm.processes[slot.SlotIndex]; ok && proc.Process != nil {
        proc.Process.Kill()
        delete(sm.processes, slot.SlotIndex)
    }
    
    sm.db.ExecContext(context, `
        UPDATE ModelSlot 
        SET Status = 'idle', 
            ModelId = NULL, 
            ProcessId = NULL,
            StartedAt = NULL,
            LastAccessedAt = NULL,
            UpdatedAt = datetime('now')
        WHERE Id = ?
    `, slot.Id)
    
    return nil
}
```

---

## 7.5 LLaMA Server Manager

```go
// internal/services/llama_manager.go
package services

import (
    stdctx "context"
    "os/exec"
    "sync"
)

type LLaMAManager struct {
    configService *ConfigService
    mutex         sync.Mutex
    process       *exec.Cmd
    isRunning     bool
}

func NewLLaMAManager(configService *ConfigService) *LLaMAManager {
    return &LLaMAManager{
        configService: configService,
    }
}

func (m *LLaMAManager) Start(context stdctx.Context, modelType string) error {
    m.mutex.Lock()
    defer m.mutex.Unlock()
    
    if m.isRunning {
        return nil // Already running
    }
    
    config, err := m.configService.GetLLaMAConfig(context)
    if err != nil {
        return err
    }
    
    // Select model based on type
    var modelPath string
    switch modelType {
    case "voice":
        modelPath = filepath.Join(config.ModelsDir, config.VoiceModel)
    case "reasoning":
        modelPath = filepath.Join(config.ModelsDir, config.ReasoningModel)
    default:
        return appfault.New(
            ErrInvalidModelType,
            "unknown model type: "+modelType,
        )
    }
    
    // Build command arguments
    args := []string{
        "--model", modelPath,
        "--host", config.Host,
        "--port", strconv.Itoa(config.Port),
        "--ctx-size", strconv.Itoa(config.ContextSize),
        "--n-gpu-layers", strconv.Itoa(config.GPULayers),
    }
    
    m.process = exec.CommandContext(context, config.ServerPath, args...)
    
    if err := m.process.Start(); err != nil {
        return appfault.Wrap(
            err,
            ErrServerStartTimeout,
            "failed to start llama server",
        )
    }
    
    m.isRunning = true
    
    // Wait for server to be ready
    return m.waitForReady(context, config.Host, config.Port)
}

func (m *LLaMAManager) Stop() error {
    m.mutex.Lock()
    defer m.mutex.Unlock()
    
    isStopped := !m.isRunning
    isProcessMissing := m.process == nil
    isAlreadyStopped := isStopped || isProcessMissing

    if isAlreadyStopped {
        return nil
    }
    
    if err := m.process.Process.Kill(); err != nil {
        return err
    }
    
    m.isRunning = false
    m.process = nil
    return nil
}

func (m *LLaMAManager) IsRunning() bool {
    m.mutex.Lock()
    defer m.mutex.Unlock()
    return m.isRunning
}

func (m *LLaMAManager) waitForReady(context stdctx.Context, host string, port int) error {
    url := fmt.Sprintf("http://%s:%d/health", host, port)
    
    for i := 0; i < 30; i++ { // Wait up to 30 seconds
        select {
        case <-context.Done():
            return context.Err()
        case <-time.After(time.Second):
            resp, err := http.Get(url)
            if err == nil && resp.StatusCode == 200 {
                resp.Body.Close()
                return nil
            }
        }
    }
    
    return appfault.New(
        ErrServerStartTimeout,
        "llama server failed to start within timeout",
    )
}
```

---

## 7.4 AI Chain Service (with RAG Integration)

The AI Chain Service orchestrates the multi-stage pipeline with RAG context injection at key stages.

```go
// internal/services/ai_chain_service.go
package services

import (
    stdctx "context"
)

type AIChainService struct {
    llamaManager    *LLaMAManager
    configService   *ConfigService
    ragService      *RAGService      // RAG integration
    artifactService *ArtifactService // Artifact management
    db              *gorm.DB
}

func NewAIChainService(
    llamaManager *LLaMAManager,
    configService *ConfigService,
    ragService *RAGService,
    artifactService *ArtifactService,
    db *gorm.DB,
) *AIChainService {
    return &AIChainService{
        llamaManager:    llamaManager,
        configService:   configService,
        ragService:      ragService,
        artifactService: artifactService,
        db:              db,
    }
}

// Stage 1: Voice Transcription
func (s *AIChainService) TranscribeAudio(context stdctx.Context, audioData []byte) appfault.Result[*TranscriptionResult] {
    configResult := s.configService.GetLLaMAConfig(context)
    if configResult.HasError() {
        return appfault.Fail[*TranscriptionResult](configResult.Error())
    }
    config := configResult.Value()
    
    // Send to Whisper endpoint
    url := fmt.Sprintf("http://%s:%d/inference", config.Host, config.Port)
    
    req, err := http.NewRequestWithContext(context, httpmethod.Post.String(), url, bytes.NewReader(audioData))
    if err != nil {
        return appfault.FailWrap[*TranscriptionResult](
            err,
            "failed to create transcription request",
        )
    }
    req.Header.Set("Content-Type", "audio/wav")
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return appfault.FailWrap[*TranscriptionResult](
            err,
            "transcription request failed",
        )
    }
    defer resp.Body.Close()
    
    var result TranscriptionResult
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return appfault.FailWrap[*TranscriptionResult](
            err,
            "failed to decode transcription result",
        )
    }
    
    return appfault.Ok(&result)
}

// Stage 2: RAG Context Retrieval (NEW)
// See: 16-rag-system.md for full retrieval pipeline
func (s *AIChainService) RetrieveRAGContext(context stdctx.Context, projectId, queryText string) appfault.Result[*RAGContextResult] {
    // Retrieve relevant chunks from indexed artifacts
    session, err := s.ragService.Retrieve(context, &RetrieveRequest{
        ProjectId:      projectId,
        QueryText:      queryText,
        TopK:           10,
        IncludePinned:  true,
        IncludeRecent:  true,
    })
    if err != nil {
        return appfault.Fail[*RAGContextResult](err)
    }
    
    // Format chunks for prompt injection
    var contextParts []string
    for _, chunk := range session.Chunks {
        contextParts = append(contextParts, fmt.Sprintf(
            "### From: %s (section: %s)\n%s",
            chunk.Artifact.RelativePath,
            chunk.SectionAnchor,
            chunk.Content,
        ))
    }
    
    return appfault.Ok(&RAGContextResult{
        SessionId:    session.Id,
        ContextText:  strings.Join(contextParts, "\n\n---\n\n"),
        ChunkCount:   len(session.Chunks),
        SourcePaths:  extractUniquePaths(session.Chunks),
    })
}

// Stage 3: Reasoning - Analyze and Generate Questions (with RAG context)
func (s *AIChainService) AnalyzeIntent(context stdctx.Context, req *AnalyzeRequest) appfault.Result[*AnalyzeResult] {
    config, _ := s.configService.GetLLaMAConfig(context)
    
    // Retrieve RAG context for grounded analysis
    ragResult := s.RetrieveRAGContext(context, req.ProjectId, req.Text)
    ragCtx := &RAGContextResult{ContextText: ""}
    if ragResult.IsOk() {
        ragCtx = ragResult.Value()
    }
    
    prompt := buildAnalysisPromptWithRAG(req.Text, req.ExistingSpecs, ragCtx.ContextText)
    
    responseResult := s.callLlm(context, config, prompt)
    if responseResult.IsError() {
        return appfault.Fail[*AnalyzeResult](responseResult.Error())
    }
    
    result, parseErr := parseAnalysisResponse(responseResult.Value())
    if parseErr != nil {
        return appfault.Fail[*AnalyzeResult](parseErr)
    }
    
    result.RAGSessionId = ragCtx.SessionId
    result.RAGChunkCount = ragCtx.ChunkCount
    
    return appfault.Ok(result)
}

// Stage 4: Generate Idea/Spec (with RAG context)
func (s *AIChainService) GenerateSpec(context stdctx.Context, req *GenerateRequest) appfault.Result[*GenerateResult] {
    config, _ := s.configService.GetLLaMAConfig(context)
    
    // Retrieve RAG context for grounded generation
    ragResult := s.RetrieveRAGContext(context, req.ProjectId, req.Intent)
    ragCtx := &RAGContextResult{ContextText: ""}
    if ragResult.IsOk() {
        ragCtx = ragResult.Value()
    }
    
    var prompt string
    switch req.OutputType {
    case "idea":
        prompt = buildIdeaPromptWithRAG(req.Intent, req.Answers, ragCtx.ContextText)
    case "02-spec":
        prompt = buildSpecPromptWithRAG(req.Intent, req.Answers, req.ProjectContext, ragCtx.ContextText)
    default:
        return appfault.FailNew[*GenerateResult](
            appfault.ErrValidation,
            fmt.Sprintf("unknown output type: %s", req.OutputType),
        )
    }
    
    responseResult := s.callLlm(context, config, prompt)
    if responseResult.IsError() {
        return appfault.Fail[*GenerateResult](responseResult.Error())
    }
    response := responseResult.Value()
    
    // Save as artifact and trigger reindex
    // See: 11-instruction-system.md for artifact lifecycle
    artifact, err := s.artifactService.SaveArtifact(context, &SaveArtifactRequest{
        ProjectId:    req.ProjectId,
        ArtifactType: req.OutputType,
        Content:      response,
        UserId:       req.UserId,
    })
    if err != nil {
        return appfault.Fail[*GenerateResult](err)
    }
    
    // Trigger RAG reindex for new artifact
    go s.ragService.TriggerReindex(stdctx.Background(), artifact.Id)
    
    return appfault.Ok(&GenerateResult{
        Content:      response,
        OutputType:   req.OutputType,
        ArtifactId:   artifact.Id,
        ArtifactPath: artifact.RelativePath,
        RAGSessionId: ragCtx.SessionId,
    })
}

// buildAnalysisPromptWithRAG injects RAG context into the analysis prompt
func buildAnalysisPromptWithRAG(text string, existingSpecs []string, ragContext string) string {
    var sb strings.Builder
    
    sb.WriteString("[INST] You are an expert specification analyst.\n\n")
    
    // Inject RAG context if available
    if ragContext != "" {
        sb.WriteString("## Relevant Context from Existing Specifications\n\n")
        sb.WriteString(ragContext)
        sb.WriteString("\n\n---\n\n")
    }
    
    sb.WriteString("## User Request\n\n")
    sb.WriteString(text)
    sb.WriteString("\n\n")
    
    sb.WriteString("## Task\n\n")
    sb.WriteString("1. Identify the user's intent\n")
    sb.WriteString("2. List any ambiguities that need clarification\n")
    sb.WriteString("3. Generate clarifying questions if needed\n")
    sb.WriteString("4. Reference relevant context from existing specs where applicable\n\n")
    
    sb.WriteString("Respond in JSON format. [/INST]")
    
    return sb.String()
}

// buildIdeaPromptWithRAG injects RAG context into idea generation
func buildIdeaPromptWithRAG(intent string, answers map[string]string, ragContext string) string {
    var sb strings.Builder
    
    sb.WriteString("[INST] You are a technical writer creating an idea document.\n\n")
    
    if ragContext != "" {
        sb.WriteString("## Related Context\n\n")
        sb.WriteString(ragContext)
        sb.WriteString("\n\n---\n\n")
    }
    
    sb.WriteString("## Intent\n\n")
    sb.WriteString(intent)
    sb.WriteString("\n\n")
    
    if len(answers) > 0 {
        sb.WriteString("## Clarifications\n\n")
        for q, a := range answers {
            sb.WriteString(fmt.Sprintf("- **%s**: %s\n", q, a))
        }
        sb.WriteString("\n")
    }
    
    sb.WriteString("Generate a well-structured idea document in Markdown format.\n")
    sb.WriteString("Include cross-references to related specs where appropriate. [/INST]")
    
    return sb.String()
}

// buildSpecPromptWithRAG injects RAG context into spec generation
func buildSpecPromptWithRAG(intent string, answers map[string]string, projectContext string, ragContext string) string {
    var sb strings.Builder
    
    sb.WriteString("[INST] You are a technical specification writer.\n\n")
    
    if ragContext != "" {
        sb.WriteString("## Relevant Existing Specifications\n\n")
        sb.WriteString(ragContext)
        sb.WriteString("\n\n---\n\n")
    }
    
    if projectContext != "" {
        sb.WriteString("## Project Context\n\n")
        sb.WriteString(projectContext)
        sb.WriteString("\n\n")
    }
    
    sb.WriteString("## Requirement\n\n")
    sb.WriteString(intent)
    sb.WriteString("\n\n")
    
    if len(answers) > 0 {
        sb.WriteString("## Clarifications\n\n")
        for q, a := range answers {
            sb.WriteString(fmt.Sprintf("- **%s**: %s\n", q, a))
        }
        sb.WriteString("\n")
    }
    
    sb.WriteString("Generate a complete technical specification in Markdown format.\n")
    sb.WriteString("Include:\n")
    sb.WriteString("- Version header\n")
    sb.WriteString("- Overview section\n")
    sb.WriteString("- Detailed requirements\n")
    sb.WriteString("- Cross-references to related specs (use [[path]] links)\n")
    sb.WriteString("- Acceptance criteria [/INST]")
    
    return sb.String()
}

// --- Typed Payload Structs (no interface{} or map[string]any) ---

// LLaMACompletionRequest is the typed request payload for LLaMA completion API
// EXEMPTED: llama.cpp /completion API request format
type LLaMACompletionRequest struct {
    Prompt      string   `json:"prompt"`
    NPredict    int      `json:"n_predict"`
    Temperature float64
    Stop        []string
}

// EnvelopeMetadata holds typed metadata for transport envelopes
type EnvelopeMetadata struct {
    UserId    string
    ProjectId string
}

// TransportLogContext holds typed context for transport debug logs
type TransportLogContext struct {
    Format  string
    Encoded string
}

func (s *AIChainService) callLlm(context stdctx.Context, config *LLaMAConfig, prompt string) appfault.Result[string] {
    url := fmt.Sprintf("http://%s:%d/completion", config.Host, config.Port)
    
    payload := LLaMACompletionRequest{
        Prompt:      prompt,
        NPredict:    2048,
        Temperature: 0.7,
        Stop:        []string{"</s>", "[INST]"},
    }
    
    body, _ := json.Marshal(payload)
    req, err := http.NewRequestWithContext(context, httpmethod.Post.String(), url, bytes.NewReader(body))
    if err != nil {
        return appfault.Fail[string](err)
    }
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return appfault.Fail[string](err)
    }
    defer resp.Body.Close()
    
    var result struct {
        Content string
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
...
// Types
type TranscriptionResult struct {
    Text       string
    Language   string
    Confidence float64
}

type RAGContextResult struct {
    SessionId   string
    ContextText string
    ChunkCount  int
    SourcePaths []string
}

type AnalyzeRequest struct {
    Text          string
    ProjectId     string
    ExistingSpecs []string
}

type AnalyzeResult struct {
    Intent       string
    Ambiguities  []string
    Questions   []Question
    Validated   bool
}

type Question struct {
    Id       string
    Text     string
    Type     string   // "text", "choice", "confirm"
    Options  []string `json:",omitempty"`
    Required bool
}

type GenerateRequest struct {
    Intent         string
    Answers        map[string]string
    OutputType     string // "idea" or "02-spec"
    ProjectContext string
}

type GenerateResult struct {
    Content    string
    OutputType string
}
```

---

## 7.5 Prompt Templates

```go
// internal/prompts/templates.go
package prompts

const AnalysisPromptTemplate = `[INST] You are an expert software architect analyzing a user's request to create a specification document.

User Request:
{{.Text}}

Existing Specifications (for context):
{{range .ExistingSpecs}}
- {{.}}
{{end}}

Your task:
1. Identify the core intent of the request
2. List any ambiguities or missing information
3. Generate clarifying questions to resolve ambiguities
4. Check if the request conflicts with existing specs

Respond in JSON format:
{
  "Intent": "concise description of what the user wants",
  "Ambiguities": ["list of unclear points"],
  "Questions": [
    {
      "Id": "q1",
      "Text": "question text",
      "Type": "text|choice|confirm",
      "Options": ["only for choice type"],
      "Required": true
    }
  ],
  "Validated": true/false
}
[/INST]`

const IdeaPromptTemplate = `[INST] You are an expert software architect creating an idea document.

User Intent: {{.Intent}}

User Answers to Clarifying Questions:
{{range $id, $answer := .Answers}}
- {{$id}}: {{$answer}}
{{end}}

Create a concise idea document in Markdown format following this structure:

# [Descriptive Title]

## Problem Statement
What problem does this solve?

## Proposed Solution
High-level description of the solution.

## Key Features
- Feature 1
- Feature 2
- ...

## Open Questions
Questions to resolve before detailed specification.

## Next Steps
What needs to happen next.
[/INST]`

const SpecPromptTemplate = `[INST] You are an expert software architect creating a detailed specification document.

User Intent: {{.Intent}}

User Answers:
{{range $id, $answer := .Answers}}
- {{$id}}: {{$answer}}
{{end}}

Project Context:
{{.ProjectContext}}

Create a detailed specification document in Markdown following the project's conventions:

1. Use numbered sections (## 1.1, ## 1.2, etc.)
2. Include code examples where relevant
3. Define data structures and interfaces
4. List acceptance criteria
5. Note dependencies on other specs

Be thorough but concise. Include implementation details.
[/INST]`
```

---

## 7.6 API Endpoints

### Model Registry Endpoints

```go
// GET /api/v1/ai/models
// List all models in registry
{
    "Success": true,
    "Data": {
        "Items": [
            {
                "Id": "uuid-1",
                "DisplayName": "Whisper Large V3",
                "FileName": "whisper-large-v3.gguf",
                "ModelType": "voice",
                "ModelPath": "/models/whisper-large-v3.gguf",
                "FileSizeBytes": 3094000000,
                "Tags": ["speech", "multilingual"],
                "IsEnabled": true,
                "ContextSize": null,
                "GpuLayers": null,
                "LastScannedAt": "2026-01-27T10:00:00Z"
            },
            {
                "Id": "uuid-2",
                "DisplayName": "Mixtral 8x7B Instruct",
                "FileName": "mixtral-8x7b-instruct.gguf",
                "ModelType": "reasoning",
                "ModelPath": "/models/mixtral-8x7b-instruct.gguf",
                "FileSizeBytes": 26000000000,
                "Tags": ["instruct", "large"],
                "IsEnabled": true
            }
        ],
        "Count": 2
    },
    "Error": null,
    "Meta": {}
}

// GET /api/v1/ai/models/{id}
// Get single model details
{
    "Success": true,
    "Data": {
        "Id": "uuid-1",
        "DisplayName": "Whisper Large V3",
        "FileName": "whisper-large-v3.gguf",
        "ModelType": "voice",
        ...
    }
}

// PUT /api/v1/ai/models/{id}
// Update model settings (display name, tags, enabled, overrides)
Request:
{
    "DisplayName": "Whisper Large V3 (Optimized)",
    "Tags": ["speech", "multilingual", "optimized"],
    "IsEnabled": true,
    "ContextSize": 4096,
    "GpuLayers": 20
}

// POST /api/v1/ai/models/scan
// Trigger model directory rescan
{
    "Success": true,
    "Data": {
        "Discovered": 5,
        "Added": 2,
        "Updated": 3,
        "Removed": 0
    }
}
```

### Model Slot Endpoints

```go
// GET /api/v1/ai/slots
// List all model slots and their status
{
    "Success": true,
    "Data": {
        "Items": [
            {
                "Id": "slot-uuid-1",
                "SlotIndex": 0,
                "Port": 8080,
                "ModelId": "uuid-1",
                "ModelName": "Whisper Large V3",
                "Status": "active",
                "StartedAt": "2026-01-27T08:00:00Z",
                "LastAccessedAt": "2026-01-27T12:30:00Z"
            },
            {
                "Id": "slot-uuid-2",
                "SlotIndex": 1,
                "Port": 8081,
                "ModelId": "uuid-2",
                "ModelName": "Mixtral 8x7B",
                "Status": "active",
                "StartedAt": "2026-01-27T09:15:00Z",
                "LastAccessedAt": "2026-01-27T12:28:00Z"
            },
            {
                "Id": "slot-uuid-3",
                "SlotIndex": 2,
                "Port": 8082,
                "ModelId": null,
                "ModelName": null,
                "Status": "idle"
            }
        ],
        "MaxConcurrentModels": 3,
        "ActiveCount": 2
    }
}

// POST /api/v1/ai/slots/request
// Request a model to be loaded, returns port when ready
Request:
{
    "ModelId": "uuid-2",
    "ProjectId": "project-uuid",  // optional: for project default resolution
    "InstructionOverride": false  // optional: if true, uses modelId directly
}

Response:
{
    "Success": true,
    "Data": {
        "SlotIndex": 1,
        "Port": 8081,
        "Status": "active",
        "WasAlreadyLoaded": true
    }
}

// POST /api/v1/ai/slots/{slotIndex}/unload
// Manually unload a model from a slot
{
    "Success": true,
    "Data": {
        "SlotIndex": 1,
        "PreviousModelId": "uuid-2",
        "Status": "idle"
    }
}

// GET /api/v1/ai/slots/{slotIndex}/health
// Health check for a specific slot
{
    "Success": true,
    "Data": {
        "SlotIndex": 1,
        "Port": 8081,
        "Healthy": true,
        "ResponseTimeMs": 45,
        "LastCheckedAt": "2026-01-27T12:35:00Z"
    }
}
```

### Model Selection Defaults Endpoints

```go
// GET /api/v1/ai/defaults
// Get current user's model defaults
{
    "success": true,
    "data": {
        "systemDefaults": {
            "reasoningModelId": "uuid-2",
            "voiceModelId": "uuid-1"
        },
        "userDefaults": {
            "reasoningModelId": "uuid-3",
            "voiceModelId": null
        },
        "resolved": {
            "reasoningModelId": "uuid-3",
            "reasoningModelName": "Llama 3 70B",
            "voiceModelId": "uuid-1",
            "voiceModelName": "Whisper Large V3"
        }
    }
}

// PUT /api/v1/ai/defaults/user
// Set user's default models
Request:
{
    "reasoningModelId": "uuid-3",
    "voiceModelId": "uuid-1"
}

// GET /api/v1/projects/{projectId}/ai-settings
// Get project-specific AI settings
{
    "success": true,
    "data": {
        "projectId": "project-uuid",
        "defaultReasoningModelId": "uuid-4",
        "defaultVoiceModelId": null,
        "instructionApprovalRequired": true
    }
}

// PUT /api/v1/projects/{projectId}/ai-settings
// Update project-specific AI settings
Request:
{
    "defaultReasoningModelId": "uuid-4",
    "defaultVoiceModelId": null,
    "instructionApprovalRequired": true
}
```

### Configuration Endpoints

```go
// GET /api/v1/ai/config
// Returns current LLaMA configuration
{
    "success": true,
    "data": {
        "serverPath": "/usr/local/bin/llama-server",
        "bindAddress": "127.0.0.1",
        "basePort": 8080,
        "portRangeStart": 8081,
        "portRangeEnd": 8089,
        "maxConcurrentModels": 3,
        "shellCommandTemplate": "{executable} --model {modelPath} --host {host} --port {port} ...",
        "modelRootPaths": ["/models", "/models-extra"],
        "contextSize": 8192,
        "gpuLayers": 35
    }
}

// PUT /api/v1/ai/config
// Update LLaMA configuration
Request:
{
    "maxConcurrentModels": 4,
    "contextSize": 16384
}
```

### AI Chain Endpoints

```go
// POST /api/v1/ai/transcribe
// Transcribe audio to text
Request: multipart/form-data with "audio" file
Response:
{
    "success": true,
    "data": {
        "text": "I want to create a new feature for user authentication...",
        "language": "en",
        "confidence": 0.95
    }
}

// POST /api/v1/ai/analyze
// Analyze intent and generate questions
Request:
{
    "text": "I want to add OAuth support to the authentication system",
    "existingSpecs": ["02-spec/auth/01-overview.md", "02-spec/auth/02-login.md"]
}

Response:
{
    "success": true,
    "data": {
        "intent": "Add OAuth 2.0 authentication providers",
        "ambiguities": [
            "Which OAuth providers to support?",
            "Should existing password auth be kept?"
        ],
        "questions": [
            {
                "id": "q1",
                "text": "Which OAuth providers should be supported?",
                "type": "choice",
                "options": ["Google", "GitHub", "Microsoft", "All of the above"],
                "required": true
            },
            {
                "id": "q2",
                "text": "Should password authentication remain as a fallback?",
                "type": "confirm",
                "required": true
            }
        ],
        "validated": true
    }
}

// POST /api/v1/ai/generate
// Generate idea or spec document
Request:
{
    "intent": "Add OAuth 2.0 authentication providers",
    "answers": {
        "q1": "All of the above",
        "q2": "true"
    },
    "outputType": "02-spec",
    "projectContext": "spec/auth"
}

Response:
{
    "success": true,
    "data": {
        "content": "# OAuth Integration\n\n## 1.1 Overview\n...",
        "outputType": "02-spec"
    }
}

// POST /api/v1/ai/generate/stream
// Stream generation for real-time display
// Returns Server-Sent Events
```

---

## 7.7 Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 7001 | `ErrLlamaNotRunning` | 500 | LLaMA server not running |
| 7002 | `ErrModelFileNotFound` | 404 | Model file not found on disk |
| 7003 | `ErrAudioInvalidFormat` | 400 | Invalid audio format for transcription |
| 7004 | `ErrTranscriptionFailed` | 500 | Voice transcription failed |
| 7005 | `ErrGenerationFailed` | 500 | Text generation failed |
| 7006 | `ErrServerStartTimeout` | 500 | Server start exceeded timeout |
| 7007 | `ErrInvalidModelType` | 400 | Invalid model type (not 'reasoning' or 'voice') |
| 7008 | `ErrServerBusy` | 503 | Server busy (model loading) |
| 7009 | `ErrAllSlotsFull` | 503 | All model slots occupied |
| 7010 | `ErrModelLoadFailed` | 500 | Failed to load model into slot |
| 7011 | `ErrModelNotInRegistry` | 404 | Model ID not found in registry |
| 7012 | `ErrSlotNotFound` | 404 | Slot index not found |
| 7013 | `ErrHealthCheckFailed` | 500 | Model health check failed |
| 7014 | `ErrModelScanFailed` | 500 | Failed to scan model directories |

---

## 7.8 Acceptance Criteria

### Model Registry
- [ ] Models discovered from configured root paths
- [ ] Model type inferred from filename patterns
- [ ] Registry syncs on startup (when mode = onStartup)
- [ ] Manual scan triggers rescan of all paths
- [ ] Model enable/disable prevents selection
- [ ] Model-specific context/GPU overrides work

### Model Selection
- [ ] Per-instruction override has highest priority
- [ ] Per-project default used when no override
- [ ] Per-user default used when no project default
- [ ] System default used as final fallback
- [ ] Resolution returns first enabled model if no defaults set

### Multi-Model Slots
- [ ] Slots initialized on server startup
- [ ] Request model loads into available slot
- [ ] Already-loaded model returns port immediately
- [ ] LRU eviction when slots full
- [ ] Health checks detect crashed models
- [ ] Slot unload gracefully stops process

### API Endpoints
- [ ] All model registry CRUD operations work
- [ ] Slot status reflects actual process state
- [ ] Model request blocks until ready
- [ ] Default model settings persist correctly
- [ ] Project AI settings stored and retrieved

### AI Chain
- [ ] Voice transcription works with voice model
- [ ] Analysis generates clarifying questions
- [ ] Generation produces valid Markdown
- [ ] Streaming generation works
- [ ] Model selection hierarchy applied to chain requests

---

## 7.15 Transport Format Service

The Transport Format Service handles serialization/deserialization of AI request/response payloads in configurable formats.

### Supported Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| `json` | `.json` | Default, structured API communication |
| `yaml` | `.yaml` | Human-readable, good for prompts with multiline content |
| `toml` | `.toml` | Configuration-style, clear key-value separation |
| `markdown` | `.md` | Documentation-friendly, rendered prompts/responses |
| `file` | varies | Large payloads, audit trail, batch processing |

### Transport Envelope

All formats use a common envelope structure:

```go
// internal/models/transport_envelope.go
package models

import "time"

type TransportEnvelope struct {
    RequestId    string                 `yaml:"requestId" toml:"request_id"`
    Timestamp    time.Time              `yaml:"timestamp" toml:"timestamp"`
    ModelId      string                 `yaml:"modelId" toml:"model_id"`
    SlotPort     int                    `json:",omitempty" yaml:"slotPort,omitempty" toml:"slot_port,omitempty"`
    Format       string                 `yaml:"format" toml:"format"`
    Direction    string                 `yaml:"direction" toml:"direction"` // "request" or "response"
    ContentType  string                 `yaml:"contentType" toml:"content_type"`
    Payload      any                    `yaml:"payload" toml:"payload"` // ALLOWED: polymorphic transport – holds AIRequest or AIResponse
    Metadata     *EnvelopeMetadata      `json:",omitempty" yaml:"metadata,omitempty" toml:"metadata,omitempty"`
}

type AIRequest struct {
    Prompt       string                 `yaml:"prompt" toml:"prompt"`
    SystemPrompt string                 `json:",omitempty" yaml:"systemPrompt,omitempty" toml:"system_prompt,omitempty"`
    MaxTokens    int                    `json:",omitempty" yaml:"maxTokens,omitempty" toml:"max_tokens,omitempty"`
    Temperature  float64                `json:",omitempty" yaml:"temperature,omitempty" toml:"temperature,omitempty"`
    Context      []ContextChunk         `json:",omitempty" yaml:"context,omitempty" toml:"context,omitempty"`
}

type AIResponse struct {
    Content      string                 `yaml:"content" toml:"content"`
    TokensUsed   TokenUsage             `yaml:"tokensUsed" toml:"tokens_used"`
    FinishReason string                 `yaml:"finishReason" toml:"finish_reason"`
    Duration     int64                  `yaml:"durationMs" toml:"duration_ms"`
}

type TokenUsage struct {
    Prompt     int `yaml:"prompt" toml:"prompt"`
    Completion int `yaml:"completion" toml:"completion"`
    Total      int `yaml:"total" toml:"total"`
}
```

### Transport Format Service Implementation

```go
// internal/services/transport_format_service.go
package services

import (
    "bytes"
    "encoding/json"
    "fmt"
    "os"
    "path/filepath"
    "strings"
    "text/template"
    "time"

    "github.com/BurntSushi/toml"
    "gopkg.in/yaml.v3"
)

type TransportFormat string

const (
    FormatJson     TransportFormat = "json"
    FormatYaml     TransportFormat = "yaml"
    FormatToml     TransportFormat = "toml"
    FormatMarkdown TransportFormat = "markdown"
    FormatFile     TransportFormat = "file"
)

type TransportFormatService struct {
    configService *ConfigService
    format        TransportFormat
    outputDir     string
    prettyPrint   bool
    mdTemplates   map[string]*template.Template
}

func NewTransportFormatService(configService *ConfigService) appfault.Result[*TransportFormatService] {
    context := stdctx.Background()
    
    format, _ := configService.GetConfig(context, "ai.transport.format")
    outputDir, _ := configService.GetConfig(context, "ai.transport.fileOutputDir")
    prettyPrint, _ := configService.GetConfigAsBool(context, "ai.transport.prettyPrint")
    
    svc := &TransportFormatService{
        configService: configService,
        format:        TransportFormat(format),
        outputDir:     outputDir,
        prettyPrint:   prettyPrint,
        mdTemplates:   make(map[string]*template.Template),
    }
    
    // Load Markdown templates
    if err := svc.loadMarkdownTemplates(); err != nil {
        return appfault.Fail[*TransportFormatService](err)
    }
    
    return appfault.Ok(svc)
}

// Encode serializes data to configured format
func (s *TransportFormatService) Encode(envelope *TransportEnvelope) appfault.Result[[]byte] {
    switch s.format {
    case FormatJson:
        return s.encodeJson(envelope)
    case FormatYaml:
        return s.encodeYaml(envelope)
    case FormatToml:
        return s.encodeToml(envelope)
    case FormatMarkdown:
        return s.encodeMarkdown(envelope)
    case FormatFile:
        return s.encodeToFile(envelope)
    default:
        return s.encodeJson(envelope)
    }
}

// Decode deserializes data from configured format
func (s *TransportFormatService) Decode(data []byte, envelope *TransportEnvelope) error {
    switch s.format {
    case FormatJson:
        return json.Unmarshal(data, envelope)
    case FormatYaml:
        return yaml.Unmarshal(data, envelope)
    case FormatToml:
        return toml.Unmarshal(data, envelope)
    case FormatMarkdown:
        return s.decodeMarkdown(data, envelope)
    case FormatFile:
        return s.decodeFromFile(data, envelope)
    default:
        return json.Unmarshal(data, envelope)
    }
}

func (s *TransportFormatService) encodeJson(envelope *TransportEnvelope) appfault.Result[[]byte] {
    if s.prettyPrint {
        data, err := json.MarshalIndent(envelope, "", "  ")
        if err != nil {
            return appfault.Fail[[]byte](err)
        }

        return appfault.Ok(data)
    }

    data, err := json.Marshal(envelope)
    if err != nil {
        return appfault.Fail[[]byte](err)
    }

    return appfault.Ok(data)
}

func (s *TransportFormatService) encodeYaml(envelope *TransportEnvelope) appfault.Result[[]byte] {
    data, err := yaml.Marshal(envelope)
    if err != nil {
        return appfault.Fail[[]byte](err)
    }

    return appfault.Ok(data)
}

func (s *TransportFormatService) encodeTOML(envelope *TransportEnvelope) appfault.Result[[]byte] {
    var buf bytes.Buffer
    encoder := toml.NewEncoder(&buf)
    if err := encoder.Encode(envelope); err != nil {
        return appfault.Fail[[]byte](err)
    }

    return appfault.Ok(buf.Bytes())
}

func (s *TransportFormatService) encodeMarkdown(envelope *TransportEnvelope) appfault.Result[[]byte] {
    templateName, _ := s.configService.GetConfig(stdctx.Background(), "ai.transport.markdownTemplate")
    if templateName == "" {
        templateName = "default"
    }
    
    tmpl, ok := s.mdTemplates[templateName]
    if !ok {
        tmpl = s.mdTemplates["default"]
    }
    
    var buf bytes.Buffer
    if err := tmpl.Execute(&buf, envelope); err != nil {
        return appfault.Fail[[]byte](err)
    }

    return appfault.Ok(buf.Bytes())
}

func (s *TransportFormatService) encodeToFile(envelope *TransportEnvelope) appfault.Result[[]byte] {
    // Ensure output directory exists
    if err := pathutil.EnsureDir(s.outputDir, 0755); err != nil {
        return appfault.Fail[[]byte](err)
    }
    
    // Generate filename: {requestId}_{direction}_{timestamp}.json
    filename := fmt.Sprintf("%s_%s_%d.json",
        envelope.RequestId,
        envelope.Direction,
        envelope.Timestamp.UnixMilli(),
    )
    filepath := filepath.Join(s.outputDir, filename)
    
    // Write JSON content to file
    content, err := json.MarshalIndent(envelope, "", "  ")
    if err != nil {
        return appfault.Fail[[]byte](err)
    }
    
    if err := pathutil.WriteFile(filepath, content, 0644); err != nil {
        return appfault.Fail[[]byte](err)
    }
    
    // Return file path reference
    return appfault.Ok([]byte(filepath))
}

func (s *TransportFormatService) decodeFromFile(data []byte, envelope *TransportEnvelope) error {
    filepath := strings.TrimSpace(string(data))
    content, err := pathutil.ReadFile(filepath)
    if err != nil {
        return err
    }
    return json.Unmarshal(content, envelope)
}

func (s *TransportFormatService) decodeMarkdown(data []byte, envelope *TransportEnvelope) error {
    // Parse Markdown with YAML frontmatter
    content := string(data)
    
    if strings.HasPrefix(content, "---") {
        parts := strings.SplitN(content, "---", 3)
        if len(parts) >= 3 {
            // Parse YAML frontmatter
            if err := yaml.Unmarshal([]byte(parts[1]), envelope); err != nil {
                return err
            }
            // Body becomes payload content
            if req, ok := envelope.Payload.(*AIRequest); ok {
                req.Prompt = strings.TrimSpace(parts[2])
            }
        }
    }
    return nil
}

func (s *TransportFormatService) loadMarkdownTemplates() error {
    s.mdTemplates["default"] = template.Must(template.New("default").Parse(`---
requestId: {{.RequestId}}
timestamp: {{.Timestamp.Format "2006-01-02T15:04:05Z07:00"}}
modelId: {{.ModelId}}
direction: {{.Direction}}
---

# AI {{if eq .Direction "request"}}Request{{else}}Response{{end}}

{{if eq .Direction "request"}}
## System Prompt
{{with .Payload}}{{.SystemPrompt}}{{end}}

## User Prompt
{{with .Payload}}{{.Prompt}}{{end}}

{{if .Payload.Context}}
## Context
{{range .Payload.Context}}
- **{{.Source}}**: {{.Content | truncate 200}}
{{end}}
{{end}}
{{else}}
## Response Content
{{with .Payload}}{{.Content}}{{end}}

## Token Usage
- Prompt: {{with .Payload}}{{.TokensUsed.Prompt}}{{end}}
- Completion: {{with .Payload}}{{.TokensUsed.Completion}}{{end}}
- Total: {{with .Payload}}{{.TokensUsed.Total}}{{end}}
{{end}}
`))

    s.mdTemplates["minimal"] = template.Must(template.New("minimal").Parse(`# {{.Direction}} | {{.RequestId}}
{{with .Payload}}{{if eq $.Direction "request"}}{{.Prompt}}{{else}}{{.Content}}{{end}}{{end}}
`))

    s.mdTemplates["verbose"] = template.Must(template.New("verbose").Parse(`---
requestId: {{.RequestId}}
timestamp: {{.Timestamp.Format "2006-01-02T15:04:05Z07:00"}}
modelId: {{.ModelId}}
slotPort: {{.SlotPort}}
format: {{.Format}}
direction: {{.Direction}}
contentType: {{.ContentType}}
metadata: {{.Metadata | toJson}}
---

# AI {{.Direction | title}} Details

## Envelope Metadata
| Field | Value |
|-------|-------|
| Request ID | {{.RequestId}} |
| Timestamp | {{.Timestamp}} |
| Model ID | {{.ModelId}} |
| Slot Port | {{.SlotPort}} |
| Format | {{.Format}} |

{{if eq .Direction "request"}}
## System Prompt
\`\`\`
{{with .Payload}}{{.SystemPrompt}}{{end}}
\`\`\`

## User Prompt
\`\`\`
{{with .Payload}}{{.Prompt}}{{end}}
\`\`\`

## Parameters
- Max Tokens: {{with .Payload}}{{.MaxTokens}}{{end}}
- Temperature: {{with .Payload}}{{.Temperature}}{{end}}

{{if .Payload.Context}}
## RAG Context Chunks
{{range $i, $chunk := .Payload.Context}}
### Chunk {{$i}}
- Source: {{$chunk.Source}}
- Score: {{$chunk.Score}}

\`\`\`
{{$chunk.Content}}
\`\`\`
{{end}}
{{end}}
{{else}}
## Response Content
\`\`\`
{{with .Payload}}{{.Content}}{{end}}
\`\`\`

## Execution Details
| Metric | Value |
|--------|-------|
| Duration | {{with .Payload}}{{.Duration}}ms{{end}} |
| Finish Reason | {{with .Payload}}{{.FinishReason}}{{end}} |
| Prompt Tokens | {{with .Payload}}{{.TokensUsed.Prompt}}{{end}} |
| Completion Tokens | {{with .Payload}}{{.TokensUsed.Completion}}{{end}} |
| Total Tokens | {{with .Payload}}{{.TokensUsed.Total}}{{end}} |
{{end}}
`))

    return nil
}

// GetFormat returns current configured format
func (s *TransportFormatService) GetFormat() TransportFormat {
    return s.format
}

// SetFormat updates format at runtime (persists to DB)
func (s *TransportFormatService) SetFormat(context stdctx.Context, format TransportFormat) error {
    if err := s.configService.SetConfig(context, "ai.transport.format", string(format)); err != nil {
        return err
    }
    s.format = format
    return nil
}

// CleanupOldFiles removes transport files older than retention period
func (s *TransportFormatService) CleanupOldFiles(context stdctx.Context) appfault.Result[int] {
    retentionHours, _ := s.configService.GetConfigAsInt(context, "ai.transport.fileRetentionHours")
    if retentionHours == 0 {
        retentionHours = 24
    }
    
    cutoff := time.Now().Add(-time.Duration(retentionHours) * time.Hour)
    deleted := 0
    
    entries, err := os.ReadDir(s.outputDir)
    if err != nil {
        return appfault.Fail[int](err)
    }
    
    for _, entry := range entries {
        info, _ := entry.Info()
        if info.ModTime().Before(cutoff) {
            pathutil.Remove(filepath.Join(s.outputDir, entry.Name()))
            deleted++
        }
    }
    
    return appfault.Ok(deleted)
}
```

### Format Selection in AI Chain

```go
// Example: Using TransportFormatService in AI requests
func (s *AIService) GenerateWithTransport(context stdctx.Context, req *AIRequest) appfault.Result[*AIResponse] {
    transportSvc := s.transportFormatService
    
    // Create request envelope
    requestEnvelope := &TransportEnvelope{
        RequestId:   generateRequestId(),
        Timestamp:   time.Now(),
        ModelId:     s.currentModel.Id,
        SlotPort:    s.currentSlot.Port,
        Format:      string(transportSvc.GetFormat()),
        Direction:   "request",
        ContentType: "ai/chat",
        Payload:     req,
        Metadata: &EnvelopeMetadata{
            UserId:    ctxutil.GetUserId(context),
            ProjectId: ctxutil.GetProjectId(context),
        },
    }
    
    // Encode for logging/audit
    encodeResult := transportSvc.Encode(requestEnvelope)
    if encodeResult.IsError() {
        return appfault.Fail[*AIResponse](encodeResult.Error())
    }
    encoded := encodeResult.Value()

    s.logger.Debug("AI Request", TransportLogContext{
        Format:  string(transportSvc.GetFormat()),
        Encoded: string(encoded),
    })
    
    // Execute AI call...
    response, err := s.executeAICall(context, req)
    if err != nil {
        return appfault.Fail[*AIResponse](err)
    }
    
    // Create response envelope
    responseEnvelope := &TransportEnvelope{
        RequestId:   requestEnvelope.RequestId,
        Timestamp:   time.Now(),
        ModelId:     s.currentModel.Id,
        SlotPort:    s.currentSlot.Port,
        Format:      string(transportSvc.GetFormat()),
        Direction:   "response",
        ContentType: "ai/chat",
        Payload:     response,
    }
    
    // Encode for logging/audit
    respEncodeResult := transportSvc.Encode(responseEnvelope)
    if respEncodeResult.IsOk() {
        s.logger.Debug("AI Response", TransportLogContext{
            Format:  string(transportSvc.GetFormat()),
            Encoded: string(respEncodeResult.Value()),
        })
    }
    
    return appfault.Ok(response)
}
```

---

## 7.16 Acceptance Criteria (Transport Format)

- [ ] JSON format encodes/decodes correctly with optional pretty-print
- [ ] YAML format preserves multiline strings properly
- [ ] TOML format uses snake_case keys as per TOML convention
- [ ] Markdown format renders human-readable documents with frontmatter
- [ ] File format writes to configured directory with proper naming
- [ ] File cleanup job removes files older than retention period
- [ ] Format can be changed at runtime via API
- [ ] All formats include metadata when `includeMetadata` is enabled
- [ ] Markdown templates (default, minimal, verbose) render correctly

---

## Related Specs

- [Backend Overview](./00-overview.md)
- [RAG System](../09-knowledge-memory/01-rag-system.md) - Context retrieval for grounded generation
- [Instruction System](./03-instruction-system.md) - Idea promotion and artifact lifecycle
- [Database Schema](../../07-database-design/01-schema.md)
- [Path Manager](../02-file-management/02-path-manager.md) - Artifact path handling
- [Voice Input](../05-voice-input/00-overview.md)
- [AI Chat UI](./08-ai-chat-ui.md)
