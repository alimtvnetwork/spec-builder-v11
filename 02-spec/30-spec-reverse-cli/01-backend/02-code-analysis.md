# Code Analysis Engine

**Version:** 2.0.0  
**Status:** Draft  
**Created:** 2026-03-09  

---

## Overview

The Code Analysis Engine is responsible for parsing, understanding, and extracting structured information from existing codebases. It serves as the foundation for reverse-engineering code into specifications.

**Cross-References:**
- [Spec Reverse CLI Overview](../00-overview.md)
- [AI Bridge Integration](./03-ai-bridge-integration.md)
- [Split DB Architecture](../../05-split-db-architecture/00-overview.md)

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CODE ANALYSIS ENGINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │  File Discovery │────▶│  Language       │────▶│  AST Parser     │       │
│   │  (Glob/Walk)    │     │  Detection      │     │  (Per-Language) │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                           │                   │
│                                                           ▼                   │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │  Spec Template  │◀────│  Pattern        │◀────│  Symbol         │       │
│   │  Generator      │     │  Analyzer       │     │  Extractor      │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Components

### 2.1 File Discovery

Recursively discovers source files in a codebase.

```go
// internal/analysis/discovery.go
package analysis

import (
    "os"
    "path/filepath"
)

type FileDiscovery struct {
    RootPath       string
    IncludePatterns []string // e.g., ["*.go", "*.ts", "*.tsx"]
    ExcludePatterns []string // e.g., ["node_modules", "vendor", ".git"]
}

type DiscoveredFile struct {
    Path         string
    RelativePath string
    Extension    string
    SizeBytes    int64
    ModTime      time.Time
}

func (d *FileDiscovery) Discover() DiscoveredFileSlice {
    var files []DiscoveredFile
    
    err := filepath.WalkDir(d.RootPath, func(path string, entry os.DirEntry, err error) error {
        if err != nil {
            return err
        }
        
        // Skip excluded directories
        if entry.IsDir() && d.isExcluded(entry.Name()) {
            return filepath.SkipDir
        }
        
        // Check file extension
        if entry.IsFile() && d.isIncluded(path) {
            info, _ := entry.Info()
            relPath, _ := filepath.Rel(d.RootPath, path)
            
            files = append(files, DiscoveredFile{
                Path:         path,
                RelativePath: relPath,
                Extension:    filepath.Ext(path),
                SizeBytes:    info.Size(),
                ModTime:      info.ModTime(),
            })
        }
        
        return nil
    })
    
    return files, err
}
```

### 2.2 Language Detection

Identifies programming language and framework.

```go
// internal/analysis/language_detector.go
package analysis

// Language and Framework enums are defined in 12-enum-architecture.md
// Import: "spec-reverse-cli/internal/enums/languagetype"
// Import: "spec-reverse-cli/internal/enums/frameworktype"
//
// languagetype.Variant: Unknown, Go, TypeScript, JavaScript, Python, Rust, Java
// frameworktype.Variant: Unknown, React, Vue, Angular, Gin, Echo, FastAPI, Express, None

type LanguageInfo struct {
    Language       Language
    Framework      Framework
    Version        string
    PackageManager string // npm, yarn, go mod, pip
    EntryPoints    []string
}

type LanguageDetector struct{}

func (d *LanguageDetector) Detect(rootPath string) appfault.Result[*LanguageInfo] {
    info := &LanguageInfo{
        Language:  LanguageUnknown,
        Framework: FrameworkNone,
    }
    
    // Check for go.mod
    if exists(filepath.Join(rootPath, "go.mod")) {
        info.Language = LanguageGo
        info.PackageManager = "go mod"
        info.Version = d.extractGoVersion(rootPath)
        info.Framework = d.detectGoFramework(rootPath)
    }
    
    // Check for package.json
    if exists(filepath.Join(rootPath, "package.json")) {
        pkg := d.parsePackageJson(rootPath)
        info.Language = d.detectJSLanguage(pkg)
        info.PackageManager = d.detectPackageManager(rootPath)
        info.Framework = d.detectJSFramework(pkg)
    }
    
    // Check for requirements.txt or pyproject.toml
    if exists(filepath.Join(rootPath, "requirements.txt")) ||
       exists(filepath.Join(rootPath, "pyproject.toml")) {
        info.Language = LanguagePython
        info.PackageManager = "pip"
        info.Framework = d.detectPythonFramework(rootPath)
    }
    
    return info, nil
}
```

### 2.3 AST Parser

Parses source code into Abstract Syntax Trees.

```go
// internal/analysis/ast_parser.go
package analysis

import (
    "go/ast"
    "go/parser"
    "go/token"
)

type ASTParser interface {
    Parse(filePath string) appfault.Result[*ParsedFile]
}

type ParsedFile struct {
    Path       string
    Language   Language
    Imports    []ImportInfo
    Types      []TypeInfo
    Functions  []FunctionInfo
    Classes    []ClassInfo
    Constants  []ConstantInfo
    Comments   []CommentInfo
}

type ImportInfo struct {
    Name     string
    Path     string
    Alias    string
    LineNum  int
}

type TypeInfo struct {
    Name        string
    Kind        string // struct, interface, enum, type alias
    Fields      []FieldInfo
    Methods     []MethodInfo
    Implements  []string
    Comments    string
    LineNum     int
}

type FunctionInfo struct {
    Name       string
    Receiver   string // For methods
    Parameters []ParameterInfo
    Returns    []ParameterInfo
    IsExported bool
    IsAsync    bool
    Comments   string
    LineNum    int
}

// GoASTParser implements ASTParser for Go
type GoASTParser struct {
    fset *token.FileSet
}

func NewGoASTParser() *GoASTParser {
    return &GoASTParser{
        fset: token.NewFileSet(),
    }
}

func (p *GoASTParser) Parse(filePath string) appfault.Result[*ParsedFile] {
    node, err := parser.ParseFile(p.fset, filePath, nil, parser.ParseComments)
    if err != nil {
        return nil, err
    }
    
    parsed := &ParsedFile{
        Path:     filePath,
        Language: LanguageGo,
    }
    
    // Extract imports
    for _, imp := range node.Imports {
        parsed.Imports = append(parsed.Imports, ImportInfo{
            Path:    strings.Trim(imp.Path.Value, `"`),
            Alias:   p.getImportAlias(imp),
            LineNum: p.fset.Position(imp.Pos()).Line,
        })
    }
    
    // Extract types and functions
    // EXEMPTED: stdlib boundary — go/ast.Inspect requires .(type) switch on ast.Node (§7.2)
    ast.Inspect(node, func(n ast.Node) bool {
        switch x := n.(type) {
        case *ast.TypeSpec:
            parsed.Types = append(parsed.Types, p.extractType(x))
        case *ast.FuncDecl:
            parsed.Functions = append(parsed.Functions, p.extractFunction(x))
        }
        return true
    })
    
    return parsed, nil
}
```

### 2.4 Symbol Extractor

Extracts high-level symbols for spec generation.

```go
// internal/analysis/symbol_extractor.go
package analysis

type SymbolExtractor struct {
    parsedFiles []*ParsedFile
}

type ExtractedSymbols struct {
    Entities     []EntitySymbol     // Structs, classes → Data models
    Services     []ServiceSymbol    // Service classes → Features
    Handlers     []HandlerSymbol    // HTTP handlers → API endpoints
    Repositories []RepositorySymbol // DB access → Database design
    Utilities    []UtilitySymbol    // Helper functions
    Constants    []ConstantSymbol   // Enums, constants → Config
}

type EntitySymbol struct {
    Name          string
    Fields        []FieldSymbol
    Relationships []string // Foreign keys, associations
    TableName     string   // Inferred or from tag
    Source        string   // File path
}

type ServiceSymbol struct {
    Name         string
    Dependencies []string // Injected dependencies
    Methods      []MethodSymbol
    Source       string
}

type HandlerSymbol struct {
    Name       string
    Route      string // e.g., "/api/v1/users"
    Method     string // GET, POST, etc.
    Parameters []ParameterSymbol
    Response   string // Return type
    Source     string
}

func (e *SymbolExtractor) Extract() appfault.Result[*ExtractedSymbols] {
    symbols := &ExtractedSymbols{}
    
    for _, file := range e.parsedFiles {
        for _, t := range file.Types {
            if e.isEntity(t) {
                symbols.Entities = append(symbols.Entities, e.toEntitySymbol(t, file.Path))
            }
            if e.isService(t) {
                symbols.Services = append(symbols.Services, e.toServiceSymbol(t, file.Path))
            }
        }
        
        for _, f := range file.Functions {
            if e.isHandler(f) {
                symbols.Handlers = append(symbols.Handlers, e.toHandlerSymbol(f, file.Path))
            }
        }
    }
    
    return symbols, nil
}

// isEntity checks if type represents a database entity
func (e *SymbolExtractor) isEntity(t TypeInfo) bool {
    // Check for GORM tags, table name methods, or naming conventions
    return strings.HasSuffix(t.Name, "Model") ||
           strings.HasSuffix(t.Name, "Entity") ||
           hasGORMTags(t.Fields)
}

// isService checks if type represents a service layer
func (e *SymbolExtractor) isService(t TypeInfo) bool {
    return strings.HasSuffix(t.Name, "Service") ||
           strings.HasSuffix(t.Name, "Manager") ||
           strings.HasSuffix(t.Name, "Handler")
}
```

### 2.5 Pattern Analyzer

Identifies architectural patterns and code structure.

```go
// internal/analysis/pattern_analyzer.go
package analysis

// PatternType enum is defined in 12-enum-architecture.md
// Import: "spec-reverse-cli/internal/enums/patterntype"
//
// patterntype.Variant: Unknown, Mvc, Layered, Hexagonal, Microservice, Monolith

type ArchitecturePattern struct {
    Type          patterntype.Variant
    Confidence    float64 // 0.0 - 1.0
    Layers        []LayerInfo
    EntryPoints   []string
    Dependencies  map[string][]string
}

type LayerInfo struct {
    Name      string // e.g., "handlers", "services", "repositories"
    Path      string // Directory path
    FileCount int
    Purpose   string // Inferred purpose
}

type PatternAnalyzer struct {
    symbols *ExtractedSymbols
    files   []DiscoveredFile
}

func (p *PatternAnalyzer) Analyze() appfault.Result[*ArchitecturePattern] {
    pattern := &ArchitecturePattern{
        Dependencies: make(map[string][]string),
    }
    
    // Analyze folder structure
    layers := p.detectLayers()
    pattern.Layers = layers
    
    // Determine pattern type based on structure
    if p.hasHandlers() && p.hasServices() && p.hasRepositories() {
        pattern.Type = PatternLayered
        pattern.Confidence = 0.85
    } else if p.hasPorts() && p.hasAdapters() {
        pattern.Type = PatternHexagonal
        pattern.Confidence = 0.80
    } else {
        pattern.Type = PatternMonolith
        pattern.Confidence = 0.60
    }
    
    // Build dependency graph
    pattern.Dependencies = p.buildDependencyGraph()
    
    return pattern, nil
}

func (p *PatternAnalyzer) detectLayers() []LayerInfo {
    layerPatterns := map[string]string{
        "cmd":         "Entry points and main packages",
        "internal":    "Private application code",
        "pkg":         "Public shared packages",
        "api":         "HTTP/gRPC handlers",
        "handlers":    "Request handlers",
        "controllers": "MVC controllers",
        "services":    "Business logic layer",
        "domain":      "Domain entities and rules",
        "models":      "Data models",
        "repository":  "Data access layer",
        "store":       "Storage implementations",
        "utils":       "Utility functions",
        "config":      "Configuration management",
    }
    
    var layers []LayerInfo
    for _, dir := range p.getDirectories() {
        if purpose, ok := layerPatterns[dir.Name]; ok {
            layers = append(layers, LayerInfo{
                Name:      dir.Name,
                Path:      dir.Path,
                FileCount: dir.FileCount,
                Purpose:   purpose,
            })
        }
    }
    
    return layers
}
```

---

## 3. Analysis Pipeline

### 3.1 Pipeline Stages

```go
// internal/analysis/pipeline.go
package analysis

import (
    stdctx "context"
    "time"
)

type AnalysisPipeline struct {
    rootPath   string
    config     *AnalysisConfig
    discovery  *FileDiscovery
    detector   *LanguageDetector
    parsers    map[Language]ASTParser
    extractor  *SymbolExtractor
    analyzer   *PatternAnalyzer
}

type AnalysisConfig struct {
    IncludeTests     bool
    MaxFileSize      int64 // Bytes
    IgnorePatterns   []string
    FocusDirectories []string // Analyze only specific dirs
}

type AnalysisResult struct {
    RootPath     string
    Language     *LanguageInfo
    FileCount    int
    LineCount    int
    Symbols      *ExtractedSymbols
    Architecture *ArchitecturePattern
    Issues       []AnalysisIssue
    Duration     time.Duration
}

type AnalysisIssue struct {
    Severity string // error, warning, info
    Message  string
    FilePath string
    LineNum  int
}

func (p *AnalysisPipeline) Run(context stdctx.Context) appfault.Result[*AnalysisResult] {
    start := time.Now()
    result := &AnalysisResult{
        RootPath: p.rootPath,
    }
    
    // Stage 1: Discover files
    files, err := p.discovery.Discover()
    if err != nil {
        return nil, NewError(SRC_ERR_DISCOVERY, err.Error())
    }
    result.FileCount = len(files)
    
    // Stage 2: Detect language
    langInfo, err := p.detector.Detect(p.rootPath)
    if err != nil {
        return nil, NewError(SRC_ERR_LANGUAGE_DETECT, err.Error())
    }
    result.Language = langInfo
    
    // Stage 3: Parse files
    parser := p.parsers[langInfo.Language]
    if parser == nil {
        return nil, NewError(SRC_ERR_NO_PARSER, "No parser for "+string(langInfo.Language))
    }
    
    var parsedFiles []*ParsedFile
    for _, file := range files {
        parsed, err := parser.Parse(file.Path)
        if err != nil {
            result.Issues = append(result.Issues, AnalysisIssue{
                Severity: "warning",
                Message:  "Parse failed: " + err.Error(),
                FilePath: file.Path,
            })
            continue
        }
        parsedFiles = append(parsedFiles, parsed)
    }
    
    // Stage 4: Extract symbols
    p.extractor = &SymbolExtractor{parsedFiles: parsedFiles}
    symbols, err := p.extractor.Extract()
    if err != nil {
        return nil, NewError(SRC_ERR_EXTRACTION, err.Error())
    }
    result.Symbols = symbols
    
    // Stage 5: Analyze patterns
    p.analyzer = &PatternAnalyzer{
        symbols: symbols,
        files:   files,
    }
    arch, err := p.analyzer.Analyze()
    if err != nil {
        return nil, NewError(SRC_ERR_ANALYSIS, err.Error())
    }
    result.Architecture = arch
    
    result.Duration = time.Since(start)
    return result, nil
}
```

---

## 4. Supported Languages

| Language | Parser | Status |
|----------|--------|--------|
| Go | `go/ast` | ✅ Full support |
| TypeScript | `@typescript-eslint/parser` | ✅ Full support |
| JavaScript | `@babel/parser` | ✅ Full support |
| Python | `ast` module | 🔄 Planned |
| Rust | `syn` crate | 🔄 Planned |

---

## 5. Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 11100 | SRC_ERR_DISCOVERY | File discovery failed |
| 11101 | SRC_ERR_LANGUAGE_DETECT | Language detection failed |
| 11102 | SRC_ERR_NO_PARSER | No parser available for language |
| 11103 | SRC_ERR_PARSE_FAILED | File parsing failed |
| 11104 | SRC_ERR_EXTRACTION | Symbol extraction failed |
| 11105 | SRC_ERR_ANALYSIS | Pattern analysis failed |

---

## 6. Cross-References

| Reference | Location |
|-----------|----------|
| AI Bridge Integration | `./03-ai-bridge-integration.md` |
| Output Formats | `./04-output-formats.md` |
| Error Codes | `./05-error-codes.md` |
| Split DB Architecture | `../../05-split-db-architecture/00-overview.md` |

---

*Code Analysis Engine specification for Spec Reverse CLI.*
