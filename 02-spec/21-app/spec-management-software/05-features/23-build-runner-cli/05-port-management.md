# Port Management

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Port availability checking, fallback management, and firewall rule configuration for the Build Runner CLI.

**Cross-References:**
- [CLI Interface](./02-cli-interface.md)
- [Configuration](./03-configuration.md)
- [Core Architecture](./01-core-architecture.md)

---

## Port Manager

### Interface

```go
type PortManager struct {
    config          *PortConfig
    firewallManager *FirewallManager
    logger          *LogService
}

type PortConfig struct {
    Default      int
    Fallback     []int
    CheckTimeout time.Duration
    Firewall     FirewallConfig
}

type PortCheckResult struct {
    Port        int
    IsAvailable bool
    Reason      string `json:",omitempty"`
    Process     string `json:",omitempty"`
    Pid         int    `json:",omitempty"`
}

type PortResolution struct {
    RequestedPort  int
    AvailablePort  int
    CheckedPorts   []PortCheckResult
}
```

### Core Functions

```go
// CheckPort verifies if a port is available
func (pm *PortManager) CheckPort(port int) appfault.Result[PortCheckResult] {
    listener, err := net.Listen("tcp", fmt.Sprintf(":%d", port))

    if err != nil {
        processInfo := pm.getProcessOnPort(port)
        return appfault.Ok(PortCheckResult{
            Port:        port,
            IsAvailable: false,
            Reason:      "in use",
            Process:     processInfo.Name,
            Pid:         processInfo.Pid,
        })
    }

    listener.Close()

    return appfault.Ok(PortCheckResult{
        Port:        port,
        IsAvailable: true,
    })
}

// ResolvePort finds an available port with fallback
func (pm *PortManager) ResolvePort(primary int, fallback []int) appfault.Result[PortResolution] {
    resolution := &PortResolution{
        RequestedPort: primary,
        CheckedPorts:  make([]PortCheckResult, 0),
    }

    primaryResult := pm.CheckPort(primary)

    if primaryResult.HasError() {
        return appfault.Fail[PortResolution](primaryResult.Error())
    }

    resolution.CheckedPorts = append(resolution.CheckedPorts, primaryResult.Value())

    if primaryResult.Value().IsAvailable {
        resolution.AvailablePort = primary
        return appfault.Ok(*resolution)
    }

    return pm.checkFallbackPorts(resolution, fallback)
}

func (pm *PortManager) checkFallbackPorts(resolution *PortResolution, fallback []int) appfault.Result[PortResolution] {
    for _, port := range fallback {
        portResult := pm.CheckPort(port)

        if portResult.HasError() {
            continue
        }

        resolution.CheckedPorts = append(resolution.CheckedPorts, portResult.Value())

        if portResult.Value().IsAvailable {
            resolution.AvailablePort = port
            return appfault.Ok(*resolution)
        }
    }

    return appfault.FailNew[PortResolution](
        ErrBrunPortUnavailable,
        "no available port found",
    )
}
```

---

## Process Detection

### Windows

```go
func (pm *PortManager) getProcessOnPortWindows(port int) ProcessInfo {
    command := exec.Command("netstat", "-ano", "-p", "TCP")
    output, err := command.Output()

    if err != nil {
        return ProcessInfo{}
    }

    pattern := regexp.MustCompile(fmt.Sprintf(`TCP\s+[\d.]+:%d\s+[\d.]+:\d+\s+LISTENING\s+(\d+)`, port))
    matches := pattern.FindStringSubmatch(string(output))
    hasMatch := len(matches) > 1

    if hasMatch {
        pid, _ := strconv.Atoi(matches[1])
        return ProcessInfo{
            Pid:  pid,
            Name: pm.getProcessName(pid),
        }
    }

    return ProcessInfo{}
}
```

### Linux

```go
func (pm *PortManager) getProcessOnPortLinux(port int) ProcessInfo {
    command := exec.Command("ss", "-tlnp", fmt.Sprintf("sport = :%d", port))
    output, err := command.Output()

    if err != nil {
        command = exec.Command("netstat", "-tlnp")
        output, _ = command.Output()
    }

    // Parse output to extract Pid and process name
    // ...
}
```

### macOS

```go
func (pm *PortManager) getProcessOnPortMacOS(port int) ProcessInfo {
    command := exec.Command("lsof", "-i", fmt.Sprintf(":%d", port), "-t")
    output, err := command.Output()

    if err != nil {
        return ProcessInfo{}
    }

    pid, _ := strconv.Atoi(strings.TrimSpace(string(output)))
    return ProcessInfo{
        Pid:  pid,
        Name: pm.getProcessName(pid),
    }
}
```

---

## Firewall Management

### Interface

```go
type FirewallManager struct {
    isEnabled bool
    ruleName  string
    logger    *LogService
}

type FirewallRule struct {
    Name      string
    Port      int
    Protocol  string // tcp, udp, both
    Direction string // in, out, both
    Action    string // allow, block
    IsEnabled bool
}

func (fm *FirewallManager) EnablePort(port int, name string, protocol string) *appfault.AppError
func (fm *FirewallManager) DisablePort(port int) *appfault.AppError
func (fm *FirewallManager) ListRules() FirewallRuleSlice
func (fm *FirewallManager) RuleExists(port int) appfault.Result[bool]
```

### Windows Implementation (netsh)

```go
func (fm *FirewallManager) enablePortWindows(port int, name string, protocol string) *appfault.AppError {
    ruleName := fmt.Sprintf("%s-%d", name, port)

    command := exec.Command("netsh", "advfirewall", "firewall", "add", "rule",
        "name="+ruleName,
        "dir=in",
        "action=allow",
        "protocol="+protocol,
        fmt.Sprintf("localport=%d", port),
    )

    output, err := command.CombinedOutput()

    if err != nil {
        return appfault.New(
            "failed to add firewall rule: %s",
            string(output),
        ).WithSkip(1)
    }

    fm.logger.Info("Firewall rule added", "name", ruleName, "port", port)
    return nil
}

func (fm *FirewallManager) disablePortWindows(port int) *appfault.AppError {
    command := exec.Command("netsh", "advfirewall", "firewall", "delete", "rule",
        fmt.Sprintf("name=%s-%d", fm.ruleName, port),
    )

    err := command.Run()

    if err != nil {
        return appfault.Wrap(err, "failed to delete firewall rule").WithSkip(1)
    }

    return nil
}

func (fm *FirewallManager) listRulesWindows() FirewallRuleSlice {
    command := exec.Command("netsh", "advfirewall", "firewall", "show", "rule",
        fmt.Sprintf("name=%s*", fm.ruleName))
    output, err := command.Output()

    if err != nil {
        return appfault.FailWrap[[]FirewallRule](err, "failed to list firewall rules")
    }

    return appfault.Ok(parseNetshOutput(string(output)))
}
```

### Linux Implementation (iptables/ufw)

```go
func (fm *FirewallManager) enablePortLinux(port int, name string, protocol string) *appfault.AppError {
    hasUfw := fm.hasUfw()

    if hasUfw {
        return fm.enablePortUfw(port, protocol)
    }

    return fm.enablePortIpTables(port, protocol)
}

func (fm *FirewallManager) enablePortUfw(port int, protocol string) *appfault.AppError {
    command := exec.Command("sudo", "ufw", "allow", fmt.Sprintf("%d/%s", port, protocol))
    err := command.Run()

    if err != nil {
        return appfault.Wrap(err, "ufw allow failed").WithSkip(1)
    }

    return nil
}

func (fm *FirewallManager) enablePortIpTables(port int, protocol string) *appfault.AppError {
    command := exec.Command("sudo", "iptables", "-A", "INPUT",
        "-p", protocol,
        "--dport", strconv.Itoa(port),
        "-j", "ACCEPT",
    )

    err := command.Run()

    if err != nil {
        return appfault.Wrap(err, "iptables rule failed").WithSkip(1)
    }

    return nil
}
```

### macOS Implementation (pfctl)

```go
func (fm *FirewallManager) enablePortMacOs(port int, name string, protocol string) *appfault.AppError {
    rule := fmt.Sprintf("pass in proto %s from any to any port %d\n", protocol, port)
    anchorFile := fmt.Sprintf("/etc/pf.anchors/%s", fm.ruleName)

    writeErr := pathutil.WriteFile(anchorFile, []byte(rule), 0644)

    if writeErr != nil {
        return appfault.Wrap(writeErr, "failed to write anchor file").WithSkip(1)
    }

    command := exec.Command("sudo", "pfctl", "-a", fm.ruleName, "-f", anchorFile)
    runErr := command.Run()

    if runErr != nil {
        return appfault.Wrap(runErr, "pfctl load failed").WithSkip(1)
    }

    return nil
}
```

---

## Port Command Output

### JSON Output

```json
{
  "requestedPort": 8080,
  "availablePort": 8081,
  "checkedPorts": [
    {
      "port": 8080,
      "available": false,
      "reason": "in use",
      "process": "node",
      "pid": 12345
    },
    {
      "port": 8081,
      "available": true
    }
  ]
}
```

### Text Output

```
Checking port availability...
  ✗ Port 8080: in use by node (PID 12345)
  ✓ Port 8081: available

Available port: 8081
```

---

## Integration with Execution

```go
func (e *ExecutionEngine) executeWithPort(context context.Context, command *Command, requestedPort int) appfault.Result[ExecutionResult] {
    resolution := e.portManager.ResolvePort(requestedPort, e.config.Ports.Fallback)

    if resolution.HasError() {
        return appfault.Fail[ExecutionResult](resolution.Error())
    }

    e.enableFirewallIfConfigured(resolution.Value().AvailablePort)

    command.Env["PORT"] = strconv.Itoa(resolution.Value().AvailablePort)

    result := e.execute(context, command)

    if result.HasError() {
        return result
    }

    value := result.Value()
    value.Port = resolution.Value().AvailablePort
    return appfault.Ok(value)
}

func (e *ExecutionEngine) enableFirewallIfConfigured(port int) {
    isAutoEnabled := e.config.Ports.Firewall.AutoEnable

    if isAutoEnabled {
        err := e.portManager.firewallManager.EnablePort(
            port,
            e.config.Ports.Firewall.RuleName,
            "tcp",
        )

        if err != nil {
            e.logger.Warn("Failed to enable firewall port", "error", err)
        }
    }
}
```

---

## See Also

- [CLI Interface](./02-cli-interface.md)
- [Configuration](./03-configuration.md)
- [Error Handling](./06-error-handling.md)
