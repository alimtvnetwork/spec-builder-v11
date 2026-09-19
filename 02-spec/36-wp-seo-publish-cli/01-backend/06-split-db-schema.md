# WP SEO Publish CLI: Split DB Schema

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The WP SEO Publish CLI follows the Split DB architecture for data persistence, with separate databases for settings, websites, and publications.

---

## Database Hierarchy

```
data/
├── wpseo.db                          # Setting DB (Root/Main)
└── {website-slug}/
    ├── website.db                    # Website DB (Per Site)
    ├── publications/
    │   └── {seq}-{id}.db            # Publication DB (Per Content)
    └── variables/
        └── {source-id}.db           # Variable DB (Per Source)
```

---

## Setting DB (wpseo.db)

The root database stores global configuration and website registry.

```sql
-- Schema version tracking
CREATE TABLE IF NOT EXISTS SchemaVersion (
    Version INTEGER PRIMARY KEY,
    AppliedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Global configuration
CREATE TABLE IF NOT EXISTS Config (
    Key TEXT PRIMARY KEY,
    Value TEXT,
    Type TEXT DEFAULT 'string',
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Website registry
CREATE TABLE IF NOT EXISTS Websites (
    Id TEXT PRIMARY KEY,
    Slug TEXT UNIQUE NOT NULL,
    SiteUrl TEXT NOT NULL,
    Username TEXT NOT NULL,
    SiteTitle TEXT,
    SiteDescription TEXT,
    Nickname TEXT,
    ApiVersion TEXT DEFAULT 'v2',
    Connected INTEGER DEFAULT 0,
    LastValidated TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxWebsitesSlug ON Websites(Slug);

-- Encrypted credentials
CREATE TABLE IF NOT EXISTS Credentials (
    WebsiteId TEXT PRIMARY KEY,
    EncryptedPass BLOB NOT NULL,
    Salt BLOB NOT NULL,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    LastUsed TEXT,
    FOREIGN KEY (WebsiteId) REFERENCES Websites(Id) ON DELETE CASCADE
);

-- Global variables
CREATE TABLE IF NOT EXISTS GlobalVariables (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Key TEXT NOT NULL UNIQUE,
    Value TEXT,
    ValueType TEXT DEFAULT 'string',
    SourceId TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxGlobalVarsKey ON GlobalVariables(Key);

-- AI Bridge connection settings
CREATE TABLE IF NOT EXISTS AiBridgeConfig (
    Id INTEGER PRIMARY KEY CHECK (Id = 1),
    BaseUrl TEXT NOT NULL DEFAULT 'http://127.0.0.1:5040',
    Timeout INTEGER DEFAULT 120,
    EnableStreaming INTEGER DEFAULT 1,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- GSearch connection settings
CREATE TABLE IF NOT EXISTS GSearchConfig (
    Id INTEGER PRIMARY KEY CHECK (Id = 1),
    BaseUrl TEXT NOT NULL DEFAULT 'http://127.0.0.1:5020',
    Timeout INTEGER DEFAULT 30,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## Website DB (website.db)

Per-website database storing site-specific data.

```sql
-- Schema version
CREATE TABLE IF NOT EXISTS SchemaVersion (
    Version INTEGER PRIMARY KEY,
    AppliedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Website metadata cache
CREATE TABLE IF NOT EXISTS SiteMetadata (
    Key TEXT PRIMARY KEY,
    Value TEXT,
    FetchedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Categories cache (synced from WordPress)
CREATE TABLE IF NOT EXISTS Categories (
    Id INTEGER PRIMARY KEY,
    Name TEXT NOT NULL,
    Slug TEXT NOT NULL,
    Description TEXT,
    ParentId INTEGER DEFAULT 0,
    Count INTEGER DEFAULT 0,
    SyncedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxCategoriesSlug ON Categories(Slug);
CREATE INDEX IdxCategoriesParent ON Categories(ParentId);

-- Tags cache (synced from WordPress)
CREATE TABLE IF NOT EXISTS Tags (
    Id INTEGER PRIMARY KEY,
    Name TEXT NOT NULL,
    Slug TEXT NOT NULL,
    Description TEXT,
    Count INTEGER DEFAULT 0,
    SyncedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxTagsSlug ON Tags(Slug);

-- Publication records
CREATE TABLE IF NOT EXISTS Publications (
    Id TEXT PRIMARY KEY,
    Seq INTEGER NOT NULL,
    ContentType TEXT NOT NULL, -- content_type.Variant (category, post, page, tag)
    RemoteId INTEGER NOT NULL,
    Title TEXT NOT NULL,
    Slug TEXT,
    Url TEXT,
    Status TEXT DEFAULT 'published', -- publishstatustype.Variant
    Categories TEXT, -- JSON array of IDs
    Tags TEXT, -- JSON array of IDs
    InternalLinks TEXT, -- JSON array of links
    GeneratedSlugs TEXT, -- JSON array of slugs
    VariablesUsed TEXT, -- JSON object
    AiPromptUsed TEXT,
    PublishedAt TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxPublicationsType ON Publications(ContentType);
CREATE INDEX IdxPublicationsRemote ON Publications(RemoteId);
CREATE INDEX IdxPublicationsSeq ON Publications(Seq);

-- Modification history
CREATE TABLE IF NOT EXISTS Modifications (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PublicationId TEXT NOT NULL,
    OriginalContent TEXT,
    NewContent TEXT,
    Prompt TEXT,
    ModifiedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PublicationId) REFERENCES Publications(Id)
);

-- Website-scoped variables
CREATE TABLE IF NOT EXISTS WebsiteVariables (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Key TEXT NOT NULL,
    Value TEXT,
    ValueType TEXT DEFAULT 'string',
    SourceId TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IdxWebsiteVarsKey ON WebsiteVariables(Key);

-- Variable sources
CREATE TABLE IF NOT EXISTS VariableSources (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Type TEXT NOT NULL, -- variable_source_type.Variant (csv, json, yaml)
    FilePath TEXT,
    Config TEXT, -- JSON config
    RowCount INTEGER DEFAULT 0,
    Scope TEXT NOT NULL, -- variable_scope.Variant (website, content)
    ImportedAt TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Content-scoped variables
CREATE TABLE IF NOT EXISTS ContentVariables (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ContentType TEXT NOT NULL, -- content_type.Variant (category, post, page, tag)
    Key TEXT NOT NULL,
    Value TEXT,
    ValueType TEXT DEFAULT 'string', -- variable_value_type.Variant
    SourceId TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxContentVars ON ContentVariables(ContentType, Key);

-- Sitemap cache reference
CREATE TABLE IF NOT EXISTS SitemapCache (
    Id INTEGER PRIMARY KEY CHECK (Id = 1),
    SitemapUrl TEXT,
    RagName TEXT, -- Reference to AI Bridge RAG
    UrlCount INTEGER DEFAULT 0,
    LastIndexed TEXT,
    LastRefreshed TEXT,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Automation configs
CREATE TABLE IF NOT EXISTS Automations (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    ContentType TEXT NOT NULL,
    VariableSourceId TEXT,
    AiPromptTemplate TEXT,
    CommonSettings TEXT, -- JSON
    Status TEXT DEFAULT 'idle', -- automation_status.Variant (idle, running, paused, completed)
    LastRunAt TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (VariableSourceId) REFERENCES VariableSources(Id)
);

-- Automation runs
CREATE TABLE IF NOT EXISTS AutomationRuns (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AutomationId TEXT NOT NULL,
    TotalItems INTEGER,
    Successful INTEGER DEFAULT 0,
    Failed INTEGER DEFAULT 0,
    Status TEXT DEFAULT 'running', -- run_status.Variant (running, completed, failed, cancelled)
    StartedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    CompletedAt TEXT,
    FOREIGN KEY (AutomationId) REFERENCES Automations(Id)
);
```

---

## Publication DB ({seq}-{id}.db)

Individual publication details and history.

```sql
-- Publication details
CREATE TABLE IF NOT EXISTS Details (
    Id TEXT PRIMARY KEY,
    RemoteId INTEGER NOT NULL,
    ContentType TEXT NOT NULL,
    Title TEXT NOT NULL,
    Content TEXT,
    Excerpt TEXT,
    Slug TEXT,
    Url TEXT,
    Status TEXT,
    Author INTEGER,
    FeaturedMedia INTEGER,
    PublishedAt TEXT,
    ModifiedAt TEXT,
    FetchedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Category assignments
CREATE TABLE IF NOT EXISTS CategoryAssignments (
    CategoryId INTEGER PRIMARY KEY,
    Name TEXT,
    Slug TEXT,
    AssignedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tag assignments
CREATE TABLE IF NOT EXISTS TagAssignments (
    TagId INTEGER PRIMARY KEY,
    Name TEXT,
    Slug TEXT,
    AssignedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Internal links used
CREATE TABLE IF NOT EXISTS InternalLinks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Url TEXT NOT NULL,
    Anchor TEXT,
    Title TEXT,
    Generated INTEGER DEFAULT 0, -- 1 if slug was generated
    Position INTEGER, -- character position in content
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SEO metadata
CREATE TABLE IF NOT EXISTS SeoMetadata (
    Id INTEGER PRIMARY KEY CHECK (Id = 1),
    KeywordCount INTEGER,
    AreaMentions INTEGER,
    WordCount INTEGER,
    ParagraphCount INTEGER,
    TransitionRatio REAL,
    ReadabilityScore REAL,
    GeneratedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Version history
CREATE TABLE IF NOT EXISTS Versions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Content TEXT NOT NULL,
    Prompt TEXT,
    VersionNumber INTEGER NOT NULL,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Variables used for this publication
CREATE TABLE IF NOT EXISTS UsedVariables (
    Key TEXT PRIMARY KEY,
    Value TEXT,
    Source TEXT -- global, website, content, instance
);
```

---

## Variable DB ({source-id}.db)

Per-source variable storage for large datasets.

```sql
-- Source metadata
CREATE TABLE IF NOT EXISTS SourceMetadata (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Type TEXT NOT NULL,
    FilePath TEXT,
    Delimiter TEXT,
    HasHeader INTEGER DEFAULT 1,
    ColumnMap TEXT, -- JSON
    RowCount INTEGER DEFAULT 0,
    ImportedAt TEXT
);

-- Variable rows
CREATE TABLE IF NOT EXISTS Rows (
    RowIndex INTEGER PRIMARY KEY,
    Data TEXT NOT NULL, -- JSON object
    Used INTEGER DEFAULT 0,
    UsedAt TEXT
);

CREATE INDEX IdxRowsUsed ON Rows(Used);

-- Column definitions (for CSV)
CREATE TABLE IF NOT EXISTS Columns (
    Index INTEGER PRIMARY KEY,
    Name TEXT NOT NULL,
    Type TEXT DEFAULT 'string',
    SampleValue TEXT
);
```

---

## GORM Models

### Setting DB Models

```go
// internal/models/setting_db.go
package models

import "time"

type SchemaVersion struct {
    Version   int       `gorm:"primaryKey"`
    AppliedAt time.Time `gorm:"autoCreateTime"`
}

type Config struct {
    Key       string    `gorm:"primaryKey"`
    Value     string
    Type      string    `gorm:"default:'string'"`
    UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

type Website struct {
    Id              string `gorm:"primaryKey"`
    Slug            string `gorm:"uniqueIndex;not null"`
    SiteUrl         string `gorm:"not null"`
    Username        string `gorm:"not null"`
    SiteTitle       string
    SiteDescription string
    Nickname        string
    ApiVersion      string     `gorm:"default:'v2'"`
    Connected       bool       `gorm:"default:false"`
    LastValidated   *time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time

    // Relationships
    Credential Credential `gorm:"foreignKey:WebsiteId"`
}

type Credential struct {
    WebsiteId     string    `gorm:"primaryKey"`
    EncryptedPass []byte    `gorm:"not null"`
    Salt          []byte    `gorm:"not null"`
    CreatedAt     time.Time
    LastUsed      *time.Time

    // Belongs to Website
    Website Website `gorm:"foreignKey:WebsiteId"`
}

type GlobalVariable struct {
    Id        uint      `gorm:"primaryKey"`
    Key       string    `gorm:"uniqueIndex;not null"`
    Value     string
    ValueType string    `gorm:"default:'string'"`
    SourceId  string
    CreatedAt time.Time
    UpdatedAt time.Time
}

type AiBridgeConfig struct {
    Id              int    `gorm:"primaryKey;check:id = 1"`
    BaseUrl         string `gorm:"not null;default:'http://127.0.0.1:5040'"`
    Timeout         int    `gorm:"default:120"`
    EnableStreaming  bool   `gorm:"default:true"`
    UpdatedAt       time.Time
}

type GSearchConfig struct {
    Id        int    `gorm:"primaryKey;check:id = 1"`
    BaseUrl   string `gorm:"not null;default:'http://127.0.0.1:5020'"`
    Timeout   int    `gorm:"default:30"`
    UpdatedAt time.Time
}
```

### Website DB Models

```go
// internal/models/website_db.go
package models

type SiteMetadata struct {
    Key       string    `gorm:"primaryKey"`
    Value     string
    FetchedAt time.Time `gorm:"autoCreateTime"`
}

type Category struct {
    ID          int    `gorm:"primaryKey"`
    Name        string `gorm:"not null"`
    Slug        string `gorm:"index;not null"`
    Description string
    ParentId    int       `gorm:"index;default:0"`
    Count       int       `gorm:"default:0"`
    SyncedAt    time.Time `gorm:"autoCreateTime"`
}

type Tag struct {
    ID          int    `gorm:"primaryKey"`
    Name        string `gorm:"not null"`
    Slug        string `gorm:"index;not null"`
    Description string
    Count       int       `gorm:"default:0"`
    SyncedAt    time.Time `gorm:"autoCreateTime"`
}

type Publication struct {
    ID             string `gorm:"primaryKey"`
    Seq            int    `gorm:"not null"`
    ContentType    string `gorm:"index;not null"`
    RemoteId       int    `gorm:"index;not null"`
    Title          string `gorm:"not null"`
    Slug           string
    URL            string
    Status         string `gorm:"default:'published'"`
    Categories     string // JSON array
    Tags           string // JSON array
    InternalLinks  string // JSON array
    GeneratedSlugs string // JSON array
    VariablesUsed  string // JSON object
    AIPromptUsed   string
    PublishedAt    *time.Time
    CreatedAt      time.Time

    // Relationships
    Modifications []Modification `gorm:"foreignKey:PublicationId"`
}

type Modification struct {
    ID              uint   `gorm:"primaryKey"`
    PublicationId   string `gorm:"index;not null"`
    OriginalContent string
    NewContent      string
    Prompt          string
    ModifiedAt      time.Time `gorm:"autoCreateTime"`

    // Belongs to Publication
    Publication Publication `gorm:"foreignKey:PublicationId"`
}

type WebsiteVariable struct {
    ID        uint      `gorm:"primaryKey"`
    Key       string    `gorm:"uniqueIndex;not null"`
    Value     string
    ValueType string    `gorm:"default:'string'"`
    SourceId  string
    CreatedAt time.Time
    UpdatedAt time.Time
}

type VariableSource struct {
    ID         string `gorm:"primaryKey"`
    Name       string `gorm:"not null"`
    Type       string `gorm:"not null"` // variable_source_type.Variant
    FilePath   string
    Config     string // JSON
    RowCount   int    `gorm:"default:0"`
    Scope      string `gorm:"not null"` // variable_scope.Variant
    ImportedAt *time.Time
    CreatedAt  time.Time
}

type ContentVariable struct {
    ID          uint   `gorm:"primaryKey"`
    ContentType string `gorm:"index:IdxContentVars;not null"`
    Key         string `gorm:"index:IdxContentVars;not null"`
    Value       string
    ValueType   string `gorm:"default:'string'"`
    SourceId    string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type SitemapCache struct {
    Id            int    `gorm:"primaryKey;check:id = 1"`
    SitemapUrl    string
    RagName       string
    UrlCount      int        `gorm:"default:0"`
    LastIndexed   *time.Time
    LastRefreshed *time.Time
    UpdatedAt     time.Time
}

type Automation struct {
    ID               string `gorm:"primaryKey"`
    Name             string `gorm:"not null"`
    ContentType      string `gorm:"not null"`
    VariableSourceId string
    AIPromptTemplate string
    CommonSettings   string     // JSON
    Status           string     `gorm:"default:'idle'"`
    LastRunAt        *time.Time
    CreatedAt        time.Time

    // Relationships
    VariableSource VariableSource `gorm:"foreignKey:VariableSourceId"`
    Runs           []AutomationRun `gorm:"foreignKey:AutomationId"`
}

type AutomationRun struct {
    ID           uint   `gorm:"primaryKey"`
    AutomationId string `gorm:"index;not null"`
    TotalItems   int
    Successful   int       `gorm:"default:0"`
    Failed       int       `gorm:"default:0"`
    Status       string    `gorm:"default:'running'"`
    StartedAt    time.Time `gorm:"autoCreateTime"`
    CompletedAt  *time.Time

    // Belongs to Automation
    Automation Automation `gorm:"foreignKey:AutomationId"`
}
```

### Publication DB Models

```go
// internal/models/publication_db.go
package models

type Detail struct {
    Id            string `gorm:"primaryKey"`
    RemoteId      int    `gorm:"not null"`
    ContentType   string `gorm:"not null"`
    Title         string `gorm:"not null"`
    Content       string
    Excerpt       string
    Slug          string
    Url           string
    Status        string
    Author        int
    FeaturedMedia int
    PublishedAt   *time.Time
    ModifiedAt    *time.Time
    FetchedAt     time.Time `gorm:"autoCreateTime"`
}

type CategoryAssignment struct {
    CategoryId int    `gorm:"primaryKey"`
    Name       string
    Slug       string
    AssignedAt time.Time `gorm:"autoCreateTime"`
}

type TagAssignment struct {
    TagId      int    `gorm:"primaryKey"`
    Name       string
    Slug       string
    AssignedAt time.Time `gorm:"autoCreateTime"`
}

type InternalLink struct {
    Id        uint   `gorm:"primaryKey"`
    Url       string `gorm:"not null"`
    Anchor    string
    Title     string
    Generated bool `gorm:"default:false"`
    Position  int
    CreatedAt time.Time
}

type SeoMetadata struct {
    Id               int     `gorm:"primaryKey;check:id = 1"`
    KeywordCount     int
    AreaMentions     int
    WordCount        int
    ParagraphCount   int
    TransitionRatio  float64
    ReadabilityScore float64
    GeneratedAt      time.Time `gorm:"autoCreateTime"`
}

type Version struct {
    Id            uint   `gorm:"primaryKey"`
    Content       string `gorm:"not null"`
    Prompt        string
    VersionNumber int    `gorm:"not null"`
    CreatedAt     time.Time
}

type UsedVariable struct {
    Key    string `gorm:"primaryKey"`
    Value  string
    Source string // global, website, content, instance
}
```

---

## Database Manager

```go
type DatabaseManager struct {
    dataDir    string
    settingDb  *gorm.DB
    websiteDbs map[string]*gorm.DB
    mu         sync.RWMutex
}

func NewDatabaseManager(dataDir string) apperror.Result[DatabaseManager] {
    dm := &DatabaseManager{
        dataDir:    dataDir,
        websiteDbs: make(map[string]*gorm.DB),
    }
    
    // Open setting Db via GORM
    settingPath := filepath.Join(dataDir, "wpseo.db")
    db, err := gorm.Open(sqlite.Open(settingPath), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    dm.settingDb = db
    
    // AutoMigrate setting Db models
    if err := dm.settingDb.AutoMigrate(
        &SchemaVersion{},
        &Config{},
        &Website{},
        &Credential{},
        &GlobalVariable{},
        &AiBridgeConfig{},
        &GSearchConfig{},
    ); err != nil {
        return nil, err
    }
    
    return dm, nil
}

func (dm *DatabaseManager) GetWebsiteDb(websiteSlug string) apperror.Result[*gorm.DB] {
    dm.mu.RLock()
    if db, exists := dm.websiteDbs[websiteSlug]; exists {
        dm.mu.RUnlock()
        return db, nil
    }
    dm.mu.RUnlock()
    
    // Create directory and open Db via GORM
    dm.mu.Lock()
    defer dm.mu.Unlock()
    
    dir := filepath.Join(dm.dataDir, websiteSlug)
    err := pathutil.EnsureDir(dir)
    if err != nil {
        return nil, err
    }
    
    dbPath := filepath.Join(dir, "website.db")
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    
    dm.websiteDbs[websiteSlug] = db
    
    // AutoMigrate website Db models
    if err := db.AutoMigrate(
        &SchemaVersion{},
        &SiteMetadata{},
        &Category{},
        &Tag{},
        &Publication{},
        &Modification{},
        &WebsiteVariable{},
        &VariableSource{},
        &ContentVariable{},
        &SitemapCache{},
        &Automation{},
        &AutomationRun{},
    ); err != nil {
        return nil, err
    }
    
    return db, nil
}

func (dm *DatabaseManager) CreatePublicationDb(websiteSlug, pubId string, seq int) apperror.Result[*gorm.DB] {
    dir := filepath.Join(dm.dataDir, websiteSlug, "publications")
    err := pathutil.EnsureDir(dir)
    if err != nil {
        return nil, err
    }
    
    filename := fmt.Sprintf("%05d-%s.db", seq, pubId)
    dbPath := filepath.Join(dir, filename)
    
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    
    // AutoMigrate publication DB models
    if err := db.AutoMigrate(
        &Detail{},
        &CategoryAssignment{},
        &TagAssignment{},
        &InternalLink{},
        &SeoMetadata{},
        &Version{},
        &UsedVariable{},
    ); err != nil {
        return nil, err
    }
    
    return db, nil
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| Split DB Architecture | `../../05-split-db-architecture/00-overview.md` |
| Variable System | `05-variable-system.md` |
| Import/Export | `09-import-export.md` |
| Enum Architecture | `12-enum-architecture.md` |
