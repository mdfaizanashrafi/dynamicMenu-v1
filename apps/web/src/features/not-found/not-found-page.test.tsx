import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "./not-found-page";

describe("NotFoundPage", () => {
  it("renders a not-found message", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Page not found")).toBeDefined();
  });
});
