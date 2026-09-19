# Build Profiles

**Version:** 4.1.0  
**Status:** Active  
**Updated:** 2026-03-12

---

## Overview

Saved build configurations that can be referenced by name. Stored in config.json and managed via CLI.

**Cross-References:**
- [Configuration](./03-configuration.md)
- [Asset Operations](./08-asset-operations.md)
- [Enum Architecture](./19-enum-architecture.md)
- [CLI Interface](./02-cli-interface.md)

---

## Build Profile Schema

```go
import "internal/enums/runtime"

type BuildProfile struct {
    Name         string            `json:",omitempty"`
    Description  string            `json:",omitempty"`
    Runtime      runtime.Variant   // Type-safe runtime enum
    Source       string            `json:",omitempty"` // Source path or script
    Output       string            `json:",omitempty"`
    Command      string            `json:",omitempty"` // For Node.js: build, dev, etc.
    Args         []string          `json:",omitempty"`
    Env          map[string]string `json:",omitempty"`
    WorkDir      string            `json:",omitempty"`
    Timeout      string            `json:",omitempty"`
    PreCommands  []string          `json:",omitempty"`
    PostCommands []string          `json:",omitempty"`
    Assets       *AssetConfig      `json:",omitempty"`
    Port         int               `json:",omitempty"`
}
```

---

## Profile Examples

### Go Backend API

```json
{
  "name": "backend-api",
  "description": "Build the Go backend API server",
  "runtime": "golang",
  "source": "./cmd/api",
  "output": "./bin/api",
  "preCommands": ["go mod tidy"],
  "env": {
    "CGO_ENABLED": "1",
    "GOOS": "linux",
    "GOARCH": "amd64"
  },
  "args": ["-ldflags", "-s -w"],
  "port": 8080
}
```

### React Frontend

```json
{
  "name": "frontend",
  "description": "Build React frontend with Vite",
  "runtime": "nodejs",
  "source": "./frontend",
  "command": "build",
  "env": {
    "NODE_ENV": "production"
  },
  "assets": {
    "enabled": true,
    "operations": [
      {
        "source": "./frontend/dist",
        "destination": "./public",
        "mode": "clear-copy"
      }
    ]
  }
}
```

### PowerShell Deployment

```json
{
  "name": "deploy-prod",
  "description": "Run production deployment script",
  "runtime": "powershell",
  "source": "./scripts/deploy.ps1",
  "args": ["-Environment", "production", "-Force"],
  "timeout": "30m"
}
```

### Development Server

```json
{
  "name": "dev-server",
  "description": "Run development server with hot reload",
  "runtime": "golang",
  "source": "./cmd/server",
  "preCommands": ["go mod tidy"],
  "env": {
    "APP_ENV": "development",
    "DEBUG": "true"
  },
  "port": 3000
}
```

---

## Profile Manager

```go
type ProfileManager struct {
    config   *Config
    profiles map[string]*BuildProfile
}

func (pm *ProfileManager) Get(name string) appfault.Result[*BuildProfile] {
    profile, exists := pm.profiles[name]
    if !exists {
        return appfault.FailNew[*BuildProfile](
            "E7201",
            "profile not found: "+name,
        )
    }

    return appfault.Ok(profile)
}

func (pm *ProfileManager) Add(profile *BuildProfile) *appfault.AppError {
    if _, exists := pm.profiles[profile.Name]; exists {
        return appfault.New(
            "E7202",
            "profile already exists: "+profile.Name,
        )
    }
    
    if validationErr := pm.validate(profile); validationErr != nil {
        return validationErr
    }
    
    pm.profiles[profile.Name] = profile

    return pm.save()
}

func (pm *ProfileManager) Remove(name string) *appfault.AppError {
    if _, exists := pm.profiles[name]; !exists {
        return appfault.New(
            "E7201",
            "profile not found: "+name,
        )
    }
    
    delete(pm.profiles, name)

    return pm.save()
}

func (pm *ProfileManager) List() []*BuildProfile {
    profiles := make([]*BuildProfile, 0, len(pm.profiles))
    for _, p := range pm.profiles {
        profiles = append(profiles, p)
    }

    return profiles
}

func (pm *ProfileManager) validate(profile *BuildProfile) *appfault.AppError {
    if profile.Name == "" {
        return appfault.New("E7203", "profile name is required")
    }
    
    // Use enum's IsValid() method for validation
    if profile.Runtime.IsInvalid() {
        return appfault.New(
            "E7204",
            "invalid runtime: "+profile.Runtime.String(),
        )
    }
    
    if profile.Source == "" && profile.Command == "" {
        return appfault.New("E7205", "source or command is required")
    }
    
    return nil
}
```

---

## Profile Execution

```go
func (e *ExecutionEngine) ExecuteProfile(context context.Context, profileName string) appfault.Result[ExecutionResult] {
    // Get profile
    profileResult := e.profileManager.Get(profileName)
    if profileResult.IsErr() {
        return appfault.Fail[ExecutionResult](profileResult.Err())
    }
    profile := profileResult.Value()
    
    // Build command from profile
    cmd := &Command{
        Type:        profile.Runtime,
        Script:      profile.Source,
        Args:        profile.Args,
        WorkDir:     profile.WorkDir,
        Env:         profile.Env,
        PreCommands: profile.PreCommands,
    }
    
    // Parse timeout
    if profile.Timeout != "" {
        cmd.Timeout, _ = time.ParseDuration(profile.Timeout)
    } else {
        cmd.Timeout = e.config.Execution.Timeout
    }
    
    // Execute pre-commands
    for _, preCmd := range cmd.PreCommands {
        preCmdResult := e.executeShellCommand(context, preCmd, cmd.WorkDir)
        if preCmdResult.IsErr() {
            return appfault.Fail[ExecutionResult](
                appfault.Wrap(preCmdResult.Err(), 7201, "pre-command failed"),
            )
        }
    }
    
    // Get executor for runtime
    executorResult := e.factory.Create(profile.Runtime)
    if executorResult.IsErr() {
        return appfault.Fail[ExecutionResult](executorResult.Err())
    }
    executor := executorResult.Value()
    
    // Handle port if specified
    if profile.Port > 0 {
        return e.executeWithPort(context, cmd, profile.Port)
    }
    
    // Execute main command
    result := executor.Execute(context, cmd)
    if result.IsErr() {
        return result
    }
    executionResult := result.Value()
    
    // Execute post-commands if build succeeded
    if executionResult.Success && len(profile.PostCommands) > 0 {
        for _, postCmd := range profile.PostCommands {
            postResult := e.executeShellCommand(context, postCmd, cmd.WorkDir)
            if postResult.IsErr() {
                e.logger.Warn("Post-command failed", "command", postCmd, "error", postResult.Err())
            }
        }
    }
    
    // Handle assets
    if profile.Assets != nil && profile.Assets.Enabled && executionResult.Success {
        if assetErr := e.assetCopier.Execute(profile.Assets); assetErr != nil {
            executionResult.Warnings = append(executionResult.Warnings, BuildError{
                Message:  "Asset copy failed: " + assetErr.Error(),
                Severity: severity.Warning, // Use enum instead of string
            })
        }
    }
    
    return result
}
```

---

## CLI Commands

### Add Profile

```bash
# Add simple Go profile
brun config add-profile \
  --name backend-api \
  --runtime golang \
  --source ./cmd/api \
  --output ./bin/api

# Add with full options
brun config add-profile \
  --name frontend \
  --runtime nodejs \
  --source ./frontend \
  --command build \
  --env "NODE_ENV=production"
```

### List Profiles

```bash
brun config show --profiles

# Output:
# Profiles:
#   backend-api    golang      Build the Go backend API
#   frontend       nodejs      Build React frontend
#   deploy-prod    powershell  Run production deployment
```

### Remove Profile

```bash
brun config remove-profile --name old-profile
```

### Execute Profile

```bash
# Run by name
brun build --profile backend-api

# Run with overrides
brun build --profile backend-api --timeout 10m --clean
```

---

## Profile Inheritance (Future)

```json
{
  "name": "backend-prod",
  "extends": "backend-api",
  "env": {
    "GOOS": "linux",
    "GOARCH": "amd64"
  },
  "args": ["-ldflags", "-s -w -X main.version=1.0.0"]
}
```

---

## See Also

- [Configuration](./03-configuration.md)
- [Asset Operations](./08-asset-operations.md)
- [CLI Interface](./02-cli-interface.md)
