import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import ModuleGrid from "../ModuleGrid";
import dashboardData from "@/generated/dashboard-data.json";

const allModules = dashboardData.ModuleGroups.flatMap(g => g.Modules);

describe("ModuleGrid", () => {
  it("TestModuleGrid_Render_DisplaysTotalModuleCount", () => {
    render(<ModuleGrid />);
    const totalEls = screen.getAllByText(String(allModules.length));
    expect(totalEls.length).toBeGreaterThanOrEqual(1);
  });

  it("TestModuleGrid_Render_DisplaysAllModuleNames", () => {
    render(<ModuleGrid />);
    allModules.forEach((m) => {
      expect(screen.getByText(m.Module)).toBeInTheDocument();
    });
  });

  it("TestModuleGrid_Render_DisplaysSectionHeading", () => {
    render(<ModuleGrid />);
    expect(screen.getByText(/Module Health/)).toBeInTheDocument();
  });

  it("TestModuleGrid_Render_DisplaysTotalFileCount", () => {
    const totalFiles = allModules.reduce((a, b) => a + (b.FileCount ?? 0), 0);
    render(<ModuleGrid />);
    expect(screen.getByText(totalFiles.toLocaleString())).toBeInTheDocument();
  });

  it("TestModuleGrid_Render_DisplaysAllGroupNames", () => {
    render(<ModuleGrid />);
    dashboardData.ModuleGroups.forEach((g) => {
      expect(screen.getByText(g.Group)).toBeInTheDocument();
    });
  });
});
