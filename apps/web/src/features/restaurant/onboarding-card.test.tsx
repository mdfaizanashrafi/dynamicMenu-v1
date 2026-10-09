import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnboardingCard } from "./onboarding-card";
import type { OnboardingProgress } from "./restaurant.types";

function renderCard(onboarding: OnboardingProgress) {
  return render(
    <MemoryRouter>
      <OnboardingCard onboarding={onboarding} />
    </MemoryRouter>
  );
}

const progress: OnboardingProgress = {
  steps: [
    { key: "identity", label: "Restaurant name", completed: true },
    { key: "profile", label: "Cuisine & description", completed: false },
    { key: "contact", label: "Contact details", completed: false },
    { key: "address", label: "Address", completed: false },
    { key: "logo", label: "Logo", completed: false },
    { key: "maps", label: "Google Maps link", completed: false },
    { key: "menu", label: "First menu published", completed: false },
    { key: "tables", label: "Tables with QR codes", completed: false },
  ],
  completedCount: 1,
  total: 8,
};

describe("OnboardingCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the completion count and progress bar", () => {
    renderCard(progress);

    expect(screen.getByText("1 of 8 · 13%")).toBeDefined();
    expect(screen.getByRole("progressbar")).toBeDefined();
  });

  it("links incomplete steps to the settings page", () => {
    renderCard(progress);

    const link = screen.getByRole("link", { name: "Google Maps link" });
    expect(link.getAttribute("href")).toBe("/dashboard/settings#maps");
    // Completed steps are plain text, not links.
    expect(screen.queryByRole("link", { name: "Restaurant name" })).toBeNull();
  });

  it("shows 100% when everything is complete", () => {
    const done: OnboardingProgress = {
      ...progress,
      completedCount: 8,
      steps: progress.steps.map((s) => ({ ...s, completed: true })),
    };
    renderCard(done);

    expect(screen.getByText("8 of 8 · 100%")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
