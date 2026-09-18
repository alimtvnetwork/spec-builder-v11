# Learned: Codebase Architecture & Spec Tree

> **Scope:** Entire Repository Structure

---

## 1. Spec-Only Constraint

This repository is strictly a specification authority (`alimtvnetwork/spec-builder-v11`). It contains 1,544+ markdown files organized into numbered folders under `spec/`. No backend Go, PHP, or Rust application code lives here; application implementation belongs in separate repositories.

## 2. Health Dashboard Companion (`src/`)

The only runtime code allowed in this repository is the Health Dashboard UI located in `src/`:
- **Framework:** React 18 + TypeScript + Vite 5 + Tailwind CSS v3 + Radix UI / shadcn.
- **Purpose:** Browses the spec tree, verifies consistency reports, displays health scores (100/100 A+ targets), and detects error code collisions.
- **Manifest:** Pipeline script `scripts/generate-dashboard-data.cjs` generates `src/generated/dashboard-data.json` from the spec tree.
- **Styling Standards:** Discrete pill groups for toolbars (Poppins font, `gap-2`, `py-[3px]`, `h-3 w-3` icons, borders `hsl(220 13% 28%)`).

## 3. High-Performance Reader Script (`03-ai-scripts/17-fast-file-reader.py`)

Provides sub-millisecond recursive directory listing, cached file reads, and regex pattern searches via `tmp/cache/`.
