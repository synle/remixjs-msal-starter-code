/** Smoke tests for the Loading component — covers default text, custom message, and both container variants. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./index";

describe("Loading", () => {
  it("renders the default 'Loading...' message when no children are provided", () => {
    render(<Loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the provided string message", () => {
    render(<Loading>Fetching data</Loading>);
    expect(screen.getByText("Fetching data")).toBeInTheDocument();
  });

  it("renders inside an Alert (info severity) by default", () => {
    const { container } = render(<Loading>Working</Loading>);
    // MUI Alert root has role="alert"
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it("renders inside a plain Box when containerType is 'box'", () => {
    const { container } = render(
      <Loading containerType="box">Working</Loading>
    );
    // No alert role when containerType is 'box'
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(screen.getByText("Working")).toBeInTheDocument();
  });
});
