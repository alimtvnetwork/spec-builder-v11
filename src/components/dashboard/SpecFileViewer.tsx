import { useState, useMemo, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";
import { FileText, ChevronRight, ChevronDown, X, FolderOpen, Search, Folder, ChevronsUpDown, ChevronsDownUp, Tag, BookOpen, Filter, ArrowLeft, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, Keyboard, Clock, Copy, Check, Download, Expand, Plus, Minus, RotateCcw, List, FileCode2, Hash, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { splitHighlightedCode } from "@/utils/highlight-lines";
import { augmentSpecFolders } from "@/utils/spec-index";

// Load all spec .md files as raw text at build time
const specModules = import.meta.glob(['/02-spec/**/*.md', '/spec/**/*.md'], { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

interface SpecFile {
  name: string;
  path: string;
}

interface SpecFolder {
  id: string;
  label: string;
  path: string;
  description: string;
  category: "foundation" | "core" | "cli" | "wordpress" | "standards" | "utilities" | "enforcement";
  files: SpecFile[];
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

const formatFileName = (filename: string): string => {
  return filename
    .replace(/\.md$/, "")
    .replace(/^(\d+)-/, "$1 — ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const specFolders: SpecFolder[] = [
  { id: "root", label: "Root Files", path: "02-spec", description: "Top-level spec directory files including the master folder structure guideline and global consistency report.", category: "foundation", files: [
    { name: "00 — Overview", path: "02-spec/00-overview.md" },
    { name: "00 — Folder Structure Guideline", path: "02-spec/00-folder-structure-guideline.md" },
    { name: "02 — Prefix Disambiguation", path: "02-spec/02-prefix-disambiguation.md" },
    { name: "99 — Consistency Report", path: "02-02-spec/99-consistency-report.md" },
  ]},
  { id: "01", label: "01 — General Spec", path: "02-spec/01-general-spec", description: "Architecture-wide standards, naming conventions, and cross-cutting concerns that apply to all projects.", category: "foundation", files: [
    { name: "00 — Overview", path: "02-spec/01-general-spec/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/01-general-spec/97-acceptance-criteria.md" },
    { name: "98 — Changelog", path: "02-spec/01-general-spec/98-changelog.md" },
    { name: "99 — Consistency Report", path: "02-spec/01-general-02-spec/99-consistency-report.md" },
  ]},
  { id: "18", label: "18 — Error Resolution", path: "02-spec/04-error-resolution", description: "Error resolution patterns, debugging guides, retrospectives, and verification strategies.", category: "foundation", files: [
    { name: "00 — Overview", path: "02-spec/04-error-resolution/00-overview.md" },
    { name: "04 — Cross Reference Diagram", path: "02-spec/04-error-resolution/04-cross-reference-diagram.md" },
    { name: "05 — Debugging Cheat Sheet", path: "02-spec/04-error-resolution/05-debugging-cheat-sheet.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/04-error-resolution/97-acceptance-criteria.md" },
    { name: "98 — Changelog", path: "02-spec/04-error-resolution/98-changelog.md" },
    { name: "99 — Consistency Report", path: "02-spec/04-error-resolution/99-consistency-report.md" },
  ]},
  { id: "02-sms", label: "02 — Spec Management Software", path: "02-spec/11-spec-management-software", description: "The spec management tool itself — features, database design, roadmap, coding guidelines, and AI handoff.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/11-spec-management-software/00-overview.md" },
    { name: "18 — Enum Consumer Checklist", path: "02-spec/11-spec-management-software/18-enum-consumer-checklist.md" },
    { name: "92 — Session Changelog", path: "02-spec/11-spec-management-software/92-session-changelog-2026-01-28.md" },
    { name: "93 — Cross Reference Validation", path: "02-spec/11-spec-management-software/93-cross-reference-validation-report.md" },
    { name: "94 — Quality Improvement Plan", path: "02-spec/11-spec-management-software/94-quality-improvement-plan.md" },
    { name: "95 — Master Index", path: "02-spec/11-spec-management-software/95-master-index.md" },
    { name: "96 — Context for AI", path: "02-spec/11-spec-management-software/96-context-for-ai.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/11-spec-management-software/97-acceptance-criteria.md" },
    { name: "97 — AI Handoff Guide", path: "02-spec/11-spec-management-software/97-ai-handoff-guide.md" },
    { name: "98 — Changelog", path: "02-spec/11-spec-management-software/98-changelog.md" },
    { name: "99 — Consistency Report", path: "02-spec/11-spec-management-software/99-consistency-report.md" },
  ]},
  { id: "20", label: "20 — Shared CLI Frontend", path: "02-spec/28-shared-cli-frontend", description: "Reusable React frontend pattern shared across all CLI tools — components, hooks, WebSocket protocol, and testing.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/28-shared-cli-frontend/00-overview.md" },
    { name: "01 — Folder Structure", path: "02-spec/28-shared-cli-frontend/01-folder-structure.md" },
    { name: "02 — WebSocket Protocol", path: "02-spec/28-shared-cli-frontend/02-websocket-protocol.md" },
    { name: "03 — Settings Service", path: "02-spec/28-shared-cli-frontend/03-settings-service.md" },
    { name: "04 — API Tester", path: "02-spec/28-shared-cli-frontend/04-api-tester.md" },
    { name: "05 — Error Modal", path: "02-spec/28-shared-cli-frontend/05-error-modal.md" },
    { name: "06 — Changelog System", path: "02-spec/28-shared-cli-frontend/06-changelog-system.md" },
    { name: "07 — Port Management", path: "02-spec/28-shared-cli-frontend/07-port-management.md" },
    { name: "08 — PowerShell Integration", path: "02-spec/28-shared-cli-frontend/08-powershell-integration.md" },
    { name: "09 — Deploy Folder", path: "02-spec/28-shared-cli-frontend/09-deploy-folder.md" },
    { name: "10 — Component Library", path: "02-spec/28-shared-cli-frontend/10-component-library.md" },
    { name: "11 — E2E Test Spec", path: "02-spec/28-shared-cli-frontend/11-e2e-test-spec.md" },
    { name: "12 — Accessibility Spec", path: "02-spec/28-shared-cli-frontend/12-accessibility-spec.md" },
    { name: "13 — Visual Regression Spec", path: "02-spec/28-shared-cli-frontend/13-visual-regression-spec.md" },
    { name: "14 — Architecture Template", path: "02-spec/28-shared-cli-frontend/14-architecture-template.md" },
    { name: "15 — Hooks Library", path: "02-spec/28-shared-cli-frontend/15-hooks-library.md" },
    { name: "16 — Tree Visualization", path: "02-spec/28-shared-cli-frontend/16-tree-visualization.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/28-shared-cli-frontend/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/28-shared-cli-frontend/99-consistency-report.md" },
  ]},
  { id: "04", label: "04 — Split DB Architecture", path: "02-spec/06-split-db-architecture", description: "Hierarchical SQLite pattern for multi-tenant data isolation, RBAC with Casbin, and database flow diagrams.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/06-split-db-architecture/00-overview.md" },
    { name: "01 — CLI Examples", path: "02-spec/06-split-db-architecture/01-cli-examples.md" },
    { name: "02 — Reset API Standard", path: "02-spec/06-split-db-architecture/02-reset-api-standard.md" },
    { name: "03 — Database Flow Diagrams", path: "02-spec/06-split-db-architecture/03-database-flow-diagrams.md" },
    { name: "04 — RBAC Casbin", path: "02-spec/06-split-db-architecture/04-rbac-casbin.md" },
    { name: "05 — User Scoped Isolation", path: "02-spec/06-split-db-architecture/05-user-scoped-isolation.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/06-split-db-architecture/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/06-split-db-architecture/99-consistency-report.md" },
  ]},
  { id: "05", label: "05 — Seedable Config Architecture", path: "02-spec/07-seedable-config-architecture", description: "Configuration seeding, RAG chunk settings, validation helpers, and test coverage matrix.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/07-seedable-config-architecture/00-overview.md" },
    { name: "02 — RAG Chunk Settings", path: "02-spec/07-seedable-config-architecture/02-rag-chunk-settings.md" },
    { name: "03 — RAG Validation Helpers", path: "02-spec/07-seedable-config-architecture/03-rag-validation-helpers.md" },
    { name: "04 — RAG Validation Tests", path: "02-spec/07-seedable-config-architecture/04-rag-validation-tests.md" },
    { name: "05 — RAG Test Coverage Matrix", path: "02-spec/07-seedable-config-architecture/05-rag-test-coverage-matrix.md" },
    { name: "06 — Validation Data Seeding", path: "02-spec/07-seedable-config-architecture/06-validation-data-seeding.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/07-seedable-config-architecture/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/07-seedable-config-architecture/99-consistency-report.md" },
  ]},
  { id: "06", label: "06 — PowerShell Integration", path: "02-spec/50-powershell-integration", description: "Build & run scripts (v2) — configuration schema, script reference, firewall rules, and error codes.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/50-powershell-integration/00-overview.md" },
    { name: "01 — Configuration Schema", path: "02-spec/50-powershell-integration/01-configuration-schema.md" },
    { name: "02 — Script Reference", path: "02-spec/50-powershell-integration/02-script-reference.md" },
    { name: "03 — Integration Guide", path: "02-spec/50-powershell-integration/03-integration-guide.md" },
    { name: "04 — Error Codes", path: "02-spec/50-powershell-integration/04-error-codes.md" },
    { name: "05 — Firewall Rules", path: "02-spec/50-powershell-integration/05-firewall-rules.md" },
    { name: "09 — Template vs Project Differences", path: "02-spec/50-powershell-integration/09-template-vs-project-differences.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/50-powershell-integration/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/50-powershell-integration/99-consistency-report.md" },
  ]},
  { id: "07", label: "07 — Error Code Registry", path: "02-spec/03-error-code-registry", description: "Global error code registry with collision resolution, utilization reports, and overlap validation.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/03-error-code-registry/00-overview.md" },
    { name: "01 — Registry", path: "02-spec/03-error-code-registry/01-registry.md" },
    { name: "02 — Integration Guide", path: "02-spec/03-error-code-registry/02-integration-guide.md" },
    { name: "03 — Collision Resolution Summary", path: "02-spec/03-error-code-registry/03-collision-resolution-summary.md" },
    { name: "04 — Error Code Utilization Report", path: "02-spec/03-error-code-registry/04-error-code-utilization-report.md" },
    { name: "08 — Overlap Validator", path: "02-spec/03-error-code-registry/08-overlap-validator.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/03-error-code-registry/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/03-error-code-registry/99-consistency-report.md" },
  ]},
  { id: "08", label: "08 — Spec Authoring Guide", path: "02-spec/05-spec-authoring-guide", description: "Standards and templates for writing specification documents — folder structure, naming, cross-references, and consistency reports.", category: "foundation", files: [
    { name: "00 — Overview", path: "02-spec/05-spec-authoring-guide/00-overview.md" },
    { name: "01 — Folder Structure", path: "02-spec/05-spec-authoring-guide/01-folder-structure.md" },
    { name: "02 — File Naming", path: "02-spec/05-spec-authoring-guide/02-file-naming.md" },
    { name: "03 — Cross References", path: "02-spec/05-spec-authoring-guide/03-cross-references.md" },
    { name: "04 — Consistency Reports", path: "02-spec/05-spec-authoring-guide/04-consistency-reports.md" },
    { name: "05 — Acceptance Criteria", path: "02-spec/05-spec-authoring-guide/05-acceptance-criteria.md" },
    { name: "06 — Changelogs", path: "02-spec/05-spec-authoring-guide/06-changelogs.md" },
    { name: "07 — Error Codes", path: "02-spec/05-spec-authoring-guide/07-error-codes.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/05-spec-authoring-guide/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/05-spec-authoring-guide/99-consistency-report.md" },
  ]},
  { id: "09", label: "09 — GSearch CLI", path: "02-spec/20-gsearch-cli", description: "Google Search CLI tool with AI Bridge integration for automated web research.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/20-gsearch-cli/00-overview.md" },
    { name: "05 — AI Bridge Integration", path: "02-spec/20-gsearch-cli/05-ai-bridge-integration.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/20-gsearch-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/20-gsearch-cli/99-consistency-report.md" },
  ]},
  { id: "10", label: "10 — BRun CLI", path: "02-spec/21-brun-cli", description: "Build runner CLI for orchestrating multi-project builds with dependency resolution.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/21-brun-cli/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/21-brun-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/21-brun-cli/99-consistency-report.md" },
  ]},
  { id: "11", label: "11 — AI Bridge CLI", path: "02-spec/22-ai-bridge-cli", description: "AI Bridge CLI for connecting LLMs to local tools, RAG systems, and project context.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/22-ai-bridge-cli/00-overview.md" },
    { name: "04 — Verification Report", path: "02-spec/22-ai-bridge-cli/04-verification-report.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/22-ai-bridge-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/22-ai-bridge-cli/99-consistency-report.md" },
  ]},
  { id: "12", label: "12 — Nexus Flow CLI", path: "02-spec/24-nexus-flow-cli", description: "Nexus Flow CLI for workflow automation and pipeline orchestration across services.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/24-nexus-flow-cli/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/24-nexus-flow-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/24-nexus-flow-cli/99-consistency-report.md" },
  ]},
  { id: "13", label: "13 — WP Plugin", path: "02-spec/30-wp-plugin", description: "WordPress plugin specs — auto-update 301 redirects, database snapshots, and plugin architecture.", category: "wordpress", files: [
    { name: "00 — Overview", path: "02-spec/30-wp-plugin/00-overview.md" },
    { name: "01 — Auto Update 301 Redirect", path: "02-spec/30-wp-plugin/01-auto-update-301-redirect.md" },
    { name: "02 — Database Snapshots", path: "02-spec/30-wp-plugin/02-database-snapshots.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/30-wp-plugin/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/30-wp-plugin/99-consistency-report.md" },
  ]},
  { id: "14", label: "14 — WP Plugin Builder", path: "02-spec/31-wp-plugin-builder", description: "Automated WordPress plugin builder — code generation, RAG system, preset learning, and observability.", category: "wordpress", files: [
    { name: "00 — Overview", path: "02-spec/31-wp-plugin-builder/00-overview.md" },
    { name: "01 — Core Architecture", path: "02-spec/31-wp-plugin-builder/01-core-architecture.md" },
    { name: "02 — CLI Interface", path: "02-spec/31-wp-plugin-builder/02-cli-interface.md" },
    { name: "03 — Configuration", path: "02-spec/31-wp-plugin-builder/03-configuration.md" },
    { name: "04 — Database Schema", path: "02-spec/31-wp-plugin-builder/04-database-schema.md" },
    { name: "05 — RAG System", path: "02-spec/31-wp-plugin-builder/05-rag-system.md" },
    { name: "06 — Project Management", path: "02-spec/31-wp-plugin-builder/06-project-management.md" },
    { name: "07 — Code Generation", path: "02-spec/31-wp-plugin-builder/07-code-generation.md" },
    { name: "08 — Spec Processing", path: "02-spec/31-wp-plugin-builder/08-spec-processing.md" },
    { name: "09 — Preset Learning", path: "02-spec/31-wp-plugin-builder/09-preset-learning.md" },
    { name: "10 — Error Handling", path: "02-spec/31-wp-plugin-builder/10-error-handling.md" },
    { name: "11 — API Interface", path: "02-spec/31-wp-plugin-builder/11-api-interface.md" },
    { name: "12 — Coding Guidelines", path: "02-spec/31-wp-plugin-builder/12-coding-guidelines.md" },
    { name: "13 — Testing Strategy", path: "02-spec/31-wp-plugin-builder/13-testing-strategy.md" },
    { name: "14 — Implementation Guide", path: "02-spec/31-wp-plugin-builder/14-implementation-guide.md" },
    { name: "15 — Enum Architecture", path: "02-spec/31-wp-plugin-builder/15-enum-architecture.md" },
    { name: "16 — Settings Service", path: "02-spec/31-wp-plugin-builder/16-settings-service.md" },
    { name: "17 — Observability", path: "02-spec/31-wp-plugin-builder/17-observability.md" },
    { name: "18 — Reset API", path: "02-spec/31-wp-plugin-builder/18-reset-api.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/31-wp-plugin-builder/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/31-wp-plugin-builder/99-consistency-report.md" },
  ]},
  { id: "15", label: "15 — Spec Reverse CLI", path: "02-spec/25-spec-reverse-cli", description: "Reverse-engineers existing codebases into structured spec files for documentation.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/25-spec-reverse-cli/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/25-spec-reverse-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/25-spec-reverse-cli/99-consistency-report.md" },
  ]},
  { id: "16", label: "16 — AI Transcribe CLI", path: "02-spec/26-ai-transcribe-cli", description: "AI-powered audio/video transcription CLI with speaker detection and formatting.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/26-ai-transcribe-cli/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/26-ai-transcribe-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/26-ai-transcribe-cli/99-consistency-report.md" },
  ]},
  { id: "17", label: "17 — AI Research", path: "02-spec/60-ai-research", description: "Research on vector databases, RAG systems, memory architectures, and Go implementation guides.", category: "utilities", files: [
    { name: "00 — Overview", path: "02-spec/60-ai-research/00-overview.md" },
    { name: "01 — Vector Databases Guide", path: "02-spec/60-ai-research/01-additional-vector-databases-and-tools-guide.md" },
    { name: "02 — AI Database Ecosystem Guide", path: "02-spec/60-ai-research/02-complete-ai-database-and-framework-ecosystem-guide.md" },
    { name: "03 — RAG Language Analysis", path: "02-spec/60-ai-research/03-rag-programming-language-analysis.md" },
    { name: "04 — RAG Memory Systems Guide", path: "02-spec/60-ai-research/04-rag-memory-systems-complete-guide.md" },
    { name: "05 — RAG Memory & Go Guide", path: "02-spec/60-ai-research/05-rag-memory-training-and-go-implementation-guide.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/60-ai-research/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/60-ai-research/99-consistency-report.md" },
  ]},
  { id: "19", label: "19 — License Manager", path: "02-spec/27-license-manager", description: "Software license management — architecture, CLI interface, data models, and configuration.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/27-license-manager/00-overview.md" },
    { name: "01 — Architecture", path: "02-spec/27-license-manager/01-architecture.md" },
    { name: "02 — CLI Interface", path: "02-spec/27-license-manager/02-cli-interface.md" },
    { name: "03 — Data Models", path: "02-spec/27-license-manager/03-data-models.md" },
    { name: "04 — Error Handling", path: "02-spec/27-license-manager/04-error-handling.md" },
    { name: "05 — Acceptance Criteria", path: "02-spec/27-license-manager/05-acceptance-criteria.md" },
    { name: "06 — Configuration", path: "02-spec/27-license-manager/06-configuration.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/27-license-manager/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/27-license-manager/99-consistency-report.md" },
  ]},
  { id: "21", label: "21 — WP SEO Publish CLI", path: "02-spec/32-wp-seo-publish-cli", description: "WordPress SEO publishing CLI for automated content optimization and deployment.", category: "wordpress", files: [
    { name: "00 — Overview", path: "02-spec/32-wp-seo-publish-cli/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/32-wp-seo-publish-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/32-wp-seo-publish-cli/99-consistency-report.md" },
  ]},
  { id: "23", label: "23 — Issues Tracker", path: "02-spec/61-how-app-issues-track", description: "Issue tracking methodology — templates, process checklists, and detailed issue write-ups.", category: "utilities", files: [
    { name: "00 — Overview", path: "02-spec/61-how-app-issues-track/00-overview.md" },
    { name: "01 — Issue Template", path: "02-spec/61-how-app-issues-track/01-issue-template.md" },
    { name: "02 — Process Checklist", path: "02-spec/61-how-app-issues-track/02-process-checklist.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/61-how-app-issues-track/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/61-how-app-issues-track/99-consistency-report.md" },
  ]},
  { id: "03", label: "03 — Coding Guidelines", path: "02-spec/02-coding-guidelines", description: "Master coding standards — code style, boolean principles, function naming, database naming, and strict typing.", category: "standards", files: [
    { name: "00 — Overview", path: "02-spec/02-coding-guidelines/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/02-coding-guidelines/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/02-coding-guidelines/99-consistency-report.md" },
  ]},
  { id: "24", label: "24 — TypeScript Standards", path: "02-spec/24-typescript-standards", description: "TypeScript-specific rules — enum patterns, type safety, and project conventions.", category: "standards", files: [
    { name: "00 — Overview", path: "02-spec/24-typescript-standards/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/24-typescript-standards/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/24-typescript-standards/99-consistency-report.md" },
  ]},
  { id: "25", label: "25 — Golang Standards", path: "02-spec/25-golang-standards", description: "Go language standards — canonical enum specification, boolean standards, and code conventions.", category: "standards", files: [
    { name: "00 — Overview", path: "02-spec/25-golang-standards/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/25-golang-standards/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/25-golang-standards/99-consistency-report.md" },
  ]},
  { id: "26", label: "26 — PHP Standards", path: "02-spec/26-php-standards", description: "PHP coding rules, conventions, and best practices for WordPress and backend development.", category: "standards", files: [
    { name: "00 — Overview", path: "02-spec/26-php-standards/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/26-php-standards/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/26-php-standards/99-consistency-report.md" },
  ]},
  { id: "28", label: "28 — WP Plugin Development", path: "02-spec/33-wp-plugin-development", description: "WordPress plugin architecture patterns, development workflow, and deployment standards.", category: "wordpress", files: [
    { name: "00 — Overview", path: "02-spec/33-wp-plugin-development/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/33-wp-plugin-development/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/33-wp-plugin-development/99-consistency-report.md" },
  ]},
  { id: "29", label: "29 — Upload Scripts", path: "02-spec/51-upload-scripts", description: "Utility scripts for uploading, syncing, and managing spec files across environments.", category: "utilities", files: [
    { name: "00 — Overview", path: "02-spec/51-upload-scripts/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/51-upload-scripts/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/51-upload-scripts/99-consistency-report.md" },
  ]},
  { id: "30", label: "30 — E2 Activity Feed", path: "02-spec/53-e2-activity-feed", description: "Activity tracking and feed system for monitoring events across services.", category: "utilities", files: [
    { name: "00 — Overview", path: "02-spec/53-e2-activity-feed/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/53-e2-activity-feed/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/53-e2-activity-feed/99-consistency-report.md" },
  ]},
  { id: "31", label: "31 — Generic Enforce", path: "02-spec/08-generic-enforce", description: "General enforcement rules and automated validation patterns applied across all projects.", category: "enforcement", files: [
    { name: "00 — Overview", path: "02-spec/08-generic-enforce/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/08-generic-enforce/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/08-generic-enforce/99-consistency-report.md" },
  ]},
  { id: "32", label: "32 — Shared Preset Data", path: "02-spec/52-shared-preset-data", description: "Shared preset and seed data definitions used across multiple CLI tools and services.", category: "core", files: [
    { name: "00 — Overview", path: "02-spec/52-shared-preset-data/00-overview.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/52-shared-preset-data/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/52-shared-preset-data/99-consistency-report.md" },
  ]},
  { id: "33", label: "33 — AI Bridge Non-Vector RAG", path: "02-spec/23-ai-bridge-non-vector-rag", description: "Non-vector RAG system — tree index schema, code/document parsers, retrieval engine, and performance benchmarks.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/23-ai-bridge-non-vector-rag/00-overview.md" },
    { name: "01 — Architecture", path: "02-spec/23-ai-bridge-non-vector-rag/01-architecture.md" },
    { name: "02 — Tree Index Schema", path: "02-spec/23-ai-bridge-non-vector-rag/02-tree-index-schema.md" },
    { name: "03 — Code Parser", path: "02-spec/23-ai-bridge-non-vector-rag/03-code-parser.md" },
    { name: "04 — Document Parser", path: "02-spec/23-ai-bridge-non-vector-rag/04-document-parser.md" },
    { name: "05 — Tree Indexing Engine", path: "02-spec/23-ai-bridge-non-vector-rag/05-tree-indexing-engine.md" },
    { name: "06 — Tree Retrieval Engine", path: "02-spec/23-ai-bridge-non-vector-rag/06-tree-retrieval-engine.md" },
    { name: "07 — API Interface", path: "02-spec/23-ai-bridge-non-vector-rag/07-api-interface.md" },
    { name: "08 — Error Codes", path: "02-spec/23-ai-bridge-non-vector-rag/08-error-codes.md" },
    { name: "09 — Configuration", path: "02-spec/23-ai-bridge-non-vector-rag/09-configuration.md" },
    { name: "10 — AI Bridge Integration", path: "02-spec/23-ai-bridge-non-vector-rag/10-ai-bridge-integration.md" },
    { name: "11 — Performance Benchmarks", path: "02-spec/23-ai-bridge-non-vector-rag/11-performance-benchmarks.md" },
    { name: "12 — Retrieval Router", path: "02-spec/23-ai-bridge-non-vector-rag/12-retrieval-router.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/23-ai-bridge-non-vector-rag/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/23-ai-bridge-non-vector-rag/99-consistency-report.md" },
  ]},
  { id: "34", label: "34 — Time Log CLI", path: "02-spec/40-time-log-cli", description: "Rust-based cross-platform system activity tracker — daemon lifecycle, browser/app tracking, screenshots, idle detection, and sync.", category: "cli", files: [
    { name: "00 — Overview", path: "02-spec/40-time-log-cli/00-overview.md" },
    { name: "01-backend / 00 — Overview", path: "02-spec/40-time-log-cli/01-backend/00-overview.md" },
    { name: "01-backend / 01 — Architecture", path: "02-spec/40-time-log-cli/01-backend/01-architecture.md" },
    { name: "01-backend / 02 — OS Integration", path: "02-spec/40-time-log-cli/01-backend/02-os-integration.md" },
    { name: "01-backend / 03 — Browser Tracking", path: "02-spec/40-time-log-cli/01-backend/03-browser-tracking.md" },
    { name: "01-backend / 04 — Screenshot Capture", path: "02-spec/40-time-log-cli/01-backend/04-screenshot-capture.md" },
    { name: "01-backend / 05 — Database Schema", path: "02-spec/40-time-log-cli/01-backend/05-database-schema.md" },
    { name: "01-backend / 06 — API Interface", path: "02-spec/40-time-log-cli/01-backend/06-api-interface.md" },
    { name: "01-backend / 07 — Error Codes", path: "02-spec/40-time-log-cli/01-backend/07-error-codes.md" },
    { name: "01-backend / 08 — File Path Extraction", path: "02-spec/40-time-log-cli/01-backend/08-file-path-extraction.md" },
    { name: "01-backend / 09 — Remote Sync", path: "02-spec/40-time-log-cli/01-backend/09-remote-sync.md" },
    { name: "01-backend / 10 — Remote Settings", path: "02-spec/40-time-log-cli/01-backend/10-remote-settings.md" },
    { name: "01-backend / 11 — Time Slice Productivity", path: "02-spec/40-time-log-cli/01-backend/11-time-slice-productivity.md" },
    { name: "01-backend / 97 — Acceptance Criteria", path: "02-spec/40-time-log-cli/01-backend/97-acceptance-criteria.md" },
    { name: "01-backend / 98 — Changelog", path: "02-spec/40-time-log-cli/01-backend/98-changelog.md" },
    { name: "01-backend / 99 — Consistency Report", path: "02-spec/40-time-log-cli/01-backend/99-consistency-report.md" },
    { name: "03-deploy / 00 — Overview", path: "02-spec/40-time-log-cli/03-deploy/00-overview.md" },
    { name: "03-deploy / 01 — Build Pipeline", path: "02-spec/40-time-log-cli/03-deploy/01-build-pipeline.md" },
    { name: "03-deploy / 02 — Windows Installer", path: "02-spec/40-time-log-cli/03-deploy/02-windows-installer.md" },
    { name: "03-deploy / 03 — Linux Packaging", path: "02-spec/40-time-log-cli/03-deploy/03-linux-packaging.md" },
    { name: "03-deploy / 04 — macOS Packaging", path: "02-spec/40-time-log-cli/03-deploy/04-macos-packaging.md" },
    { name: "03-deploy / 05 — Auto Update", path: "02-spec/40-time-log-cli/03-deploy/05-auto-update.md" },
    { name: "03-deploy / 97 — Acceptance Criteria", path: "02-spec/40-time-log-cli/03-deploy/97-acceptance-criteria.md" },
    { name: "03-deploy / 99 — Consistency Report", path: "02-spec/40-time-log-cli/03-deploy/99-consistency-report.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/40-time-log-cli/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/40-time-log-cli/99-consistency-report.md" },
  ]},
  { id: "35", label: "35 — Time Log UI", path: "02-spec/41-time-log-ui", description: "React-based dashboard frontend for the Time Log system — views, settings, privacy controls, and deployment.", category: "utilities", files: [
    { name: "00 — Overview", path: "02-spec/41-time-log-ui/00-overview.md" },
    { name: "02-frontend / 00 — Overview", path: "02-spec/41-time-log-ui/02-frontend/00-overview.md" },
    { name: "02-frontend / 01 — Architecture", path: "02-spec/41-time-log-ui/02-frontend/01-architecture.md" },
    { name: "02-frontend / 02 — Component Library", path: "02-spec/41-time-log-ui/02-frontend/02-component-library.md" },
    { name: "02-frontend / 03 — State Management", path: "02-spec/41-time-log-ui/02-frontend/03-state-management.md" },
    { name: "02-frontend / 04 — Dashboard Views", path: "02-spec/41-time-log-ui/02-frontend/04-dashboard-views.md" },
    { name: "02-frontend / 05 — Settings Privacy", path: "02-spec/41-time-log-ui/02-frontend/05-settings-privacy.md" },
    { name: "02-frontend / 99 — Consistency Report", path: "02-spec/41-time-log-ui/02-frontend/99-consistency-report.md" },
    { name: "03-deploy / 00 — Overview", path: "02-spec/41-time-log-ui/03-deploy/00-overview.md" },
    { name: "03-deploy / 01 — Embedded Serving", path: "02-spec/41-time-log-ui/03-deploy/01-embedded-serving.md" },
    { name: "03-deploy / 02 — Standalone Build", path: "02-spec/41-time-log-ui/03-deploy/02-standalone-build.md" },
    { name: "03-deploy / 03 — CI CD", path: "02-spec/41-time-log-ui/03-deploy/03-ci-cd.md" },
    { name: "03-deploy / 99 — Consistency Report", path: "02-spec/41-time-log-ui/03-deploy/99-consistency-report.md" },
    { name: "97 — Acceptance Criteria", path: "02-spec/41-time-log-ui/97-acceptance-criteria.md" },
    { name: "99 — Consistency Report", path: "02-spec/41-time-log-ui/99-consistency-report.md" },
  ]},
  { id: "36", label: "36 — Time Log Combined", path: "02-spec/42-time-log-combined", description: "Combined acceptance criteria summary and consistency report for the Time Log CLI + UI system.", category: "utilities", files: [
    { name: "00 — Overview", path: "02-spec/42-time-log-combined/00-overview.md" },
    { name: "00 — Acceptance Criteria Summary", path: "02-spec/42-time-log-combined/00-acceptance-criteria-summary.md" },
    { name: "99 — Consistency Report", path: "02-spec/42-time-log-combined/99-consistency-report.md" },
  ]},
];

// Auto-merge any spec files discovered on disk (e.g. nested folders like
// 02-spec/09-code-block-system) into the curated list so they remain searchable.
const augmentedSpecFolders: SpecFolder[] = augmentSpecFolders(specFolders, { includeNumberPrefix: true });

const totalFiles = augmentedSpecFolders.reduce((sum, f) => sum + f.files.length, 0);

export interface SpecFileViewerHandle {
  filterByCategory: (category: SpecFolder["category"]) => void;
}

export type SpecCategory = SpecFolder["category"];

interface SpecFileViewerProps {
  onCategoryClick?: (category: SpecCategory) => void;
  defaultOpen?: boolean;
  fullPage?: boolean;
}

const SpecFileViewer = forwardRef<SpecFileViewerHandle, SpecFileViewerProps>(({ onCategoryClick, defaultOpen = false, fullPage = false }, ref) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedFile, setSelectedFile] = useState<SpecFile | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<SpecFolder | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentPanelRef = useRef<HTMLDivElement>(null);
  const DEFAULT_FONT_SIZE = fullPage ? 18 : 15;
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const increaseFontSize = () => setFontSize((s) => Math.min(s + 2, 28));
  const decreaseFontSize = () => setFontSize((s) => Math.max(s - 2, 10));
  const resetFontSize = () => setFontSize(DEFAULT_FONT_SIZE);
  const [showToc, setShowToc] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement>(null);

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

  const [activeTocId, setActiveTocId] = useState<string>("");
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

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<SpecFolder["category"] | "all">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEscHint, setShowEscHint] = useState(false);
  const [escHintVisible, setEscHintVisible] = useState(false);
  const [showContentPanel, setShowContentPanel] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(fullPage ? 340 : 300);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientX - dragStartXRef.current;
      const newWidth = Math.max(200, Math.min(600, dragStartWidthRef.current + delta));
      setSidebarWidth(newWidth);
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
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  // Navigation: null = root folder list, SpecFolder = inside that folder
  const [currentFolder, setCurrentFolder] = useState<SpecFolder | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shortcutsEnabled, setShortcutsEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("spec-viewer-shortcuts") !== "false"; } catch { return true; }
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Recent files — persisted to localStorage
  const [recentFiles, setRecentFiles] = useState<SpecFile[]>(() => {
    try {
      const stored = localStorage.getItem("spec-viewer-recent-files");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const addToRecentFiles = useCallback((file: SpecFile) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f.path !== file.path);
      const updated = [file, ...filtered].slice(0, 5);
      localStorage.setItem("spec-viewer-recent-files", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      setShowEscHint(true);
      setEscHintVisible(true);
      const fadeTimer = setTimeout(() => setEscHintVisible(false), 2500);
      const removeTimer = setTimeout(() => setShowEscHint(false), 3000);
      return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
    } else {
      setShowEscHint(false);
      setEscHintVisible(false);
    }
  }, [isFullscreen]);

  const navigateIntoFolder = (folder: SpecFolder) => {
    setCurrentFolder(folder);
    setSelectedFile(null);
    setFileContent("");
  };

  const navigateBack = () => {
    if (selectedFile) {
      setSelectedFile(null);
      setFileContent("");
    } else {
      setCurrentFolder(null);
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFolders = useMemo(() => {
    let folders = augmentedSpecFolders;
    if (categoryFilter !== "all") {
      folders = folders.filter((f) => f.category === categoryFilter);
    }
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders
      .map((folder) => ({
        ...folder,
        files: folder.files.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.path.toLowerCase().includes(q) ||
            folder.label.toLowerCase().includes(q)
        ),
      }))
      .filter((folder) => folder.files.length > 0);
  }, [searchQuery, categoryFilter]);

  const currentFileList = useMemo(() => {
    if (currentFolder) return currentFolder.files;
    return filteredFolders.flatMap(f => f.files);
  }, [currentFolder, filteredFolders]);

  const currentFileIndex = useMemo(() => {
    if (!selectedFile) return -1;
    return currentFileList.findIndex(f => f.path === selectedFile.path);
  }, [selectedFile, currentFileList]);

  const currentFolderIndex = useMemo(() => {
    if (!currentFolder) return -1;
    return filteredFolders.findIndex(f => f.id === currentFolder.id);
  }, [currentFolder, filteredFolders]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      if (!shortcutsEnabled) return;
      if (isInputFocused) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "ArrowRight" && currentFileList.length > 0) {
        e.preventDefault();
        const nextIndex = currentFileIndex < currentFileList.length - 1 ? currentFileIndex + 1 : 0;
        handleFileClick(currentFileList[nextIndex]);
        return;
      }

      if (e.key === "ArrowLeft" && currentFileList.length > 0) {
        e.preventDefault();
        const prevIndex = currentFileIndex > 0 ? currentFileIndex - 1 : currentFileList.length - 1;
        handleFileClick(currentFileList[prevIndex]);
        return;
      }

      if (e.key === "ArrowDown" && !currentFolder && filteredFolders.length > 0) {
        e.preventDefault();
        const nextIdx = currentFolderIndex < filteredFolders.length - 1 ? currentFolderIndex + 1 : 0;
        navigateIntoFolder(filteredFolders[nextIdx]);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateBack();
        return;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, shortcutsEnabled, currentFileList, currentFileIndex, currentFolder, currentFolderIndex, filteredFolders]);

  useImperativeHandle(ref, () => ({
    filterByCategory: (category: SpecFolder["category"]) => {
      const colors = categoryColors[category];
      const matchCount = augmentedSpecFolders.filter((f) => f.category === category).length;
      setCategoryFilter(category);
      setIsOpen(true);
      setCurrentFolder(null);
      setExpandedFolders(new Set(augmentedSpecFolders.filter((f) => f.category === category).map((f) => f.id)));
      toast.info(`Filtered to ${colors.label}`, {
        description: `Showing ${matchCount} module${matchCount !== 1 ? "s" : ""} in this category`,
      });
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
  }));

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedFolders(new Set(filteredFolders.map((f) => f.id)));
    }
  }, [searchQuery, filteredFolders]);

  const handleFileClick = async (file: SpecFile) => {
    setSelectedFile(file);
    setShowContentPanel(true);
    setLoading(true);
    addToRecentFiles(file);
    try {
      // Try loading via Vite's import.meta.glob (build-time bundled)
      const globKey = `/${file.path}`;
      const loader = specModules[globKey];
      if (loader) {
        const text = await loader();
        setFileContent(text);
      } else {
        // Fallback to fetch
        const response = await fetch(`/${file.path}`);
        if (response.ok) {
          const text = await response.text();
          setFileContent(text);
        } else {
          setFileContent(`# Unable to load file\n\nFile: \`${file.path}\`\n\nThis file could not be loaded in the browser. It exists in the project source but is not served as a static asset.\n\n---\n\n**Tip:** To view this file, open it directly in your code editor or IDE.`);
        }
      }
    } catch {
      setFileContent(`# Unable to load file\n\nFile: \`${file.path}\`\n\nThis file could not be loaded in the browser.`);
    }
    setLoading(false);
  };

  const fullscreenClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-background p-4 flex flex-col transition-all duration-300 ease-in-out relative"
    : "transition-all duration-300 ease-in-out";

  const escHint = isFullscreen ? (
    <div
      className="absolute top-0 right-0 z-[60] h-20 w-52 flex justify-end items-start pointer-events-auto"
      onMouseEnter={() => { if (!showEscHint) { setShowEscHint(true); setEscHintVisible(true); } }}
      onMouseLeave={() => { setEscHintVisible(false); setTimeout(() => setShowEscHint(false), 500); }}
    >
      <div className="absolute inset-0 bg-gradient-to-bl from-background/20 via-background/5 to-transparent rounded-bl-xl pointer-events-none animate-[pulse_5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
      {showEscHint && (
        <span className={`relative z-10 mt-2 mr-4 text-xs text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-md border border-border transition-opacity duration-500 ${escHintVisible ? "opacity-100" : "opacity-0"}`}>
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono font-medium">Esc</kbd> to exit fullscreen
        </span>
      )}
    </div>
  ) : null;

  return (
    <section ref={sectionRef} className={fullscreenClasses}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <FolderOpen className="h-3.5 w-3.5 text-info" />
          <h2 className="font-heading text-xs uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
            Spec Files — All Modules
          </h2>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="rounded-full bg-info/10 px-2 py-0.5 font-mono text-[10px] text-info">
            {augmentedSpecFolders.length} modules · {totalFiles} files
          </span>
        </button>

        {isOpen && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              title="Keyboard shortcuts"
              className={`p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer ${showShortcuts ? "text-info bg-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Keyboard className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowContentPanel(!showContentPanel)}
              title={showContentPanel ? "Hide content panel" : "Show content panel"}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showContentPanel ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <>
        {escHint}
        {showShortcuts && (
           <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-[11px] text-muted-foreground" role="region" aria-label="Keyboard shortcuts">
            <span className="font-medium text-foreground/70 mr-1">Shortcuts:</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">←</kbd> Prev file</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">→</kbd> Next file</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">↓</kbd> Enter folder</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">↑</kbd> Go back</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">/</kbd> Search</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Esc</kbd> Exit fullscreen</span>
            <button
              onClick={() => {
                const next = !shortcutsEnabled;
                setShortcutsEnabled(next);
                localStorage.setItem("spec-viewer-shortcuts", String(next));
                toast.success(next ? "Shortcuts enabled" : "Shortcuts disabled");
              }}
              className={`ml-auto flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                shortcutsEnabled
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${shortcutsEnabled ? "bg-success" : "bg-destructive"}`} />
              {shortcutsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        )}
        <div className={`flex gap-0 ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
          {/* Folder tree / drill-down panel */}
          <div
            className={`rounded-xl border border-border bg-card overflow-hidden shrink-0 ${isFullscreen ? "flex flex-col" : ""}`}
            style={{ width: showContentPanel ? `${sidebarWidth}px` : "100%" }}
          >
            {/* Toolbar header */}
            <div className="border-b border-border bg-secondary/50 px-4 py-2.5 flex items-center gap-2">
              {currentFolder ? (
                <>
                  <button
                    onClick={navigateBack}
                    className="p-1 rounded hover:bg-accent transition-colors cursor-pointer"
                    title="Back to folder list"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <Folder className="h-3.5 w-3.5 text-warning" />
                  <p className="font-mono text-[11px] font-medium text-foreground truncate">
                    {currentFolder.label}
                  </p>
                  <span className={`ml-auto rounded-full ${categoryColors[currentFolder.category].bg} ${categoryColors[currentFolder.category].text} px-1.5 py-0.5 text-[9px] font-medium shrink-0`}>
                    {categoryColors[currentFolder.category].label}
                  </span>
                </>
              ) : (
                <p className="font-mono text-[11px] font-medium text-muted-foreground">
                  spec/
                </p>
              )}
            </div>

            {/* Search & filter - only at root level */}
            {!currentFolder && (
              <div className="border-b border-border bg-secondary/50 px-3 py-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all spec files…"
                    className="w-full rounded-md border border-border bg-background pl-8 pr-14 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-info"
                  />
                  {searchQuery.trim() && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-info/10 px-1.5 py-0.5 font-mono text-[10px] text-info">
                      {filteredFolders.reduce((sum, f) => sum + f.files.length, 0)}
                    </span>
                  )}
                </div>
                <div className="relative shrink-0">
                  <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as SpecFolder["category"] | "all")}
                    className="appearance-none rounded-md border border-border bg-background pl-6 pr-5 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-info cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="foundation">Foundation</option>
                    <option value="core">Core System</option>
                    <option value="cli">CLI Tool</option>
                    <option value="wordpress">WordPress</option>
                    <option value="standards">Standards</option>
                    <option value="utilities">Utility</option>
                    <option value="enforcement">Enforcement</option>
                  </select>
                </div>
                <button
                  onClick={() => setExpandedFolders(new Set(filteredFolders.map((f) => f.id)))}
                  title="Expand all"
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setExpandedFolders(new Set())}
                  title="Collapse all"
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronsDownUp className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className={`overflow-y-auto ${isFullscreen ? "flex-1 min-h-0" : fullPage ? "max-h-[calc(100vh-180px)]" : "max-h-[600px]"}`}>
              {currentFolder ? (
                /* Inside a folder: show description + file list */
                (() => {
                  const cat = categoryColors[currentFolder.category];
                  return (
                <div>
                  <div className={`px-4 py-3 border-b border-border/30 border-l-2 ${cat.border}`}>
                    <p className={`text-[11px] font-mono mb-1 ${cat.text} opacity-70`}>{currentFolder.path}/</p>
                    <p className="text-[12px] text-foreground/60 leading-relaxed flex items-start gap-2">
                      <BookOpen className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${cat.text} opacity-60`} />
                      {currentFolder.description}
                    </p>
                  </div>
                  {currentFolder.files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-[12px] transition-colors cursor-pointer border-b border-border/20 border-l-2 last:border-b-0 ${
                        selectedFile?.path === file.path
                          ? `${cat.bg} ${cat.text} ${cat.border}`
                          : `border-l-transparent text-foreground/70 ${cat.fileBg} hover:text-foreground hover:border-l-2 hover:${cat.border}`
                      }`}
                    >
                      <FileText className={`h-3.5 w-3.5 shrink-0 ${selectedFile?.path === file.path ? cat.text : cat.iconColor}`} />
                      <span className="truncate">{file.name}</span>
                      <span className={`ml-auto font-mono text-[10px] opacity-60 ${selectedFile?.path === file.path ? cat.text : "text-muted-foreground"}`}>.md</span>
                    </button>
                  ))}
                </div>
                  );
                })()
              ) : (
                /* Root: folder list */
                <>
                {recentFiles.length > 0 && !searchQuery.trim() && categoryFilter === "all" && (
                  <div className="border-b border-border/30 bg-secondary/20 px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Clock className="h-3 w-3 text-info/60" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Recent</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recentFiles.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => handleFileClick(file)}
                          className={`inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[10px] transition-colors cursor-pointer ${
                            selectedFile?.path === file.path
                              ? "bg-info/10 text-info border-info/30"
                              : "text-foreground/60 hover:bg-accent hover:text-foreground bg-background/50"
                          }`}
                        >
                          <FileText className="h-2.5 w-2.5 shrink-0 opacity-60" />
                          <span className="truncate max-w-[120px]">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Category Color Legend */}
                {!searchQuery.trim() && !categoryFilter && !currentFolder && (
                  <div className="border-b border-border/30 bg-secondary/10 px-3 py-1.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Categories</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Object.entries(categoryColors) as [SpecFolder["category"], typeof categoryColors[SpecFolder["category"]]][]).map(([key, cat]) => (
                        <button
                          key={key}
                          onClick={() => onCategoryClick?.(key)}
                          className={`inline-flex items-center gap-1 rounded-md border-l-2 ${cat.border} px-1.5 py-0.5 text-[9px] cursor-pointer transition-colors ${cat.bg} ${cat.text} hover:opacity-80`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredFolders.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matching files</p>
                ) : (
                  filteredFolders.map((folder) => {
                    const cat = categoryColors[folder.category];
                    return (
                    <div key={folder.id}>
                      <button
                        onClick={() => navigateIntoFolder(folder)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-medium transition-colors cursor-pointer border-b border-border/30 border-l-2 ${cat.border} bg-secondary/20 hover:bg-secondary/50`}
                      >
                        <ChevronRight className={`h-3 w-3 shrink-0 ${cat.text} opacity-60`} />
                        <Folder className={`h-3.5 w-3.5 shrink-0 ${cat.text}`} />
                        <span className="truncate text-foreground/90">{folder.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick?.(folder.category);
                          }}
                          className={`ml-auto rounded-full ${cat.bg} ${cat.text} px-1.5 py-0.5 text-[9px] font-medium shrink-0 leading-none cursor-pointer hover:opacity-80 transition-opacity`}
                          title={`Highlight ${cat.label} certificates`}
                        >
                          {cat.label}
                        </button>
                        <span className={`font-mono text-[10px] shrink-0 ${cat.text} opacity-60`}>
                          {folder.files.length}
                        </span>
                      </button>
                    </div>
                    );
                  })
                )}
                </>
              )}
            </div>
          </div>

          {/* Resize handle */}
          {showContentPanel && (
            <div
              onMouseDown={handleResizeStart}
              onDoubleClick={() => setSidebarWidth(fullPage ? 340 : 300)}
              className="w-2 shrink-0 cursor-col-resize group/resize flex items-center justify-center hover:bg-primary/20 transition-colors"
              title="Drag to resize · Double-click to reset"
            >
              <div className="w-0.5 h-8 rounded-full bg-border group-hover/resize:bg-primary/50 transition-colors" />
            </div>
          )}

          {/* Content viewer panel */}
          {showContentPanel && (
            <div ref={contentPanelRef} className={`rounded-xl border border-border bg-card overflow-hidden flex-1 min-w-0 ${isFullscreen ? "flex flex-col" : ""}`}>
              {selectedFile ? (
                (() => {
                  const handleCopyContent = () => {
                    navigator.clipboard.writeText(fileContent).then(() => {
                      setCopied(true);
                      toast.success("Copied to clipboard");
                      setTimeout(() => setCopied(false), 2000);
                    });
                  };
                  const handleDownload = () => {
                    const blob = new Blob([fileContent], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = selectedFile.path.split("/").pop() || "file.md";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("File downloaded");
                  };
                  const handleContentFullscreen = () => {
                    const el = contentPanelRef.current;
                    if (!el) return;
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      el.requestFullscreen();
                    }
                  };
                  return (
                    <>
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-secondary/80 backdrop-blur-sm px-5 py-2">
                        <nav className="flex items-center gap-1 min-w-0 text-[12px]" style={{ fontFamily: "'Ubuntu Mono', monospace" }}>
                          {selectedFile.path.split("/").map((segment, i, arr) => {
                            const isLast = i === arr.length - 1;
                            const partialPath = arr.slice(0, i + 1).join("/");
                            const handleBreadcrumbClick = () => {
                              if (isLast || i === 0) return;
                              const folder = augmentedSpecFolders.find((f) => f.path === partialPath);
                              if (folder) navigateIntoFolder(folder);
                            };
                            return (
                              <span key={i} className="flex items-center gap-1 shrink-0">
                                {i === 0 ? (
                                  <FolderOpen className="h-3.5 w-3.5 text-info shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                )}
                                {isLast ? (
                                  <span className="text-info font-medium">{segment.replace(/\.md$/, "")}</span>
                                ) : (
                                  <button
                                    onClick={handleBreadcrumbClick}
                                    className={`transition-colors ${i === 0 ? "text-muted-foreground" : "text-muted-foreground hover:text-info hover:underline cursor-pointer"}`}
                                  >
                                    {segment}
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </nav>
                        {fileContent && !loading && (() => {
                          const words = fileContent.trim().split(/\s+/).length;
                          const mins = Math.max(1, Math.ceil(words / 200));
                          return (
                            <span className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 shrink-0" title={`${words.toLocaleString()} words · ${mins} min read`}>
                              <span>{words.toLocaleString()} words</span>
                              <span>·</span>
                              <span>{mins} min</span>
                            </span>
                          );
                        })()}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={handleCopyContent} disabled={loading || !fileContent} className="p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer group disabled:opacity-30" title="Copy markdown">
                            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />}
                          </button>
                          <button onClick={handleDownload} disabled={loading || !fileContent} className="p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer group disabled:opacity-30" title="Download file">
                            <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </button>
                          <button onClick={handleContentFullscreen} className="p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer group" title="Fullscreen">
                            <Expand className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </button>
                          <button onClick={() => setShowToc((v) => !v)} className={`p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer group ${showToc ? "bg-accent" : ""}`} title="Table of contents">
                            <List className={`h-3.5 w-3.5 transition-colors ${showToc ? "text-info" : "text-muted-foreground group-hover:text-foreground"}`} />
                          </button>
                          <div className="w-px h-4 bg-border mx-0.5" />
                          <div className="flex items-center gap-0">
                            <button onClick={decreaseFontSize} disabled={fontSize <= 10} className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer group disabled:opacity-30" title="Decrease font size">
                              <Minus className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            <button onClick={resetFontSize} className="px-1 rounded-md hover:bg-accent transition-colors cursor-pointer group" title="Reset font size">
                              <span className="text-[9px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{fontSize}</span>
                            </button>
                            <button onClick={increaseFontSize} disabled={fontSize >= 28} className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer group disabled:opacity-30" title="Increase font size">
                              <Plus className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                          </div>
                          <div className="w-px h-4 bg-border mx-0.5" />
                          <button onClick={() => { setSelectedFile(null); setFileContent(""); }} className="p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer group" title="Close">
                            <X className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </button>
                        </div>
                      </div>
                      {/* Reading progress bar */}
                      {!loading && fileContent && (
                        <div className="h-[2px] w-full bg-border/30">
                          <div
                            className="h-full bg-info/60 transition-[width] duration-150 ease-out"
                            style={{ width: `${scrollProgress}%` }}
                          />
                        </div>
                      )}
                      <div className={`flex ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
                        {/* Table of Contents sidebar */}
                        {showToc && tocHeadings.length > 0 && !loading && (
                          <div className={`border-r border-border bg-secondary/30 overflow-y-auto shrink-0 w-56 ${isFullscreen ? "" : fullPage ? "max-h-[calc(100vh-180px)]" : "max-h-[600px]"}`}>
                            <div className="px-3 py-2 border-b border-border/50">
                              <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">On this page</span>
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
                                  style={{ fontFamily: "'Ubuntu Mono', monospace" }}
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
                        {/* Main content */}
                        <div ref={contentScrollRef} className={`overflow-y-auto flex-1 min-w-0 ${isFullscreen ? "p-8" : fullPage ? "p-6 max-h-[calc(100vh-180px)]" : "p-5 max-h-[600px]"}`}>
                          {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <div className="h-4 w-4 rounded-full border-2 border-info border-t-transparent animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            <div className={`prose-spec ${isFullscreen ? "max-w-4xl mx-auto" : ""}`} style={{ fontSize: `${isFullscreen ? fontSize + 4 : fontSize}px` }}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                  pre: ({ children, ...props }) => {
                                    const codeWrapRef = useRef<HTMLDivElement>(null);
                                    const codeRef = useRef<HTMLDivElement>(null);
                                    const [codeCopied, setCodeCopied] = useState(false);
                                    const [codeFontSize, setCodeFontSize] = useState(fullPage ? 17 : 15);
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
                                    const handleCodeDownload = () => {
                                      const text = codeText;
                                      const blob = new Blob([text], { type: "text/plain" });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = "code-snippet.txt";
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    };
                                    const handleCodeFullscreen = () => {
                                      const el = codeWrapRef.current;
                                      if (!el) return;
                                      if (document.fullscreenElement) {
                                        document.exitFullscreen();
                                      } else {
                                        el.requestFullscreen().catch(() => {
                                          // Fallback: use fixed overlay if Fullscreen API is blocked
                                          setIsCodeFullscreen(true);
                                        });
                                      }
                                    };
                                    // Listen for fullscreen change to sync state
                                    useEffect(() => {
                                      const handler = () => {
                                        if (!document.fullscreenElement && codeWrapRef.current) {
                                          setIsCodeFullscreen(false);
                                        } else if (document.fullscreenElement === codeWrapRef.current) {
                                          setIsCodeFullscreen(true);
                                        }
                                      };
                                      document.addEventListener("fullscreenchange", handler);
                                      return () => document.removeEventListener("fullscreenchange", handler);
                                    }, []);
                                    // ESC to exit overlay fallback
                                    useEffect(() => {
                                      if (!isCodeFullscreen || document.fullscreenElement) return;
                                      const handler = (e: KeyboardEvent) => {
                                        if (e.key === "Escape") setIsCodeFullscreen(false);
                                      };
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

                                    const defaultFontSize = fullPage ? 17 : 15;

                                    return (
                                      <div
                                        ref={codeWrapRef}
                                        className={`relative group/code rounded-lg overflow-hidden code-block-glow ${
                                          isCodeFullscreen && !document.fullscreenElement
                                            ? "fixed inset-0 z-[9999] flex flex-col"
                                            : isCodeFullscreen
                                            ? "flex flex-col h-full"
                                            : "my-4"
                                        }`}
                                        style={{
                                          backgroundColor: "hsl(220 14% 11%)",
                                          border: "1px solid hsl(220 13% 22%)",
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
                                          {/* Language badge — Poppins, no dot glow (per spec 04-code-block-component.md §3) */}
                                          <span
                                            className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                                            style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: `hsl(${badgeColor})` }}
                                          >
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${badgeColor})` }} />
                                            {langLabel}
                                          </span>
                                          <span
                                            className="ml-auto text-[11px]"
                                            style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: "hsl(220 10% 50%)" }}
                                          >
                                            {lineCount} Lines
                                          </span>
                                          {/* Toolbar — discrete pill groups (per spec 04-code-block-component.md §2 v2.0) */}
                                          <div className="flex items-center gap-1.5 ml-4" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                                            {/* Font-size pill group (3 segmented buttons in ONE pill) */}
                                            <div
                                              className="flex items-stretch rounded overflow-hidden border"
                                              style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                                            >
                                              <button
                                                onClick={() => setCodeFontSize(s => Math.max(s - 2, 10))}
                                                className="px-1.5 py-[1px] hover:bg-white/[0.06] transition-colors"
                                                title="Decrease font size"
                                              >
                                                <span className="text-[10px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>A-</span>
                                              </button>
                                              <button
                                                onClick={() => setCodeFontSize(defaultFontSize)}
                                                className="px-1.5 py-[1px] hover:bg-white/[0.06] transition-colors border-l"
                                                style={{ borderColor: "hsl(220 13% 28%)" }}
                                                title="Reset font size"
                                              >
                                                <span className="text-[10px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>A</span>
                                              </button>
                                              <button
                                                onClick={() => setCodeFontSize(s => Math.min(s + 2, 32))}
                                                className="px-1.5 py-[1px] hover:bg-white/[0.06] transition-colors border-l"
                                                style={{ borderColor: "hsl(220 13% 28%)" }}
                                                title="Increase font size"
                                              >
                                                <span className="text-[10px] font-medium" style={{ color: "hsl(220 10% 75%)" }}>A+</span>
                                              </button>
                                            </div>

                                            {/* Copy — standalone pill */}
                                            <button
                                              onClick={handleCodeCopy}
                                              className="px-2 py-[1px] flex items-center gap-1 rounded border hover:bg-white/[0.06] transition-colors"
                                              style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                                              title="Copy"
                                            >
                                              {codeCopied ? <Check className="h-2.5 w-2.5" style={{ color: "hsl(152 70% 50%)" }} /> : <Copy className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />}
                                              <span className="text-[10px] font-medium hidden sm:inline" style={{ color: "hsl(220 10% 75%)" }}>Copy</span>
                                            </button>

                                            {/* Download — standalone pill */}
                                            <button
                                              onClick={handleCodeDownload}
                                              className="px-2 py-[1px] flex items-center gap-1 rounded border hover:bg-white/[0.06] transition-colors"
                                              style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                                              title="Download"
                                            >
                                              <Download className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />
                                              <span className="text-[10px] font-medium hidden sm:inline" style={{ color: "hsl(220 10% 75%)" }}>Download</span>
                                            </button>

                                            {/* Select all — standalone pill */}
                                            <button
                                              onClick={() => {
                                                const all = new Set(Array.from({ length: lineCount }, (_, i) => i + 1));
                                                setSelectedLines(prev => prev.size === lineCount ? new Set() : all);
                                              }}
                                              className="px-2 py-[1px] flex items-center gap-1 rounded border hover:bg-white/[0.06] transition-colors"
                                              style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                                              title="Select all lines"
                                            >
                                              <ListChecks className="h-2.5 w-2.5" style={{ color: "hsl(220 10% 70%)" }} />
                                              <span className="text-[10px] font-medium hidden sm:inline" style={{ color: "hsl(220 10% 75%)" }}>
                                                {selectedLines.size === lineCount ? "Deselect" : "Select all"}
                                              </span>
                                            </button>

                                            {/* Fullscreen — standalone icon pill */}
                                            <button
                                              onClick={() => {
                                                if (isCodeFullscreen && document.fullscreenElement) document.exitFullscreen();
                                                else if (isCodeFullscreen) setIsCodeFullscreen(false);
                                                else handleCodeFullscreen();
                                              }}
                                              className="px-1.5 py-[1px] flex items-center rounded-md border hover:bg-white/[0.06] transition-colors"
                                              style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}
                                              title={isCodeFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                            >
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
                  );
                })()
              ) : currentFolder ? (
                (() => {
                  const cat = categoryColors[currentFolder.category];
                  return (
                <>
                  <div className={`flex items-center justify-between border-b border-border bg-secondary/50 px-5 py-2.5 border-l-2 ${cat.border}`}>
                    <nav className="flex items-center gap-1 min-w-0 font-mono text-[12px]">
                      <FolderOpen className={`h-3.5 w-3.5 shrink-0 ${cat.text}`} />
                      <span className="text-muted-foreground">spec</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <span className={`${cat.text} font-medium`}>{currentFolder.label}</span>
                    </nav>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className={`h-5 w-5 ${cat.text}`} />
                      <h3 className="font-heading text-sm font-semibold text-foreground">{currentFolder.label}</h3>
                      <span className={`rounded-full ${cat.bg} px-2 py-0.5 font-mono text-[10px] ${cat.text}`}>
                        {currentFolder.files.length} files
                      </span>
                      <span className={`rounded-full ${cat.bg} ${cat.text} px-2 py-0.5 text-[10px] font-medium flex items-center gap-1`}>
                        <Tag className="h-2.5 w-2.5" />
                        {cat.label}
                      </span>
                    </div>
                    <p className={`text-[12px] mb-1 ${cat.text} opacity-60`} style={{ fontFamily: "'Ubuntu Mono', monospace" }}>{currentFolder.path}/</p>
                    <p className="text-[12px] text-foreground/60 mb-5 leading-relaxed flex items-start gap-2">
                      <BookOpen className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${cat.text} opacity-50`} />
                      {currentFolder.description}
                    </p>
                     <div className="space-y-1">
                      {currentFolder.files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => handleFileClick(file)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[13px] transition-all cursor-pointer group border-l-2 ${
                            selectedFile?.path === file.path
                              ? `${cat.bg} ${cat.text} ${cat.border}`
                              : `border-l-transparent text-foreground/80 ${cat.fileBg} hover:text-foreground`
                          }`}
                        >
                          <FileCode2 className={`h-4 w-4 shrink-0 transition-colors ${selectedFile?.path === file.path ? cat.text : `${cat.iconColor} group-hover:${cat.text}`}`} />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate font-medium">{file.name}</span>
                            <span className={`text-[10px] opacity-50 truncate ${cat.text}`} style={{ fontFamily: "'Ubuntu Mono', monospace" }}>{file.path.split("/").pop()}</span>
                          </div>
                          <span className={`shrink-0 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity ${cat.text}`} style={{ fontFamily: "'Ubuntu Mono', monospace" }}>.md</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 opacity-20 mb-3" />
                  <p className="text-sm">Select a spec folder to browse</p>
                  <p className="text-[11px] mt-1 opacity-60">Click any folder to enter it and view its files</p>
                  {recentFiles.length > 0 && (
                    <div className="mt-6 w-full max-w-sm">
                      <div className="flex items-center gap-1.5 mb-2 px-1">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">Recent Files</span>
                      </div>
                      <div className="space-y-0.5">
                        {recentFiles.map((file) => (
                          <button
                            key={file.path}
                            onClick={() => handleFileClick(file)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[12px] transition-colors cursor-pointer text-foreground/70 hover:bg-accent hover:text-foreground group"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-info transition-colors" />
                            <span className="truncate">{file.name}</span>
                            <span className="ml-auto font-mono text-[9px] text-muted-foreground/50 truncate max-w-[120px]">{file.path.replace("spec/", "")}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        </>
      )}
    </section>
  );
});

SpecFileViewer.displayName = "SpecFileViewer";

export default SpecFileViewer;
