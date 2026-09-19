import { Archive, Layers, Server, Terminal, Globe, Wrench, FlaskConical } from "lucide-react";
import dashboardData from "@/generated/dashboard-data.json";

type ModuleScore = { Module: string; Score: number | null; FileCount?: number };
type ModuleGroup = { Group: string; Range: string; Modules: ModuleScore[] };

const groupIcons: Record<string, React.ElementType> = {
  "Foundation": Layers,
  "Core System": Server,
  "Standards": Layers,
  "CLI Tool": Terminal,
  "WordPress": Globe,
  "Utility": Wrench,
  "Enforcement": FlaskConical,
};

const ModuleCard = ({ m }: { m: ModuleScore }) => {
  const hasScore = m.Score !== null;
  const isHealthy = hasScore && m.Score === 100;
  const scoreVal = m.Score ?? 0;
  const fileCount = m.FileCount ?? 0;
  return (
    <div
      className={`group rounded-lg border p-3 transition-all duration-300 hover:-translate-y-0.5 ${
        isHealthy
          ? "border-success/30 bg-success/5 hover:border-success/50 hover:shadow-[0_0_15px_hsl(var(--vscode-green)/0.1)]"
          : hasScore
            ? "border-warning/30 bg-warning/5 hover:border-warning/50 hover:shadow-[0_0_15px_hsl(var(--vscode-orange)/0.1)]"
            : "border-border/40 bg-card hover:border-border/60"
      }`}
    >
      <p className="font-mono text-[11px] font-medium text-foreground truncate transition-colors duration-200 group-hover:text-foreground" title={m.Module}>
        {m.Module}
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHealthy ? "bg-success" : hasScore ? "bg-warning" : "bg-muted-foreground/20"
          }`}
          style={{ width: `${hasScore ? scoreVal : 0}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-bold ${
            isHealthy ? "text-success" : hasScore ? "text-warning" : "text-muted-foreground/50"
          }`}
        >
          {hasScore ? `${m.Score}/100` : "No report"}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </span>
      </div>
    </div>
  );
};

const ModuleGrid = () => {
  const groups = dashboardData.ModuleGroups as ModuleGroup[];
  const allModules = groups.flatMap(g => g.Modules);
  const scored = allModules.filter(m => m.Score !== null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.Score!, 0) / scored.length) : 0;
  const totalFiles = allModules.reduce((a, b) => a + (b.FileCount ?? 0), 0);

  return (
    <section>
      <h2 className="mb-5 font-heading text-xs uppercase tracking-widest text-muted-foreground">
        <Archive className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        Module Health &amp; Groupings
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5 rounded-xl border border-border/50 bg-card p-4">
        {[
          { label: "Total Modules", value: String(allModules.length), color: "text-foreground" },
          { label: "Groups", value: String(groups.length), color: "text-info" },
          { label: "Scored", value: String(scored.length), color: "text-success" },
          { label: "Avg Score", value: scored.length > 0 ? `${avgScore}/100` : "—", color: avgScore === 100 ? "text-success" : avgScore >= 80 ? "text-warning" : "text-destructive" },
          { label: "Total Files", value: totalFiles.toLocaleString(), color: "text-info" },
        ].map((stat) => (
          <div key={stat.label} className="group transition-transform duration-200 hover:translate-x-0.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className={`mt-0.5 font-mono text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {groups.map(group => {
        const Icon = groupIcons[group.Group] ?? Layers;
        const groupFiles = group.Modules.reduce((a, b) => a + (b.FileCount ?? 0), 0);
        return (
          <div key={group.Group} className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                {group.Group}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                {group.Range}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {group.Modules.length} modules · {groupFiles} files
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {group.Modules.map(m => <ModuleCard key={m.Module} m={m} />)}
            </div>
          </div>
        );
      })}

      <div className="mt-3 rounded-lg border border-border/40 bg-secondary/30 px-4 py-3 transition-colors duration-200 hover:bg-secondary/40">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Known Deferred Debt</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ~1,399 spec-level Go code example violations (tuple-return signatures + HTTP method magic strings across 7 CLIs) — intentionally deferred until Go backend implementation begins.
          <span className="ml-1 font-mono text-[10px] text-muted-foreground/50">
            See: 02-spec/61-how-app-issues-track/07-magic-string-tuple-return-audit.md
          </span>
        </p>
      </div>
    </section>
  );
};

export default ModuleGrid;
