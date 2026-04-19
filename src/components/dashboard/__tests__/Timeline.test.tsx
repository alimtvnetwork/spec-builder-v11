import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import Timeline from "../Timeline";
import dashboardData from "@/generated/dashboard-data.json";

describe("Timeline", () => {
  it("TestTimeline_Render_DisplaysGeneratedDate", () => {
    render(<Timeline />);
    expect(screen.getByText(dashboardData.GeneratedAt)).toBeInTheDocument();
  });

  it("TestTimeline_Render_DisplaysSectionHeading", () => {
    render(<Timeline />);
    expect(screen.getByText("Validation Timeline")).toBeInTheDocument();
  });

  it("TestTimeline_Render_DisplaysSpecFileCount", () => {
    render(<Timeline />);
    expect(
      screen.getByText(new RegExp(`${dashboardData.SpecFiles.toLocaleString()} files detected`))
    ).toBeInTheDocument();
  });
});
