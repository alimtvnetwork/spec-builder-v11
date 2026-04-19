import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import MetricsGrid from "../MetricsGrid";
import dashboardData from "@/generated/dashboard-data.json";

describe("MetricsGrid", () => {
  it("TestMetricsGrid_Render_DisplaysHealthGrade", () => {
    render(<MetricsGrid />);
    expect(screen.getByText(dashboardData.HealthGrade)).toBeInTheDocument();
  });

  it("TestMetricsGrid_Render_DisplaysSpecFileCount", () => {
    render(<MetricsGrid />);
    expect(screen.getByText(dashboardData.SpecFiles.toLocaleString())).toBeInTheDocument();
  });

  it("TestMetricsGrid_Render_DisplaysAllMetricLabels", () => {
    render(<MetricsGrid />);
    const labels = ["Health Score", "Link Integrity", "Modules", "Spec Files", "Remediations", "Open Issues"];
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("TestMetricsGrid_Render_DisplaysBrokenLinkCount", () => {
    render(<MetricsGrid />);
    expect(screen.getByText(String(dashboardData.Links.Broken))).toBeInTheDocument();
  });
});
