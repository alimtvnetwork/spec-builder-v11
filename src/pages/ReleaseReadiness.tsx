import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Shield,
  Server,
  Terminal,
  Package,
  RefreshCw,
  Monitor,
  Workflow,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type GateStatus = "passed" | "in-progress" | "blocked" | "not-started";

interface Criterion {
  id: string;
  label: string;
  status: GateStatus;
}

interface Gate {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  criteriaRange: string;
  required: string;
  criteria: Criterion[];
  dependsOn: string[];
}

const GATES: Gate[] = [
  {
    id: "G1",
    key: "backend",
    title: "Backend",
    description: "Core daemon lifecycle, OS hooks, browser tracking, screenshot capture, database, and API",
    icon: Server,
    criteriaRange: "AC-BE-01 – AC-BE-64",
    required: "All 64",
    dependsOn: [],
    criteria: [
      { id: "AC-BE-ARCH", label: "Daemon lifecycle, event bus, resource limits (12)", status: "not-started" },
      { id: "AC-BE-OS", label: "Window detection, click hooks, idle, autostart (10)", status: "not-started" },
      { id: "AC-BE-BROWSER", label: "Tab parsing, dwell time, URL categories, privacy (10)", status: "not-started" },
      { id: "AC-BE-SCREENSHOT", label: "Capture triggers, compression, blur, retention (10)", status: "not-started" },
      { id: "AC-BE-DB", label: "SQLite schema, WAL, migrations, cleanup (10)", status: "not-started" },
      { id: "AC-BE-API", label: "HTTP endpoints, CLI commands, export, pagination (12)", status: "not-started" },
    ],
  },
  {
    id: "G2",
    key: "integration",
    title: "CLI Integration",
    description: "Single binary delivery, first-run setup, e2e flow, privacy enforcement, and upgrade path",
    icon: Terminal,
    criteriaRange: "AC-CLI-01 – AC-CLI-14",
    required: "All 14",
    dependsOn: ["G1"],
    criteria: [
      { id: "AC-CLI-01", label: "Single binary with embedded UI assets", status: "not-started" },
      { id: "AC-CLI-02", label: "Zero external runtime dependencies", status: "not-started" },
      { id: "AC-CLI-03", label: "First-run config & database auto-creation", status: "not-started" },
      { id: "AC-CLI-04", label: "Comprehensive --help documentation", status: "not-started" },
      { id: "AC-CLI-05", label: "Cross-collector privacy exclusions", status: "not-started" },
      { id: "AC-CLI-06", label: "Idle detection state transitions", status: "not-started" },
      { id: "AC-CLI-07", label: "WAL-based crash recovery", status: "not-started" },
      { id: "AC-CLI-08", label: "End-to-end system flow verification", status: "not-started" },
    ],
  },
  {
    id: "G5",
    key: "cicd",
    title: "CI/CD",
    description: "Build pipeline, cross-compilation, versioning, and checksum verification",
    icon: Workflow,
    criteriaRange: "AC-DEPLOY-01 – AC-DEPLOY-10",
    required: "All 10",
    dependsOn: ["G2"],
    criteria: [
      { id: "AC-DEPLOY-BUILD", label: "CI/CD pipeline, cross-compilation, versioning, checksums (10)", status: "not-started" },
    ],
  },
  {
    id: "G3",
    key: "installers",
    title: "Platform Installers",
    description: "MSI, DEB/RPM, DMG, and platform-specific install/uninstall flows",
    icon: Package,
    criteriaRange: "AC-DEPLOY-11 – AC-DEPLOY-37",
    required: "Per platform",
    dependsOn: ["G5"],
    criteria: [
      { id: "AC-DEPLOY-WIN", label: "MSI, PATH, registry, silent install, Windows Service (9)", status: "not-started" },
      { id: "AC-DEPLOY-LIN", label: "DEB/RPM, systemd, AppImage, AUR, XDG (9)", status: "not-started" },
      { id: "AC-DEPLOY-MAC", label: "Homebrew, DMG, code signing, notarization, permissions (9)", status: "not-started" },
    ],
  },
  {
    id: "G4",
    key: "update",
    title: "Auto-Update",
    description: "Atomic binary replacement, rollback, version skip, and update channel selection",
    icon: RefreshCw,
    criteriaRange: "AC-DEPLOY-38 – AC-DEPLOY-46",
    required: "All 9",
    dependsOn: ["G5"],
    criteria: [
      { id: "AC-DEPLOY-UPDATE", label: "Auto-update, atomic replace, rollback, version skip (9)", status: "not-started" },
    ],
  },
  {
    id: "G6",
    key: "ui",
    title: "UI Frontend",
    description: "React architecture, component library, state management, dashboard, and deploy config",
    icon: Monitor,
    criteriaRange: "AC-UI-01 – AC-UI-50",
    required: "All 50",
    dependsOn: ["G3"],
    criteria: [
      { id: "AC-UI-ARCH", label: "Routing, API client, connection status, error handling (8)", status: "not-started" },
      { id: "AC-UI-COMP", label: "Theming, tables, charts, lightbox, keyboard, loading (8)", status: "not-started" },
      { id: "AC-UI-STATE", label: "Polling, caching, persistence, prefetch, optimistic updates (7)", status: "not-started" },
      { id: "AC-UI-DASH", label: "Stat cards, timeline, charts, gallery, reports, export (12)", status: "not-started" },
      { id: "AC-UI-PRIV", label: "Config CRUD, collector toggles, privacy, retention, deletion (8)", status: "not-started" },
      { id: "AC-UI-DEPLOY", label: "Embedded serving, cache headers, CSP, Vite proxy, bundle size (7)", status: "not-started" },
    ],
  },
  {
    id: "G7",
    key: "e2e",
    title: "End-to-End",
    description: "Full stack verification: daemon → API → UI dashboard",
    icon: Shield,
    criteriaRange: "AC-CLI-08",
    required: "AC-CLI-08",
    dependsOn: ["G6"],
    criteria: [
      { id: "AC-CLI-08-E2E", label: "Full stack: daemon → API → UI dashboard verified", status: "not-started" },
    ],
  },
];

const statusConfig: Record<GateStatus, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  "passed": { color: "text-[hsl(var(--vscode-green))]", bg: "bg-[hsl(var(--vscode-green)/0.12)]", border: "border-[hsl(var(--vscode-green)/0.3)]", label: "Passed", icon: CheckCircle2 },
  "in-progress": { color: "text-[hsl(var(--vscode-blue))]", bg: "bg-[hsl(var(--vscode-blue)/0.12)]", border: "border-[hsl(var(--vscode-blue)/0.3)]", label: "In Progress", icon: Clock },
  "blocked": { color: "text-[hsl(var(--vscode-red))]", bg: "bg-[hsl(var(--vscode-red)/0.12)]", border: "border-[hsl(var(--vscode-red)/0.3)]", label: "Blocked", icon: Lock },
  "not-started": { color: "text-muted-foreground", bg: "bg-muted/40", border: "border-border", label: "Not Started", icon: Circle },
};

function getGateStatus(gate: Gate, allGates: Gate[], statuses: Record<string, GateStatus>): GateStatus {
  const depsMet = gate.dependsOn.every((depId) => {
    const depGate = allGates.find((g) => g.id === depId);
    if (!depGate) return true;
    return getGateStatus(depGate, allGates, statuses) === "passed";
  });

  const criteriaStatuses = gate.criteria.map((c) => statuses[c.id] ?? c.status);
  const allPassed = criteriaStatuses.every((s) => s === "passed");
  const anyInProgress = criteriaStatuses.some((s) => s === "in-progress");

  if (allPassed) return "passed";
  if (!depsMet) return "blocked";
  if (anyInProgress) return "in-progress";
  return "not-started";
}

function GateCard({ gate, allGates, statuses, onToggleCriterion }: {
  gate: Gate;
  allGates: Gate[];
  statuses: Record<string, GateStatus>;
  onToggleCriterion: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const gateStatus = getGateStatus(gate, allGates, statuses);
  const cfg = statusConfig[gateStatus];
  const Icon = gate.icon;
  const passedCount = gate.criteria.filter((c) => (statuses[c.id] ?? c.status) === "passed").length;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} transition-all duration-300`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left"
      >
        <div className={`flex-shrink-0 rounded-md p-2.5 ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`h-5 w-5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs font-bold ${cfg.color}`}>{gate.id}</span>
            <h3 className="font-heading text-sm font-semibold text-foreground">{gate.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{gate.description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <span className={`text-xs font-mono font-semibold ${cfg.color}`}>
              {passedCount}/{gate.criteria.length}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${gateStatus === "passed" ? "bg-[hsl(var(--vscode-green))]" : gateStatus === "in-progress" ? "bg-[hsl(var(--vscode-blue))]" : "bg-muted-foreground/30"}`}
                style={{ width: `${gate.criteria.length > 0 ? (passedCount / gate.criteria.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-border/50 pt-3 space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {gate.criteriaRange}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Required: {gate.required}
            </span>
          </div>
          {gate.criteria.map((criterion) => {
            const cStatus = statuses[criterion.id] ?? criterion.status;
            const cCfg = statusConfig[cStatus];
            const CIcon = cCfg.icon;
            return (
              <button
                key={criterion.id}
                onClick={() => onToggleCriterion(criterion.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors text-left group"
              >
                <CIcon className={`h-4 w-4 flex-shrink-0 ${cCfg.color} transition-colors`} />
                <span className="font-mono text-[10px] text-muted-foreground w-24 flex-shrink-0">{criterion.id}</span>
                <span className="text-xs text-foreground/80 flex-1">{criterion.label}</span>
                <span className={`text-[10px] font-mono ${cCfg.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  click to toggle
                </span>
              </button>
            );
          })}
          {gate.dependsOn.length > 0 && (
            <div className="mt-3 pt-2 border-t border-border/30 flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Depends on: {gate.dependsOn.join(", ")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DependencyGraph() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Gate Dependencies</h3>
      <pre className="font-mono text-[11px] text-muted-foreground leading-relaxed">
{`G1 (Backend) ──► G2 (Integration) ──► G5 (CI/CD) ──► G3 (Installers)
                                         │                  │
                                         ▼                  ▼
                                    G4 (Update)        G6 (UI)
                                                          │
                                                          ▼
                                                     G7 (E2E)`}
      </pre>
    </div>
  );
}

const STATUS_CYCLE: GateStatus[] = ["not-started", "in-progress", "passed"];

export default function ReleaseReadiness() {
  const [statuses, setStatuses] = useState<Record<string, GateStatus>>({});

  const toggleCriterion = (id: string) => {
    setStatuses((prev) => {
      const current = prev[id] ?? "not-started";
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...prev, [id]: next };
    });
  };

  const totalCriteria = GATES.reduce((sum, g) => sum + g.criteria.length, 0);
  const passedCriteria = GATES.reduce(
    (sum, g) => sum + g.criteria.filter((c) => (statuses[c.id] ?? c.status) === "passed").length,
    0
  );
  const passedGates = GATES.filter((g) => getGateStatus(g, GATES, statuses) === "passed").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-8 py-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between">
            <div>
              <Link
                to="/"
                className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Health Dashboard
              </Link>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Time Log System
              </p>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Release Readiness
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                7-gate release checklist · 174 acceptance criteria
              </p>
            </div>
          </div>

          {/* Summary bar */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Gates Passed</p>
              <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                <span className={passedGates === 7 ? "text-[hsl(var(--vscode-green))]" : ""}>{passedGates}</span>
                <span className="text-muted-foreground text-lg"> / 7</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Criteria Passed</p>
              <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                <span className={passedCriteria === totalCriteria ? "text-[hsl(var(--vscode-green))]" : ""}>{passedCriteria}</span>
                <span className="text-muted-foreground text-lg"> / {totalCriteria}</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Overall</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${passedCriteria === totalCriteria ? "bg-[hsl(var(--vscode-green))]" : "bg-[hsl(var(--vscode-blue))]"}`}
                    style={{ width: `${totalCriteria > 0 ? (passedCriteria / totalCriteria) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-foreground">
                  {totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-4">
          {GATES.map((gate) => (
            <GateCard
              key={gate.id}
              gate={gate}
              allGates={GATES}
              statuses={statuses}
              onToggleCriterion={toggleCriterion}
            />
          ))}

          <DependencyGraph />
        </div>
      </main>
    </div>
  );
}
