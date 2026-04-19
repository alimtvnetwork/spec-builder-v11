import { useState, useMemo } from "react";
import { ClipboardList, ArrowUpDown } from "lucide-react";
import dashboardData from "@/generated/dashboard-data.json";

type ReportSortKey = "date" | "title" | "cert";
type ReportFilter = "all" | "certified" | "uncertified";

const ReportsTable = () => {
  const [reportSort, setReportSort] = useState<ReportSortKey>("date");
  const [reportSortAsc, setReportSortAsc] = useState(false);
  const [reportFilter, setReportFilter] = useState<ReportFilter>("all");

  const filteredReports = useMemo(() => {
    type Report = { File: string; Title: string; Date: string; CertId: string | null };
    let reports: Report[] = [...dashboardData.ValidationReports];
    if (reportFilter === "certified") reports = reports.filter((r) => r.CertId);
    if (reportFilter === "uncertified") reports = reports.filter((r) => !r.CertId);
    reports.sort((a, b) => {
      let cmp = 0;
      if (reportSort === "date") {
        const da = a.Date === "Unknown" ? "0000-00-00" : a.Date;
        const db = b.Date === "Unknown" ? "0000-00-00" : b.Date;
        cmp = da.localeCompare(db);
      } else if (reportSort === "title") {
        cmp = a.Title.localeCompare(b.Title);
      } else {
        cmp = (a.CertId || "").localeCompare(b.CertId || "");
      }
      return reportSortAsc ? cmp : -cmp;
    });
    return reports;
  }, [reportSort, reportSortAsc, reportFilter]);

  const toggleReportSort = (key: ReportSortKey) => {
    if (reportSort === key) setReportSortAsc((p) => !p);
    else { setReportSort(key); setReportSortAsc(true); }
  };

  return (
    <section>
      <h2 className="mb-5 font-heading text-xs uppercase tracking-widest text-muted-foreground">
        <ClipboardList className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        Validation Reports
      </h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-secondary/30 p-0.5">
          {(["all", "certified", "uncertified"] as ReportFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setReportFilter(f)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                reportFilter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              {f === "all" ? "All" : f === "certified" ? "Certified" : "No Certificate"}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground ml-auto">
          {filteredReports.length} of {dashboardData.ValidationReports.length} reports
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th
                onClick={() => toggleReportSort("title")}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
              >
                <span className="inline-flex items-center gap-1">Report <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th
                onClick={() => toggleReportSort("date")}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
              >
                <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th
                onClick={() => toggleReportSort("cert")}
                className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
              >
                <span className="inline-flex items-center gap-1 justify-end">Certificate <ArrowUpDown className="h-3 w-3" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r, i) => (
              <tr
                key={r.File}
                className={`transition-all duration-200 hover:bg-[hsl(var(--vscode-blue)/0.04)] hover:shadow-[inset_3px_0_0_hsl(var(--vscode-blue)/0.4)] ${i < filteredReports.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-foreground text-sm truncate max-w-xs lg:max-w-md">{r.Title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60">{r.File}</p>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{r.Date}</td>
                <td className="px-4 py-2.5 text-right">
                  {r.CertId ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {r.CertId}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReportsTable;
