import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText, ChevronRight, ChevronDown, X, FolderOpen, Search, Folder,
   BookOpen, ArrowLeft, Copy, Check, Download, Expand, Plus, Minus,
   RotateCcw, List, Hash, Minimize2, FileCode2, Keyboard, ListChecks,
 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { splitHighlightedCode } from "@/utils/highlight-lines";
import { augmentSpecFolders } from "@/utils/spec-index";

// ── Spec data & types ────────────────────────────────────────────────

const specModules = import.meta.glob(['/02-spec/**/*.md', '/spec/**/*.md'], { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

interface SpecFile { name: string; path: string; }

interface SpecFolder {
  id: string;
  label: string;
  path: string;
  description: string;
  category: "foundation" | "core" | "cli" | "wordpress" | "standards" | "utilities" | "enforcement";
  files: SpecFile[];
  children?: SpecFolder[];
}

const categoryColors: Record<SpecFolder["category"], { bg: string; text: string; label: string; border: string; fileBg: string; iconColor: string }> = {
  foundation: { bg: "bg-info/20", text: "text-info", label: "Foundation", border: "border-l-info", fileBg: "hover:bg-info/10", iconColor: "text-info/90" },
  core: { bg: "bg-primary/20", text: "text-primary", label: "Core System", border: "border-l-primary", fileBg: "hover:bg-primary/10", iconColor: "text-primary/90" },
  cli: { bg: "bg-success/20", text: "text-success", label: "CLI Tool", border: "border-l-success", fileBg: "hover:bg-success/10", iconColor: "text-success/90" },
  wordpress: { bg: "bg-warning/20", text: "text-warning", label: "WordPress", border: "border-l-warning", fileBg: "hover:bg-warning/10", iconColor: "text-warning/90" },
  standards: { bg: "bg-[hsl(var(--vscode-purple)/0.2)]", text: "text-[hsl(var(--vscode-purple))]", label: "Standards", border: "border-l-[hsl(var(--vscode-purple))]", fileBg: "hover:bg-[hsl(var(--vscode-purple)/0.1)]", iconColor: "text-[hsl(var(--vscode-purple)/0.9)]" },
  utilities: { bg: "bg-[hsl(var(--vscode-yellow)/0.2)]", text: "text-[hsl(var(--vscode-yellow))]", label: "Utility", border: "border-l-[hsl(var(--vscode-yellow))]", fileBg: "hover:bg-[hsl(var(--vscode-yellow)/0.1)]", iconColor: "text-[hsl(var(--vscode-yellow)/0.9)]" },
  enforcement: { bg: "bg-destructive/20", text: "text-destructive", label: "Enforcement", border: "border-l-destructive", fileBg: "hover:bg-destructive/10", iconColor: "text-destructive/90" },
};

// Same folder data as SpecFileViewer
const specFolders: SpecFolder[] = [
  { id: "root", label: "Root Files", path: "02-spec", description: "Top-level spec directory files.", category: "foundation", files: [
    { name: "Overview", path: "02-spec/00-overview.md" },
    { name: "Folder Structure Guideline", path: "02-spec/00-folder-structure-guideline.md" },
    { name: "Prefix Disambiguation", path: "02-spec/02-prefix-disambiguation.md" },
    { name: "Consistency Report", path: "02-02-spec/99-consistency-report.md" },
  ]},
  { id: "01", label: "General Spec", path: "02-spec/01-general-spec", description: "Architecture-wide standards and cross-cutting concerns.", category: "foundation", files: [
    { name: "Overview", path: "02-spec/01-general-spec/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/01-general-spec/97-acceptance-criteria.md" },
    { name: "Changelog", path: "02-spec/01-general-spec/98-changelog.md" },
    { name: "Consistency Report", path: "02-spec/01-general-02-spec/99-consistency-report.md" },
  ]},
  { id: "03", label: "Coding Guidelines", path: "02-spec/02-coding-guidelines", description: "Master coding standards.", category: "standards", files: [
    { name: "Overview", path: "02-spec/02-coding-guidelines/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/02-coding-guidelines/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/02-coding-guidelines/99-consistency-report.md" },
  ], children: [
    { id: "03-spec", label: "Coding Guidelines Spec", path: "02-spec/02-coding-guidelines/01-cross-language", description: "Cross-language coding standards.", category: "standards", files: [
      { name: "Overview", path: "02-spec/02-coding-guidelines/01-cross-language/00-overview.md" },
    ]},
    { id: "03-archive", label: "_Archive", path: "02-spec/02-coding-guidelines/_archive", description: "Archived coding guidelines.", category: "standards", files: [] },
  ]},
  { id: "07", label: "Error Code Registry", path: "02-spec/03-error-code-registry", description: "Global error code registry.", category: "core", files: [
    { name: "Overview", path: "02-spec/03-error-code-registry/00-overview.md" },
    { name: "Registry", path: "02-spec/03-error-code-registry/01-registry.md" },
    { name: "Integration Guide", path: "02-spec/03-error-code-registry/02-integration-guide.md" },
    { name: "Collision Resolution Summary", path: "02-spec/03-error-code-registry/03-collision-resolution-summary.md" },
    { name: "Error Code Utilization Report", path: "02-spec/03-error-code-registry/04-error-code-utilization-report.md" },
    { name: "Overlap Validator", path: "02-spec/03-error-code-registry/08-overlap-validator.md" },
    { name: "Acceptance Criteria", path: "02-spec/03-error-code-registry/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/03-error-code-registry/99-consistency-report.md" },
  ]},
  { id: "18", label: "Error Resolution", path: "02-spec/04-error-resolution", description: "Error resolution patterns and debugging guides.", category: "foundation", files: [
    { name: "Overview", path: "02-spec/04-error-resolution/00-overview.md" },
    { name: "Cross Reference Diagram", path: "02-spec/04-error-resolution/04-cross-reference-diagram.md" },
    { name: "Debugging Cheat Sheet", path: "02-spec/04-error-resolution/05-debugging-cheat-sheet.md" },
    { name: "Acceptance Criteria", path: "02-spec/04-error-resolution/97-acceptance-criteria.md" },
    { name: "Changelog", path: "02-spec/04-error-resolution/98-changelog.md" },
    { name: "Consistency Report", path: "02-spec/04-error-resolution/99-consistency-report.md" },
  ]},
  { id: "08", label: "Spec Authoring Guide", path: "02-spec/05-spec-authoring-guide", description: "Standards and templates for writing specification documents.", category: "foundation", files: [
    { name: "Overview", path: "02-spec/05-spec-authoring-guide/00-overview.md" },
    { name: "Folder Structure", path: "02-spec/05-spec-authoring-guide/01-folder-structure.md" },
    { name: "Naming Conventions", path: "02-spec/05-spec-authoring-guide/02-naming-conventions.md" },
    { name: "Required Files", path: "02-spec/05-spec-authoring-guide/03-required-files.md" },
    { name: "Cli Module Template", path: "02-spec/05-spec-authoring-guide/04-cli-module-template.md" },
    { name: "Non Cli Module Template", path: "02-spec/05-spec-authoring-guide/05-non-cli-module-template.md" },
    { name: "Memory Folder Guide", path: "02-spec/05-spec-authoring-guide/06-memory-folder-guide.md" },
    { name: "Cross References", path: "02-spec/05-spec-authoring-guide/07-cross-references.md" },
    { name: "Exceptions", path: "02-spec/05-spec-authoring-guide/08-exceptions.md" },
    { name: "Acceptance Criteria", path: "02-spec/05-spec-authoring-guide/97-acceptance-criteria.md" },
    { name: "Changelog", path: "02-spec/05-spec-authoring-guide/98-changelog.md" },
    { name: "Consistency Report", path: "02-spec/05-spec-authoring-guide/99-consistency-report.md" },
  ]},
  { id: "04", label: "Split DB Architecture", path: "02-spec/06-split-db-architecture", description: "Hierarchical SQLite pattern for multi-tenant data isolation.", category: "core", files: [
    { name: "Overview", path: "02-spec/06-split-db-architecture/00-overview.md" },
    { name: "CLI Examples", path: "02-spec/06-split-db-architecture/01-cli-examples.md" },
    { name: "Reset API Standard", path: "02-spec/06-split-db-architecture/02-reset-api-standard.md" },
    { name: "Database Flow Diagrams", path: "02-spec/06-split-db-architecture/03-database-flow-diagrams.md" },
    { name: "RBAC Casbin", path: "02-spec/06-split-db-architecture/04-rbac-casbin.md" },
    { name: "User Scoped Isolation", path: "02-spec/06-split-db-architecture/05-user-scoped-isolation.md" },
    { name: "Acceptance Criteria", path: "02-spec/06-split-db-architecture/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/06-split-db-architecture/99-consistency-report.md" },
  ]},
  { id: "05", label: "Seedable Config Architecture", path: "02-spec/07-seedable-config-architecture", description: "Configuration seeding and RAG chunk settings.", category: "core", files: [
    { name: "Overview", path: "02-spec/07-seedable-config-architecture/00-overview.md" },
    { name: "RAG Chunk Settings", path: "02-spec/07-seedable-config-architecture/02-rag-chunk-settings.md" },
    { name: "RAG Validation Helpers", path: "02-spec/07-seedable-config-architecture/03-rag-validation-helpers.md" },
    { name: "RAG Validation Tests", path: "02-spec/07-seedable-config-architecture/04-rag-validation-tests.md" },
    { name: "RAG Test Coverage Matrix", path: "02-spec/07-seedable-config-architecture/05-rag-test-coverage-matrix.md" },
    { name: "Validation Data Seeding", path: "02-spec/07-seedable-config-architecture/06-validation-data-seeding.md" },
    { name: "Acceptance Criteria", path: "02-spec/07-seedable-config-architecture/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/07-seedable-config-architecture/99-consistency-report.md" },
  ]},
  { id: "31", label: "Generic Enforce", path: "02-spec/08-generic-enforce", description: "General enforcement rules.", category: "enforcement", files: [
    { name: "Overview", path: "02-spec/08-generic-enforce/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/08-generic-enforce/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/08-generic-enforce/99-consistency-report.md" },
  ]},
  { id: "02-sms", label: "Spec Management Software", path: "02-spec/11-spec-management-software", description: "The spec management tool itself.", category: "core", files: [
    { name: "Overview", path: "02-spec/11-spec-management-software/00-overview.md" },
    { name: "Enum Consumer Checklist", path: "02-spec/11-spec-management-software/18-enum-consumer-checklist.md" },
    { name: "Session Changelog", path: "02-spec/11-spec-management-software/92-session-changelog-2026-01-28.md" },
    { name: "Cross Reference Validation", path: "02-spec/11-spec-management-software/93-cross-reference-validation-report.md" },
    { name: "Quality Improvement Plan", path: "02-spec/11-spec-management-software/94-quality-improvement-plan.md" },
    { name: "Master Index", path: "02-spec/11-spec-management-software/95-master-index.md" },
    { name: "Context for AI", path: "02-spec/11-spec-management-software/96-context-for-ai.md" },
    { name: "Acceptance Criteria", path: "02-spec/11-spec-management-software/97-acceptance-criteria.md" },
    { name: "AI Handoff Guide", path: "02-spec/11-spec-management-software/97-ai-handoff-guide.md" },
    { name: "Changelog", path: "02-spec/11-spec-management-software/98-changelog.md" },
    { name: "Consistency Report", path: "02-spec/11-spec-management-software/99-consistency-report.md" },
  ]},
  { id: "09", label: "GSearch CLI", path: "02-spec/20-gsearch-cli", description: "Google Search CLI tool.", category: "cli", files: [
    { name: "Overview", path: "02-spec/20-gsearch-cli/00-overview.md" },
    { name: "AI Bridge Integration", path: "02-spec/20-gsearch-cli/05-ai-bridge-integration.md" },
    { name: "Acceptance Criteria", path: "02-spec/20-gsearch-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/20-gsearch-cli/99-consistency-report.md" },
  ]},
  { id: "10", label: "BRun CLI", path: "02-spec/21-brun-cli", description: "Build runner CLI.", category: "cli", files: [
    { name: "Overview", path: "02-spec/21-brun-cli/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/21-brun-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/21-brun-cli/99-consistency-report.md" },
  ]},
  { id: "11", label: "AI Bridge CLI", path: "02-spec/22-ai-bridge-cli", description: "AI Bridge CLI for connecting LLMs.", category: "cli", files: [
    { name: "Overview", path: "02-spec/22-ai-bridge-cli/00-overview.md" },
    { name: "Verification Report", path: "02-spec/22-ai-bridge-cli/04-verification-report.md" },
    { name: "Acceptance Criteria", path: "02-spec/22-ai-bridge-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/22-ai-bridge-cli/99-consistency-report.md" },
  ]},
  { id: "33", label: "AI Bridge Non-Vector RAG", path: "02-spec/23-ai-bridge-non-vector-rag", description: "Non-vector RAG system.", category: "cli", files: [
    { name: "Overview", path: "02-spec/23-ai-bridge-non-vector-rag/00-overview.md" },
    { name: "Architecture", path: "02-spec/23-ai-bridge-non-vector-rag/01-architecture.md" },
    { name: "Tree Index Schema", path: "02-spec/23-ai-bridge-non-vector-rag/02-tree-index-schema.md" },
    { name: "Code Parser", path: "02-spec/23-ai-bridge-non-vector-rag/03-code-parser.md" },
    { name: "Document Parser", path: "02-spec/23-ai-bridge-non-vector-rag/04-document-parser.md" },
    { name: "Tree Indexing Engine", path: "02-spec/23-ai-bridge-non-vector-rag/05-tree-indexing-engine.md" },
    { name: "Tree Retrieval Engine", path: "02-spec/23-ai-bridge-non-vector-rag/06-tree-retrieval-engine.md" },
    { name: "API Interface", path: "02-spec/23-ai-bridge-non-vector-rag/07-api-interface.md" },
    { name: "Error Codes", path: "02-spec/23-ai-bridge-non-vector-rag/08-error-codes.md" },
    { name: "Configuration", path: "02-spec/23-ai-bridge-non-vector-rag/09-configuration.md" },
    { name: "AI Bridge Integration", path: "02-spec/23-ai-bridge-non-vector-rag/10-ai-bridge-integration.md" },
    { name: "Performance Benchmarks", path: "02-spec/23-ai-bridge-non-vector-rag/11-performance-benchmarks.md" },
    { name: "Retrieval Router", path: "02-spec/23-ai-bridge-non-vector-rag/12-retrieval-router.md" },
    { name: "Acceptance Criteria", path: "02-spec/23-ai-bridge-non-vector-rag/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/23-ai-bridge-non-vector-rag/99-consistency-report.md" },
  ]},
  { id: "12", label: "Nexus Flow CLI", path: "02-spec/24-nexus-flow-cli", description: "Nexus Flow CLI for workflow automation.", category: "cli", files: [
    { name: "Overview", path: "02-spec/24-nexus-flow-cli/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/24-nexus-flow-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/24-nexus-flow-cli/99-consistency-report.md" },
  ]},
  { id: "24", label: "TypeScript Standards", path: "02-spec/24-typescript-standards", description: "TypeScript-specific rules.", category: "standards", files: [
    { name: "Overview", path: "02-spec/24-typescript-standards/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/24-typescript-standards/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/24-typescript-standards/99-consistency-report.md" },
  ]},
  { id: "15", label: "Spec Reverse CLI", path: "02-spec/25-spec-reverse-cli", description: "Reverse-engineers codebases into spec files.", category: "cli", files: [
    { name: "Overview", path: "02-spec/25-spec-reverse-cli/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/25-spec-reverse-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/25-spec-reverse-cli/99-consistency-report.md" },
  ]},
  { id: "25", label: "Golang Standards", path: "02-spec/25-golang-standards", description: "Go language standards.", category: "standards", files: [
    { name: "Overview", path: "02-spec/25-golang-standards/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/25-golang-standards/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/25-golang-standards/99-consistency-report.md" },
  ]},
  { id: "16", label: "AI Transcribe CLI", path: "02-spec/26-ai-transcribe-cli", description: "AI-powered transcription CLI.", category: "cli", files: [
    { name: "Overview", path: "02-spec/26-ai-transcribe-cli/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/26-ai-transcribe-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/26-ai-transcribe-cli/99-consistency-report.md" },
  ]},
  { id: "26", label: "PHP Standards", path: "02-spec/26-php-standards", description: "PHP coding rules.", category: "standards", files: [
    { name: "Overview", path: "02-spec/26-php-standards/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/26-php-standards/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/26-php-standards/99-consistency-report.md" },
  ]},
  { id: "19", label: "License Manager", path: "02-spec/27-license-manager", description: "Software license management.", category: "cli", files: [
    { name: "Overview", path: "02-spec/27-license-manager/00-overview.md" },
    { name: "Architecture", path: "02-spec/27-license-manager/01-architecture.md" },
    { name: "CLI Interface", path: "02-spec/27-license-manager/02-cli-interface.md" },
    { name: "Data Models", path: "02-spec/27-license-manager/03-data-models.md" },
    { name: "Error Handling", path: "02-spec/27-license-manager/04-error-handling.md" },
    { name: "Acceptance Criteria", path: "02-spec/27-license-manager/05-acceptance-criteria.md" },
    { name: "Configuration", path: "02-spec/27-license-manager/06-configuration.md" },
    { name: "Acceptance Criteria", path: "02-spec/27-license-manager/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/27-license-manager/99-consistency-report.md" },
  ]},
  { id: "20", label: "Shared CLI Frontend", path: "02-spec/28-shared-cli-frontend", description: "Reusable React frontend pattern.", category: "core", files: [
    { name: "Overview", path: "02-spec/28-shared-cli-frontend/00-overview.md" },
    { name: "Folder Structure", path: "02-spec/28-shared-cli-frontend/01-folder-structure.md" },
    { name: "WebSocket Protocol", path: "02-spec/28-shared-cli-frontend/02-websocket-protocol.md" },
    { name: "Settings Service", path: "02-spec/28-shared-cli-frontend/03-settings-service.md" },
    { name: "API Tester", path: "02-spec/28-shared-cli-frontend/04-api-tester.md" },
    { name: "Error Modal", path: "02-spec/28-shared-cli-frontend/05-error-modal.md" },
    { name: "Changelog System", path: "02-spec/28-shared-cli-frontend/06-changelog-system.md" },
    { name: "Port Management", path: "02-spec/28-shared-cli-frontend/07-port-management.md" },
    { name: "PowerShell Integration", path: "02-spec/28-shared-cli-frontend/08-powershell-integration.md" },
    { name: "Deploy Folder", path: "02-spec/28-shared-cli-frontend/09-deploy-folder.md" },
    { name: "Component Library", path: "02-spec/28-shared-cli-frontend/10-component-library.md" },
    { name: "E2E Test Spec", path: "02-spec/28-shared-cli-frontend/11-e2e-test-spec.md" },
    { name: "Accessibility Spec", path: "02-spec/28-shared-cli-frontend/12-accessibility-spec.md" },
    { name: "Visual Regression Spec", path: "02-spec/28-shared-cli-frontend/13-visual-regression-spec.md" },
    { name: "Architecture Template", path: "02-spec/28-shared-cli-frontend/14-architecture-template.md" },
    { name: "Hooks Library", path: "02-spec/28-shared-cli-frontend/15-hooks-library.md" },
    { name: "Tree Visualization", path: "02-spec/28-shared-cli-frontend/16-tree-visualization.md" },
    { name: "Acceptance Criteria", path: "02-spec/28-shared-cli-frontend/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/28-shared-cli-frontend/99-consistency-report.md" },
  ]},
  { id: "13", label: "WP Plugin", path: "02-spec/30-wp-plugin", description: "WordPress plugin specs.", category: "wordpress", files: [
    { name: "Overview", path: "02-spec/30-wp-plugin/00-overview.md" },
    { name: "Auto Update 301 Redirect", path: "02-spec/30-wp-plugin/01-auto-update-301-redirect.md" },
    { name: "Database Snapshots", path: "02-spec/30-wp-plugin/02-database-snapshots.md" },
    { name: "Acceptance Criteria", path: "02-spec/30-wp-plugin/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/30-wp-plugin/99-consistency-report.md" },
  ]},
  { id: "14", label: "WP Plugin Builder", path: "02-spec/31-wp-plugin-builder", description: "Automated WordPress plugin builder.", category: "wordpress", files: [
    { name: "Overview", path: "02-spec/31-wp-plugin-builder/00-overview.md" },
    { name: "Core Architecture", path: "02-spec/31-wp-plugin-builder/01-core-architecture.md" },
    { name: "CLI Interface", path: "02-spec/31-wp-plugin-builder/02-cli-interface.md" },
    { name: "Configuration", path: "02-spec/31-wp-plugin-builder/03-configuration.md" },
    { name: "Database Schema", path: "02-spec/31-wp-plugin-builder/04-database-schema.md" },
    { name: "RAG System", path: "02-spec/31-wp-plugin-builder/05-rag-system.md" },
    { name: "Project Management", path: "02-spec/31-wp-plugin-builder/06-project-management.md" },
    { name: "Code Generation", path: "02-spec/31-wp-plugin-builder/07-code-generation.md" },
    { name: "Spec Processing", path: "02-spec/31-wp-plugin-builder/08-spec-processing.md" },
    { name: "Preset Learning", path: "02-spec/31-wp-plugin-builder/09-preset-learning.md" },
    { name: "Error Handling", path: "02-spec/31-wp-plugin-builder/10-error-handling.md" },
    { name: "API Interface", path: "02-spec/31-wp-plugin-builder/11-api-interface.md" },
    { name: "Coding Guidelines", path: "02-spec/31-wp-plugin-builder/12-coding-guidelines.md" },
    { name: "Testing Strategy", path: "02-spec/31-wp-plugin-builder/13-testing-strategy.md" },
    { name: "Implementation Guide", path: "02-spec/31-wp-plugin-builder/14-implementation-guide.md" },
    { name: "Enum Architecture", path: "02-spec/31-wp-plugin-builder/15-enum-architecture.md" },
    { name: "Settings Service", path: "02-spec/31-wp-plugin-builder/16-settings-service.md" },
    { name: "Observability", path: "02-spec/31-wp-plugin-builder/17-observability.md" },
    { name: "Reset API", path: "02-spec/31-wp-plugin-builder/18-reset-api.md" },
    { name: "Acceptance Criteria", path: "02-spec/31-wp-plugin-builder/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/31-wp-plugin-builder/99-consistency-report.md" },
  ]},
  { id: "21", label: "WP SEO Publish CLI", path: "02-spec/32-wp-seo-publish-cli", description: "WordPress SEO publishing CLI.", category: "wordpress", files: [
    { name: "Overview", path: "02-spec/32-wp-seo-publish-cli/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/32-wp-seo-publish-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/32-wp-seo-publish-cli/99-consistency-report.md" },
  ]},
  { id: "28", label: "WP Plugin Development", path: "02-spec/33-wp-plugin-development", description: "WordPress plugin architecture patterns.", category: "wordpress", files: [
    { name: "Overview", path: "02-spec/33-wp-plugin-development/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/33-wp-plugin-development/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/33-wp-plugin-development/99-consistency-report.md" },
  ]},
  { id: "34", label: "Time Log CLI", path: "02-spec/40-time-log-cli", description: "Rust-based cross-platform system activity tracker.", category: "cli", files: [
    { name: "Overview", path: "02-spec/40-time-log-cli/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/40-time-log-cli/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/40-time-log-cli/99-consistency-report.md" },
  ], children: [
    { id: "34-backend", label: "Backend", path: "02-spec/40-time-log-cli/01-backend", description: "Time Log CLI backend specs.", category: "cli", files: [
      { name: "Overview", path: "02-spec/40-time-log-cli/01-backend/00-overview.md" },
      { name: "Architecture", path: "02-spec/40-time-log-cli/01-backend/01-architecture.md" },
      { name: "OS Integration", path: "02-spec/40-time-log-cli/01-backend/02-os-integration.md" },
      { name: "Browser Tracking", path: "02-spec/40-time-log-cli/01-backend/03-browser-tracking.md" },
      { name: "Screenshot Capture", path: "02-spec/40-time-log-cli/01-backend/04-screenshot-capture.md" },
      { name: "Database Schema", path: "02-spec/40-time-log-cli/01-backend/05-database-schema.md" },
      { name: "API Interface", path: "02-spec/40-time-log-cli/01-backend/06-api-interface.md" },
      { name: "Error Codes", path: "02-spec/40-time-log-cli/01-backend/07-error-codes.md" },
      { name: "File Path Extraction", path: "02-spec/40-time-log-cli/01-backend/08-file-path-extraction.md" },
      { name: "Remote Sync", path: "02-spec/40-time-log-cli/01-backend/09-remote-sync.md" },
      { name: "Remote Settings", path: "02-spec/40-time-log-cli/01-backend/10-remote-settings.md" },
      { name: "Time Slice Productivity", path: "02-spec/40-time-log-cli/01-backend/11-time-slice-productivity.md" },
      { name: "Acceptance Criteria", path: "02-spec/40-time-log-cli/01-backend/97-acceptance-criteria.md" },
      { name: "Changelog", path: "02-spec/40-time-log-cli/01-backend/98-changelog.md" },
      { name: "Consistency Report", path: "02-spec/40-time-log-cli/01-backend/99-consistency-report.md" },
    ]},
    { id: "34-deploy", label: "Deploy", path: "02-spec/40-time-log-cli/03-deploy", description: "Time Log CLI deployment specs.", category: "cli", files: [
      { name: "Overview", path: "02-spec/40-time-log-cli/03-deploy/00-overview.md" },
      { name: "Build Pipeline", path: "02-spec/40-time-log-cli/03-deploy/01-build-pipeline.md" },
      { name: "Windows Installer", path: "02-spec/40-time-log-cli/03-deploy/02-windows-installer.md" },
      { name: "Linux Packaging", path: "02-spec/40-time-log-cli/03-deploy/03-linux-packaging.md" },
      { name: "macOS Packaging", path: "02-spec/40-time-log-cli/03-deploy/04-macos-packaging.md" },
      { name: "Auto Update", path: "02-spec/40-time-log-cli/03-deploy/05-auto-update.md" },
      { name: "Acceptance Criteria", path: "02-spec/40-time-log-cli/03-deploy/97-acceptance-criteria.md" },
      { name: "Consistency Report", path: "02-spec/40-time-log-cli/03-deploy/99-consistency-report.md" },
    ]},
  ]},
  { id: "35", label: "Time Log UI", path: "02-spec/41-time-log-ui", description: "React-based dashboard frontend for the Time Log system.", category: "utilities", files: [
    { name: "Overview", path: "02-spec/41-time-log-ui/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/41-time-log-ui/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/41-time-log-ui/99-consistency-report.md" },
  ], children: [
    { id: "35-frontend", label: "Frontend", path: "02-spec/41-time-log-ui/02-frontend", description: "Time Log UI frontend specs.", category: "utilities", files: [
      { name: "Overview", path: "02-spec/41-time-log-ui/02-frontend/00-overview.md" },
      { name: "Architecture", path: "02-spec/41-time-log-ui/02-frontend/01-architecture.md" },
      { name: "Component Library", path: "02-spec/41-time-log-ui/02-frontend/02-component-library.md" },
      { name: "State Management", path: "02-spec/41-time-log-ui/02-frontend/03-state-management.md" },
      { name: "Dashboard Views", path: "02-spec/41-time-log-ui/02-frontend/04-dashboard-views.md" },
      { name: "Settings Privacy", path: "02-spec/41-time-log-ui/02-frontend/05-settings-privacy.md" },
      { name: "Consistency Report", path: "02-spec/41-time-log-ui/02-frontend/99-consistency-report.md" },
    ]},
    { id: "35-deploy", label: "Deploy", path: "02-spec/41-time-log-ui/03-deploy", description: "Time Log UI deployment specs.", category: "utilities", files: [
      { name: "Overview", path: "02-spec/41-time-log-ui/03-deploy/00-overview.md" },
      { name: "Embedded Serving", path: "02-spec/41-time-log-ui/03-deploy/01-embedded-serving.md" },
      { name: "Standalone Build", path: "02-spec/41-time-log-ui/03-deploy/02-standalone-build.md" },
      { name: "CI CD", path: "02-spec/41-time-log-ui/03-deploy/03-ci-cd.md" },
      { name: "Consistency Report", path: "02-spec/41-time-log-ui/03-deploy/99-consistency-report.md" },
    ]},
  ]},
  { id: "36", label: "Time Log Combined", path: "02-spec/42-time-log-combined", description: "Combined acceptance criteria for the Time Log system.", category: "utilities", files: [
    { name: "Overview", path: "02-spec/42-time-log-combined/00-overview.md" },
    { name: "Acceptance Criteria Summary", path: "02-spec/42-time-log-combined/00-acceptance-criteria-summary.md" },
    { name: "Consistency Report", path: "02-spec/42-time-log-combined/99-consistency-report.md" },
  ]},
  { id: "06", label: "PowerShell Integration", path: "02-spec/50-powershell-integration", description: "Build & run scripts configuration.", category: "core", files: [
    { name: "Overview", path: "02-spec/50-powershell-integration/00-overview.md" },
    { name: "Configuration Schema", path: "02-spec/50-powershell-integration/01-configuration-schema.md" },
    { name: "Script Reference", path: "02-spec/50-powershell-integration/02-script-reference.md" },
    { name: "Integration Guide", path: "02-spec/50-powershell-integration/03-integration-guide.md" },
    { name: "Error Codes", path: "02-spec/50-powershell-integration/04-error-codes.md" },
    { name: "Firewall Rules", path: "02-spec/50-powershell-integration/05-firewall-rules.md" },
    { name: "Template vs Project Differences", path: "02-spec/50-powershell-integration/09-template-vs-project-differences.md" },
    { name: "Acceptance Criteria", path: "02-spec/50-powershell-integration/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/50-powershell-integration/99-consistency-report.md" },
  ]},
  { id: "29", label: "Upload Scripts", path: "02-spec/51-upload-scripts", description: "Utility scripts for uploading and syncing.", category: "utilities", files: [
    { name: "Overview", path: "02-spec/51-upload-scripts/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/51-upload-scripts/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/51-upload-scripts/99-consistency-report.md" },
  ]},
  { id: "32", label: "Shared Preset Data", path: "02-spec/52-shared-preset-data", description: "Shared preset and seed data definitions.", category: "core", files: [
    { name: "Overview", path: "02-spec/52-shared-preset-data/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/52-shared-preset-data/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/52-shared-preset-data/99-consistency-report.md" },
  ]},
  { id: "30", label: "E2 Activity Feed", path: "02-spec/53-e2-activity-feed", description: "Activity tracking and feed system.", category: "utilities", files: [
    { name: "Overview", path: "02-spec/53-e2-activity-feed/00-overview.md" },
    { name: "Acceptance Criteria", path: "02-spec/53-e2-activity-feed/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/53-e2-activity-feed/99-consistency-report.md" },
  ]},
  { id: "17", label: "AI Research", path: "02-spec/60-ai-research", description: "Research on vector databases and RAG systems.", category: "utilities", files: [
    { name: "Overview", path: "02-spec/60-ai-research/00-overview.md" },
    { name: "Vector Databases Guide", path: "02-spec/60-ai-research/01-additional-vector-databases-and-tools-guide.md" },
    { name: "AI Database Ecosystem Guide", path: "02-spec/60-ai-research/02-complete-ai-database-and-framework-ecosystem-guide.md" },
    { name: "RAG Language Analysis", path: "02-spec/60-ai-research/03-rag-programming-language-analysis.md" },
    { name: "RAG Memory Systems Guide", path: "02-spec/60-ai-research/04-rag-memory-systems-complete-guide.md" },
    { name: "RAG Memory & Go Guide", path: "02-spec/60-ai-research/05-rag-memory-training-and-go-implementation-guide.md" },
    { name: "Acceptance Criteria", path: "02-spec/60-ai-research/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/60-ai-research/99-consistency-report.md" },
  ]},
  { id: "23", label: "Issues Tracker", path: "02-spec/61-how-app-issues-track", description: "Issue tracking methodology.", category: "utilities", files: [
    { name: "Overview", path: "02-spec/61-how-app-issues-track/00-overview.md" },
    { name: "Issue Template", path: "02-spec/61-how-app-issues-track/01-issue-template.md" },
    { name: "Process Checklist", path: "02-spec/61-how-app-issues-track/02-process-checklist.md" },
    { name: "Acceptance Criteria", path: "02-spec/61-how-app-issues-track/97-acceptance-criteria.md" },
    { name: "Consistency Report", path: "02-spec/61-how-app-issues-track/99-consistency-report.md" },
  ]},
];

// Augment the curated list with auto-discovered spec files so nested folders
// (e.g. 02-spec/09-code-block-system) and any newly added docs always appear.
const augmentedSpecFolders: SpecFolder[] = augmentSpecFolders(specFolders, { includeNumberPrefix: false });

const totalFiles = augmentedSpecFolders.reduce((sum, f) => sum + f.files.length + (f.children?.reduce((s, c) => s + c.files.length, 0) || 0), 0);

// ── Component ────────────────────────────────────────────────────────

const SpecBrowser = () => {
  const [selectedFile, setSelectedFile] = useState<SpecFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showToc, setShowToc] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  // Resize logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientX - dragStartXRef.current;
      setSidebarWidth(Math.max(220, Math.min(500, dragStartWidthRef.current + delta)));
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // TOC
  const tocHeadings = useMemo(() => {
    if (!fileContent) return [];
    let inCodeBlock = false;
    return fileContent.split("\n")
      .filter((line) => {
        if (/^```/.test(line)) { inCodeBlock = !inCodeBlock; return false; }
        if (inCodeBlock) return false;
        return /^#{1,4}\s/.test(line);
      })
      .map((line) => {
        const match = line.match(/^(#{1,4})\s+(.*)/);
        if (!match) return null;
        const level = match[1].length;
        const text = match[2].replace(/[`*_~\[\]]/g, "").trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return { level, text, id };
      })
      .filter(Boolean) as { level: number; text: string; id: string }[];
  }, [fileContent]);

  const [activeTocId, setActiveTocId] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const activeTocRef = useRef<HTMLButtonElement>(null);

  // Scroll progress tracking
  useEffect(() => {
    const scrollEl = contentScrollRef.current;
    if (!scrollEl) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const maxScroll = scrollHeight - clientHeight;
      setScrollProgress(maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0);
    };
    handleScroll();
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [fileContent, selectedFile]);

  // IntersectionObserver scroll-spy for TOC
  useEffect(() => {
    if (!showToc || tocHeadings.length === 0) return;
    const scrollEl = contentScrollRef.current;
    if (!scrollEl) return;
    const headingEls = scrollEl.querySelectorAll<HTMLElement>("[data-heading-id]");
    if (headingEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).getAttribute("data-heading-id") || "";
            setActiveTocId(id);
          }
        }
      },
      { root: scrollEl, rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showToc, tocHeadings, fileContent, selectedFile]);

  // Auto-scroll active TOC item into view
  useEffect(() => {
    if (activeTocRef.current) {
      activeTocRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeTocId]);

  // Search filtering
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return augmentedSpecFolders;
    const q = searchQuery.toLowerCase();
    const filterFolder = (folder: SpecFolder): SpecFolder | null => {
      const matchingFiles = folder.files.filter(f =>
        f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q) || folder.label.toLowerCase().includes(q)
      );
      const matchingChildren = folder.children?.map(filterFolder).filter(Boolean) as SpecFolder[] | undefined;
      if (matchingFiles.length > 0 || (matchingChildren && matchingChildren.length > 0)) {
        return { ...folder, files: matchingFiles, children: matchingChildren };
      }
      return null;
    };
    return augmentedSpecFolders.map(filterFolder).filter(Boolean) as SpecFolder[];
  }, [searchQuery]);

  // Auto-expand on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const ids = new Set<string>();
      const collectIds = (folders: SpecFolder[]) => {
        for (const f of folders) {
          ids.add(f.id);
          if (f.children) collectIds(f.children);
        }
      };
      collectIds(filteredFolders);
      setExpandedFolders(ids);
    }
  }, [searchQuery, filteredFolders]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFileClick = async (file: SpecFile) => {
    setSelectedFile(file);
    setLoading(true);
    try {
      const globKey = `/${file.path}`;
      const loader = specModules[globKey];
      if (loader) {
        setFileContent(await loader());
      } else {
        const response = await fetch(`/${file.path}`);
        if (response.ok) setFileContent(await response.text());
        else setFileContent(`# Unable to load file\n\nFile: \`${file.path}\``);
      }
    } catch {
      setFileContent(`# Unable to load file\n\nFile: \`${file.path}\``);
    }
    setLoading(false);
  };

  // Flat file list for arrow navigation
  const allFiles = useMemo(() => {
    const files: SpecFile[] = [];
    const collect = (folders: SpecFolder[]) => {
      for (const f of folders) {
        files.push(...f.files);
        if (f.children) collect(f.children);
      }
    };
    collect(specFolders);
    return files;
  }, []);

  const currentFileIndex = useMemo(() => {
    if (!selectedFile) return -1;
    return allFiles.findIndex(f => f.path === selectedFile.path);
  }, [selectedFile, allFiles]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).matches("input,textarea,select");

      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
        return;
      }

      if (isInput) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts(v => !v);
        return;
      }

      if (e.key === "ArrowRight" && allFiles.length > 0) {
        e.preventDefault();
        const next = currentFileIndex < allFiles.length - 1 ? currentFileIndex + 1 : 0;
        handleFileClick(allFiles[next]);
        return;
      }

      if (e.key === "ArrowLeft" && allFiles.length > 0) {
        e.preventDefault();
        const prev = currentFileIndex > 0 ? currentFileIndex - 1 : allFiles.length - 1;
        handleFileClick(allFiles[prev]);
        return;
      }

      if (e.key === "Escape" && selectedFile) {
        setSelectedFile(null);
        setFileContent("");
        return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showShortcuts, allFiles, currentFileIndex, selectedFile]);

  // ── Render tree item ───────────────────────────────────────────────

  const renderFolder = (folder: SpecFolder, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const cat = categoryColors[folder.category];
    const hasChildren = folder.children && folder.children.length > 0;
    const paddingLeft = 12 + depth * 16;

    return (
      <div key={folder.id}>
        <button
          onClick={() => toggleFolder(folder.id)}
          className="w-full flex items-center gap-1.5 py-[7px] pr-3 text-left transition-colors cursor-pointer hover:bg-[hsl(var(--sidebar-accent))]"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          )}
          <Folder className={`h-3.5 w-3.5 shrink-0 ${cat.text}`} />
          <span className="text-[13px] text-sidebar-foreground truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {folder.label}
          </span>
        </button>

        {isExpanded && (
          <div>
            {folder.files.map((file) => {
              const isActive = selectedFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => handleFileClick(file)}
                  className={`w-full flex items-center gap-1.5 py-[6px] pr-3 text-left transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-sidebar-foreground"
                  }`}
                  style={{ paddingLeft: paddingLeft + 20 }}
                >
                  <FileText className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
                  <span className="text-[13px] truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {file.name}
                  </span>
                </button>
              );
            })}
            {hasChildren && folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col border-r border-sidebar-border shrink-0 overflow-hidden"
        style={{ width: sidebarWidth, backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-2.5 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileCode2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[15px] font-semibold text-sidebar-foreground" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
            Spec Docs
          </span>
        </div>

        {/* Search */}
        <div className="px-3 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-full rounded-lg border border-sidebar-border bg-background/50 pl-8 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tree */}
        <nav className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
          {filteredFolders.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground/60">No results</p>
          ) : (
            filteredFolders.map((folder) => renderFolder(folder))
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-4 py-2.5 shrink-0 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-[12px] text-muted-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span style={{ fontFamily: "'Ubuntu Mono', monospace" }}>Dashboard</span>
          </Link>
          <button
            onClick={() => setShowShortcuts(v => !v)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${showShortcuts ? "bg-primary/15 text-primary" : "text-muted-foreground/50 hover:text-sidebar-foreground hover:bg-[hsl(var(--sidebar-accent))]"}`}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* ── Resize handle ── */}
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={() => setSidebarWidth(280)}
        className="w-1.5 shrink-0 cursor-col-resize group/resize flex items-center justify-center hover:bg-primary/20 transition-colors"
        title="Drag to resize"
      >
        <div className="w-0.5 h-8 rounded-full bg-border/50 group-hover/resize:bg-primary/50 transition-colors" />
      </div>

      {/* ── Content panel ── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-5 py-2 shrink-0">
              <nav className="flex items-center gap-1 min-w-0 text-[12px]" style={{ fontFamily: "'Ubuntu Mono', monospace" }}>
                {selectedFile.path.split("/").map((segment, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      {i === 0 ? (
                        <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className={isLast ? "text-primary font-medium" : "text-muted-foreground"}>
                        {segment.replace(/\.md$/, "")}
                      </span>
                    </span>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 shrink-0" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                {fileContent && !loading && (() => {
                  const words = fileContent.trim().split(/\s+/).length;
                  const mins = Math.max(1, Math.ceil(words / 200));
                  return (
                    <span className="text-[11px] mr-1" style={{ color: "hsl(220 10% 50%)" }}>
                      {words.toLocaleString()} words · {mins} min
                    </span>
                  );
                })()}

                {/* Pill 1: Copy markdown */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fileContent).then(() => {
                      setCopied(true);
                      toast.success("Copied to clipboard");
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  disabled={loading || !fileContent}
                  className="px-2.5 py-[3px] flex items-center gap-1.5 rounded-md border hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                  style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                  title="Copy markdown"
                >
                  {copied ? <Check className="h-3 w-3" style={{ color: "hsl(152 70% 50%)" }} /> : <Copy className="h-3 w-3" style={{ color: "hsl(220 10% 70%)" }} />}
                  <span className="text-[11px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>Copy</span>
                </button>

                {/* Pill 2: Download */}
                <button
                  onClick={() => {
                    const blob = new Blob([fileContent], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = selectedFile.path.split("/").pop() || "file.md";
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    toast.success("File downloaded");
                  }}
                  disabled={loading || !fileContent}
                  className="px-2.5 py-[3px] flex items-center gap-1.5 rounded-md border hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                  style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                  title="Download file"
                >
                  <Download className="h-3 w-3" style={{ color: "hsl(220 10% 70%)" }} />
                  <span className="text-[11px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>Download</span>
                </button>

                {/* Pill 3: TOC toggle */}
                <button
                  onClick={() => setShowToc(v => !v)}
                  className="px-2.5 py-[3px] flex items-center gap-1.5 rounded-md border hover:bg-white/[0.06] transition-colors"
                  style={{
                    borderColor: showToc ? "hsl(var(--primary) / 0.5)" : "hsl(220 13% 28%)",
                    background: showToc ? "hsl(var(--primary) / 0.12)" : "hsl(220 14% 13%)",
                  }}
                  title="Table of contents"
                >
                  <List className="h-3 w-3" style={{ color: showToc ? "hsl(var(--primary))" : "hsl(220 10% 70%)" }} />
                  <span className="text-[11px] font-medium" style={{ color: showToc ? "hsl(var(--primary))" : "hsl(220 10% 75%)" }}>TOC</span>
                </button>

                {/* Pill 4: Font-size segmented group */}
                <div
                  className="flex items-stretch rounded-md overflow-hidden border"
                  style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                >
                  <button
                    onClick={() => setFontSize(s => Math.max(s - 2, 12))}
                    disabled={fontSize <= 12}
                    className="px-2 py-[3px] hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                    title="Decrease font size"
                  >
                    <Minus className="h-3 w-3" style={{ color: "hsl(220 10% 70%)" }} />
                  </button>
                  <button
                    onClick={() => setFontSize(18)}
                    className="px-2 py-[3px] hover:bg-white/[0.06] transition-colors border-l"
                    style={{ borderColor: "hsl(220 13% 28%)" }}
                    title="Reset font size"
                  >
                    <span className="text-[10px] font-medium tabular-nums" style={{ color: "hsl(220 10% 75%)" }}>{fontSize}</span>
                  </button>
                  <button
                    onClick={() => setFontSize(s => Math.min(s + 2, 30))}
                    disabled={fontSize >= 30}
                    className="px-2 py-[3px] hover:bg-white/[0.06] transition-colors border-l disabled:opacity-30"
                    style={{ borderColor: "hsl(220 13% 28%)" }}
                    title="Increase font size"
                  >
                    <Plus className="h-3 w-3" style={{ color: "hsl(220 10% 70%)" }} />
                  </button>
                </div>

                {/* Pill 5: Close (icon-only) */}
                <button
                  onClick={() => { setSelectedFile(null); setFileContent(""); }}
                  className="px-2 py-[3px] flex items-center rounded-md border hover:bg-white/[0.06] transition-colors"
                  style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                  title="Close"
                >
                  <X className="h-3 w-3" style={{ color: "hsl(220 10% 70%)" }} />
                </button>
              </div>
            </div>

            {/* Reading progress */}
            {!loading && fileContent && (
              <div className="h-[2px] w-full bg-border/30 shrink-0">
                <div className="h-full bg-primary/60 transition-[width] duration-150 ease-out" style={{ width: `${scrollProgress}%` }} />
              </div>
            )}

            {/* Content */}
            <div className="flex flex-1 min-h-0">
              {/* TOC sidebar */}
              {showToc && tocHeadings.length > 0 && !loading && (
                <div className="border-r border-border bg-secondary/30 overflow-y-auto shrink-0 w-56">
                  <div className="px-3 py-2 border-b border-border/50">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: "hsl(220 10% 55%)" }}
                    >
                      On this page
                    </span>
                  </div>
                  <nav className="p-1.5 space-y-px">
                    {tocHeadings.map((h, i) => {
                      const isActive = activeTocId === h.id;
                      const indentClass = h.level === 1 ? "pl-3 font-medium" : h.level === 2 ? "pl-4" : h.level === 3 ? "pl-5 text-[0.7rem]" : "pl-6 text-[0.65rem]";
                      return (
                      <button
                        key={i}
                        ref={isActive ? activeTocRef : undefined}
                        onClick={() => {
                          const el = contentScrollRef.current?.querySelector(`[data-heading-id="${h.id}"]`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`w-full text-left py-1.5 rounded-md text-[11px] transition-colors cursor-pointer truncate flex items-center gap-1.5 border-l-2 ${indentClass} ${
                          isActive
                            ? "border-l-primary bg-primary/10 text-primary"
                            : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-l-muted-foreground/40"
                        }`}
                        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
                        title={h.text}
                      >
                        <Hash className={`h-2.5 w-2.5 shrink-0 ${isActive ? "opacity-80" : "opacity-40"}`} />
                        <span className="truncate">{h.text}</span>
                      </button>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Markdown content */}
              <div ref={contentScrollRef} className="overflow-y-auto flex-1 min-w-0 p-8">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="prose-spec max-w-4xl mx-auto" style={{ fontSize: `${fontSize}px` }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        pre: ({ children, ...props }) => {
                          const codeWrapRef = useRef<HTMLDivElement>(null);
                          const codeRef = useRef<HTMLDivElement>(null);
                          const [codeCopied, setCodeCopied] = useState(false);
                          const [codeFontSize, setCodeFontSize] = useState(17);
                          const [isCodeFullscreen, setIsCodeFullscreen] = useState(false);
                          const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
                          const handleLineClick = (lineNum: number, e: React.MouseEvent) => {
                            setSelectedLines(prev => {
                              const next = new Set(e.shiftKey ? prev : []);
                              if (prev.has(lineNum) && !e.shiftKey) { next.delete(lineNum); } else { next.add(lineNum); }
                              return next;
                            });
                          };

                          const [selCopied, setSelCopied] = useState(false);
                          const handleCodeCopy = () => {
                            const text = codeText;
                            navigator.clipboard.writeText(text).then(() => {
                              setCodeCopied(true);
                              toast.success("Code copied");
                              setTimeout(() => setCodeCopied(false), 2000);
                            });
                          };
                          const handleCopySelected = () => {
                            const sorted = Array.from(selectedLines).sort((a, b) => a - b);
                            const text = sorted.map(n => lines[n - 1] ?? "").join("\n");
                            navigator.clipboard.writeText(text).then(() => {
                              setSelCopied(true);
                              toast.success(`${sorted.length} line${sorted.length > 1 ? "s" : ""} copied`);
                              setTimeout(() => setSelCopied(false), 2000);
                            });
                          };

                          const handleCodeFullscreen = () => {
                            const el = codeWrapRef.current;
                            if (!el) return;
                            if (document.fullscreenElement) document.exitFullscreen();
                            else el.requestFullscreen().catch(() => setIsCodeFullscreen(true));
                          };

                          useEffect(() => {
                            const handler = () => {
                              if (!document.fullscreenElement && codeWrapRef.current) setIsCodeFullscreen(false);
                              else if (document.fullscreenElement === codeWrapRef.current) setIsCodeFullscreen(true);
                            };
                            document.addEventListener("fullscreenchange", handler);
                            return () => document.removeEventListener("fullscreenchange", handler);
                          }, []);

                          useEffect(() => {
                            if (!isCodeFullscreen || document.fullscreenElement) return;
                            const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsCodeFullscreen(false); };
                            window.addEventListener("keydown", handler);
                            return () => window.removeEventListener("keydown", handler);
                          }, [isCodeFullscreen]);

                          // Extract text for line counting
                          const extractText = (node: any): string => {
                            if (typeof node === "string") return node;
                            if (Array.isArray(node)) return node.map(extractText).join("");
                            if (node?.props?.children) return extractText(node.props.children);
                            return "";
                          };
                          const codeText = extractText(children);
                          const lines = codeText.split("\n");
                          const highlightedLines = splitHighlightedCode(children);
                          const lineCount = highlightedLines.length > 1 && highlightedLines[highlightedLines.length - 1].length === 0 ? highlightedLines.length - 1 : highlightedLines.length;

                          // Detect language from children
                          const toPascalCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                          let langLabel = "Plain Text";
                          let langKey = "";
                          const codeChild = Array.isArray(children) ? children[0] : children;
                          if (codeChild && typeof codeChild === "object" && "props" in codeChild) {
                            const cls = codeChild.props.className || "";
                            const langMatch = cls.match(/language-(\w+)/);
                            if (langMatch) {
                              langLabel = toPascalCase(langMatch[1]);
                              langKey = langMatch[1].toLowerCase();
                            }
                          }

                          // Auto-detect tree structure from content
                           const treeCharCount = (codeText.match(/[├└│]/g) || []).length;
                           const boxDrawingCount = (codeText.match(/[┌┐┘┬┴┼─╔═╗║╚╝╠╣╦╩╬]/g) || []).length;
                           const hasTreeChars = treeCharCount >= 2 && boxDrawingCount < treeCharCount;
                           const isTreeBlock = langKey === "tree" || langKey === "structure" || hasTreeChars;
                          if (isTreeBlock) { langKey = "tree"; langLabel = "STRUCTURE"; }

                          const langColors: Record<string, string> = {
                            typescript: "99 83% 62%", ts: "99 83% 62%", tsx: "99 83% 62%",
                            javascript: "53 93% 54%", js: "53 93% 54%",
                            go: "194 66% 55%", golang: "194 66% 55%",
                            php: "234 45% 60%",
                            css: "264 55% 58%",
                            json: "38 92% 50%",
                            bash: "120 40% 55%", sh: "120 40% 55%", shell: "120 40% 55%",
                            sql: "200 70% 55%",
                            rust: "25 85% 55%",
                            html: "12 80% 55%", xml: "12 80% 55%",
                            yaml: "0 75% 55%", yml: "0 75% 55%",
                            markdown: "252 85% 60%", md: "252 85% 60%",
                            tree: "142 72% 55%", structure: "142 72% 55%",
                          };
                          const badgeColor = langColors[langKey] || "220 10% 50%";

                          // Tree line renderer
                          const renderTreeLine = (line: string) => {
                            const treeMatch = line.match(/^([\s│]*[├└]──?\s*|[\s│]*)/);
                            const prefix = treeMatch ? treeMatch[0] : "";
                            const rest = line.slice(prefix.length);
                            const commentMatch = rest.match(/^(.*?)\s+(#\s*.*)$/);
                            const name = commentMatch ? commentMatch[1] : rest;
                            const comment = commentMatch ? commentMatch[2] : "";
                            const isFolder = name.endsWith("/");
                            const isEllipsis = name.trim() === "...";
                            const isEmptyLine = !name.trim() && !comment.trim();

                            if (isEmptyLine) {
                              return <span style={{ color: "hsl(220 10% 60% / 0.5)" }}>{prefix || "\u00A0"}</span>;
                            }

                            const styledPrefix = prefix.replace(/[├└│─]/g, (ch) =>
                              ch === "│" ? "│" : ch === "├" ? "├" : ch === "└" ? "└" : "─"
                            );

                            return (
                              <span>
                                <span style={{ color: "hsl(220 10% 60% / 0.5)" }}>{styledPrefix}</span>
                                {isEllipsis ? (
                                  <span style={{ color: "hsl(330 85% 65%)" }}>...</span>
                                ) : isFolder ? (
                                  <>
                                    <span>📁 </span>
                                    <span style={{ color: "hsl(220 20% 92%)", fontWeight: 600 }}>{name}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>📄 </span>
                                    <span style={{ color: "hsl(220 20% 92% / 0.85)" }}>{name}</span>
                                  </>
                                )}
                                {comment && (
                                  <span style={{ color: "hsl(220 10% 60%)", fontStyle: "italic" }}> {comment}</span>
                                )}
                              </span>
                            );
                          };

                          const defaultFontSize = 17;

                          const handleCodeDownload = () => {
                            const blob = new Blob([codeText], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "code-snippet.txt";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          };

                          return (
                            <div
                              ref={codeWrapRef}
                              className={`relative group/code rounded-lg overflow-hidden code-block-glow ${
                                isCodeFullscreen && !document.fullscreenElement
                                  ? "fixed inset-0 z-[9999] flex flex-col"
                                  : isCodeFullscreen ? "flex flex-col h-full" : "my-4"
                              }`}
                              style={{
                                backgroundColor: "hsl(220 14% 11%)",
                                border: "1px solid hsl(220 13% 22%)",
                                ["--lang-accent" as any]: badgeColor,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 8px 32px hsl(${badgeColor} / 0.1), 0 0 0 1px hsl(${badgeColor} / 0.15)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {/* Header bar */}
                              <div
                                className="flex items-center px-4 py-2 border-b shrink-0"
                                style={{ backgroundColor: "hsl(220 14% 14%)", borderColor: "hsl(220 13% 20%)" }}
                              >
                                <span
                                  className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                                  style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: `hsl(${badgeColor})` }}
                                >
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${badgeColor})` }} />
                                  {langLabel}
                                </span>
                                <div className="ml-auto flex items-center gap-2">
                                  <span
                                    className="text-[11px]"
                                    style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: "hsl(220 10% 50%)" }}
                                  >
                                    {lineCount} Lines
                                  </span>
                                  {selectedLines.size > 0 && (
                                    <span
                                      className="rounded-[0.3rem] px-1.5 py-[0.15rem] text-[10px] font-semibold"
                                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", letterSpacing: "0.02em" }}
                                    >
                                      {selectedLines.size === 1
                                        ? `Line ${Array.from(selectedLines)[0]}`
                                        : `Lines ${Math.min(...Array.from(selectedLines))}-${Math.max(...Array.from(selectedLines))}`}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 ml-4" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                                  <div
                                    className="flex items-stretch rounded overflow-hidden border"
                                    style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                                  >
                                    <button onClick={() => setCodeFontSize(s => Math.max(s - 2, 10))} className="px-1.5 py-[1px] hover:bg-white/[0.06] transition-colors" title="Decrease font size">
                                      <span className="text-[10px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>A-</span>
                                    </button>
                                    <button onClick={() => setCodeFontSize(defaultFontSize)} className="px-1.5 py-[1px] hover:bg-white/[0.06] transition-colors border-l" style={{ borderColor: "hsl(220 13% 28%)" }} title="Reset font size">
                                      <span className="text-[10px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>A</span>
                                    </button>
                                    <button onClick={() => setCodeFontSize(s => Math.min(s + 2, 32))} className="px-1.5 py-[1px] hover:bg-white/[0.06] transition-colors border-l" style={{ borderColor: "hsl(220 13% 28%)" }} title="Increase font size">
                                      <span className="text-[10px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>A+</span>
                                    </button>
                                  </div>
                                  <button onClick={handleCodeCopy} className="px-2 py-[1px] flex items-center gap-1 rounded border hover:bg-white/[0.06] transition-colors" style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }} title="Copy">
                                    {codeCopied ? <Check className="h-2.5 w-2.5" style={{ color: "hsl(152 70% 50%)" }} /> : <Copy className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />}
                                    <span className="text-[10px] font-medium hidden sm:inline" style={{ color: "hsl(220 10% 75%)" }}>Copy</span>
                                  </button>
                                  <button onClick={handleCodeDownload} className="px-2 py-[1px] flex items-center gap-1 rounded border hover:bg-white/[0.06] transition-colors" style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }} title="Download">
                                    <Download className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />
                                    <span className="text-[10px] font-medium hidden sm:inline" style={{ color: "hsl(220 10% 75%)" }}>Download</span>
                                  </button>
                                  <button onClick={() => {
                                    const all = new Set(Array.from({ length: lineCount }, (_, i) => i + 1));
                                    setSelectedLines(prev => prev.size === lineCount ? new Set() : all);
                                  }} className="px-2 py-[1px] flex items-center gap-1 rounded border hover:bg-white/[0.06] transition-colors" style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }} title="Select all lines">
                                    <ListChecks className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />
                                    <span className="text-[10px] font-medium hidden sm:inline" style={{ color: "hsl(220 10% 75%)" }}>{selectedLines.size === lineCount ? "Deselect" : "Select all"}</span>
                                  </button>
                                  <button onClick={() => {
                                    if (isCodeFullscreen && document.fullscreenElement) document.exitFullscreen();
                                    else if (isCodeFullscreen) setIsCodeFullscreen(false);
                                    else handleCodeFullscreen();
                                  }} className="px-1.5 py-[1px] flex items-center rounded border hover:bg-white/[0.06] transition-colors" style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }} title={isCodeFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                                    {isCodeFullscreen ? <Minimize2 className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} /> : <Expand className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />}
                                  </button>
                                </div>
                              </div>

                              {/* Copy selected lines bar */}
                               {selectedLines.size > 0 && (
                                  <div
                                   className="flex items-center gap-2 px-4 py-[0.35rem] border-t animate-in fade-in slide-in-from-top-1 duration-200"
                                   style={{ backgroundColor: "hsl(var(--primary) / 0.08)", borderColor: "hsl(var(--primary) / 0.2)" }}
                                >
                                  <span className="text-[11px] font-medium" style={{ color: "hsl(var(--primary))", letterSpacing: "0.02em" }}>
                                    {selectedLines.size} line{selectedLines.size > 1 ? "s" : ""} selected
                                  </span>
                                  <button
                                    onClick={handleCopySelected}
                                    className="px-2.5 py-[3px] rounded-md border flex items-center gap-1.5 hover:brightness-125 transition-colors"
                                    style={{ background: "hsl(var(--primary) / 0.15)", borderColor: "hsl(var(--primary) / 0.3)" }}
                                    title="Copy selected lines"
                                  >
                                    {selCopied ? <Check className="h-3 w-3" style={{ color: "hsl(152 70% 50%)" }} /> : <Copy className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />}
                                    <span className="text-[11px] font-medium" style={{ color: "hsl(var(--primary))" }}>{selCopied ? "Copied!" : "Copy selected"}</span>
                                  </button>
                                  <div className="ml-auto flex items-center gap-2">
                                    <button
                                      onClick={() => setSelectedLines(new Set())}
                                      className="px-2 py-[3px] rounded-md hover:brightness-125 transition-colors"
                                      style={{ color: "hsl(220 10% 50%)" }}
                                      title="Clear selection"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Code with line numbers - row-based for hover */}
                              <div className={`${isCodeFullscreen ? "flex-1 overflow-auto" : "overflow-x-auto"}`}>
                                <table className="w-full border-collapse" style={{ fontSize: `${codeFontSize}px`, lineHeight: isTreeBlock ? 1.15 : 1.6, fontFamily: "'Ubuntu Mono', 'JetBrains Mono', monospace" }}>
                                  <tbody>
                                    {highlightedLines.slice(0, lineCount).map((hlLine, i) => {
                                      const lineNum = i + 1;
                                      const isSelected = selectedLines.has(lineNum);
                                      return (
                                      <tr
                                        key={i}
                                        className={`code-line-hover transition-colors duration-150 cursor-pointer ${isSelected ? "code-line-selected" : ""}`}
                                        onClick={(e) => handleLineClick(lineNum, e)}
                                        style={{ backgroundColor: isSelected ? "rgba(234, 179, 8, 0.15)" : "transparent" }}
                                      >
                                        <td
                                          className="select-none text-right px-3 border-r sticky left-0 align-top"
                                          style={{
                                            color: isSelected ? "hsl(45 93% 47%)" : "hsl(220 10% 35%)",
                                            backgroundColor: isSelected ? "hsl(var(--primary) / 0.12)" : "hsl(220 14% 9%)",
                                            borderColor: "hsl(220 13% 18%)",
                                            minWidth: `${Math.max(String(lineCount).length * 0.7 + 1.5, 2.5)}em`,
                                            userSelect: "none",
                                            fontSize: `${Math.max(codeFontSize * 0.7, 11)}px`,
                                            lineHeight: 1,
                                          }}
                                        >
                                          {lineNum}
                                        </td>
                                        <td className="whitespace-pre px-1" style={{ paddingTop: '0px', paddingBottom: '0px', paddingRight: '1.25rem', paddingLeft: '0.5rem' }}>
                                          {isTreeBlock ? renderTreeLine(lines[i] || "") : (hlLine.length > 0 ? hlLine : "\u00A0")}
                                        </td>
                                      </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        },
                        ul: ({ children, node, ...props }) => {
                          const isTaskList = node?.children?.some((child: any) =>
                            child.type === "element" && child.tagName === "li" &&
                            child.properties?.className?.includes?.("task-list-item")
                          );
                          if (!isTaskList) return <ul {...props}>{children}</ul>;
                          const extractListText = (items: any): string => {
                            if (!items) return "";
                            const arr = Array.isArray(items) ? items : [items];
                            return arr
                              .filter((c: any) => {
                                if (typeof c === "string") return c.trim().length > 0;
                                return c?.props != null;
                              })
                              .map((c: any) => {
                                if (typeof c === "string") {
                                  const trimmed = c.trim();
                                  return trimmed ? `- ${trimmed}` : null;
                                }
                                const extract = (n: any): string => {
                                  if (typeof n === "string") return n;
                                  if (Array.isArray(n)) return n.map(extract).join("");
                                  if (n?.props?.type === "checkbox") return n.props.checked ? "[x] " : "[ ] ";
                                  if (n?.props?.children) return extract(n.props.children);
                                  return "";
                                };
                                const txt = extract(c).trim();
                                return txt ? `- ${txt}` : null;
                              })
                              .filter(Boolean)
                              .join("\n");
                          };
                          const [listCopied, setListCopied] = useState(false);
                          const handleCopyList = () => {
                            const text = extractListText(children);
                            navigator.clipboard.writeText(text).then(() => {
                              setListCopied(true);
                              toast.success("Checklist copied as markdown");
                              setTimeout(() => setListCopied(false), 2000);
                            });
                          };
                          return (
                            <div className="relative group/checklist">
                              <div className="flex justify-end mb-1">
                                <button
                                  onClick={handleCopyList}
                                  className="opacity-0 group-hover/checklist:opacity-100 transition-opacity duration-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 z-10"
                                  style={{ background: "hsl(220 13% 20%)", border: "1px solid hsl(220 13% 30%)" }}
                                  title="Copy checklist as markdown"
                                >
                                  {listCopied ? <Check className="h-3 w-3" style={{ color: "hsl(152 70% 50%)" }} /> : <Copy className="h-3 w-3" style={{ color: "hsl(220 10% 60%)" }} />}
                                  <span className="text-[10px] font-mono" style={{ color: "hsl(220 10% 60%)" }}>{listCopied ? "Copied" : "Copy list"}</span>
                                </button>
                              </div>
                              <ul {...props}>{children}</ul>
                            </div>
                          );
                        },
                        h1: ({ children, ...props }) => {
                          const text = String(children).replace(/[^\w\s-]/g, "").trim();
                          const id = text.toLowerCase().replace(/\s+/g, "-");
                          return <h1 data-heading-id={id} {...props}>{children}</h1>;
                        },
                        h2: ({ children, ...props }) => {
                          const text = String(children).replace(/[^\w\s-]/g, "").trim();
                          const id = text.toLowerCase().replace(/\s+/g, "-");
                          return <h2 data-heading-id={id} {...props}>{children}</h2>;
                        },
                        h3: ({ children, ...props }) => {
                          const text = String(children).replace(/[^\w\s-]/g, "").trim();
                          const id = text.toLowerCase().replace(/\s+/g, "-");
                          return <h3 data-heading-id={id} {...props}>{children}</h3>;
                        },
                        h4: ({ children, ...props }) => {
                          const text = String(children).replace(/[^\w\s-]/g, "").trim();
                          const id = text.toLowerCase().replace(/\s+/g, "-");
                          return <h4 data-heading-id={id} {...props}>{children}</h4>;
                        },
                        table: ({ children, ...props }) => (
                          <div className="table-wrapper">
                            <table {...props}>{children}</table>
                          </div>
                        ),
                      }}
                    >
                      {fileContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/60">
            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-[15px] font-medium text-muted-foreground/80" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
              Select a document to read
            </p>
            <p className="text-[13px] mt-1 text-muted-foreground/50">
              Browse {specFolders.length} modules · {totalFiles} spec files
            </p>
          </div>
        )}
      </main>

      {/* ── Shortcuts panel ── */}
      {showShortcuts && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowShortcuts(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[420px] rounded-xl border border-border bg-card shadow-2xl animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                <span className="text-[14px] font-semibold text-foreground" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
                  Keyboard Shortcuts
                </span>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { section: "Navigation", shortcuts: [
                  { keys: ["←"], desc: "Previous file" },
                  { keys: ["→"], desc: "Next file" },
                  { keys: ["Esc"], desc: "Close file / close panel" },
                ]},
                { section: "Search", shortcuts: [
                  { keys: ["/"], desc: "Focus search input" },
                  { keys: ["Esc"], desc: "Clear search focus" },
                ]},
                { section: "View", shortcuts: [
                  { keys: ["?"], desc: "Toggle this panel" },
                ]},
              ].map(({ section, shortcuts }) => (
                <div key={section}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
                    {section}
                  </h3>
                  <div className="space-y-1.5">
                    {shortcuts.map(({ keys, desc }) => (
                      <div key={desc} className="flex items-center justify-between py-1">
                        <span className="text-[13px] text-foreground/80">{desc}</span>
                        <div className="flex items-center gap-1">
                          {keys.map(k => (
                            <kbd key={k} className="min-w-[28px] text-center px-2 py-1 rounded-md bg-muted border border-border text-[11px] font-mono font-medium text-muted-foreground">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border/50 bg-secondary/20">
              <p className="text-[11px] text-muted-foreground/50 text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">?</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Esc</kbd> to close
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SpecBrowser;
