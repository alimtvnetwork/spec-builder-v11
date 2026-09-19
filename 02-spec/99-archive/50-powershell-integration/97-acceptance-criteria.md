# PowerShell Integration v2: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Configuration Schema (01-configuration-schema.md)

### PS-01: Config Loading

**GIVEN** a valid `powershell.json` file exists in the project root  
**WHEN** the PowerShell runner script starts  
**THEN** all fields (projectName, backendDir, frontendDir, distDir, targetDir) are loaded  
**AND** default values are applied for optional fields (rootDir: ".", frontendDir: ".", distDir: "dist")

**Edge Cases:**
- **GIVEN** `powershell.json` is missing **WHEN** the script starts **THEN** a clear error is shown: "Configuration file not found: powershell.json"
- **GIVEN** `powershell.json` has invalid JSON syntax **WHEN** parsing is attempted **THEN** the parse error with line number is displayed
- **GIVEN** required field `backendDir` is missing **WHEN** validation runs **THEN** an error lists all missing required fields

### PS-02: Schema Validation

**GIVEN** a `powershell.json` with a `$schema` reference  
**WHEN** the configuration is loaded  
**THEN** the file is validated against the referenced JSON Schema  
**AND** any violations are reported with field path and expected type

---

## Script Reference (02-script-reference.md)

### PS-03: Go Backend Build

**GIVEN** the configuration points to a valid Go backend directory  
**WHEN** the build script executes the backend step  
**THEN** `go build` is run with the configured flags and output path  
**AND** build success or failure is reported with exit code

**Edge Cases:**
- **GIVEN** Go is not installed **WHEN** the backend build step runs **THEN** a clear error "Go runtime not found" is displayed with installation instructions
- **GIVEN** `go mod tidy` is configured **WHEN** the build runs **THEN** `go mod tidy` executes before `go build`

### PS-04: Frontend Build

**GIVEN** the configuration specifies a frontend directory with `package.json`  
**WHEN** the frontend build step runs  
**THEN** the package manager (pnpm/npm/yarn/bun) is detected and `build` script is executed  
**AND** the output is placed in the configured `distDir`

**Edge Cases:**
- **GIVEN** pnpm Plug'n'Play mode is active **WHEN** the build runs **THEN** the script handles `.pnp.cjs` resolution correctly
- **GIVEN** `node_modules` is missing **WHEN** the build runs **THEN** `install` is run automatically before `build`

### PS-05: Asset Copy to Target

**GIVEN** the frontend build completed successfully  
**WHEN** the asset copy step runs  
**THEN** files from `distDir` are copied to `targetDir` for backend serving  
**AND** existing files in `targetDir` are replaced

---

## Integration Guide (03-integration-guide.md)

### PS-06: Full Build Pipeline

**GIVEN** a project with both Go backend and React frontend  
**WHEN** the full pipeline script is executed  
**THEN** steps run in order: backend build → frontend build → asset copy  
**AND** each step's output is logged with timing information  
**AND** failure in any step halts the pipeline with the step name and error

**Edge Cases:**
- **GIVEN** the pipeline is interrupted via Ctrl+C (SIGINT) **WHEN** cleanup runs **THEN** partial build artifacts are cleaned up and a summary of completed steps is shown

---

## Error Codes (04-error-codes.md)

### PS-07: Error Code Reporting

**GIVEN** a build failure occurs at any step  
**WHEN** the error is reported  
**THEN** a structured error code from the PowerShell error range is included  
**AND** the error message is human-readable and includes the failed command

---

## Firewall Rules (05-firewall-rules.md)

### PS-08: Firewall Configuration

**GIVEN** the CLI needs to open a port for the backend server  
**WHEN** `brun port --firewall enable` is executed on Windows  
**THEN** a `netsh advfirewall` rule is created for the configured port  
**AND** the rule name includes the project name for identification

**Edge Cases:**
- **GIVEN** the script runs without administrator privileges **WHEN** firewall modification is attempted **THEN** an elevation prompt is shown or a clear permissions error is returned
- **GIVEN** a rule with the same name already exists **WHEN** creation is attempted **THEN** the existing rule is updated rather than duplicated

---

*Wave 6 — Batch 1 (Patched): PowerShell Integration v2 acceptance criteria with added SIGINT pipeline interruption edge case.*