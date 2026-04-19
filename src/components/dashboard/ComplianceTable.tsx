import dashboardData from "@/generated/dashboard-data.json";

const ComplianceTable = () => (
  <section>
    <h2 className="mb-5 font-heading text-xs uppercase tracking-widest text-muted-foreground">
      CLI Compliance Audits
    </h2>
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-secondary/30">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tool</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Audit Date</th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance</th>
          </tr>
        </thead>
        <tbody>
          {dashboardData.ComplianceTools.map((tool, i) => (
            <tr
              key={tool.Tool}
              className={`transition-all duration-200 hover:bg-[hsl(var(--vscode-blue)/0.04)] hover:shadow-[inset_3px_0_0_hsl(var(--vscode-blue)/0.4)] ${i < dashboardData.ComplianceTools.length - 1 ? "border-b border-border/30" : ""}`}
            >
              <td className="px-4 py-2.5 font-medium text-foreground">{tool.Tool}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tool.Date}</td>
              <td className="px-4 py-2.5 text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 font-mono text-xs font-bold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  {tool.Status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default ComplianceTable;
