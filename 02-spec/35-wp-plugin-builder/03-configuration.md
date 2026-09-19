# Configuration

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Configuration schema for WP Plugin Builder, with automatic seeding on first run or version change.

**Cross-References:**
- [CLI Interface](./02-cli-interface.md)
- [BRun Configuration](../26-brun-cli/01-backend/03-configuration.md)
- [GSearch Configuration](../25-gsearch-cli/01-backend/02-configuration.md)

---

## Configuration File Location

Default search order:
1. `--config` flag value
2. `./wpb.json` (current directory)
3. `~/.wpb/wpb.json` (user home)
4. `/etc/wpb/wpb.json` (system-wide, Linux/macOS)

---

## Seeding Behavior

Configuration is seeded automatically when:
1. **First Run:** No config file exists
2. **Version Change:** Config version differs from binary version
3. **Manual:** `wpb config init --force`

### Seeding Process

```go
func SeedConfig(force bool) error {
    configPath := getConfigPath()
    
    // Check if seeding needed
    if !force && fileExists(configPath) {
        existing := loadConfig(configPath)
        if existing.Version == BinaryVersion {
            return nil // Already seeded with current version
        }
        // Backup and migrate
        backup(configPath)
    }
    
    // Create default config
    config := DefaultConfig()
    config.Version = BinaryVersion
    config.SeededAt = time.Now()
    
    return writeConfig(configPath, config)
}
```

---

## Complete Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "wpb-config-schema",
  "title": "WP Plugin Builder Configuration",
  "type": "object",
  "properties": {
    "Version": {
      "type": "string",
      "description": "Configuration schema version",
      "default": "1.0.0"
    },
    "SeededAt": {
      "type": "string",
      "format": "date-time",
      "description": "When config was last seeded"
    },
    "Database": {
      "type": "object",
      "description": "Database configuration",
      "properties": {
        "RootPath": {
          "type": "string",
          "default": "~/.wpb/wpb.sqlite",
          "description": "Path to root database"
        },
        "ProjectDir": {
          "type": "string",
          "default": "~/.wpb/projects",
          "description": "Directory for project databases"
        },
        "BackupEnabled": {
          "type": "boolean",
          "default": true
        },
        "BackupRetention": {
          "type": "integer",
          "default": 7,
          "description": "Days to keep backups"
        }
      }
    },
    "AiBridge": {
      "type": "object",
      "description": "AI Bridge connection settings",
      "properties": {
        "Url": {
          "type": "string",
          "default": "http://localhost:5040",
          "description": "AI Bridge endpoint"
        },
        "Timeout": {
          "type": "string",
          "default": "60s",
          "description": "Request timeout"
        },
        "Retries": {
          "type": "integer",
          "default": 3
        },
        "RetryDelay": {
          "type": "string",
          "default": "1s"
        },
        "Model": {
          "type": "string",
          "default": "",
          "description": "Preferred model (empty = AI Bridge default)"
        }
      }
    },
    "Rag": {
      "type": "object",
      "description": "RAG system configuration",
      "properties": {
        "ChunkSize": {
          "type": "integer",
          "default": 1000,
          "description": "Text chunk size for embedding"
        },
        "ChunkOverlap": {
          "type": "integer",
          "default": 200,
          "description": "Overlap between chunks"
        },
        "TopK": {
          "type": "integer",
          "default": 5,
          "description": "Number of results to retrieve"
        },
        "MinSimilarity": {
          "type": "number",
          "default": 0.7,
          "description": "Minimum similarity score (0-1)"
        },
        "EmbeddingModel": {
          "type": "string",
          "default": "",
          "description": "Embedding model (empty = AI Bridge default)"
        }
      }
    },
    "Generation": {
      "type": "object",
      "description": "Code generation settings",
      "properties": {
        "OutputDir": {
          "type": "string",
          "default": "./plugins",
          "description": "Default output directory"
        },
        "OverwriteMode": {
          "type": "string",
          "description": "Uses overwrite_mode.Variant — see 15-enum-architecture.md",
          "enum": ["skip", "overwrite", "backup"],
          "default": "backup"
        },
        "Validate": {
          "type": "boolean",
          "default": true,
          "description": "Validate generated code"
        },
        "Formatting": {
          "type": "object",
          "properties": {
            "IndentStyle": {
              "type": "string",
              "description": "Uses indent_style.Variant — see 15-enum-architecture.md",
              "enum": ["tabs", "spaces"],
              "default": "tabs"
            },
            "IndentSize": {
              "type": "integer",
              "default": 4
            },
            "LineEnding": {
              "type": "string",
              "description": "Uses line_ending.Variant — see 15-enum-architecture.md",
              "enum": ["lf", "crlf"],
              "default": "lf"
            }
          }
        },
        "Templates": {
          "type": "object",
          "description": "Custom template paths",
          "properties": {
            "Plugin": { "type": "string" },
            "Class": { "type": "string" },
            "Admin": { "type": "string" },
            "Public": { "type": "string" }
          }
        }
      }
    },
    "Server": {
      "type": "object",
      "description": "Server mode configuration",
      "properties": {
        "Host": {
          "type": "string",
          "default": "localhost"
        },
        "Port": {
          "type": "integer",
          "default": 8090
        },
        "Cors": {
          "type": "boolean",
          "default": true
        },
        "CorsOrigins": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["*"]
        },
        "RateLimit": {
          "type": "object",
          "properties": {
            "Enabled": { "type": "boolean", "default": true },
            "RequestsPerMinute": { "type": "integer", "default": 60 }
          }
        }
      }
    },
    "Logging": {
      "type": "object",
      "description": "Logging configuration",
      "properties": {
        "Level": {
          "type": "string",
          "description": "Uses log_level.Variant — see 15-enum-architecture.md",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info"
        },
        "Format": {
          "type": "string",
          "description": "Uses log_format.Variant — see 15-enum-architecture.md",
          "enum": ["text", "json"],
          "default": "text"
        },
        "Directory": {
          "type": "string",
          "default": "~/.wpb/logs"
        },
        "MaxSize": {
          "type": "string",
          "default": "10MB"
        },
        "MaxFiles": {
          "type": "integer",
          "default": 5
        },
        "IncludeStackTrace": {
          "type": "boolean",
          "default": true
        }
      }
    },
    "Wordpress": {
      "type": "object",
      "description": "WordPress-specific defaults",
      "properties": {
        "MinVersion": {
          "type": "string",
          "default": "6.0"
        },
        "TestedUpTo": {
          "type": "string",
          "default": "6.4"
        },
        "RequiresPhp": {
          "type": "string",
          "default": "7.4"
        },
        "License": {
          "type": "string",
          "default": "GPL-2.0-or-later"
        },
        "LicenseUri": {
          "type": "string",
          "default": "https://www.gnu.org/licenses/gpl-2.0.html"
        }
      }
    },
    "Presets": {
      "type": "object",
      "description": "Preset loading configuration",
      "properties": {
        "AutoLoad": {
          "type": "array",
          "items": { "type": "string" },
          "default": [],
          "description": "Presets to load on project creation"
        },
        "Directory": {
          "type": "string",
          "default": "~/.wpb/presets",
          "description": "Custom presets directory"
        }
      }
    }
  }
}
```

---

## Example Configuration

```json
{
  "Version": "1.0.0",
  "SeededAt": "2026-02-01T10:00:00Z",
  "Database": {
    "RootPath": "~/.wpb/wpb.sqlite",
    "ProjectDir": "~/.wpb/projects",
    "BackupEnabled": true,
    "BackupRetention": 7
  },
  "AiBridge": {
    "Url": "http://localhost:5040",
    "Timeout": "60s",
    "Retries": 3,
    "RetryDelay": "1s",
    "Model": ""
  },
  "Rag": {
    "ChunkSize": 1000,
    "ChunkOverlap": 200,
    "TopK": 5,
    "MinSimilarity": 0.7,
    "EmbeddingModel": ""
  },
  "Generation": {
    "OutputDir": "./plugins",
    "OverwriteMode": "backup",
    "Validate": true,
    "Formatting": {
      "IndentStyle": "tabs",
      "IndentSize": 4,
      "LineEnding": "lf"
    }
  },
  "Server": {
    "Host": "localhost",
    "Port": 8090,
    "Cors": true,
    "CorsOrigins": ["*"],
    "RateLimit": {
      "Enabled": true,
      "RequestsPerMinute": 60
    }
  },
  "Logging": {
    "Level": "info",
    "Format": "text",
    "Directory": "~/.wpb/logs",
    "MaxSize": "10MB",
    "MaxFiles": 5,
    "IncludeStackTrace": true
  },
  "Wordpress": {
    "MinVersion": "6.0",
    "TestedUpTo": "6.4",
    "RequiresPhp": "7.4",
    "License": "GPL-2.0-or-later",
    "LicenseUri": "https://www.gnu.org/licenses/gpl-2.0.html"
  },
  "Presets": {
    "AutoLoad": ["wordpress-core-standards"],
    "Directory": "~/.wpb/presets"
  }
}
```

---

## Environment Variable Overrides

All configuration values can be overridden via environment variables with the `WPB_` prefix:

| Config Key | Environment Variable |
|------------|---------------------|
| `Database.RootPath` | `WPB_DATABASE_ROOTPATH` |
| `AiBridge.Url` | `WPB_AIBRIDGE_URL` |
| `Server.Port` | `WPB_SERVER_PORT` |
| `Logging.Level` | `WPB_LOGGING_LEVEL` |

---

## Migration on Version Change

When binary version changes:

1. Backup existing config: `wpb.json.bak.{timestamp}`
2. Load existing values
3. Apply new defaults for new fields
4. Preserve user customizations
5. Write merged config
6. Update `version` and `seededAt`

---

## See Also

- [CLI Interface](./02-cli-interface.md)
- [Database Schema](./04-database-schema.md)
- [Error Handling](./10-error-handling.md)
