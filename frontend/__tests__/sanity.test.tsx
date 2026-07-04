import React from "react";
import { render, screen } from "@testing-library/react";

describe("Frontend Sanity Test", () => {
  it("verifies React Testing Library rendering and configuration", () => {
    render(<div data-testid="sanity">RentSure Platform Scaffold</div>);
    const element = screen.getByTestId("sanity");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("RentSure Platform Scaffold");
  });
});
