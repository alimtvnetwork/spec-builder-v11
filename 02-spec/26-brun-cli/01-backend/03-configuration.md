# Configuration

**Version:** 4.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Configuration schema and options for the Build Runner CLI (`brun`). Uses JSON format for consistency with the gsearch CLI.

**Cross-References:**
- [CLI Interface](./02-cli-interface.md)
- [Build Profiles](./07-build-profiles.md)
- [Asset Operations](./08-asset-operations.md)

---

## Configuration File Location

Default search order:
1. `--config` flag value
2. `./config.json` (current directory)
3. `~/.brun/config.json` (user home)
4. `/etc/brun/config.json` (system-wide, Linux/macOS)

---

## Complete Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "brun-config-schema",
  "title": "Build Runner CLI Configuration",
  "type": "object",
  "properties": {
    "Version": {
      "type": "string",
      "description": "Configuration schema version",
      "default": "1.0.0"
    },
    "Runtimes": {
      "type": "object",
      "description": "Runtime executable paths",
      "properties": {
        "PowerShell": {
          "type": "object",
          "properties": {
            "Path": { "type": "string", "default": "pwsh" },
            "Args": { "type": "array", "items": { "type": "string" }, "default": ["-NoProfile", "-NonInteractive"] }
          }
        },
        "NodeJs": {
          "type": "object",
          "properties": {
            "Path": { "type": "string", "default": "node" },
            "PackageManager": { "type": "string", "enum": ["npm", "yarn", "bun"], "default": "npm" }
          }
        },
        "Golang": {
          "type": "object",
          "properties": {
            "Path": { "type": "string", "default": "go" },
            "ModTidy": { "type": "string", "enum": ["skip", "run", "force"], "default": "run" },
            "BuildFlags": { "type": "array", "items": { "type": "string" }, "default": ["-v"] }
          }
        }
      }
    },
    "Ports": {
      "type": "object",
      "description": "Port management configuration",
      "properties": {
        "Default": { "type": "integer", "default": 8080 },
        "Fallback": {
          "type": "array",
          "items": { "type": "integer" },
          "default": [8081, 8082, 8083, 8084, 8085]
        },
        "CheckTimeout": { "type": "string", "default": "5s" },
        "Firewall": {
          "type": "object",
          "properties": {
            "Enabled": { "type": "boolean", "default": false },
            "AutoEnable": { "type": "boolean", "default": false },
            "RuleName": { "type": "string", "default": "brun" }
          }
        }
      }
    },
    "Logging": {
      "type": "object",
      "description": "Logging configuration",
      "properties": {
        "Enabled": { "type": "boolean", "default": true },
        "Directory": { "type": "string", "default": "./logs" },
        "CreateRunFolders": { "type": "boolean", "default": true },
        "KeepRuns": { "type": "integer", "default": 50 },
        "Files": {
          "type": "object",
          "properties": {
            "Stdout": { "type": "string", "default": "log.txt" },
            "Stderr": { "type": "string", "default": "error.txt" },
            "Combined": { "type": "string", "default": "combined.txt" }
          }
        },
        "IncludeStackTrace": { "type": "boolean", "default": true }
      }
    },
    "Output": {
      "type": "object",
      "description": "Output configuration",
      "properties": {
        "Format": { "type": "string", "enum": ["text", "json"], "default": "text" },
        "ColorEnabled": { "type": "boolean", "default": true },
        "Timestamps": { "type": "boolean", "default": true },
        "JsonPretty": { "type": "boolean", "default": true }
      }
    },
    "WorkDirectory": {
      "type": "string",
      "description": "Base working directory for all operations. Can be overridden to work on any directory.",
      "default": "."
    },
    "AllowExternalDirs": {
      "type": "boolean",
      "description": "Allow working on directories outside the default WorkDirectory",
      "default": false
    },
    "Execution": {
      "type": "object",
      "description": "Execution defaults",
      "properties": {
        "Timeout": { "type": "string", "default": "5m" },
        "Concurrent": { "type": "boolean", "default": true },
        "MaxRetries": { "type": "integer", "default": 0 },
        "RetryDelay": { "type": "string", "default": "1s" }
      }
    },
    "Applications": {
      "type": "array",
      "description": "Named application definitions with health check configuration",
      "items": { "$ref": "#/$defs/ApplicationDef" }
    },
    "Profiles": {
      "type": "array",
      "description": "Saved build profiles",
      "items": { "$ref": "#/$defs/BuildProfile" }
    }
  },
  "$defs": {
    "BuildProfile": {
      "type": "object",
      "required": ["Name"],
      "properties": {
        "Name": { "type": "string" },
        "Description": { "type": "string" },
        "Runtime": { "type": "string", "enum": ["powershell", "nodejs", "golang"] },
        "Source": { "type": "string" },
        "Output": { "type": "string" },
        "Command": { "type": "string" },
        "Args": { "type": "array", "items": { "type": "string" } },
        "Env": { "type": "object", "additionalProperties": { "type": "string" } },
        "Workdir": { "type": "string" },
        "Timeout": { "type": "string" },
        "PreCommands": { "type": "array", "items": { "type": "string" } },
        "PostCommands": { "type": "array", "items": { "type": "string" } },
        "Assets": { "$ref": "#/$defs/AssetConfig" },
        "Port": { "type": "integer" }
      }
    },
    "AssetConfig": {
      "type": "object",
      "properties": {
        "Enabled": { "type": "boolean", "default": false },
        "Operations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "Source": { "type": "string" },
              "Destination": { "type": "string" },
              "Mode": { "type": "string", "enum": ["copy", "clear-copy", "override", "skip-existing"] },
              "Pattern": { "type": "string" },
              "Exclude": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    },
    "ApplicationDef": {
      "type": "object",
      "required": ["Name"],
      "description": "Named application definition for health checks and monitoring",
      "properties": {
        "Name": { "type": "string", "description": "Unique application identifier" },
        "Description": { "type": "string" },
        "HealthCheck": {
          "type": "object",
          "properties": {
            "Enabled": { "type": "boolean", "default": true },
            "Url": { "type": "string", "description": "Health check URL (e.g., http://localhost:8080/health)" },
            "Host": { "type": "string", "default": "localhost" },
            "Port": { "type": "integer" },
            "Path": { "type": "string", "default": "/" },
            "Method": { "type": "string", "enum": ["GET", "HEAD"], "default": "GET" },
            "Timeout": { "type": "string", "default": "5s" },
            "Interval": { "type": "string", "default": "1s" },
            "Retries": { "type": "integer", "default": 30 },
            "ExpectedStatus": { "type": "array", "items": { "type": "integer" }, "default": [200] },
            "ExpectedBody": { "type": "string", "description": "Expected response body substring" }
          }
        },
        "Profile": { "type": "string", "description": "Associated build profile name" },
        "Ports": {
          "type": "object",
          "properties": {
            "Primary": { "type": "integer" },
            "Fallback": { "type": "array", "items": { "type": "integer" } }
          }
        },
        "Workdir": { "type": "string", "description": "Custom working directory for this application" }
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
  "Runtimes": {
    "PowerShell": {
      "Path": "pwsh",
      "Args": ["-NoProfile", "-NonInteractive"]
    },
    "NodeJs": {
      "Path": "node",
      "PackageManager": "bun"
    },
    "Golang": {
      "Path": "go",
      "ModTidy": "run",
      "BuildFlags": ["-v", "-ldflags", "-s -w"]
    }
  },
  "Ports": {
    "Default": 8080,
    "Fallback": [8081, 8082, 8083],
    "CheckTimeout": "5s",
    "Firewall": {
      "Enabled": true,
      "AutoEnable": false,
      "RuleName": "brun-app"
    }
  },
  "Logging": {
    "Enabled": true,
    "Directory": "./logs",
    "CreateRunFolders": true,
    "KeepRuns": 50,
    "Files": {
      "Stdout": "log.txt",
      "Stderr": "error.txt",
      "Combined": "combined.txt"
    },
    "IncludeStackTrace": true
  },
  "Output": {
    "Format": "text",
    "ColorEnabled": true,
    "Timestamps": true,
    "JsonPretty": true
  },
  "Execution": {
    "Timeout": "5m",
    "Concurrent": true,
    "MaxRetries": 0,
    "RetryDelay": "1s"
  },
  "WorkDirectory": ".",
  "AllowExternalDirs": false,
  "Applications": [
    {
      "Name": "BackendApi",
      "Description": "Go backend API server",
      "HealthCheck": {
        "Enabled": true,
        "Host": "localhost",
        "Port": 8080,
        "Path": "/health",
        "Method": "GET",
        "Timeout": "5s",
        "Interval": "1s",
        "Retries": 30,
        "ExpectedStatus": [200]
      },
      "Profile": "backend-api",
      "Ports": {
        "Primary": 8080,
        "Fallback": [8081, 8082]
      }
    },
    {
      "Name": "FrontendDev",
      "Description": "React frontend development server",
      "HealthCheck": {
        "Enabled": true,
        "Host": "localhost",
        "Port": 3000,
        "Path": "/",
        "Timeout": "10s",
        "Retries": 60,
        "ExpectedStatus": [200, 304]
      },
      "Profile": "frontend",
      "Ports": {
        "Primary": 3000,
        "Fallback": [3001, 3002]
      }
    }
  ],
  "Profiles": [
    {
      "Name": "backend-api",
      "Description": "Build the Go backend API",
      "Runtime": "golang",
      "Source": "./cmd/api",
      "Output": "./bin/api",
      "PreCommands": ["go mod tidy"],
      "Env": {
        "CGO_ENABLED": "1",
        "GOOS": "linux"
      },
      "Port": 8080
    },
    {
      "Name": "frontend",
      "Description": "Build React frontend",
      "Runtime": "nodejs",
      "Source": "./frontend",
      "Command": "build",
      "Assets": {
        "Enabled": true,
        "Operations": [
          {
            "Source": "./frontend/dist",
            "Destination": "./public",
            "Mode": "clear-copy"
          }
        ]
      }
    },
    {
      "Name": "deploy-script",
      "Description": "Run deployment PowerShell script",
      "Runtime": "powershell",
      "Source": "./scripts/deploy.ps1",
      "Args": ["-Environment", "production"]
    }
  ]
}
```

---

## Environment Variable Overrides

All configuration values can be overridden via environment variables with the `BRUN_` prefix:

| Config Key | Environment Variable |
|------------|---------------------|
| `Runtimes.Golang.Path` | `BRUN_RUNTIMES_GOLANG_PATH` |
| `Ports.Default` | `BRUN_PORTS_DEFAULT` |
| `Logging.Directory` | `BRUN_LOGGING_DIRECTORY` |
| `Output.Format` | `BRUN_OUTPUT_FORMAT` |

---

## Configuration Keys Summary

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Version` | string | `1.0.0` | Schema version |
| `Runtimes.PowerShell.Path` | string | `pwsh` | PowerShell executable |
| `Runtimes.PowerShell.Args` | array | `["-NoProfile", "-NonInteractive"]` | Default PS args |
| `Runtimes.NodeJs.Path` | string | `node` | Node.js executable |
| `Runtimes.NodeJs.PackageManager` | string | `npm` | npm, yarn, or bun |
| `Runtimes.Golang.Path` | string | `go` | Go executable |
| `Runtimes.Golang.ModTidy` | string | `run` | skip, run, force |
| `Runtimes.Golang.BuildFlags` | array | `["-v"]` | Go build flags |
| `Ports.Default` | int | `8080` | Default port |
| `Ports.Fallback` | array | `[8081-8085]` | Fallback ports |
| `Ports.CheckTimeout` | duration | `5s` | Port check timeout |
| `Ports.Firewall.Enabled` | bool | `false` | Enable firewall ops |
| `Ports.Firewall.AutoEnable` | bool | `false` | Auto-add rules |
| `Logging.Enabled` | bool | `true` | Enable file logging |
| `Logging.Directory` | string | `./logs` | Log directory |
| `Logging.CreateRunFolders` | bool | `true` | Create per-run folders |
| `Logging.KeepRuns` | int | `50` | Max runs to keep |
| `Logging.IncludeStackTrace` | bool | `true` | Include stack traces |
| `Output.Format` | string | `text` | text or json |
| `Output.ColorEnabled` | bool | `true` | Color output |
| `Execution.Timeout` | duration | `5m` | Default timeout |
| `Execution.Concurrent` | bool | `true` | Concurrent checks |

---

## Go Configuration Structs

```go
package config

import (
    "github.com/brun-cli/internal/enums/copymodetype"
    "github.com/brun-cli/internal/enums/httpmethodtype"
    "github.com/brun-cli/internal/enums/modtidymodetype"
    "github.com/brun-cli/internal/enums/outputformattype"
    "github.com/brun-cli/internal/enums/packagemanagertype"
    "github.com/brun-cli/internal/enums/runtimetype"
)

// Config represents the root configuration
type Config struct {
    Version           string
    Runtimes          RuntimesConfig
    Ports             PortsConfig
    Logging           LoggingConfig
    Output            OutputConfig
    WorkDirectory     string
    AllowExternalDirs bool
    Execution         ExecutionConfig
    Applications      []ApplicationDef
    Profiles          []BuildProfile
}

// RuntimesConfig contains runtime executable paths
type RuntimesConfig struct {
    PowerShell PowerShellConfig
    NodeJs     NodeJsConfig
    Golang     GolangConfig
}

// PowerShellConfig for PowerShell runtime
type PowerShellConfig struct {
    Path string
    Args []string
}

// NodeJsConfig for Node.js runtime
type NodeJsConfig struct {
    Path           string
    PackageManager package_manager.Variant
}

// GolangConfig for Go runtime
type GolangConfig struct {
    Path       string
    ModTidy    mod_tidy_mode.Variant
    BuildFlags []string
}

// PortsConfig for port management
type PortsConfig struct {
    Default      int
    Fallback     []int
    CheckTimeout string
    Firewall     FirewallConfig
}

// FirewallConfig for firewall rules
type FirewallConfig struct {
    Enabled    bool
    AutoEnable bool
    RuleName   string
}

// LoggingConfig for logging settings
type LoggingConfig struct {
    Enabled           bool
    Directory         string
    CreateRunFolders  bool
    KeepRuns          int
    Files             LogFiles
    IncludeStackTrace bool
}

// LogFiles defines log file names
type LogFiles struct {
    Stdout   string
    Stderr   string
    Combined string
}

// OutputConfig for output settings
type OutputConfig struct {
    Format       output_format.Variant
    ColorEnabled bool
    Timestamps   bool
    JsonPretty   bool
}

// ExecutionConfig for execution defaults
type ExecutionConfig struct {
    Timeout    string
    Concurrent bool
    MaxRetries int
    RetryDelay string
}

// ApplicationDef defines a named application
type ApplicationDef struct {
    Name        string
    Description string            `json:",omitempty"`
    HealthCheck HealthCheckConfig
    Profile     string            `json:",omitempty"`
    Ports       AppPortsConfig    `json:",omitempty"`
    Workdir     string            `json:",omitempty"`
}

// HealthCheckConfig for health check settings
type HealthCheckConfig struct {
    Enabled        bool
    Url            string              `json:",omitempty"`
    Host           string
    Port           int
    Path           string
    Method         http_method.Variant
    Timeout        string
    Interval       string
    Retries        int
    ExpectedStatus []int
    ExpectedBody   string              `json:",omitempty"`
}

// AppPortsConfig for application ports
type AppPortsConfig struct {
    Primary  int
    Fallback []int `json:",omitempty"`
}

// BuildProfile defines a build profile
type BuildProfile struct {
    Name         string
    Description  string            `json:",omitempty"`
    Runtime      runtime.Variant
    Source       string            `json:",omitempty"`
    Output       string            `json:",omitempty"`
    Command      string            `json:",omitempty"`
    Args         []string          `json:",omitempty"`
    Env          map[string]string `json:",omitempty"`
    Workdir      string            `json:",omitempty"`
    Timeout      string            `json:",omitempty"`
    PreCommands  []string          `json:",omitempty"`
    PostCommands []string          `json:",omitempty"`
    Assets       AssetConfig       `json:",omitempty"`
    Port         int               `json:",omitempty"`
}

// AssetConfig for asset operations
type AssetConfig struct {
    Enabled    bool
    Operations []AssetOperation `json:",omitempty"`
}

// AssetOperation defines a single asset operation
type AssetOperation struct {
    Source      string
    Destination string
    Mode        copy_mode.Variant
    Pattern     string   `json:",omitempty"`
    Exclude     []string `json:",omitempty"`
}
```

---

## Cross-References

- [Enum Architecture](./19-enum-architecture.md) - Type-safe enums for configuration values
- [Build Profiles](./07-build-profiles.md)
- [Asset Operations](./08-asset-operations.md)
- [Port Management](./05-port-management.md)
