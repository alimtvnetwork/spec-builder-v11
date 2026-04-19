# Core Architecture

**Version:** 2.0.0  
**Status:** Draft  
**Created:** 2026-03-09  

---

## Overview

The Spec Reverse CLI is a command-line tool that analyzes existing codebases and generates structured specifications. It uses AI Bridge for intelligent spec generation and follows the Split DB architecture for data storage.

**Cross-References:**
- [Spec Reverse CLI Overview](../00-overview.md)
- [Code Analysis Engine](./02-code-analysis.md)
- [AI Bridge Integration](./03-ai-bridge-integration.md)
- [Split DB Architecture](../../06-split-db-architecture/00-overview.md)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPEC REVERSE CLI                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   CLI       │────▶│   Analysis  │────▶│   AI        │                   │
│   │   Commands  │     │   Engine    │     │   Bridge    │                   │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   Config    │     │   Symbol    │     │   Spec      │                   │
│   │   Manager   │     │   Store     │     │   Generator │                   │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│         │                   │                   │                           │
│         └───────────────────┴───────────────────┘                           │
│                             │                                                │
│                             ▼                                                │
│                    ┌─────────────────┐                                      │
│                    │   Split DB      │                                      │
│                    │   (SQLite)      │                                      │
│                    └─────────────────┘                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
spec-reverse-cli/
├── cmd/
│   ├── root.go                 # Cobra root command
│   ├── analyze.go              # `src analyze <path>` command
│   ├── generate.go             # `src generate` command
│   ├── ingest.go               # `src ingest` command (RAG)
│   ├── query.go                # `src query` command (RAG search)
│   └── version.go              # Version info
├── internal/
│   ├── analysis/               # Code analysis engine
│   │   ├── discovery.go        # File discovery
│   │   ├── language_detector.go
│   │   ├── ast_parser.go       # AST parsing (per-language)
│   │   ├── symbol_extractor.go # Symbol extraction
│   │   ├── pattern_analyzer.go # Architecture patterns
│   │   └── pipeline.go         # Analysis pipeline
│   ├── aibridge/               # AI Bridge client
│   │   ├── client.go           # HTTP client
│   │   ├── prompts.go          # System prompts
│   │   ├── prompt_builder.go   # Prompt construction
│   │   ├── rag_loader.go       # RAG context loading
│   │   └── response_parser.go  # Parse LLM responses
│   ├── generator/              # Spec generation
│   │   ├── spec_generator.go   # Main generator
│   │   ├── template_simple.go  # Simple (CLI) format
│   │   ├── template_complex.go # Complex (SM) format
│   │   └── output_writer.go    # File output
│   ├── config/                 # Configuration
│   │   ├── config.go           # Config loading
│   │   └── defaults.go         # Default values
│   ├── models/                 # GORM models
│   │   ├── analysis.go         # Analysis results
│   │   ├── symbol.go           # Extracted symbols
│   │   └── spec.go             # Generated specs
│   └── errors/                 # Error handling
│       └── codes.go            # Error codes (11xxx)
├── pkg/
│   └── shared/                 # Shared utilities
│       ├── dbutil/             # Database helpers
│       ├── configutil/         # Config helpers
│       └── errorutil/          # Error helpers
├── configs/
│   ├── seeding-src.json        # Default config values
│   └── changelog.json          # Config migrations
├── go.mod
├── go.sum
└── main.go
```

---

## 3. CLI Commands

### 3.1 Command Overview

| Command | Description | Example |
|---------|-------------|---------|
| `src analyze` | Analyze a codebase | `src analyze ./my-project` |
| `src generate` | Generate specs from analysis | `src generate --format complex` |
| `src ingest` | Ingest files into RAG | `src ingest ./codebase --recursive` |
| `src query` | Query RAG knowledge | `src query "authentication"` |
| `src version` | Show version info | `src version` |

### 3.2 Analyze Command

```go
// cmd/analyze.go
package cmd

import (
    "github.com/spf13/cobra"
)

var analyzeCmd = &cobra.Command{
    Use:   "analyze <path>",
    Short: "Analyze a codebase and extract symbols",
    Long: `Analyze a codebase to extract entities, services, handlers, 
and architectural patterns. Results are stored in the database 
for subsequent spec generation.`,
    Args: cobra.ExactArgs(1),
    RunE: runAnalyze,
}

func init() {
    rootCmd.AddCommand(analyzeCmd)
    
    analyzeCmd.Flags().StringSliceP("include", "i", []string{}, "Include patterns (e.g., *.go)")
    analyzeCmd.Flags().StringSliceP("exclude", "e", []string{"node_modules", "vendor"}, "Exclude patterns")
    analyzeCmd.Flags().BoolP("recursive", "r", true, "Analyze recursively")
    analyzeCmd.Flags().Int64("max-file-size", 1048576, "Max file size in bytes (default 1MB)")
}

func runAnalyze(cmd *cobra.Command, args []string) error {
    rootPath := args[0]
    
    // Load config
    cfg, err := config.Load()
    if err != nil {
        return NewError(SRC_ERR_CONFIG, err.Error())
    }
    
    // Create analysis pipeline
    pipeline := analysis.NewPipeline(rootPath, &analysis.AnalysisConfig{
        IncludePatterns: mustGetStringSlice(cmd, "include"),
        ExcludePatterns: mustGetStringSlice(cmd, "exclude"),
        MaxFileSize:     mustGetInt64(cmd, "max-file-size"),
    })
    
    // Run analysis
    result, err := pipeline.Run(cmd.Context())
    if err != nil {
        return err
    }
    
    // Store result
    db, _ := dbutil.Open(cfg.DatabasePath)
    if err := db.Create(result).Error; err != nil {
        return NewError(SRC_ERR_DB, err.Error())
    }
    
    // Output summary
    fmt.Printf("✓ Analyzed %d files in %s\n", result.FileCount, result.Duration)
    fmt.Printf("  Language: %s (%s)\n", result.Language.Language, result.Language.Framework)
    fmt.Printf("  Entities: %d\n", len(result.Symbols.Entities))
    fmt.Printf("  Services: %d\n", len(result.Symbols.Services))
    fmt.Printf("  Handlers: %d\n", len(result.Symbols.Handlers))
    
    return nil
}
```

### 3.3 Generate Command

```go
// cmd/generate.go
package cmd

var generateCmd = &cobra.Command{
    Use:   "generate",
    Short: "Generate specifications from analysis results",
    Long: `Generate structured specifications from previously analyzed code.
Supports two output formats:
  - simple: CLI-style minimal folder structure
  - complex: SM-style comprehensive documentation`,
    RunE: runGenerate,
}

func init() {
    rootCmd.AddCommand(generateCmd)
    
    generateCmd.Flags().StringP("format", "f", "simple", "Output format (simple|complex)")
    generateCmd.Flags().StringP("output", "o", "./specs", "Output directory")
    generateCmd.Flags().StringP("analysis-id", "a", "", "Specific analysis ID (default: latest)")
    generateCmd.Flags().Bool("dry-run", false, "Preview without writing files")
}

func runGenerate(cmd *cobra.Command, args []string) error {
    format := mustGetString(cmd, "format")
    outputDir := mustGetString(cmd, "output")
    
    // Load latest analysis
    db, _ := dbutil.Open(cfg.DatabasePath)
    var result models.AnalysisResult
    if err := db.Order("created_at DESC").First(&result).Error; err != nil {
        return NewError(SRC_ERR_NO_ANALYSIS, "No analysis results found")
    }
    
    // Create AI Bridge client
    client := aibridge.NewClient(&aibridge.AiBridgeConfig{
        BaseUrl:     cfg.AIBridge.Url,
        Model:       cfg.AIBridge.Model,
        Temperature: cfg.AIBridge.Temperature,
    })
    
    // Load RAG context
    ragLoader := aibridge.NewRagLoader(db, client)
    ragContext, _ := ragLoader.LoadKnowledge([]aibridge.KnowledgeCategory{
        aibridge.KnowledgeSplitDb,
        aibridge.KnowledgeSeedable,
        aibridge.KnowledgeErrorCodes,
    })
    
    // Generate specs
    gen := generator.New(client, &generator.Config{
        Format:     generator.Format(format),
        OutputDir:  outputDir,
        RAGContext: ragContext,
    })
    
    specs, err := gen.Generate(cmd.Context(), &result)
    if err != nil {
        return err
    }
    
    // Write output
    if !mustGetBool(cmd, "dry-run") {
        if err := gen.Write(specs); err != nil {
            return err
        }
    }
    
    fmt.Printf("✓ Generated %d spec files\n", len(specs))
    return nil
}
```

---

## 4. Data Models

> **Enum Reference:** All enum types below are defined in [`12-enum-architecture.md`](./12-enum-architecture.md).

### 4.1 Analysis Result

```go
// internal/models/analysis.go
package models

import (
    "time"
    "gorm.io/gorm"
    "spec-reverse-cli/internal/enums/languagetype"
    "spec-reverse-cli/internal/enums/frameworktype"
    "spec-reverse-cli/internal/enums/symboltype"
    "spec-reverse-cli/internal/enums/severitytype"
)

type AnalysisResult struct {
    ID           string             `gorm:"primaryKey"`
    RootPath     string             `gorm:"not null"`
    Language     language.Variant   `gorm:"not null"`
    Framework    framework.Variant
    FileCount    int
    LineCount    int
    Architecture string
    Confidence   float64
    Duration     int64          // Nanoseconds
    CreatedAt    time.Time
    UpdatedAt    time.Time
    DeletedAt    gorm.DeletedAt `gorm:"index"`
    
    // Relationships
    Symbols      []ExtractedSymbol `gorm:"foreignKey:AnalysisId"`
    Issues       []AnalysisIssue   `gorm:"foreignKey:AnalysisId"`
}

type ExtractedSymbol struct {
    ID         string              `gorm:"primaryKey"`
    AnalysisId string              `gorm:"index;not null"`
    Type       symbol_type.Variant `gorm:"not null"`
    Name       string              `gorm:"not null"`
    Source     string              // File path
    Metadata   string              // JSON
    CreatedAt  time.Time
}

type AnalysisIssue struct {
    ID         string           `gorm:"primaryKey"`
    AnalysisId string           `gorm:"index;not null"`
    Severity   severity.Variant
    Message    string
    FilePath   string
    LineNum    int
    CreatedAt  time.Time
}
```

### 4.2 Generated Spec

```go
// internal/models/spec.go
package models

type GeneratedSpec struct {
    ID           string                `gorm:"primaryKey"`
    AnalysisId   string                `gorm:"index;not null"`
    Title        string                `gorm:"not null"`
    SpecType     spec_type.Variant     // Uses spec_type enum
    Format       output_format.Variant // Uses output_format enum
    OutputPath   string
    Content      string                // Full Markdown
    Version      string
    Status       string
    TokensUsed   int
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

---

## 5. Configuration

### 5.1 Seedable Config

```json
// configs/seeding-src.json
{
  "Version": "1.0.0",
  "Values": {
    "Src.Database.Path": "./src.db",
    "Src.AiBridge.Url": "http://localhost:5040",
    "Src.AiBridge.Model": "llama3",
    "Src.AiBridge.Temperature": 0.7,
    "Src.AiBridge.MaxTokens": 4096,
    "Src.AiBridge.Timeout": 120,
    "Src.Analysis.MaxFileSize": 1048576,
    "Src.Analysis.ExcludePatterns": ["node_modules", "vendor", ".git", "dist", "build"],
    "Src.Output.DefaultFormat": "simple",
    "Src.Rag.Enabled": true,
    "Src.Rag.ChunkLimit": 10
  }
}
```

### 5.2 Config Loader

```go
// internal/config/config.go
package config

type Config struct {
    DatabasePath string
    AIBridge     AIBridgeConfig
    Analysis     AnalysisConfig
    Output       OutputConfig
    RAG          RAGConfig
}

type AIBridgeConfig struct {
    Url         string
    Model       string
    Temperature float64
    MaxTokens   int
    Timeout     int
}

type AnalysisConfig struct {
    MaxFileSize     int64
    ExcludePatterns []string
}

type OutputConfig struct {
    DefaultFormat string
}

type RAGConfig struct {
    Enabled    bool
    ChunkLimit int
}

func Load() apperror.Result[*Config] {
    // Load from seedable config pattern
    db, err := dbutil.Open(getDbPath())
    if err != nil {
        return nil, err
    }
    
    cfg := &Config{}
    
    // Load each config key
    cfg.DatabasePath = configutil.GetString(db, "Src.Database.Path", "./src.db")
    cfg.AIBridge.Url = configutil.GetString(db, "Src.AiBridge.Url", "http://localhost:5040")
    cfg.AIBridge.Model = configutil.GetString(db, "Src.AiBridge.Model", "llama3")
    cfg.AIBridge.Temperature = configutil.GetFloat(db, "Src.AiBridge.Temperature", 0.7)
    cfg.AIBridge.MaxTokens = configutil.GetInt(db, "Src.AiBridge.MaxTokens", 4096)
    cfg.AIBridge.Timeout = configutil.GetInt(db, "Src.AiBridge.Timeout", 120)
    
    return cfg, nil
}
```

---

## 6. Error Codes

| Range | Category | Description |
|-------|----------|-------------|
| 11000-11099 | General | Startup, CLI, general errors |
| 11100-11199 | Analysis | File discovery, parsing, extraction |
| 11200-11299 | AI Bridge | Connection, request, response |
| 11300-11399 | Generation | Spec generation, templating |
| 11400-11499 | Output | File writing, formatting |

### 6.1 Error Code Registry

```go
// internal/errors/codes.go
package errors

const (
    // General (11000-11099)
    SRC_ERR_CONFIG        = 11000
    SRC_ERR_DB            = 11001
    SRC_ERR_NO_ANALYSIS   = 11002
    SRC_ERR_INVALID_ARG   = 11003
    
    // Analysis (11100-11199)
    SRC_ERR_DISCOVERY     = 11100
    SRC_ERR_LANGUAGE      = 11101
    SRC_ERR_NO_PARSER     = 11102
    SRC_ERR_PARSE         = 11103
    SRC_ERR_EXTRACT       = 11104
    SRC_ERR_PATTERN       = 11105
    
    // AI Bridge (11200-11299)
    SRC_ERR_AI_REQUEST    = 11200
    SRC_ERR_AI_CONNECTION = 11201
    SRC_ERR_AI_RESPONSE   = 11202
    SRC_ERR_AI_PARSE      = 11203
    SRC_ERR_AI_TIMEOUT    = 11204
    SRC_ERR_RAG_CATEGORY  = 11210
    SRC_ERR_RAG_LOAD      = 11211
    SRC_ERR_EMBED         = 11212
    SRC_ERR_SEARCH        = 11213
    
    // Generation (11300-11399)
    SRC_ERR_GEN_TEMPLATE  = 11300
    SRC_ERR_GEN_FORMAT    = 11301
    SRC_ERR_GEN_VALIDATE  = 11302
    
    // Output (11400-11499)
    SRC_ERR_OUTPUT_DIR    = 11400
    SRC_ERR_OUTPUT_WRITE  = 11401
    SRC_ERR_OUTPUT_PERM   = 11402
)
```

---

## 7. Cross-References

| Reference | Location |
|-----------|----------|
| Code Analysis | `./02-code-analysis.md` |
| AI Bridge Integration | `./03-ai-bridge-integration.md` |
| Output Formats | `./04-output-formats.md` |
| Error Codes | `./05-error-codes.md` |
| Split DB Architecture | `../../06-split-db-architecture/00-overview.md` |
| Seedable Config | `../../07-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../../28-shared-cli-frontend/00-overview.md` |

---

*Core Architecture specification for Spec Reverse CLI.*
