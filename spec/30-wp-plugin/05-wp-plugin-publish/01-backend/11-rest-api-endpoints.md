# 11 — REST API Endpoints


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

The backend HTTP API provides RESTful endpoints for the React frontend to interact with sites, plugins, sync operations, and error logs.

---

## Base Configuration

- **Base URL:** `http://localhost:8080/api/v1`
- **Content-Type:** `application/json`
- **Authentication:** None (localhost only)

---

## API Index & Health

### API Index

```
GET /api/v1
GET /api/v1/
```

Returns API metadata. Useful for verifying the API is running.

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Name": "WP Plugin Publish API",
    "Version": "v1",
    "Health": "/api/v1/health",
    "Ws": "/ws"
  }
}
```

### Health Check

```
GET /api/v1/health
```

Returns server health status using the **standard envelope format**.

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Status": "ok",
    "Timestamp": "2026-02-04T10:00:00Z"
  }
}
```

> **Important:** The health endpoint MUST return the standard `{Success:true, Data:{...}}` envelope, not a custom format like `{Status:"healthy"}`. Frontend connectivity detection relies on parsing JSON and checking HTTP status codes.

---

## Response Format

### Success Response

```json
{
  "Success": true,
  "Data": { ... }
}
```

### Error Response

```json
{
  "Success": false,
  "Error": {
    "Code": "E2005",
    "Message": "site not found",
    "Details": "Additional context about the error",
    "Context": {
      "SiteId": 123
    },
    "File": "service.go",
    "Line": 45,
    "Function": "GetById",
    "StackTrace": "...",
    "Timestamp": "2026-02-01T10:30:00Z"
  }
}
```

---

## Endpoints

### Sites

#### List Sites

```
GET /api/v1/sites
```

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1,
      "Name": "Production Site",
      "Url": "https://example.com",
      "Username": "admin",
      "IsActive": true,
      "LastSyncAt": "2026-02-01T10:00:00Z",
      "CreatedAt": "2026-01-15T08:00:00Z",
      "UpdatedAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

#### Get Site

```
GET /api/v1/sites/:id
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Name": "Production Site",
    "Url": "https://example.com",
    "Username": "admin",
    "IsActive": true,
    "LastSyncAt": "2026-02-01T10:00:00Z",
    "CreatedAt": "2026-01-15T08:00:00Z",
    "UpdatedAt": "2026-02-01T10:00:00Z"
  }
}
```

#### Create Site

```
POST /api/v1/sites
```

**Request:**
```json
{
  "Name": "Production Site",
  "Url": "https://example.com",
  "Username": "admin",
  "AppPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

**Response:** Same as Get Site

#### Update Site

```
PUT /api/v1/sites/:id
```

**Request:**
```json
{
  "Name": "Updated Name",
  "AppPassword": "new-password"
}
```

**Response:** Same as Get Site

#### Delete Site

```
DELETE /api/v1/sites/:id
```

**Response:**
```json
{
  "Success": true,
  "Data": null
}
```

#### Test Site Connection

```
POST /api/v1/sites/:id/test
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Success": true,
    "WpVersion": "6.4.2",
    "SiteName": "My WordPress Site",
    "PluginCount": 12
  }
}
```

#### Test Credentials (before saving)

```
POST /api/v1/sites/test
```

**Request:**
```json
{
  "Url": "https://example.com",
  "Username": "admin",
  "AppPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

**Response:** Same as Test Site Connection

---

### Plugins

#### List All Plugins

```
GET /api/v1/plugins
```

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1,
      "Name": "My Plugin",
      "LocalPath": "/Users/dev/plugins/my-plugin",
      "RemoteSlug": "my-plugin",
      "SiteId": 1,
      "IsActive": true,
      "IsWatching": true,
      "LastPublishedAt": "2026-02-01T09:00:00Z",
      "LastHash": "abc123...",
      "CreatedAt": "2026-01-20T12:00:00Z",
      "UpdatedAt": "2026-02-01T09:00:00Z",
      "Site": {
        "Id": 1,
        "Name": "Production Site",
        "Url": "https://example.com"
      }
    }
  ]
}
```

#### List Plugins by Site

```
GET /api/v1/sites/:siteId/plugins
```

**Response:** Same as List All Plugins (filtered by site)

#### Get Plugin

```
GET /api/v1/plugins/:id
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Name": "My Plugin",
    "LocalPath": "/Users/dev/plugins/my-plugin",
    "RemoteSlug": "my-plugin",
    "SiteId": 1,
    "IsActive": true,
    "IsWatching": true,
    "LastPublishedAt": "2026-02-01T09:00:00Z",
    "LastHash": "abc123...",
    "CreatedAt": "2026-01-20T12:00:00Z",
    "UpdatedAt": "2026-02-01T09:00:00Z",
    "Site": {
      "Id": 1,
      "Name": "Production Site",
      "Url": "https://example.com"
    }
  }
}
```

#### Create Plugin

```
POST /api/v1/plugins
```

**Request:**
```json
{
  "Name": "My Plugin",
  "LocalPath": "/Users/dev/plugins/my-plugin",
  "RemoteSlug": "my-plugin",
  "SiteId": 1
}
```

**Response:** Same as Get Plugin

#### Update Plugin

```
PUT /api/v1/plugins/:id
```

**Request:**
```json
{
  "Name": "Updated Plugin Name",
  "IsActive": false
}
```

**Response:** Same as Get Plugin

#### Delete Plugin

```
DELETE /api/v1/plugins/:id
```

**Response:**
```json
{
  "Success": true,
  "Data": null
}
```

#### Scan Directory

```
POST /api/v1/plugins/scan
```

**Request:**
```json
{
  "Path": "/Users/dev/plugins/my-plugin"
}
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Path": "/Users/dev/plugins/my-plugin",
    "IsValid": true,
    "PluginName": "My Custom Plugin",
    "Version": "1.2.0",
    "MainFile": "my-plugin.php",
    "Files": [
      {
        "Path": "my-plugin.php",
        "Size": 4096,
        "Hash": "abc123...",
        "ModifiedAt": "2026-02-01T08:00:00Z",
        "IsDirectory": false
      }
    ],
    "TotalSize": 102400
  }
}
```

#### Set Watching Status

```
PUT /api/v1/plugins/:id/watching
```

**Request:**
```json
{
  "Watching": true
}
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Watching": true
  }
}
```

---

### Sync Operations

#### Get File Changes

```
GET /api/v1/plugins/:id/changes
```

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1,
      "PluginId": 1,
      "FilePath": "includes/class-utils.php",
      "ChangeType": "modified",
      "FileHash": "def456...",
      "IsPending": true,
      "DetectedAt": "2026-02-01T10:15:00Z",
      "CreatedAt": "2026-02-01T10:15:00Z"
    }
  ]
}
```

#### Check Sync Status

```
POST /api/v1/plugins/:id/sync/check
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "PluginId": 1,
    "LocalHash": "abc123...",
    "RemoteHash": "def456...",
    "IsSynced": false,
    "LocalVersion": "1.2.1",
    "RemoteVersion": "1.2.0",
    "ChangedFiles": [
      {
        "Path": "includes/class-utils.php",
        "ChangeType": "modified",
        "LocalHash": "new123...",
        "RemoteHash": "old456..."
      }
    ],
    "NewFiles": ["assets/new-file.js"],
    "DeletedFiles": []
  }
}
```

#### Clear Pending Changes

```
DELETE /api/v1/plugins/:id/changes
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Cleared": 5
  }
}
```

---

### Publish Operations

#### Publish Plugin

```
POST /api/v1/plugins/:id/publish
```

**Request:**
```json
{
  "Mode": "full",
  "CreateBackup": true,
  "Activate": true
}
```

**Modes:**
- `full` — Zip and upload entire plugin
- `single` — Upload only changed files (requires companion plugin)

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Success": true,
    "PluginSlug": "my-plugin",
    "Version": "1.2.1",
    "WasUpdated": true,
    "BackupId": 5,
    "FilesPublished": 1,
    "Duration": 2340
  }
}
```

---

### Backups

#### List Backups for Plugin

```
GET /api/v1/plugins/:id/backups
```

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Id": 5,
      "PluginId": 1,
      "SiteId": 1,
      "FilePath": "backups/my-plugin_2026-02-01_100000.zip",
      "FileSize": 102400,
      "PluginVersion": "1.2.0",
      "CreatedAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

#### Restore Backup

```
POST /api/v1/backups/:id/restore
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Success": true,
    "RestoredVersion": "1.2.0"
  }
}
```

#### Delete Backup

```
DELETE /api/v1/backups/:id
```

**Response:**
```json
{
  "Success": true,
  "Data": null
}
```

---

### Error Logs

#### List Errors

```
GET /api/v1/errors
GET /api/v1/errors?limit=50&level=error
```

**Query Parameters:**
- `limit` (optional): Maximum number of errors to return (default: 100)
- `level` (optional): Filter by level (error, warn, info)
- `code` (optional): Filter by error code

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1,
      "Level": "error",
      "Code": "E3002",
      "Message": "Authentication failed",
      "Context": {
        "SiteUrl": "https://example.com"
      },
      "StackTrace": "...",
      "File": "auth.go",
      "Line": 45,
      "Function": "validateCredentials",
      "CreatedAt": "2026-02-01T10:30:00Z"
    }
  ]
}
```

#### Clear All Errors

```
DELETE /api/v1/errors
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Deleted": 15
  }
}
```

---

### Settings

#### Get Settings

```
GET /api/v1/settings
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Port": 8080,
    "WatchDebounceMs": 500,
    "BackupRetentionDays": 30,
    "MaxBackupsPerPlugin": 10,
    "TempDirectory": ".temp",
    "BackupDirectory": "backups",
    "LogLevel": "info"
  }
}
```

#### Update Settings

```
PUT /api/v1/settings
```

**Request:**
```json
{
  "WatchDebounceMs": 1000,
  "LogLevel": "debug"
}
```

**Response:** Same as Get Settings

---

### Watcher

#### Get Watcher Status

```
GET /api/v1/watcher/status
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "IsRunning": true,
    "WatchedPlugins": 3,
    "PendingChanges": 5,
    "LastEventAt": "2026-02-01T10:28:00Z"
  }
}
```

#### Start Watcher

```
POST /api/v1/watcher/start
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Started": true
  }
}
```

#### Stop Watcher

```
POST /api/v1/watcher/stop
```

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Stopped": true
  }
}
```

---

## Router Implementation

```go
// internal/api/router.go
package api

import (
    "net/http"
    
    "github.com/gorilla/mux"
    
    "wp-plugin-publish/internal/api/handlers"
    "wp-plugin-publish/internal/api/middleware"
    "wp-plugin-publish/internal/logger"
)

func NewRouter(h *handlers.Handlers, log *logger.Logger) *mux.Router {
    r := mux.NewRouter()
    
    // Apply global middleware
    r.Use(middleware.Logging(log))
    r.Use(middleware.Recovery(log))
    r.Use(middleware.CORS())
    
    // API v1 routes
    api := r.PathPrefix("/api/v1").Subrouter()
    
    // Sites
    api.HandleFunc("/sites", h.Sites.List).Methods(httpmethod.Get.String())
    api.HandleFunc("/sites", h.Sites.Create).Methods(httpmethod.Post.String())
    api.HandleFunc("/sites/test", h.Sites.TestCredentials).Methods(httpmethod.Post.String())
    api.HandleFunc("/sites/{id:[0-9]+}", h.Sites.Get).Methods(httpmethod.Get.String())
    api.HandleFunc("/sites/{id:[0-9]+}", h.Sites.Update).Methods(httpmethod.Put.String())
    api.HandleFunc("/sites/{id:[0-9]+}", h.Sites.Delete).Methods(httpmethod.Delete.String())
    api.HandleFunc("/sites/{id:[0-9]+}/test", h.Sites.TestConnection).Methods(httpmethod.Post.String())
    api.HandleFunc("/sites/{id:[0-9]+}/plugins", h.Plugins.ListBySite).Methods(httpmethod.Get.String())
    
    // Plugins
    api.HandleFunc("/plugins", h.Plugins.List).Methods(httpmethod.Get.String())
    api.HandleFunc("/plugins", h.Plugins.Create).Methods(httpmethod.Post.String())
    api.HandleFunc("/plugins/scan", h.Plugins.Scan).Methods(httpmethod.Post.String())
    api.HandleFunc("/plugins/{id:[0-9]+}", h.Plugins.Get).Methods(httpmethod.Get.String())
    api.HandleFunc("/plugins/{id:[0-9]+}", h.Plugins.Update).Methods(httpmethod.Put.String())
    api.HandleFunc("/plugins/{id:[0-9]+}", h.Plugins.Delete).Methods(httpmethod.Delete.String())
    api.HandleFunc("/plugins/{id:[0-9]+}/watching", h.Plugins.SetWatching).Methods(httpmethod.Put.String())
    api.HandleFunc("/plugins/{id:[0-9]+}/changes", h.Sync.GetChanges).Methods(httpmethod.Get.String())
    api.HandleFunc("/plugins/{id:[0-9]+}/changes", h.Sync.ClearChanges).Methods(httpmethod.Delete.String())
    api.HandleFunc("/plugins/{id:[0-9]+}/sync/check", h.Sync.Check).Methods(httpmethod.Post.String())
    api.HandleFunc("/plugins/{id:[0-9]+}/publish", h.Publish.Publish).Methods(httpmethod.Post.String())
    api.HandleFunc("/plugins/{id:[0-9]+}/backups", h.Backup.List).Methods(httpmethod.Get.String())
    
    // Backups
    api.HandleFunc("/backups/{id:[0-9]+}", h.Backup.Delete).Methods(httpmethod.Delete.String())
    api.HandleFunc("/backups/{id:[0-9]+}/restore", h.Backup.Restore).Methods(httpmethod.Post.String())
    
    // Errors
    api.HandleFunc("/errors", h.Errors.List).Methods(httpmethod.Get.String())
    api.HandleFunc("/errors", h.Errors.Clear).Methods(httpmethod.Delete.String())
    
    // Settings
    api.HandleFunc("/settings", h.Settings.Get).Methods(httpmethod.Get.String())
    api.HandleFunc("/settings", h.Settings.Update).Methods(httpmethod.Put.String())
    
    // Watcher
    api.HandleFunc("/watcher/status", h.Watcher.Status).Methods(httpmethod.Get.String())
    api.HandleFunc("/watcher/start", h.Watcher.Start).Methods(httpmethod.Post.String())
    api.HandleFunc("/watcher/stop", h.Watcher.Stop).Methods(httpmethod.Post.String())
    
    return r
}
```

---

## CORS Middleware

```go
// internal/api/middleware/cors.go
package middleware

import "net/http"

func CORS() func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Only allow localhost origins
            origin := r.Header.Get("Origin")
            if origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000" {
                w.Header().Set("Access-Control-Allow-Origin", origin)
                w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                w.Header().Set("Access-Control-Max-Age", "86400")
            }
            
            if r.Method == "OPTIONS" {
                w.WriteHeader(http.StatusOK)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}
```

---

## Next Document

See [12-websocket-events.md](./12-websocket-events.md) for real-time notifications.
