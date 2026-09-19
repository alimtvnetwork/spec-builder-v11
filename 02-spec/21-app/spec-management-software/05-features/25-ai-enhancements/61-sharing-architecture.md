# Phase 6.1: Sharing Architecture

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09
**Parent:** [Cross-Project Memory](./60-cross-project-memory.md)

---

## Overview

Architecture for sharing specs, folders, files, and knowledge items between projects with permission-based access control, versioning, and conflict resolution.

---

## 1. Sharing Model

### 1.1 Share Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SHARING ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                    ┌──────────────────┐              │
│  │  SOURCE PROJECT  │                    │  TARGET PROJECT  │              │
│  │                  │                    │                  │              │
│  │  ┌────────────┐  │    Share Link      │  ┌────────────┐  │              │
│  │  │ Spec File  │──┼────────────────────┼──│ Reference  │  │              │
│  │  └────────────┘  │                    │  └────────────┘  │              │
│  │                  │                    │                  │              │
│  │  ┌────────────┐  │    Share Link      │  ┌────────────┐  │              │
│  │  │  Folder    │──┼────────────────────┼──│ Reference  │  │              │
│  │  │  ├─ spec1  │  │                    │  └────────────┘  │              │
│  │  │  └─ spec2  │  │                    │                  │              │
│  │  └────────────┘  │                    │                  │              │
│  │                  │                    │                  │              │
│  │  ┌────────────┐  │    Share Link      │  ┌────────────┐  │              │
│  │  │  Memory    │──┼────────────────────┼──│ Reference  │  │              │
│  │  └────────────┘  │                    │  └────────────┘  │              │
│  │                  │                    │                  │              │
│  └──────────────────┘                    └──────────────────┘              │
│                                                                             │
│  Permissions: READ │ COPY │ SYNC                                            │
│  Access: PRIVATE │ PROJECT │ WORKSPACE │ PUBLIC                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Models

```typescript
// types/sharing.ts

/**
 * Core share record representing a shared resource between projects
 */
export interface MemoryShare {
  id: string;
  
  // Source information
  sourceProjectId: string;
  sourceProjectName: string;
  sourceWorkspaceId: string;
  
  // Target information
  targetProjectId: string;
  targetProjectName: string;
  targetWorkspaceId: string;
  
  // Resource details
  resourceType: ShareResourceType;
  resourcePath: string;
  resourceName: string;
  resourceHash: string; // Content hash for change detection
  
  // Access control
  permissions: SharePermission;
  accessLevel: ShareAccessLevel;
  
  // User tracking
  sharedBy: string;
  sharedByEmail: string;
  acceptedBy?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  
  // State
  status: ShareStatus;
  syncState?: SyncState;
}

export type ShareResourceType = 
  | 'spec'           // Single spec file
  | 'folder'         // Folder with all contents
  | 'file'           // Non-spec file (image, etc.)
  | 'url'            // URL reference
  | 'memory'         // Knowledge memory item
  | 'collection';    // Curated collection of items

export type SharePermission = 
  | 'read'           // View only, use in AI context
  | 'copy'           // Can duplicate to local project
  | 'sync'           // Bi-directional sync
  | 'edit';          // Can edit source (for collaborators)

export type ShareAccessLevel =
  | 'private'        // Only specific project
  | 'project'        // Anyone with project access
  | 'workspace'      // Anyone in workspace
  | 'public';        // Anyone with link

export type ShareStatus =
  | 'pending'        // Awaiting acceptance
  | 'active'         // Currently active
  | 'paused'         // Temporarily disabled
  | 'expired'        // Past expiration date
  | 'revoked';       // Permanently disabled

export interface SyncState {
  lastSyncedAt: Date;
  sourceVersion: number;
  targetVersion: number;
  hasConflict: boolean;
  conflictDetails?: ConflictInfo;
}

export interface ConflictInfo {
  sourceModifiedAt: Date;
  targetModifiedAt: Date;
  sourceModifiedBy: string;
  targetModifiedBy: string;
  conflictType: 'content' | 'delete' | 'rename';
}

/**
 * Share invitation for pending shares
 */
export interface ShareInvitation {
  id: string;
  shareId: string;
  inviteeEmail: string;
  inviteeProjectId?: string;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

/**
 * Collection of curated items for sharing
 */
export interface ShareCollection {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  items: ShareCollectionItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareCollectionItem {
  resourceType: ShareResourceType;
  resourcePath: string;
  resourceName: string;
  order: number;
  notes?: string;
}
```

### 1.3 Database Schema

```sql
-- Core shares table
CREATE TABLE IF NOT EXISTS memory_shares (
  id TEXT PRIMARY KEY,
  
  -- Source
  source_project_id TEXT NOT NULL,
  source_project_name TEXT NOT NULL,
  source_workspace_id TEXT NOT NULL,
  
  -- Target
  target_project_id TEXT NOT NULL,
  target_project_name TEXT NOT NULL,
  target_workspace_id TEXT NOT NULL,
  
  -- Resource
  resource_type TEXT NOT NULL 
    CHECK (resource_type IN ('spec', 'folder', 'file', 'url', 'memory', 'collection')),
  resource_path TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  resource_hash TEXT,
  
  -- Access
  permissions TEXT DEFAULT 'read' 
    CHECK (permissions IN ('read', 'copy', 'sync', 'edit')),
  access_level TEXT DEFAULT 'private'
    CHECK (access_level IN ('private', 'project', 'workspace', 'public')),
  
  -- Users
  shared_by TEXT NOT NULL,
  shared_by_email TEXT NOT NULL,
  accepted_by TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  
  -- State
  status TEXT DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'paused', 'expired', 'revoked')),
  
  -- Constraints
  UNIQUE(source_project_id, target_project_id, resource_path),
  FOREIGN KEY (source_project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (target_project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IdxSharesSourceProject ON memory_shares(source_project_id);
CREATE INDEX IdxSharesTargetProject ON memory_shares(target_project_id);
CREATE INDEX IdxSharesSourceWorkspace ON memory_shares(source_workspace_id);
CREATE INDEX IdxSharesTargetWorkspace ON memory_shares(target_workspace_id);
CREATE INDEX IdxSharesStatus ON memory_shares(status);
CREATE INDEX IdxSharesType ON memory_shares(resource_type);
CREATE INDEX IdxSharesSharedBy ON memory_shares(shared_by);

-- Sync state tracking
CREATE TABLE IF NOT EXISTS share_sync_state (
  share_id TEXT PRIMARY KEY,
  last_synced_at DATETIME,
  source_version INTEGER DEFAULT 1,
  target_version INTEGER DEFAULT 1,
  has_conflict BOOLEAN DEFAULT FALSE,
  conflict_details TEXT, -- JSON
  FOREIGN KEY (share_id) REFERENCES memory_shares(id) ON DELETE CASCADE
);

-- Share invitations
CREATE TABLE IF NOT EXISTS share_invitations (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_project_id TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME,
  declined_at DATETIME,
  FOREIGN KEY (share_id) REFERENCES memory_shares(id) ON DELETE CASCADE
);

CREATE INDEX IdxInvitationsEmail ON share_invitations(invitee_email);
CREATE INDEX IdxInvitationsExpires ON share_invitations(expires_at);

-- Share collections
CREATE TABLE IF NOT EXISTS share_collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS share_collection_items (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_path TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  item_order INTEGER DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (collection_id) REFERENCES share_collections(id) ON DELETE CASCADE
);

-- Cached content for offline access
CREATE TABLE IF NOT EXISTS share_content_cache (
  share_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (share_id) REFERENCES memory_shares(id) ON DELETE CASCADE
);

-- Audit log for share activities
CREATE TABLE IF NOT EXISTS share_audit_log (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  details TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (share_id) REFERENCES memory_shares(id) ON DELETE CASCADE
);

CREATE INDEX IdxAuditShare ON share_audit_log(share_id);
CREATE INDEX IdxAuditActor ON share_audit_log(actor_id);
CREATE INDEX IdxAuditCreated ON share_audit_log(created_at);
```

---

## 2. Backend Services

### 2.1 Share Service

```go
// internal/sharing/share_service.go

package sharing

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"specmgmt/internal/db"
	"specmgmt/internal/files"
	"specmgmt/internal/projects"
)

type ShareService struct {
	db       *db.DB
	files    *files.Service
	projects *projects.Service
	sync     *SyncService
	audit    *AuditService
}

func NewShareService(
	db *db.DB,
	files *files.Service,
	projects *projects.Service,
) *ShareService {
	svc := &ShareService{
		db:       db,
		files:    files,
		projects: projects,
	}
	svc.sync = NewSyncService(db, files)
	svc.audit = NewAuditService(db)
	return svc
}

// CreateShare establishes a new share between projects
func (s *ShareService) CreateShare(context stdctx.Context, req CreateShareRequest) apperror.Result[MemoryShare] {
	// Validate source resource exists
	exists, err := s.files.Exists(context, req.SourceProjectId, req.ResourcePath)
	if err != nil || !exists {
		return apperror.FailNew[MemoryShare](
			"E9100",
			fmt.Sprintf("resource not found: %s", req.ResourcePath),
		)
	}

	// Validate user has permission on source project
	hasAccess, err := s.projects.HasAccess(context, req.UserId, req.SourceProjectId, "admin")
	if err != nil || !hasAccess {
		return apperror.FailNew[MemoryShare](
			"E9101",
			"insufficient permissions on source project",
		)
	}

	// Get project names for denormalization
	sourceProject, _ := s.projects.Get(context, req.SourceProjectId)
	targetProject, _ := s.projects.Get(context, req.TargetProjectId)

	// Calculate content hash
	content, err := s.files.GetContent(context, req.SourceProjectId, req.ResourcePath)
	if err != nil {
		return apperror.FailWrap[MemoryShare](
			err,
			"E9102",
			"failed to read content",
		)
	}
	hash := s.hashContent(content)

	share := &MemoryShare{
		Id:                generateId(),
		SourceProjectId:   req.SourceProjectId,
		SourceProjectName: sourceProject.Name,
		SourceWorkspaceId: sourceProject.WorkspaceId,
		TargetProjectId:   req.TargetProjectId,
		TargetProjectName: targetProject.Name,
		TargetWorkspaceId: targetProject.WorkspaceId,
		ResourceType:      req.ResourceType,
		ResourcePath:      req.ResourcePath,
		ResourceName:      req.ResourceName,
		ResourceHash:      hash,
		Permissions:       req.Permissions,
		AccessLevel:       req.AccessLevel,
		SharedBy:          req.UserId,
		SharedByEmail:     req.UserEmail,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		Status:            "active",
	}

	// Handle expiration
	if req.ExpiresIn > 0 {
		expiry := time.Now().Add(req.ExpiresIn)
		share.ExpiresAt = &expiry
	}

	// Insert share
	if err := s.insertShare(context, share); err != nil {
		return apperror.FailWrap[MemoryShare](
			err,
			"E9102",
			"failed to create share",
		)
	}

	// Initialize sync state if sync permission
	if req.Permissions == "sync" {
		if err := s.sync.InitializeSyncState(context, share.Id); err != nil {
			// Log but don't fail
			fmt.Printf("Warning: failed to init sync state: %v\n", err)
		}
	}

	// Cache content for read shares
	if err := s.cacheContent(context, share.Id, content, hash); err != nil {
		fmt.Printf("Warning: failed to cache content: %v\n", err)
	}

	// ShareAuditDetails is the typed context for share audit log entries.
	type ShareAuditDetails struct {
		Permissions []string
		AccessLevel string
	}

	// Audit log
	s.audit.Log(context, share.Id, "created", req.UserId, req.UserEmail, ShareAuditDetails{
		Permissions: req.Permissions,
		AccessLevel: req.AccessLevel,
	})

	return apperror.Ok(*share)
}

// GetSharesForProject returns all shares where project is target
func (s *ShareService) GetSharesForProject(context stdctx.Context, projectId string) apperror.Result[[]MemoryShare] {
	query := `
		SELECT * FROM memory_shares 
		WHERE target_project_id = ? AND status = 'active'
		ORDER BY created_at DESC
	`

	shares, err := s.queryShares(context, query, projectId)
	if err != nil {
		return apperror.FailWrap[[]MemoryShare](
			err,
			"E9103",
			"failed to query shares for project",
		)
	}

	return apperror.Ok(shares)
}

// GetSharesFromProject returns all shares where project is source
func (s *ShareService) GetSharesFromProject(context stdctx.Context, projectId string) apperror.Result[[]MemoryShare] {
	query := `
		SELECT * FROM memory_shares 
		WHERE source_project_id = ? AND status != 'revoked'
		ORDER BY created_at DESC
	`

	shares, err := s.queryShares(context, query, projectId)
	if err != nil {
		return apperror.FailWrap[[]MemoryShare](
			err,
			"E9103",
			"failed to query shares from project",
		)
	}

	return apperror.Ok(shares)
}

// GetShareContent retrieves the actual content of a shared resource
func (s *ShareService) GetShareContent(context stdctx.Context, shareId, userId string) apperror.Result[string] {
	share, err := s.GetShare(context, shareId)
	if err != nil {
		return apperror.FailWrap[string](
			err,
			"E9104",
			"share not found",
		)
	}

	// Validate user has access
	if err := s.validateAccess(context, share, userId); err != nil {
		return apperror.FailWrap[string](
			err,
			"E9104",
			"access denied",
		)
	}

	// Try cache first
	if cached, err := s.getCachedContent(context, shareId); err == nil {
		return apperror.Ok(cached)
	}

	// Fetch from source
	content, err := s.files.GetContent(context, share.SourceProjectId, share.ResourcePath)
	if err != nil {
		return apperror.FailWrap[string](
			err,
			"E9104",
			"failed to fetch content",
		)
	}

	// Update cache
	hash := s.hashContent(content)
	s.cacheContent(context, shareId, content, hash)

	return apperror.Ok(content)
}

// RevokeShare permanently disables a share
func (s *ShareService) RevokeShare(context stdctx.Context, shareId, userId, userEmail string) error {
	share, err := s.GetShare(context, shareId)
	if err != nil {
		return err
	}

	// Only sharer can revoke
	if share.SharedBy != userId {
		// Check if user is project admin
		hasAccess, _ := s.projects.HasAccess(context, userId, share.SourceProjectId, "admin")
		if !hasAccess {
			return apperror.New(
				ErrInsufficientPermissions,
				"insufficient permissions to revoke share",
			)
		}
	}

	_, err = s.db.ExecContext(context, `
		UPDATE memory_shares 
		SET status = 'revoked', updated_at = ?
		WHERE id = ?
	`, time.Now(), shareId)

	if err == nil {
		s.audit.Log(context, shareId, "revoked", userId, userEmail, nil)
	}

	return err
}

// UpdatePermissions changes share permissions
func (s *ShareService) UpdatePermissions(context stdctx.Context, shareId, userId string, permissions string) error {
	share, err := s.GetShare(context, shareId)
	if err != nil {
		return err
	}

	if share.SharedBy != userId {
		return apperror.New(
			ErrInsufficientPermissions,
			"only the sharer can update permissions",
		)
	}

	_, err = s.db.ExecContext(context, `
		UPDATE memory_shares 
		SET permissions = ?, updated_at = ?
		WHERE id = ?
	`, permissions, time.Now(), shareId)

	// Initialize sync if upgrading to sync
	if permissions == "sync" && share.Permissions != "sync" {
		s.sync.InitializeSyncState(context, shareId)
	}

	return err
}

func (s *ShareService) hashContent(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])
}

func (s *ShareService) cacheContent(context stdctx.Context, shareId, content, hash string) error {
	expires := time.Now().Add(24 * time.Hour)
	_, err := s.db.ExecContext(context, `
		INSERT OR REPLACE INTO share_content_cache 
		(share_id, content, content_hash, cached_at, expires_at)
		VALUES (?, ?, ?, ?, ?)
	`, shareId, content, hash, time.Now(), expires)
	return err
}
```

### 2.2 Permission Validator

```go
// internal/sharing/permission_validator.go

package sharing

import (
	stdctx "context"
	"fmt"
)

type PermissionValidator struct {
	shares   *ShareService
	projects *projects.Service
}

// ValidateAccess checks if a user can access a share
func (v *PermissionValidator) ValidateAccess(
	context stdctx.Context,
	share *MemoryShare,
	userId string,
	requiredPermission string,
) error {
	// Check share status
	if share.Status != "active" {
		return apperror.New(
			ErrShareNotActive,
			"share is not active: "+share.Status,
		)
	}

	// Check expiration
	if share.ExpiresAt != nil && time.Now().After(*share.ExpiresAt) {
		return apperror.New(
			ErrShareExpired,
			"share has expired",
		)
	}

	// Check access level
	switch share.AccessLevel {
	case "public":
		// Anyone can access
		return nil
		
	case "workspace":
		// Check workspace membership
		hasAccess, _ := v.projects.IsWorkspaceMember(ctx, userId, share.TargetWorkspaceId)
		if hasAccess {
			return nil
		}
		return apperror.New(
			ErrAccessDenied,
			"not a workspace member",
		)
		
	case "project":
		// Check project membership
		hasAccess, _ := v.projects.HasAccess(ctx, userId, share.TargetProjectId, "viewer")
		if hasAccess {
			return nil
		}
		return apperror.New(
			ErrAccessDenied,
			"not a project member",
		)
		
	case "private":
		// Check specific project access
		hasAccess, _ := v.projects.HasAccess(ctx, userId, share.TargetProjectId, "viewer")
		if hasAccess {
			return nil
		}
		return apperror.New(
			ErrAccessDenied,
			"access denied",
		)
	}

	return apperror.New(
		ErrUnknownAccessLevel,
		"unknown access level",
	)
}

// CanPerformAction checks if user can perform specific action
func (v *PermissionValidator) CanPerformAction(
	share *MemoryShare,
	action string,
) bool {
	switch action {
	case "read":
		return true // All permission levels can read
		
	case "copy":
		return share.Permissions == "copy" || 
			   share.Permissions == "sync" || 
			   share.Permissions == "edit"
		
	case "sync":
		return share.Permissions == "sync" || share.Permissions == "edit"
		
	case "edit":
		return share.Permissions == "edit"
	}
	
	return false
}
```

---

## 3. Frontend Components

### 3.1 Share Dialog

```typescript
// components/sharing/ShareDialog.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Link, Users, Globe, Lock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SharePermission, ShareAccessLevel, ShareResourceType } from '@/types/sharing';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceProjectId: string;
  resource: {
    type: ShareResourceType;
    path: string;
    name: string;
  };
}

export function ShareDialog({
  open,
  onOpenChange,
  sourceProjectId,
  resource,
}: ShareDialogProps) {
  const [shareType, setShareType] = useState<'project' | 'link'>('project');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [permissions, setPermissions] = useState<SharePermission>('read');
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>('private');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch available projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      return res.json();
    },
  });
  
  const targetProjects = projects.filter((p: any) => p.id !== sourceProjectId);
  
  // Create share mutation
  const createShare = useMutation({
    mutationFn: async () => {
      const body: any = {
        source_project_id: sourceProjectId,
        resource_type: resource.type,
        resource_path: resource.path,
        resource_name: resource.name,
        permissions,
        access_level: accessLevel,
      };
      
      if (shareType === 'project') {
        body.target_project_id = targetProjectId;
      }
      
      if (hasExpiry) {
        body.expires_in_days = expiryDays;
      }
      
      const res = await fetch('/api/v1/sharing/shares', {
        method: HttpMethod.Post,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Shared successfully' });
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      onOpenChange(false);
      
      // Copy link if link share
      if (shareType === 'link' && data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast({ title: 'Link copied to clipboard' });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to share',
        description: error.message,
      });
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {resource.type}
          </DialogTitle>
          <DialogDescription>
            Share "{resource.name}" with another project or create a shareable link.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={shareType} onValueChange={(v) => setShareType(v as 'project' | 'link')}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="project" className="gap-2">
              <Users className="h-4 w-4" />
              Share to Project
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link className="h-4 w-4" />
              Create Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="project" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Target Project</Label>
              <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {targetProjects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Access Level</Label>
              <RadioGroup value={accessLevel} onValueChange={(v) => setAccessLevel(v as ShareAccessLevel)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="workspace" id="workspace" />
                  <Label htmlFor="workspace" className="flex items-center gap-2 font-normal">
                    <Users className="h-4 w-4" />
                    <div>
                      <span className="font-medium">Workspace</span>
                      <p className="text-xs text-muted-foreground">Anyone in your workspace</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex items-center gap-2 font-normal">
                    <Globe className="h-4 w-4" />
                    <div>
                      <span className="font-medium">Public</span>
                      <p className="text-xs text-muted-foreground">Anyone with the link</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Common options */}
        <div className="space-y-4 pt-4 border-t">
          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <RadioGroup value={permissions} onValueChange={(v) => setPermissions(v as SharePermission)}>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="read" id="perm-read" />
                  <Label htmlFor="perm-read" className="font-normal cursor-pointer">
                    <span className="font-medium">Read</span>
                    <p className="text-xs text-muted-foreground">View and reference in AI</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="copy" id="perm-copy" />
                  <Label htmlFor="perm-copy" className="font-normal cursor-pointer">
                    <span className="font-medium">Copy</span>
                    <p className="text-xs text-muted-foreground">Can duplicate locally</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="sync" id="perm-sync" />
                  <Label htmlFor="perm-sync" className="font-normal cursor-pointer">
                    <span className="font-medium">Sync</span>
                    <p className="text-xs text-muted-foreground">Auto-sync changes</p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Expiration */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Set expiration
              </Label>
              <p className="text-xs text-muted-foreground">
                Share will expire after specified days
              </p>
            </div>
            <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
          </div>
          
          {hasExpiry && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createShare.mutate()}
            disabled={
              createShare.isPending ||
              (shareType === 'project' && !targetProjectId)
            }
          >
            {shareType === 'link' ? 'Create Link' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. Testing Requirements

| Test | Description | Priority |
|------|-------------|----------|
| Create share | Share created with correct data | Critical |
| Permission validation | Access denied without permission | Critical |
| Cross-workspace share | Shares work across workspaces | High |
| Share expiration | Expired shares inaccessible | High |
| Revoke share | Revoked shares stop working | High |
| Content caching | Cache speeds up access | Medium |
| Audit logging | All actions logged | Medium |

---

## Related Specs

- [Sync Mechanism](./62-sync-mechanism.md)
- [RAG Integration](./63-rag-integration.md)
- [UI Components](./64-sharing-ui.md)
