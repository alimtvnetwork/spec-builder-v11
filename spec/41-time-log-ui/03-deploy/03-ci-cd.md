# Time Log UI: CI/CD

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

GitHub Actions workflow for building, testing, and packaging the Time Log UI. The UI build artifacts are uploaded for consumption by the CLI binary build pipeline.

---

## Workflow

```yaml
# .github/workflows/ui-build.yml
name: Time Log UI Build

on:
  push:
    paths:
      - "ui/**"
    branches: [main]
  pull_request:
    paths:
      - "ui/**"

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: ui/package-lock.json

      - run: npm ci
        working-directory: ui

      - run: npm run lint
        working-directory: ui

      - run: npm run test:ci
        working-directory: ui

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: ui/package-lock.json

      - run: npm ci
        working-directory: ui

      - run: npm run build
        working-directory: ui
        env:
          VITE_API_BASE_URL: /api/v1

      - name: Upload UI dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: timelog-ui-dist
          path: ui/dist/
          retention-days: 7

      - name: Report bundle size
        run: |
          echo "## Bundle Size Report" >> $GITHUB_STEP_SUMMARY
          echo '```' >> $GITHUB_STEP_SUMMARY
          du -sh ui/dist/ >> $GITHUB_STEP_SUMMARY
          du -sh ui/dist/assets/*.js >> $GITHUB_STEP_SUMMARY
          du -sh ui/dist/assets/*.css >> $GITHUB_STEP_SUMMARY
          echo '```' >> $GITHUB_STEP_SUMMARY
```

---

## Integration with CLI Build

The CLI build pipeline downloads the UI artifact before compiling:

```yaml
# In .github/workflows/cli-release.yml
- name: Download UI dist
  uses: actions/download-artifact@v4
  with:
    name: timelog-ui-dist
    path: ui/dist/

- name: Build CLI with embedded UI
  run: cargo build --release
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CLI Build Pipeline | `../../40-time-log-cli/03-deploy/01-build-pipeline.md` |
| Embedded Serving | `./01-embedded-serving.md` |
| Standalone Build | `./02-standalone-build.md` |
