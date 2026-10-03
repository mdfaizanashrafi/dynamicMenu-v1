import { MemoryRouter, Route, Routes } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGuard } from "./auth-guard";

const mocks = vi.hoisted(() => ({
  clerk: { isLoaded: true, isSignedIn: false },
  env: { clerkPublishableKey: undefined as string | undefined },
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    isLoaded: mocks.clerk.isLoaded,
    isSignedIn: mocks.clerk.isSignedIn,
  }),
  useUser: () => ({
    isLoaded: mocks.clerk.isLoaded,
    isSignedIn: mocks.clerk.isSignedIn,
  }),
}));

vi.mock("../../config/env", () => ({
  env: {
    get clerkPublishableKey() {
      return mocks.env.clerkPublishableKey;
    },
  },
}));

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route path="/private" element={<div>private content</div>} />
        </Route>
        <Route path="/sign-in" element={<div>sign in screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthGuard", () => {
  beforeEach(() => {
    mocks.env.clerkPublishableKey = "pk_test_dummy";
    mocks.clerk.isLoaded = true;
    mocks.clerk.isSignedIn = false;
  });

  afterEach(() => {
    cleanup();
  });

  it("shows setup instructions when Clerk is not configured", () => {
    mocks.env.clerkPublishableKey = undefined;

    renderGuard();

    expect(screen.getByText("Authentication not configured")).toBeDefined();
    expect(screen.queryByText("private content")).toBeNull();
  });

  it("shows a loading state while the session is being resolved", () => {
    mocks.clerk.isLoaded = false;

    renderGuard();

    expect(screen.getByText("Loading…")).toBeDefined();
    expect(screen.queryByText("private content")).toBeNull();
  });

  it("redirects signed-out visitors to /sign-in", () => {
    renderGuard();

    expect(screen.getByText("sign in screen")).toBeDefined();
    expect(screen.queryByText("private content")).toBeNull();
  });

  it("renders protected content for signed-in users", () => {
    mocks.clerk.isSignedIn = true;

    renderGuard();

    expect(screen.getByText("private content")).toBeDefined();
  });
});
