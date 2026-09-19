# Time Log CLI: File Path Extraction

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

Many applications embed the active file's path in their window title. The File Path Extractor parses the `WindowTitle` captured by the App Focus Collector to extract structured file path information — enabling reports like "time spent per project," "files edited today," and "project-level activity breakdowns."

This module does **not** introduce new OS hooks. It operates as a **post-processing layer** on top of the `AppActivity.WindowTitle` field already captured by the App Focus Collector (see `02-os-integration.md`).

---

## Application Title Patterns

### Code Editors & IDEs

| Application | Default Window Title Format | File Path Location |
|-------------|----------------------------|-------------------|
| **VS Code** | `{filename} — {folderName} — Visual Studio Code` | Configurable via `window.title`; default shows short filename and folder |
| **VS Code (full path)** | `{/full/path/to/file.rs} — {folderName} — Visual Studio Code` | When `window.title` includes `${activeEditorLong}` |
| **IntelliJ IDEA** | `{project} — {filepath} — IntelliJ IDEA` | Between first and second ` — ` separator |
| **WebStorm** | `{project} — {filepath} — WebStorm` | Same as IntelliJ |
| **PyCharm** | `{project} — {filepath} — PyCharm` | Same as IntelliJ |
| **Sublime Text** | `{filename} — {/full/path} — Sublime Text` | After first ` — `, before ` — Sublime Text` |
| **Sublime Text (full)** | `{/full/path/to/file.py} — Sublime Text` | When `show_full_path: true` |
| **Vim / Neovim** | `{filename} (+) - VIM` or `{filepath} - NVIM` | Before ` - VIM` / ` - NVIM` |
| **Notepad++** | `{/full/path/to/file.txt} - Notepad++` | Before ` - Notepad++` |
| **Emacs** | `{filename} (dirpath) — Emacs` | Filename outside parens, directory inside |
| **Xcode** | `{filename} — {project} — Xcode` | Before first ` — ` |
| **Android Studio** | `{project} — {filepath} — Android Studio` | Same as IntelliJ pattern |

### Office / Document Applications

| Application | Default Window Title Format | File Path Location |
|-------------|----------------------------|-------------------|
| **Microsoft Word** | `{filename} - Word` | Filename only (no path by default) |
| **Microsoft Word (path)** | `{filename} - {path} - Word` | When title bar path is enabled in settings |
| **Microsoft Excel** | `{filename} - Excel` | Filename only |
| **LibreOffice Writer** | `{filename} — LibreOffice Writer` | Filename only by default |
| **LibreOffice (macro)** | `{/full/path/to/file.odt} — LibreOffice Writer` | Full path when ShowFullPath macro is active |
| **Google Docs** | `{document title} - Google Docs - {Browser}` | Document title only (cloud, no local path) |
| **Notion** | `{page title} - Notion - {Browser}` | Page title only (cloud, no local path) |

### Terminal / Shell Applications

| Application | Default Window Title Format | File Path Location |
|-------------|----------------------------|-------------------|
| **Windows Terminal** | `{shell}: {cwd}` | CWD after colon |
| **GNOME Terminal** | `{user}@{host}: {cwd}` | CWD after `: ` |
| **iTerm2** | `{cwd} — {shell} — {WxH}` | CWD at start |
| **Alacritty** | `{cwd}` or `{shell}` | Depends on config |
| **Kitty** | `{cwd} — kitty` | Before ` — kitty` |
| **Hyper** | `{shell}: {cwd}` | CWD after colon |

### File Managers

| Application | Default Window Title Format | File Path Location |
|-------------|----------------------------|-------------------|
| **Explorer** | `{folder_name}` | Name only (no full path in title) |
| **Nautilus/Files** | `{folder_name}` | Name only |
| **Finder** | `{folder_name}` | Name only |
| **Dolphin** | `{/full/path} — Dolphin` | Full path before ` — Dolphin` |
| **Thunar** | `{folder_name} - Thunar` | Name only |

---

## Extraction Engine

### Architecture

```rust
pub struct FilePathExtractor {
    /// Registered per-application parsers, keyed by normalized app name
    parsers: HashMap<String, Box<dyn TitleParser>>,
    /// Fallback regex patterns for unknown applications
    fallback_patterns: Vec<FallbackPattern>,
}

pub trait TitleParser: Send + Sync {
    /// Extract file path info from a window title for this application
    fn parse(&self, title: &str) -> Option<ExtractedPath>;
    
    /// Application identifiers this parser handles (lowercase)
    fn app_names(&self) -> &[&str];
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct ExtractedPath {
    /// The raw extracted path string
    pub raw_path: String,
    /// Normalized absolute path (resolved `~`, env vars)
    pub absolute_path: Option<String>,
    /// Just the filename component
    pub filename: Option<String>,
    /// File extension (without dot)
    pub extension: Option<String>,
    /// Parent directory
    pub directory: Option<String>,
    /// Project root (workspace/solution directory, if detectable)
    pub project_root: Option<String>,
    /// Whether this is a local file or cloud document
    pub source: PathSource,
    /// Confidence score (0.0–1.0) for extraction accuracy
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize)]
pub enum PathSource {
    /// Local file with a filesystem path
    Local,
    /// Cloud document (Google Docs, Notion, etc.) — title only
    Cloud,
    /// Unknown / could not determine
    Unknown,
}
```

### Parser Implementations

#### VS Code Parser

```rust
pub struct VsCodeParser;

impl TitleParser for VsCodeParser {
    fn app_names(&self) -> &[&str] {
        &["code", "code-insiders", "codium", "vscodium"]
    }

    fn parse(&self, title: &str) -> Option<ExtractedPath> {
        // Pattern 1: "{file} — {folder} — Visual Studio Code"
        // Pattern 2: "{/full/path/file} — {folder} — Visual Studio Code"
        // Pattern 3: "{file} — {folder} [WSL: Ubuntu] — Visual Studio Code"
        
        let stripped = title
            .strip_suffix(" — Visual Studio Code")?
            .strip_suffix(" — Visual Studio Code - Insiders")
            .unwrap_or(title);
        
        // Split on " — " to separate file from folder
        let parts: Vec<&str> = stripped.splitn(2, " — ").collect();
        
        let file_part = parts.first()?;
        let folder_part = parts.get(1);
        
        // Handle dirty indicator
        let file_part = file_part.trim_start_matches("● ");
        
        // Detect if file_part is a full path
        let is_full_path = file_part.starts_with('/')
            || file_part.starts_with('~')
            || (file_part.len() > 2 && file_part.chars().nth(1) == Some(':'));
        
        // Build ExtractedPath with confidence based on what we could extract
        // ...
    }
}
```

#### JetBrains Parser (IntelliJ, WebStorm, PyCharm, etc.)

```rust
pub struct JetBrainsParser;

impl TitleParser for JetBrainsParser {
    fn app_names(&self) -> &[&str] {
        &["idea", "idea64", "webstorm", "webstorm64", 
          "pycharm", "pycharm64", "phpstorm", "phpstorm64",
          "goland", "goland64", "rider", "rider64",
          "rustrover", "rustrover64", "clion", "clion64",
          "studio64", "android studio"]
    }

    fn parse(&self, title: &str) -> Option<ExtractedPath> {
        // Pattern: "{project} — {filepath} [{module}] — {IDE Name}"
        // Example: "timelog — src/main.rs [timelog-cli] — IntelliJ IDEA"
        
        let ide_suffixes = [
            " — IntelliJ IDEA", " — WebStorm", " — PyCharm",
            " — PhpStorm", " — GoLand", " — Rider",
            " — RustRover", " — CLion", " — Android Studio",
        ];
        
        let stripped = ide_suffixes.iter()
            .find_map(|suffix| title.strip_suffix(suffix))?;
        
        // Split on " — " — project is first, filepath is second
        let parts: Vec<&str> = stripped.splitn(2, " — ").collect();
        // Extract project root from first part, relative file path from second
        // ...
    }
}
```

#### Microsoft Office Parser

```rust
pub struct MsOfficeParser;

impl TitleParser for MsOfficeParser {
    fn app_names(&self) -> &[&str] {
        &["winword", "excel", "powerpnt", "onenote", "outlook"]
    }

    fn parse(&self, title: &str) -> Option<ExtractedPath> {
        // Pattern 1: "{filename} - Word"
        // Pattern 2: "{filename} - {path} - Word"
        // Pattern 3: "{filename} [Read-Only] - Word"
        // Pattern 4: "Document1 - Word" (unsaved)
        
        let suffixes = [" - Word", " - Excel", " - PowerPoint", " - OneNote"];
        
        let stripped = suffixes.iter()
            .find_map(|suffix| title.strip_suffix(suffix))?;
        
        // Remove modifiers like [Read-Only], [Compatibility Mode]
        let cleaned = stripped
            .replace(" [Read-Only]", "")
            .replace(" [Compatibility Mode]", "");
        
        // Check if there's a path separator (second " - " indicates path)
        // ...
    }
}
```

#### Terminal Parser

```rust
pub struct TerminalParser;

impl TitleParser for TerminalParser {
    fn app_names(&self) -> &[&str] {
        &["windowsterminal", "wt", "gnome-terminal-server",
          "konsole", "xfce4-terminal", "alacritty", "kitty",
          "iterm2", "terminal", "hyper", "wezterm-gui"]
    }

    fn parse(&self, title: &str) -> Option<ExtractedPath> {
        // Multiple patterns depending on shell and terminal:
        //   "user@host: /home/user/projects/timelog"
        //   "/home/user/projects — bash — 80x24"
        //   "~/projects/timelog"
        //   "bash: /tmp"
        
        // Strategy: look for path-like segments
        // 1. Match known patterns by terminal
        // 2. Fall back to regex: capture longest substring matching a path
        // ...
    }
}
```

### Fallback Pattern Matching

For applications without a dedicated parser, use regex heuristics:

```rust
pub struct FallbackPattern {
    /// Description for debugging
    pub name: &'static str,
    /// Regex to match against the full window title
    pub pattern: Regex,
    /// Capture group index containing the path
    pub path_group: usize,
    /// Base confidence for this pattern
    pub confidence: f64,
}

/// Default fallback patterns (ordered by specificity)
fn default_fallback_patterns() -> Vec<FallbackPattern> {
    vec![
        // Unix absolute path
        FallbackPattern {
            name: "unix_absolute",
            pattern: Regex::new(r"(/(?:[\w.@-]+/)*[\w.@-]+)").unwrap(),
            path_group: 1,
            confidence: 0.6,
        },
        // Windows absolute path
        FallbackPattern {
            name: "windows_absolute",
            pattern: Regex::new(r"([A-Z]:\\(?:[^\s\\/:*?\"<>|]+\\)*[^\s\\/:*?\"<>|]+)").unwrap(),
            path_group: 1,
            confidence: 0.6,
        },
        // Home-relative path
        FallbackPattern {
            name: "home_relative",
            pattern: Regex::new(r"(~(?:/[\w.@-]+)+)").unwrap(),
            path_group: 1,
            confidence: 0.7,
        },
        // Filename with extension (weakest signal)
        FallbackPattern {
            name: "filename_with_ext",
            pattern: Regex::new(r"\b([\w.-]+\.\w{1,10})\b").unwrap(),
            path_group: 1,
            confidence: 0.3,
        },
    ]
}
```

---

## Platform-Specific Path Normalization

| Operation | Windows | Linux | macOS |
|-----------|---------|-------|-------|
| Home expansion | `%USERPROFILE%` → `C:\Users\{name}` | `~` → `/home/{name}` | `~` → `/Users/{name}` |
| Path separator | `\` (normalize to `/` for storage) | `/` | `/` |
| Drive letter | `C:\...` → `C:/...` | N/A | N/A |
| WSL paths | `/mnt/c/...` → `C:/...` (cross-reference) | Native `/...` | N/A |
| Case sensitivity | Case-insensitive comparison | Case-sensitive | Case-insensitive (HFS+) |
| Symlink resolution | Optional (via `GetFinalPathNameByHandleW`) | Optional (via `realpath`) | Optional (via `realpath`) |

### Path Normalization Function

```rust
pub fn normalize_path(raw: &str) -> NormalizedPath {
    let mut path = raw.to_string();
    
    // 1. Expand home directory
    if path.starts_with('~') {
        if let Some(home) = dirs::home_dir() {
            path = path.replacen('~', &home.to_string_lossy(), 1);
        }
    }
    
    // 2. Normalize separators to forward slash
    path = path.replace('\\', "/");
    
    // 3. Remove trailing slash
    path = path.trim_end_matches('/').to_string();
    
    // 4. Extract components
    let filename = Path::new(&path)
        .file_name()
        .map(|f| f.to_string_lossy().to_string());
    let extension = Path::new(&path)
        .extension()
        .map(|e| e.to_string_lossy().to_string());
    let directory = Path::new(&path)
        .parent()
        .map(|p| p.to_string_lossy().to_string());
    
    NormalizedPath { path, filename, extension, directory }
}
```

---

## Project Root Detection

When a file path is extracted, attempt to identify the **project root** by walking up the directory tree looking for marker files:

```rust
const PROJECT_MARKERS: &[&str] = &[
    // Version control
    ".git", ".hg", ".svn",
    // Rust
    "Cargo.toml",
    // Node.js / TypeScript
    "package.json", "tsconfig.json",
    // Python
    "pyproject.toml", "setup.py", "setup.cfg",
    // Go
    "go.mod",
    // Java / Kotlin
    "pom.xml", "build.gradle", "build.gradle.kts",
    // .NET / C#
    "*.sln", "*.csproj",
    // PHP
    "composer.json",
    // Ruby
    "Gemfile",
    // General
    ".editorconfig", ".project",
];

pub fn detect_project_root(file_path: &Path) -> Option<PathBuf> {
    let mut current = file_path.parent()?;
    loop {
        for marker in PROJECT_MARKERS {
            if marker.contains('*') {
                // Glob match (e.g., *.sln)
                if glob_exists(current, marker) {
                    return Some(current.to_path_buf());
                }
            } else if current.join(marker).exists() {
                return Some(current.to_path_buf());
            }
        }
        current = current.parent()?;
    }
}
```

---

## Data Model Extension

New fields added to the `AppActivity` table:

```sql
ALTER TABLE AppActivity ADD COLUMN FilePath     TEXT;  -- Extracted file path (normalized)
ALTER TABLE AppActivity ADD COLUMN FileName     TEXT;  -- Extracted filename
ALTER TABLE AppActivity ADD COLUMN FileExtension TEXT; -- File extension (e.g., "rs", "tsx")
ALTER TABLE AppActivity ADD COLUMN ProjectRoot  TEXT;  -- Detected project root
ALTER TABLE AppActivity ADD COLUMN PathSource   TEXT NOT NULL DEFAULT 'Unknown'; -- Local, Cloud, Unknown
ALTER TABLE AppActivity ADD COLUMN PathConfidence REAL NOT NULL DEFAULT 0.0;     -- 0.0–1.0

CREATE INDEX IdxAppActivityFilePath ON AppActivity(FilePath);
CREATE INDEX IdxAppActivityProjectRoot ON AppActivity(ProjectRoot);
CREATE INDEX IdxAppActivityFileExtension ON AppActivity(FileExtension);
```

### Updated Struct

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppActivity {
    pub id: Uuid,
    pub session_id: Uuid,
    pub app_name: String,
    pub window_title: String,
    pub process_id: Option<u32>,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub dwell_seconds: Option<f64>,
    // New file path fields
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_extension: Option<String>,
    pub project_root: Option<String>,
    pub path_source: PathSource,
    pub path_confidence: f64,
    pub created_at: DateTime<Utc>,
}
```

---

## API Extensions

New query parameters and endpoints for file-path-based reporting:

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/summary/projects` | Time per project root for a date range |
| `GET` | `/api/v1/summary/file-types` | Time per file extension |
| `GET` | `/api/v1/summary/files` | Top files by dwell time |

### New Query Parameters on Existing Endpoints

| Endpoint | New Parameter | Description |
|----------|--------------|-------------|
| `/api/v1/activities/apps` | `ProjectRoot` | Filter by project root |
| `/api/v1/activities/apps` | `FileExtension` | Filter by file extension |
| `/api/v1/activities/apps` | `HasFilePath` | `true` = only entries with extracted paths |

### Example Response: `/api/v1/summary/projects`

```json
{
  "Data": [
    {
      "ProjectRoot": "/home/user/projects/timelog-cli",
      "ProjectName": "timelog-cli",
      "TotalSeconds": 7200.0,
      "FileCount": 23,
      "TopFile": "src/main.rs",
      "TopFileSeconds": 1800.0,
      "Extensions": {
        "rs": 5400,
        "toml": 900,
        "md": 900
      }
    }
  ]
}
```

---

## Configuration

```toml
[FilePathExtraction]
Enabled = true
ResolveProjectRoot = true      # Walk up directory tree to find project markers
NormalizePaths = true           # Expand ~, normalize separators
MinConfidence = 0.3             # Discard extractions below this confidence
VerifyPathExists = false        # If true, check filesystem (slower but more accurate)

# Custom application title patterns (extend built-in parsers)
[[FilePathExtraction.CustomParsers]]
AppName = "my-custom-ide"
Pattern = "^(.+) - My Custom IDE$"
PathGroup = 1
```

---

## Rust Crate Dependencies (Additional)

| Crate | Purpose |
|-------|---------|
| `regex` | Title pattern matching and fallback extraction |
| `dirs` | Home directory resolution for path normalization |
| `glob` | Project root marker matching |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| App Focus Collector | `./02-os-integration.md` |
| Browser Tracking | `./03-browser-tracking.md` |
| Database Schema | `./05-database-schema.md` |
| API Interface | `./06-api-interface.md` |
| Architecture | `./01-architecture.md` |
