import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, RefreshCw, Shield, ExternalLink, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import dashboardData from "@/generated/dashboard-data.json";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import CertificateCards, { type CertificateCardsHandle } from "@/components/dashboard/CertificateCard";
import ReportsTable from "@/components/dashboard/ReportsTable";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import ComplianceTable from "@/components/dashboard/ComplianceTable";
import Timeline from "@/components/dashboard/Timeline";
import SpecFileViewer, { type SpecFileViewerHandle } from "@/components/dashboard/SpecFileViewer";

const sections = [
  { id: "metrics", label: "Key Metrics" },
  { id: "spec-viewer", label: "Spec Files" },
  { id: "certificates", label: "Certificates" },
  { id: "compliance", label: "Compliance" },
  { id: "reports", label: "Reports" },
  { id: "modules", label: "Modules" },
  { id: "timeline", label: "Timeline" },
];

const Index = () => {
  const specViewerRef = useRef<SpecFileViewerHandle>(null);
  const certCardsRef = useRef<CertificateCardsHandle>(null);
  const [activeSection, setActiveSection] = useState("");

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const entries = new Map<string, boolean>();

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          entries.set(id, entry.isIntersecting);
          // Pick first visible section
          for (const s of sections) {
            if (entries.get(s.id)) { setActiveSection(s.id); break; }
          }
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <header className="border-b border-border/50 px-8 py-10 lg:px-12 bg-gradient-to-b from-[hsl(var(--vscode-blue)/0.03)] to-transparent">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Project Governance
              </p>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Health Dashboard
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Baseline v30.0.0</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-success/20 bg-success/5 transition-all duration-300 hover:border-success/40 hover:shadow-[0_0_20px_hsl(var(--vscode-green)/0.15)]">
                  <span className="font-heading text-2xl font-bold text-success">{dashboardData.HealthGrade}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Scanned {dashboardData.GeneratedAt}
                </span>
                <button
                  onClick={() => {
                    toast.info("Rescan triggered", {
                      description: "Run `node scripts/generate-dashboard-data.cjs` or restart the dev server to regenerate metrics.",
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:border-border cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Rescan
                </button>
                <Link
                  to="/release-readiness"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--vscode-purple)/0.3)] bg-[hsl(var(--vscode-purple)/0.08)] px-3 py-1.5 text-[11px] font-medium text-[hsl(var(--vscode-purple))] transition-all duration-200 hover:bg-[hsl(var(--vscode-purple)/0.15)] hover:border-[hsl(var(--vscode-purple)/0.5)] hover:shadow-[0_0_12px_hsl(var(--vscode-purple)/0.1)]"
                >
                  <Shield className="h-3 w-3" />
                  Release Readiness
                </Link>
              </div>
            </div>
          </div>

          {/* Section nav pills */}
          <nav className="mt-6 flex items-center gap-1 overflow-x-auto pb-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                  activeSection === s.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10 lg:px-12 space-y-12">
        <section id="metrics" className="scroll-mt-24">
          <MetricsGrid />
        </section>
        <section id="spec-viewer" className="scroll-mt-24">
          <div className="flex items-center gap-3">
            <SpecFileViewer ref={specViewerRef} onCategoryClick={(cat) => certCardsRef.current?.highlightByCategory(cat)} />
            <Link
              to="/spec"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 self-start mt-1"
              style={{ fontFamily: "'Ubuntu Mono', monospace" }}
            >
              <ExternalLink className="h-3 w-3" />
              Open Full Spec Browser
            </Link>
          </div>
        </section>
        <section id="certificates" className="scroll-mt-24">
          <CertificateCards ref={certCardsRef} onCategoryClick={(cat) => specViewerRef.current?.filterByCategory(cat)} />
        </section>
        <section id="compliance" className="scroll-mt-24">
          <ComplianceTable />
        </section>
        <section id="reports" className="scroll-mt-24">
          <ReportsTable />
        </section>
        <section id="modules" className="scroll-mt-24">
          <ModuleGrid />
        </section>
        <section id="timeline" className="scroll-mt-24">
          <Timeline />
        </section>
      </main>

      <footer className="border-t border-border/50 px-8 py-8 lg:px-12 bg-gradient-to-t from-[hsl(var(--vscode-blue)/0.02)] to-transparent">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-mono text-[11px] text-muted-foreground/50">
            Project Governance Dashboard · Baseline v30.0.0 · Auto-generated {dashboardData.GeneratedAt}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
