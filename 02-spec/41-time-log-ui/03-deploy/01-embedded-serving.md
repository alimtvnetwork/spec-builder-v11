# Time Log UI: Embedded Serving

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

The primary deployment mode embeds the compiled UI assets directly into the Time Log CLI Rust binary using `rust-embed`. The CLI HTTP server serves both the API (`/api/v1/*`) and the UI (`/`, `/assets/*`) on the same port (`9847`), resulting in a single self-contained executable.

---

## rust-embed Integration

### Cargo Dependency

```toml
[dependencies]
rust-embed = { version = "8", features = ["compression"] }
mime_guess = "2"
```

### Asset Struct

```rust
use rust_embed::Embed;

#[derive(Embed)]
#[folder = "ui/dist/"]
#[prefix = ""]
struct UiAssets;
```

### Compression

- `rust-embed` compresses assets at compile time using `flate2`
- Assets are decompressed on first request and cached in memory
- Typical compression ratio: ~70% for JS/CSS, ~30% for images

---

## HTTP Routing

The CLI's HTTP server (Actix-Web/Axum) routes requests with the following priority:

```
Request
  ├── /api/v1/*  → API handlers (JSON responses)
  ├── /assets/*  → Embedded static assets (JS, CSS, images, fonts)
  └── /*         → Fallback to index.html (SPA client-side routing)
```

### Implementation

```rust
use axum::{Router, routing::get, response::Response, http::StatusCode};

fn ui_router() -> Router {
    Router::new()
        .fallback(get(serve_ui_asset))
}

async fn serve_ui_asset(uri: axum::http::Uri) -> Response {
    let path = uri.path().trim_start_matches('/');

    // Try exact file match first
    if let Some(file) = UiAssets::get(path) {
        let mime = mime_guess::from_path(path)
            .first_or_octet_stream()
            .to_string();
        return Response::builder()
            .header("Content-Type", mime)
            .header("Cache-Control", cache_policy(path))
            .body(file.data.into())
            .unwrap();
    }

    // Fallback to index.html for SPA routing
    let index = UiAssets::get("index.html").unwrap();
    Response::builder()
        .header("Content-Type", "text/html")
        .header("Cache-Control", "no-cache")
        .body(index.data.into())
        .unwrap()
}
```

---

## Cache Policy

| Asset Type | Cache-Control | Rationale |
|------------|---------------|-----------|
| `index.html` | `no-cache` | Must always fetch latest to pick up new hashes |
| `/assets/*.js` | `max-age=31536000, immutable` | Content-hashed filenames |
| `/assets/*.css` | `max-age=31536000, immutable` | Content-hashed filenames |
| `/assets/*.woff2` | `max-age=31536000, immutable` | Fonts rarely change |
| Other | `max-age=3600` | Moderate caching |

```rust
fn cache_policy(path: &str) -> &'static str {
    if path == "index.html" {
        "no-cache"
    } else if path.starts_with("assets/") {
        "max-age=31536000, immutable"
    } else {
        "max-age=3600"
    }
}
```

---

## Build Integration

The UI must be built **before** the Rust binary is compiled, so that `rust-embed` can find the `ui/dist/` folder.

### Directory Layout

```
timelog/
├── src/                    # Rust source
├── ui/                     # UI source (React/Vite project)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── dist/               # ← Built output, embedded by rust-embed
├── Cargo.toml
└── build.rs                # Optional: auto-build UI during cargo build
```

### build.rs (Optional Auto-Build)

```rust
use std::process::Command;

fn main() {
    // Only rebuild UI if source changed
    println!("cargo:rerun-if-changed=ui/src");
    println!("cargo:rerun-if-changed=ui/index.html");
    println!("cargo:rerun-if-changed=ui/package.json");

    let status = Command::new("npm")
        .args(["run", "build"])
        .current_dir("ui")
        .status()
        .expect("Failed to build UI — is Node.js installed?");

    if !status.success() {
        panic!("UI build failed");
    }
}
```

---

## Binary Size Impact

| Component | Estimated Size |
|-----------|---------------|
| Base CLI binary | ~10 MB |
| UI assets (compressed) | ~800 KB–1.5 MB |
| Total with UI | ~11–12 MB |

---

## Security Headers

The embedded server adds security headers to all UI responses:

```rust
fn security_headers() -> Vec<(&'static str, &'static str)> {
    vec![
        ("X-Content-Type-Options", "nosniff"),
        ("X-Frame-Options", "DENY"),
        ("Referrer-Policy", "strict-origin-when-cross-origin"),
        ("Content-Security-Policy",
         "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; \
          img-src 'self' data: blob:; connect-src 'self'"),
    ]
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CLI Build Pipeline | `../../40-time-log-cli/03-deploy/01-build-pipeline.md` |
| CLI Architecture | `../../40-time-log-cli/01-backend/01-architecture.md` |
| UI Architecture | `../02-frontend/01-architecture.md` |
