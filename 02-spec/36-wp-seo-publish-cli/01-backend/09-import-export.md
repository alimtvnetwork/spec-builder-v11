# WP SEO Publish CLI: Import/Export

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The Import/Export system enables data portability for websites, variables, and publication records.

---

## Export Formats

### JSON Export

Single file containing all selected data:

```json
{
  "Version": "1.0.0",
  "ExportedAt": "2026-02-02T10:30:00Z",
  "Website": {
    "Id": "ws-abc123",
    "Slug": "example-com",
    "SiteUrl": "https://example.com",
    "SiteTitle": "Example Blog",
    "Nickname": "My Blog"
  },
  "Settings": {
    "AiBridge": {...},
    "Publishing": {...}
  },
  "Variables": {
    "Global": [...],
    "Website": [...],
    "Content": [...]
  },
  "VariableSources": [...],
  "Publications": [...],
  "Categories": [...],
  "Tags": [...],
  "SitemapCache": {...}
}
```

### ZIP Export

Structured archive for large datasets:

```
export-example-com-20260202.zip
├── manifest.json           # Export metadata
├── website.json           # Website configuration
├── settings.json          # All settings
├── variables/
│   ├── global.json
│   ├── website.json
│   └── sources/
│       ├── src-001.json
│       └── src-002.csv    # Original file preserved
├── publications/
│   ├── index.json         # Publication list
│   └── details/
│       ├── pub-001.json
│       └── pub-002.json
└── cache/
    └── sitemap.json
```

---

## Export API

### Export Website Data

```go
type ExportRequest struct {
    WebsiteId string                  // Target website ID
    Include   []string                // publications, variables, settings, cache
    Format    exportformattype.Variant    // → internal/enums/exportformattype/
}

type ExportResult struct {
    FileName   string
    Size       int64
    Format     string
    Url        string     `json:",omitempty"` // Download URL
    Data       []byte     `json:"-"`          // For immediate response
    ExportedAt time.Time
}

func (s *ImportExportService) Export(req ExportRequest) appfault.Result[ExportResult] {
    website, err := s.db.GetWebsite(req.WebsiteId)
    if err != nil {
        return appfault.FailWrap[ExportResult](err, ErrDatabaseQueryFailed, "failed to get website")
    }
    
    export := &ExportData{
        Version:    "1.0.0",
        ExportedAt: time.Now(),
        Website:    website,
    }
    
    for _, inc := range req.Include {
        switch inc {
        case "settings":
            export.Settings, _ = s.db.GetSettings(req.WebsiteId)
        case "variables":
            export.Variables, _ = s.exportVariables(req.WebsiteId)
        case "publications":
            export.Publications, _ = s.exportPublications(req.WebsiteId)
        case "cache":
            export.SitemapCache, _ = s.db.GetSitemapCache(req.WebsiteId)
        }
    }
    
    switch req.Format {
    case "json":
        return s.exportJson(export, website.Slug)
    case "zip":
        return s.exportZip(export, website.Slug)
    default:
        return appfault.FailNew[ExportResult](ErrInvalidExportFormat, "invalid export format: "+req.Format)
    }
}

func (s *ImportExportService) exportJson(export *ExportData, slug string) appfault.Result[ExportResult] {
    data, err := json.MarshalIndent(export, "", "  ")
    if err != nil {
        return appfault.FailWrap[ExportResult](err, ErrJsonMarshalFailed, "failed to marshal export json")
    }
    
    fileName := fmt.Sprintf("export-%s-%s.json", slug, time.Now().Format("20060102"))
    
    return appfault.Ok(ExportResult{
        FileName:   fileName,
        Size:       int64(len(data)),
        Format:     "json",
        Data:       data,
        ExportedAt: time.Now(),
    })
}

func (s *ImportExportService) exportZip(export *ExportData, slug string) appfault.Result[ExportResult] {
    fileName := fmt.Sprintf("export-%s-%s.zip", slug, time.Now().Format("20060102"))
    filePath := filepath.Join(s.exportDir, fileName)
    
    zipFile, err := pathutil.CreateFile(filePath)
    if err != nil {
        return appfault.FailWrap[ExportResult](err, ErrFileCreateFailed, "failed to create zip file")
    }
    defer zipFile.Close()
    
    zipWriter := zip.NewWriter(zipFile)
    defer zipWriter.Close()
    
    // Write manifest
    manifest := ExportManifest{
        Version:    export.Version,
        ExportedAt: export.ExportedAt,
        Website:    export.Website.Slug,
        Includes:   []string{"settings", "variables", "publications"},
    }
    s.writeJsonToZip(zipWriter, "manifest.json", manifest)
    
    // Write website config
    s.writeJsonToZip(zipWriter, "website.json", export.Website)
    
    // Write settings
    s.writeJsonToZip(zipWriter, "settings.json", export.Settings)
    
    // Write variables
    s.writeJsonToZip(zipWriter, "variables/global.json", export.Variables.Global)
    s.writeJsonToZip(zipWriter, "variables/website.json", export.Variables.Website)
    
    // Write publications
    pubIndex := make([]PublicationIndexEntry, len(export.Publications))
    for i, pub := range export.Publications {
        pubIndex[i] = PublicationIndexEntry{
            Id:    pub.Id,
            Title: pub.Title,
            Type:  pub.ContentType,
        }
        s.writeJsonToZip(zipWriter, 
            fmt.Sprintf("publications/details/%s.json", pub.Id), 
            pub)
    }
    s.writeJsonToZip(zipWriter, "publications/index.json", pubIndex)
    
    zipWriter.Close()
    
    info, _ := pathutil.Stat(filePath)
    
    return &ExportResult{
        FileName:   fileName,
        Size:       info.Size(),
        Format:     "zip",
        Url:        "/api/v1/data/downloads/" + fileName,
        ExportedAt: time.Now(),
    }, nil
}
```

---

## Import API

### Import Website Data

```go
type ImportRequest struct {
    WebsiteId   string              `json:",omitempty"` // Create new if empty
    FilePath    string
    Include     []string            // publications, variables, settings
    MergeMode   mergemodetype.Variant   // → internal/enums/mergemodetype/
}

type ImportResult struct {
    WebsiteId       string
    Imported        ImportStats
    Skipped         ImportStats
    Errors          []string `json:",omitempty"`
    ImportedAt      time.Time
}

type ImportStats struct {
    Variables    int
    Publications int
    Settings     int
}

func (s *ImportExportService) Import(req ImportRequest) appfault.Result[ImportResult] {
    // Detect format
    ext := filepath.Ext(req.FilePath)
    
    var importData *ExportData
    var err error
    
    switch ext {
    case ".json":
        importData, err = s.parseJsonImport(req.FilePath)
    case ".zip":
        importData, err = s.parseZipImport(req.FilePath)
    default:
        return appfault.FailNew[ImportResult](ErrInvalidImportFormat, "invalid import format: "+ext)
    }
    
    if err != nil {
        return appfault.FailWrap[ImportResult](err, ErrFileReadFailed, "failed to parse import file")
    }
    
    // Validate version compatibility
    if !isCompatibleVersion(importData.Version) {
        return appfault.FailNew[ImportResult](ErrVersionMismatch, fmt.Sprintf("version mismatch: %s vs %s", importData.Version, CurrentVersion))
    }
    
    result := &ImportResult{
        ImportedAt: time.Now(),
    }
    
    // Create or get website
    if req.WebsiteId == "" {
        // Create new website from import
        website, err := s.db.CreateWebsite(importData.Website)
        if err != nil {
            return appfault.FailWrap[ImportResult](err, ErrDatabaseSaveFailed, "failed to create website")
        }
        result.WebsiteId = website.Id
    } else {
        result.WebsiteId = req.WebsiteId
    }
    
    // Import components based on include list
    for _, inc := range req.Include {
        switch inc {
        case "settings":
            if importData.Settings != nil {
                err := s.importSettings(result.WebsiteId, importData.Settings, req.MergeMode)
                if err != nil {
                    result.Errors = append(result.Errors, err.Error())
                } else {
                    result.Imported.Settings++
                }
            }
        case "variables":
            imported, skipped, errs := s.importVariables(result.WebsiteId, importData.Variables, req.MergeMode)
            result.Imported.Variables = imported
            result.Skipped.Variables = skipped
            result.Errors = append(result.Errors, errs...)
        case "publications":
            imported, skipped, errs := s.importPublications(result.WebsiteId, importData.Publications, req.MergeMode)
            result.Imported.Publications = imported
            result.Skipped.Publications = skipped
            result.Errors = append(result.Errors, errs...)
        }
    }
    
    return appfault.Ok(*result)
}
```

---

## Reset Operation

### 2-Step Reset

```go
type ResetRequest struct {
    WebsiteId      string // Target website
    ConfirmPhrase  string // Must match "RESET-{websiteId}"
    KeepConnection bool
    KeepVariables  bool
}

type ResetResult struct {
    Success     bool
    Deleted     DeleteStats
    Preserved   []string
    ResetAt     time.Time
}

type DeleteStats struct {
    Publications int
    Variables    int
    Cache        int
}

func (s *ImportExportService) Reset(req ResetRequest) appfault.Result[ResetResult] {
    // Step 1: Validate confirmation phrase
    expectedPhrase := fmt.Sprintf("RESET-%s", req.WebsiteId)
    if req.ConfirmPhrase != expectedPhrase {
        return appfault.FailNew[ResetResult](ErrResetConfirmationMismatch, fmt.Sprintf("confirmation mismatch: %s vs %s", req.ConfirmPhrase, expectedPhrase))
    }
    
    website, err := s.db.GetWebsite(req.WebsiteId)
    if err != nil {
        return appfault.FailWrap[ResetResult](err, ErrDatabaseQueryFailed, "failed to get website")
    }
    
    result := &ResetResult{
        Success:   true,
        ResetAt:   time.Now(),
        Preserved: make([]string, 0),
    }
    
    // Step 2: Perform reset
    websiteDbRes := s.dbManager.GetWebsiteDb(website.Slug)
    if websiteDbRes.HasError() {
        return appfault.Fail[ResetResult](websiteDbRes.AppError())
    }
    websiteDb := websiteDbRes.Value()
    
    // Delete publications
    pubCount, err := s.deleteAllPublications(websiteDb)
    if err != nil {
        return appfault.FailWrap[ResetResult](err, ErrDatabaseDeleteFailed, "failed to delete publications")
    }
    result.Deleted.Publications = pubCount
    
    // Handle variables
    if !req.KeepVariables {
        varCount, err := s.deleteAllVariables(websiteDb)
        if err != nil {
            return appfault.FailWrap[ResetResult](err, ErrDatabaseDeleteFailed, "failed to delete variables")
        }
        result.Deleted.Variables = varCount
    } else {
        result.Preserved = append(result.Preserved, "variables")
    }
    
    // Clear cache
    cacheCount, err := s.clearCache(websiteDb)
    if err != nil {
        return appfault.FailWrap[ResetResult](err, ErrDatabaseDeleteFailed, "failed to clear cache")
    }
    result.Deleted.Cache = cacheCount
    
    // Handle connection
    if !req.KeepConnection {
        err := s.db.DeleteConnection(req.WebsiteId)
        if err != nil {
            return appfault.FailWrap[ResetResult](err, ErrDatabaseDeleteFailed, "failed to delete connection")
        }
    } else {
        result.Preserved = append(result.Preserved, "connection")
    }
    
    return appfault.Ok(*result)
}
```

---

## Backup Strategy

### Auto-Backup Before Destructive Operations

```go
func (s *ImportExportService) CreateAutoBackup(websiteId, operation string) appfault.Result[ExportResult] {
    backupReq := ExportRequest{
        WebsiteId: websiteId,
        Include:   []string{"publications", "variables", "settings", "cache"},
        Format:    "zip",
    }
    
    exportRes := s.Export(backupReq)
    if exportRes.HasError() {
        return exportRes
    }
    result := exportRes.Value()
    
    // Rename with operation context
    newName := fmt.Sprintf("backup-%s-%s-%s.zip", 
        operation, 
        websiteId[:8], 
        time.Now().Format("20060102-150405"))
    
    // Move to backups directory
    s.moveToBackups(result.FileName, newName)
    result.FileName = newName
    
    // Track backup
    s.db.SaveBackupRecord(BackupRecord{
        WebsiteId: websiteId,
        FileName:  newName,
        Operation: operation,
        Size:      result.Size,
        CreatedAt: time.Now(),
    })
    
    return appfault.Ok(result)
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| Split DB Schema | `06-split-db-schema.md` |
| API Endpoints | `07-api-endpoints.md` |
| AI Bridge Import/Export | `../../27-ai-bridge-cli/01-backend/14-reset-and-export-api.md` |
| Enum Architecture | `12-enum-architecture.md` |
