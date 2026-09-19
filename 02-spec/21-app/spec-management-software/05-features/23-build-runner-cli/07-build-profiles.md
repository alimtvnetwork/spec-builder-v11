# Build Profiles

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Saved build configurations that can be referenced by name. Stored in config.json and managed via CLI.

**Cross-References:**
- [Configuration](./03-configuration.md)
- [Asset Operations](./08-asset-operations.md)
- [CLI Interface](./02-cli-interface.md)

---

## Build Profile Schema

```go
type BuildProfile struct {
    Name         string            
    Description  string            `json:",omitempty"`
    Runtime      runtimetype.Variant
    Source       string            // Source path or script
    Output       string            `json:",omitempty"`
    Command      string            `json:",omitempty"` // For Node.js: build, dev, etc.
    Args         []string          `json:",omitempty"`
    Env          map[string]string `json:",omitempty"`
    WorkDir      string            `json:"workdir,omitempty"` // EXEMPTED: Config file key
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

func (pm *ProfileManager) Get(name string) appfault.Result[BuildProfile] {
    profile, isFound := pm.profiles[name]

    if !isFound {
        return appfault.FailNew[BuildProfile](
            ErrBrunConfigProfileNotFound,
            "profile not found: %s",
            name,
        )
    }

    return appfault.Ok(*profile)
}

func (pm *ProfileManager) Add(profile *BuildProfile) *appfault.AppError {
    _, isExists := pm.profiles[profile.Name]

    if isExists {
        return appfault.New(
            "profile already exists: %s",
            profile.Name,
        ).WithSkip(1)
    }

    validateErr := pm.validate(profile)

    if validateErr != nil {
        return validateErr
    }

    pm.profiles[profile.Name] = profile
    return pm.save()
}

func (pm *ProfileManager) Remove(name string) *appfault.AppError {
    _, isExists := pm.profiles[name]
    isMissing := !isExists

    if isMissing {
        return appfault.New(
            "profile not found: %s",
            name,
        ).WithSkip(1)
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
    hasName := profile.Name != ""

    if !hasName {
        return appfault.New("profile name is required").WithSkip(1)
    }

    hasSource := profile.Source != ""
    hasCommand := profile.Command != ""
    hasSourceOrCommand := hasSource || hasCommand

    if !hasSourceOrCommand {
        return appfault.New("source or command is required").WithSkip(1)
    }

    return nil
}
```

---

## Profile Execution

```go
func (e *ExecutionEngine) ExecuteProfile(context context.Context, profileName string) appfault.Result[ExecutionResult] {
    profileResult := e.profileManager.Get(profileName)

    if profileResult.HasError() {
        return appfault.Fail[ExecutionResult](profileResult.Error())
    }

    profile := profileResult.Value()
    command := e.buildCommandFromProfile(profile)

    return e.runProfileExecution(context, profile, command)
}

func (e *ExecutionEngine) buildCommandFromProfile(profile BuildProfile) *Command {
    cmd := &Command{
        Type:        profile.Runtime,
        Script:      profile.Source,
        Args:        profile.Args,
        WorkDir:     profile.WorkDir,
        Env:         profile.Env,
        PreCommands: profile.PreCommands,
    }

    hasTimeout := profile.Timeout != ""

    if hasTimeout {
        cmd.Timeout, _ = time.ParseDuration(profile.Timeout)
    } else {
        cmd.Timeout = e.config.Execution.Timeout
    }

    return cmd
}

func (e *ExecutionEngine) runProfileExecution(context context.Context, profile BuildProfile, cmd *Command) appfault.Result[ExecutionResult] {
    preErr := e.runPreCommands(context, cmd)

    if preErr != nil {
        return appfault.Fail[ExecutionResult](preErr)
    }

    hasPort := profile.Port > 0

    if hasPort {
        return e.executeWithPort(context, cmd, profile.Port)
    }

    return e.executeAndFinalize(context, profile, cmd)
}

func (e *ExecutionEngine) runPreCommands(context context.Context, cmd *Command) *appfault.AppError {
    for _, preCmd := range cmd.PreCommands {
        result := e.executeShellCommand(context, preCmd, cmd.WorkDir)

        if result.HasError() {
            return appfault.Wrap(
                result.Error(),
                "pre-command failed",
            ).WithSkip(1)
        }
    }

    return nil
}

func (e *ExecutionEngine) executeAndFinalize(context context.Context, profile BuildProfile, cmd *Command) appfault.Result[ExecutionResult] {
    executorResult := e.factory.Create(profile.Runtime)

    if executorResult.HasError() {
        return appfault.Fail[ExecutionResult](executorResult.Error())
    }

    result := executorResult.Value().Execute(context, cmd)

    if result.HasError() {
        return result
    }

    e.runPostCommands(context, profile, result.Value())
    e.handleAssets(profile, result.Value())
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
