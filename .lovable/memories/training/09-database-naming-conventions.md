# Memory: training/database-naming-conventions

**Updated:** 2026-02-17  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Overview

Database schemas use **PascalCase** for all identifiers. JSON wire format (API payloads) uses **camelCase** for interoperability with JavaScript/TypeScript frontends. GORM column tags use **PascalCase** to match DB columns.

---

## Naming Convention Rules

| Context | Convention | Example |
|---------|------------|---------|
| DB Table Names | PascalCase Singular | `User`, `ProjectMetadata` |
| DB Column Names | PascalCase | `SessionId`, `CreatedAt`, `MessageCount` |
| GORM Column Tags | PascalCase | `gorm:"column:SessionId"` |
| Index Names | `Idx` prefix + PascalCase | `IdxUserEmail`, `IdxProjectOwnerId` |
| Go Struct Fields | PascalCase | `SessionId string` |
| JSON Wire Format | camelCase | `"sessionId"`, `"createdAt"`, `"messageCount"` |
| JSON Tags in Go | camelCase | `json:"sessionId"`, `json:"createdAt"` |

---

## Scope Clarification

### Database Layer (PascalCase)

Applies to: SQL DDL, GORM column tags, migration scripts, index names.

```sql
CREATE TABLE Message (
    Id TEXT PRIMARY KEY,
    SessionId TEXT NOT NULL,
    CreatedAt DATETIME,
    MessageCount INTEGER
);

CREATE INDEX IdxMessageSessionId ON Message(SessionId);
```

### JSON Wire Format (camelCase)

Applies to: API request/response payloads, JSON tags on Go structs, OpenAPI schemas.

This follows idiomatic conventions for Go ↔ JavaScript interop. Go structs bridge both worlds via separate `gorm` and `json` tags.

```json
{
  "sessionId": "abc123",
  "createdAt": "2026-02-02T10:00:00Z",
  "messageCount": 5
}
```

---

## Go Struct Example

```go
type Message struct {
    Id        string    `gorm:"column:Id;primaryKey" json:"id"`
    SessionId string    `gorm:"column:SessionId;not null" json:"sessionId"`
    Role      string    `gorm:"column:Role" json:"role"`
    Content   string    `gorm:"column:Content" json:"content"`
    Tokens    int       `gorm:"column:Tokens" json:"tokens"`
    CreatedAt time.Time `gorm:"column:CreatedAt" json:"createdAt"`
}
```

> **Key pattern:** `gorm` tags → PascalCase (matches DB), `json` tags → camelCase (matches API).

---

## Applicable Projects

- AI Bridge CLI
- GSearch CLI
- BRun CLI
- Nexus Flow CLI
- Spec Management Software

---

*PascalCase for database. camelCase for JSON. No exceptions.*
