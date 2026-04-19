import dashboardData from "@/generated/dashboard-data.json";

const Timeline = () => (
  <section className="pb-12">
    <h2 className="mb-5 font-heading text-xs uppercase tracking-widest text-muted-foreground">
      Validation Timeline
    </h2>
    <div className="relative space-y-0 border-l-2 border-border/50 pl-6">
      {[
        { date: "2026-03-14", event: "Issue #18 closed — 18,900 remediations across 89 waves" },
        { date: "2026-03-18", event: `v30.0.0 baseline established — ${dashboardData.Links.Fixed}/${dashboardData.Links.Total} links verified, ${dashboardData.TotalModules}/${dashboardData.TotalModules} modules ${dashboardData.HealthGrade}` },
        { date: "2026-03-18", event: `Memory validation complete — 11 fixes, ${dashboardData.MemoryFiles} files across ${dashboardData.MemoryFolders} folders` },
        { date: dashboardData.GeneratedAt, event: `Dashboard auto-generated from spec tree scan — ${dashboardData.SpecFiles.toLocaleString()} files detected` },
      ].map((item, i) => (
        <div key={i} className="group relative pb-6 transition-transform duration-200 hover:translate-x-1">
          <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-success bg-background transition-all duration-300 group-hover:scale-125 group-hover:border-[hsl(var(--vscode-green))] group-hover:shadow-[0_0_8px_hsl(var(--vscode-green)/0.4)]" />
          <p className="font-mono text-xs text-muted-foreground transition-colors duration-200 group-hover:text-[hsl(var(--vscode-purple))]">{item.date}</p>
          <p className="mt-0.5 text-sm text-foreground transition-colors duration-200 group-hover:text-foreground/90">{item.event}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Timeline;
