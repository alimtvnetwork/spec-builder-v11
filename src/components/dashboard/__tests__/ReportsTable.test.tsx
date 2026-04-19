import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";
import ReportsTable from "../ReportsTable";
import dashboardData from "@/generated/dashboard-data.json";

describe("ReportsTable", () => {
  it("TestReportsTable_Render_DisplaysAllReportTitles", () => {
    render(<ReportsTable />);
    dashboardData.ValidationReports.forEach((r) => {
      expect(screen.getByText(r.Title)).toBeInTheDocument();
    });
  });

  it("TestReportsTable_Render_DisplaysReportCount", () => {
    render(<ReportsTable />);
    const count = dashboardData.ValidationReports.length;
    expect(screen.getByText(`${count} of ${count} reports`)).toBeInTheDocument();
  });

  it("TestReportsTable_FilterCertified_ShowsOnlyCertified", async () => {
    const user = userEvent.setup();
    render(<ReportsTable />);

    await user.click(screen.getByText("Certified"));

    const certified = dashboardData.ValidationReports.filter((r) => r.CertId);
    const total = dashboardData.ValidationReports.length;
    expect(screen.getByText(`${certified.length} of ${total} reports`)).toBeInTheDocument();
  });

  it("TestReportsTable_Render_DisplaysCertIds", () => {
    render(<ReportsTable />);
    dashboardData.ValidationReports.forEach((r) => {
      if (r.CertId) {
        expect(screen.getByText(r.CertId)).toBeInTheDocument();
      }
    });
  });
});
