import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import dashboardData from "@/generated/dashboard-data.json";

type SpecCategory = "foundation" | "core" | "cli" | "wordpress" | "standards" | "utilities" | "enforcement";

const categoryColors: Record<SpecCategory, { bg: string; text: string; label: string }> = {
  foundation: { bg: "bg-info/10", text: "text-info", label: "Foundation" },
  core: { bg: "bg-primary/10", text: "text-primary", label: "Core System" },
  cli: { bg: "bg-success/10", text: "text-success", label: "CLI Tool" },
  wordpress: { bg: "bg-warning/10", text: "text-warning", label: "WordPress" },
  standards: { bg: "bg-secondary", text: "text-foreground/70", label: "Standards" },
  utilities: { bg: "bg-accent", text: "text-accent-foreground", label: "Utility" },
  enforcement: { bg: "bg-destructive/10", text: "text-destructive", label: "Enforcement" },
};

interface CertificateData {
  id: string;
  title: string;
  date: string;
  status: "passed";
  metrics: { label: string; value: string }[];
  description: string;
  location: string;
  relatedCategories: SpecCategory[];
  details: {
    scope: string;
    categories: string[];
    approach: string;
    signedBy: string;
    notes: string;
  };
}

const certificates: CertificateData[] = [
  {
    id: "CERT-2026-0314-ISS18",
    title: "Issue #18 — Standards Remediation",
    date: "2026-03-14",
    status: "passed",
    metrics: [
      { label: "Violations Remediated", value: "~18,900" },
      { label: "Remediation Waves", value: "89" },
      { label: "Files in Scope", value: "1,164" },
      { label: "Categories", value: "9" },
    ],
    description: "Project-wide code standards enforcement across context naming, error handling, return signatures, filesystem access, boolean logic, type safety, abbreviation casing, and structural consistency.",
    location: "spec/validation-reports/05-completion-certificate-issue-18.md",
    relatedCategories: ["standards", "enforcement", "foundation"],
    details: {
      scope: "1,164 files across 9 categories",
      categories: ["Context Naming", "Error Handling", "Return Signatures", "Filesystem Access", "Boolean Logic", "Type Safety", "Abbreviation Casing", "Structural Consistency", "General Standards"],
      approach: "Automated 89-wave remediation with manual review gates between each wave.",
      signedBy: "Project Governance · Automated Validator",
      notes: "Largest single remediation effort in project history. Zero regressions detected post-completion.",
    },
  },
  {
    id: "CERT-2026-0318-REFRESH",
    title: "v30.0.0 — Spec Tree Consistency",
    date: "2026-03-18",
    status: "passed",
    metrics: [
      { label: "Broken Links Fixed", value: `${dashboardData.Links.Fixed}/${dashboardData.Links.Total}` },
      { label: "Modules Verified", value: `${dashboardData.TotalModules}/${dashboardData.TotalModules}` },
      { label: "Markdown Files", value: dashboardData.SpecFiles.toLocaleString() },
      { label: "Health Score", value: `${dashboardData.HealthScore}/100` },
    ],
    description: "Full specification tree validation — cross-reference integrity, consistency report accuracy, and master index health dashboard refresh to v30.0.0 baseline.",
    location: "spec/validation-reports/14-audit-certificate-2026-03-18.md",
    relatedCategories: ["foundation", "core"],
    details: {
      scope: `${dashboardData.SpecFiles.toLocaleString()} markdown files across ${dashboardData.TotalModules} modules`,
      categories: ["Cross-Reference Integrity", "Consistency Report Accuracy", "Master Index Health", "Module Version Alignment"],
      approach: "Full-tree link scan with automated fix-and-verify cycle. Each module independently validated.",
      signedBy: "Project Governance · Spec Validator",
      notes: `Established v30.0.0 as the canonical baseline. ${dashboardData.Links.Broken} broken links remaining.`,
    },
  },
  {
    id: "CERT-2026-0318-MEMORY",
    title: "Memory Validation — Institutional Knowledge",
    date: "2026-03-18",
    status: "passed",
    metrics: [
      { label: "Memory Files", value: String(dashboardData.MemoryFiles) },
      { label: "Folders", value: String(dashboardData.MemoryFolders) },
      { label: "Issues Found & Fixed", value: "11" },
      { label: "Links Validated", value: "364" },
    ],
    description: "Complete structural validation of .lovable/memories/ — broken link remediation, naming convention enforcement, and cross-reference integrity across the institutional memory tree.",
    location: ".lovable/memories/workflow/completed/2026-03-18-memory-validation-certificate.md",
    relatedCategories: ["foundation", "utilities"],
    details: {
      scope: `${dashboardData.MemoryFiles} memory files across ${dashboardData.MemoryFolders} folders`,
      categories: ["Broken Link Remediation", "Naming Convention Enforcement", "Cross-Reference Integrity", "Index Count Accuracy"],
      approach: "Recursive directory scan with path verification and naming pattern checks.",
      signedBy: "Project Governance · Memory Validator",
      notes: "11 issues discovered and fixed in-place. Final index counts corrected (Workflow: 16→17, QA: 2→3).",
    },
  },
];

const StatusBadge = ({ status }: { status: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
    {status === "passed" ? "PASSED" : status}
  </span>
);

export interface CertificateCardsHandle {
  highlightByCategory: (category: SpecCategory) => void;
}

interface CertificateCardsProps {
  onCategoryClick?: (category: SpecCategory) => void;
}

const CertificateCards = forwardRef<CertificateCardsHandle, CertificateCardsProps>(({ onCategoryClick }, ref) => {
  const [expandedCerts, setExpandedCerts] = useState<Set<string>>(new Set());
  const [highlightedCategory, setHighlightedCategory] = useState<SpecCategory | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    highlightByCategory: (category: SpecCategory) => {
      const colors = categoryColors[category];
      const matchCount = certificates.filter((c) => c.relatedCategories.includes(category)).length;
      setHighlightedCategory(category);
      toast.info(`Highlighting ${colors.label} certificates`, {
        description: `${matchCount} certificate${matchCount !== 1 ? "s" : ""} match this category`,
      });
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      setTimeout(() => setHighlightedCategory(null), 3000);
    },
  }));

  const toggleCert = (id: string) => {
    setExpandedCerts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section ref={sectionRef}>
      <h2 className="mb-5 font-heading text-xs uppercase tracking-widest text-muted-foreground">
        Formal Certificates
      </h2>
      <div className="space-y-4">
        {certificates.map((cert) => {
          const isExpanded = expandedCerts.has(cert.id);
          const isHighlighted = highlightedCategory && cert.relatedCategories.includes(highlightedCategory);
          return (
            <div
              key={cert.id}
              className={`overflow-hidden rounded-xl border bg-card transition-all hover:border-border ${
                isHighlighted
                  ? "border-info ring-2 ring-info/30 shadow-lg shadow-info/10"
                  : "border-border/50"
              }`}
            >
              <button
                onClick={() => toggleCert(cert.id)}
                className="w-full text-left flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {cert.id}
                    </code>
                    <StatusBadge status={cert.status} />
                    <span className="text-xs text-muted-foreground">{cert.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{cert.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {cert.description}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60 break-all">
                    📄 {cert.location}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cert.relatedCategories.map((cat) => {
                      const color = categoryColors[cat];
                      return (
                        <button
                          key={cat}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick?.(cat);
                          }}
                          className={`rounded-full ${color.bg} ${color.text} px-2 py-0.5 text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                          title={`View ${color.label} spec files`}
                        >
                          {color.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              <div className="grid grid-cols-2 gap-px border-t border-border/50 bg-border/30 sm:grid-cols-4">
                {cert.metrics.map((m) => (
                  <div key={m.label} className="bg-card px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-border/50 bg-secondary/30 px-5 py-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scope</p>
                        <p className="mt-0.5 text-sm text-foreground">{cert.details.scope}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Signed By</p>
                        <p className="mt-0.5 text-sm text-foreground">{cert.details.signedBy}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approach</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{cert.details.approach}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cert.details.categories.map((cat) => (
                          <span key={cat} className="rounded-full bg-info/10 px-2.5 py-0.5 text-[11px] font-medium text-info">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg bg-success/5 border border-success/10 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-success mb-0.5">Notes</p>
                      <p className="text-sm text-muted-foreground">{cert.details.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

CertificateCards.displayName = "CertificateCards";

export default CertificateCards;
