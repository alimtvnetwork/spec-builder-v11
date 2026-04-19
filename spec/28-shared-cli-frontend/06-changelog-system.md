# Changelog System Specification


**Last Updated:** 2026-03-20  

> **Version:** 1.0.0  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Version-aware changelog display that shows what's new when the application updates.

---

## Features

| Feature | Description |
|---------|-------------|
| Auto-detect | Detect version change on startup |
| Modal Display | Show changelog in modal |
| Markdown Support | Render markdown changelog |
| Dismiss | Remember dismissed versions |
| Skip | Option to skip future changelogs |

---

## Changelog File Format

### CHANGELOG.md

```markdown
# Changelog

## [1.2.0] - 2026-02-01

### Added
- Live WebSocket log streaming
- API tester with preset data
- Settings export/import functionality

### Changed
- Improved error modal with copy support
- Better port fallback handling

### Fixed
- WebSocket reconnection issues
- Settings validation errors

## [1.1.0] - 2026-01-25

### Added
- Settings management UI
- Version-aware configuration seeding

### Fixed
- Database migration issues

## [1.0.0] - 2026-01-15

### Initial Release
- Basic CLI functionality
- React frontend
- WebSocket communication
```

---

## Version Storage

### Local Storage Schema

```typescript
interface VersionState {
  lastSeenVersion: string;
  skipChangelog: boolean;
  dismissedVersions: string[];
}
```

---

## React Hook

```typescript
// hooks/useVersion.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface VersionInfo {
  version: string;
  changelog: string;
}

export function useVersion() {
  const [showChangelog, setShowChangelog] = useState(false);
  
  const { data: versionInfo } = useQuery<VersionInfo>({
    queryKey: ['version'],
    queryFn: async () => {
      const res = await fetch('/api/version');
      return res.json();
    }
  });
  
  useEffect(() => {
    if (!versionInfo) return;
    
    const stored = localStorage.getItem('version-state');
    const state: VersionState = stored 
      ? JSON.parse(stored) 
      : { lastSeenVersion: '', skipChangelog: false, dismissedVersions: [] };
    
    if (state.skipChangelog) return;
    
    if (state.lastSeenVersion !== versionInfo.version) {
      setShowChangelog(true);
    }
  }, [versionInfo]);
  
  const dismissChangelog = (skipFuture = false) => {
    if (!versionInfo) return;
    
    const stored = localStorage.getItem('version-state');
    const state: VersionState = stored 
      ? JSON.parse(stored) 
      : { lastSeenVersion: '', skipChangelog: false, dismissedVersions: [] };
    
    const newState: VersionState = {
      ...state,
      lastSeenVersion: versionInfo.version,
      skipChangelog: skipFuture,
      dismissedVersions: [...state.dismissedVersions, versionInfo.version]
    };
    
    localStorage.setItem('version-state', JSON.stringify(newState));
    setShowChangelog(false);
  };
  
  return {
    version: versionInfo?.version,
    changelog: versionInfo?.changelog,
    showChangelog,
    dismissChangelog
  };
}
```

---

## Changelog Modal Component

```typescript
// components/common/ChangelogModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChangelogModalProps {
  open: boolean;
  onClose: (skipFuture?: boolean) => void;
  changelog?: string;
  version?: string;
}

export function ChangelogModal({ open, onClose, changelog, version }: ChangelogModalProps) {
  const [skipFuture, setSkipFuture] = useState(false);

  return (
    <Dialog open={open} onOpenChange={() => onClose(skipFuture)}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>🎉 What's New in v{version}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="prose prose-sm dark:prose-invert">
            <ReactMarkdown>{changelog || 'No changelog available.'}</ReactMarkdown>
          </div>
        </ScrollArea>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Checkbox
              id="skip"
              checked={skipFuture}
              onCheckedChange={(c) => setSkipFuture(!!c)}
            />
            <label htmlFor="skip" className="text-sm text-muted-foreground">
              Don't show changelog on updates
            </label>
          </div>
          
          <Button onClick={() => onClose(skipFuture)}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Backend Endpoint

```go
// api/version.go
package api

import (
    "encoding/json"
    "net/http"
    "os"
)

var Version = "1.2.0" // Set at build time

type VersionResponse struct {
    Version   string
    Changelog string
}

func (h *Handler) HandleVersion(w http.ResponseWriter, r *http.Request) {
    changelog, _ := pathutil.ReadFile("CHANGELOG.md")
    
    resp := VersionResponse{
        Version:   Version,
        Changelog: string(changelog),
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}
```

---

## Extracting Current Version Changelog

Parse CHANGELOG.md to show only current version's changes:

```typescript
function extractCurrentChangelog(changelog: string, version: string): string {
  const versionPattern = new RegExp(`## \\[${version}\\].*?\n(.*?)(?=## \\[|$)`, 's');
  const match = changelog.match(versionPattern);
  return match ? match[1].trim() : changelog;
}
```

---

*Standard changelog system for all CLI frontends.*
