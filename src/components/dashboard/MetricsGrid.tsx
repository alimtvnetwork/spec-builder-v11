import { Shield, CheckCircle, FileText, Link, Database, AlertTriangle } from "lucide-react";
import dashboardData from "@/generated/dashboard-data.json";

const healthMetrics = [
  { icon: Shield, label: "Health Score", value: dashboardData.HealthGrade, subvalue: `${dashboardData.HealthScore} / 100`, color: "text-success", glowColor: "group-hover:shadow-[0_0_20px_hsl(var(--vscode-green)/0.15)]" },
  { icon: Link, label: "Link Integrity", value: dashboardData.Links.Broken === 0 ? "100%" : `${Math.round((dashboardData.Links.Fixed / dashboardData.Links.Total) * 100)}%`, subvalue: `${dashboardData.Links.Fixed} verified · ${dashboardData.Links.Broken} remaining`, color: dashboardData.Links.Broken === 0 ? "text-success" : "text-warning", glowColor: dashboardData.Links.Broken === 0 ? "group-hover:shadow-[0_0_20px_hsl(var(--vscode-green)/0.15)]" : "group-hover:shadow-[0_0_20px_hsl(var(--vscode-orange)/0.15)]" },
  { icon: Database, label: "Modules", value: `${dashboardData.TotalModules}/${dashboardData.TotalModules}`, subvalue: "All passing", color: "text-success", glowColor: "group-hover:shadow-[0_0_20px_hsl(var(--vscode-green)/0.15)]" },
  { icon: FileText, label: "Spec Files", value: dashboardData.SpecFiles.toLocaleString(), subvalue: "Markdown documents", color: "text-info", glowColor: "group-hover:shadow-[0_0_20px_hsl(var(--vscode-blue)/0.15)]" },
  { icon: CheckCircle, label: "Remediations", value: "18,900+", subvalue: "89 waves complete", color: "text-success", glowColor: "group-hover:shadow-[0_0_20px_hsl(var(--vscode-green)/0.15)]" },
  { icon: AlertTriangle, label: "Open Issues", value: String(dashboardData.Links.Broken), subvalue: dashboardData.Links.Broken === 0 ? "Zero actionable" : `${dashboardData.Links.Broken} broken links`, color: dashboardData.Links.Broken === 0 ? "text-success" : "text-warning", glowColor: dashboardData.Links.Broken === 0 ? "group-hover:shadow-[0_0_20px_hsl(var(--vscode-green)/0.15)]" : "group-hover:shadow-[0_0_20px_hsl(var(--vscode-orange)/0.15)]" },
];

const MetricsGrid = () => (
  <section>
    <h2 className="mb-5 font-heading text-xs uppercase tracking-widest text-muted-foreground">
      Key Metrics
    </h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {healthMetrics.map((metric) => (
        <div
          key={metric.label}
          className={`group relative rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-border hover:-translate-y-1 ${metric.glowColor}`}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-[hsl(var(--vscode-blue)/0.03)] group-hover:to-transparent pointer-events-none" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <metric.icon className={`h-4 w-4 ${metric.color} transition-transform duration-300 group-hover:scale-110`} />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
                {metric.label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${metric.color} transition-transform duration-200 group-hover:translate-x-0.5`}>{metric.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{metric.subvalue}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default MetricsGrid;
