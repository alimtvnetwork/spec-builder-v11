import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import ComplianceTable from "../ComplianceTable";
import dashboardData from "@/generated/dashboard-data.json";

describe("ComplianceTable", () => {
  it("TestComplianceTable_Render_DisplaysAllToolNames", () => {
    render(<ComplianceTable />);
    dashboardData.ComplianceTools.forEach((tool) => {
      expect(screen.getByText(tool.Tool)).toBeInTheDocument();
    });
  });

  it("TestComplianceTable_Render_DisplaysComplianceStatus", () => {
    render(<ComplianceTable />);
    const statusCells = screen.getAllByText("100%");
    expect(statusCells.length).toBe(dashboardData.ComplianceTools.length);
  });

  it("TestComplianceTable_Render_DisplaysSectionHeading", () => {
    render(<ComplianceTable />);
    expect(screen.getByText("CLI Compliance Audits")).toBeInTheDocument();
  });
});
