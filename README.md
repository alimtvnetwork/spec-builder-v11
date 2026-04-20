# Coding Guidelines

> **Author:** [alimtvnetwork](https://github.com/alimtvnetwork)
> **Status:** Specification-only repository (with companion Health Dashboard UI)
> **Last updated:** 2026-04-20

A canonical, version-controlled set of **coding guidelines, error-code registries, and architectural specifications** that drive multiple downstream projects (CLIs, WordPress plugins, Go services, React frontends). Everything in `spec/` is the source of truth — implementation lives in separate repositories.

This repo also ships a small **Health Dashboard** (React + Vite + TypeScript) that browses the spec tree, surfaces consistency reports, and visualizes health-score metrics.

---

## ✨ What's Inside

- **`spec/`** — The full specification tree. Numeric-prefixed, lowercase-kebab-case folders covering coding standards, error codes, AI-bridge architecture, license manager, time-log system, dashboards, and more.
- **`.lovable/memories/`** — Institutional memory: conventions, constraints, training packages, and per-feature decision logs that AI agents and contributors load before making changes.
- **`src/`** — Health Dashboard UI (React 18 + Vite 5 + Tailwind v3 + shadcn) for browsing specs and metrics.
- **`scripts/`** — Data-pipeline scripts that generate the dashboard manifest from the spec tree.

---

## 🚨 Critical Constraint

> **This is a SPECIFICATION-ONLY repository.**
> 
> | ❌ Do NOT | ✅ Do |
> |---|---|
> | Implement application code (Go/PHP/Rust/Python) here | Write specs, error codes, consistency reports |
> | Suggest "implement X" as a next step | Suggest spec improvements, audits, cross-reference fixes |
> | Edit anything in `.release/` | Bump at least the **minor** version on every code change |

The only runtime code allowed in this repo is the **Health Dashboard** under `src/`.

---

## 🚀 Getting Started

```bash
# Install dependencies
bun install        # or: npm install

# Run the dashboard locally
bun run dev        # http://localhost:8080

# Build for production
bun run build

# Lint & test
bun run lint
bun run test
```

---

## 📁 Repository Layout

```
.
├── spec/                   # Canonical specifications (the product)
│   ├── 00-overview.md
│   ├── 03-coding-guidelines/
│   ├── 07-error-code-registry/
│   ├── 09-code-block-system/
│   └── …                   # ~40 numbered modules
├── .lovable/
│   ├── memories/           # Institutional memory & training packages
│   └── memory/index.md     # Quick-reference index
├── src/                    # Health Dashboard (React + Vite + TS)
│   ├── components/dashboard/
│   ├── pages/
│   └── utils/
├── scripts/                # Manifest generation
├── package.json
└── README.md               # ← you are here
```

---

## 📜 Conventions (TL;DR)

- **Files & folders:** lowercase-kebab-case with numeric prefixes (`01-name-of-file.md`).
- **Identifiers:** PascalCase, abbreviations as words (`Url`, `Id`, never `URL`/`ID`).
- **Booleans:** strictly positive (`isDefined`, never `isNotNil`).
- **Errors:** `Err` prefix, `*apperror.AppError` only — never swallow.
- **Functions:** ≤ 3 parameters, ≤ 15 lines of logic, single return value.
- **Filesystem:** no raw `os.Stat`/`file_exists` — use `pathutil` / `PathHelper`.
- **Types:** `any` and `unknown` are banned.

Full rules live under `spec/03-coding-guidelines/` and `.lovable/memories/constraints/`.

---

## 🤝 Workflow

1. **Plan before execute** — produce a reliability risk report before any non-trivial change.
2. **Update `98-changelog.md` and `99-consistency-report.md`** in the affected module.
3. **Maintain `spec/00-overview.md`** when modules are added, renamed, or renumbered.
4. **Bump the version** in `package.json` (minor for features, patch for fixes).

---

## 🔗 Related

- Previous iteration: [coding-guidelines-v15](https://github.com/alimtvnetwork/coding-guidelines-v15)
- Issue tracker: GitHub Issues on this repository.

---

## 📄 License

Internal — see repository owner for usage terms.

— Maintained by **[alimtvnetwork](https://github.com/alimtvnetwork)**
