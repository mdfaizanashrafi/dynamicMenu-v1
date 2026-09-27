import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { createBrowserRouter } from "react-router-dom";
import { env } from "../config/env";
import { AppLayout } from "../components/layout/app-layout";
import { LandingPage } from "../features/landing/landing-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { CustomerMenuPage } from "../features/customer-menu/customer-menu-page";
import { NotFoundPage } from "../features/not-found/not-found-page";

const RootLayout = env.clerkPublishableKey
  ? ({ children }: { children: ReactNode }) => (
      <ClerkProvider publishableKey={env.clerkPublishableKey!}>
        {children}
      </ClerkProvider>
    )
  : ({ children }: { children: ReactNode }) => <>{children}</>;

function withAuth(element: ReactNode): ReactNode {
  // Protected-route guards land in Phase 1 with Clerk integration.
  return element;
}

export const router = createBrowserRouter([
  {
    element: (
      <RootLayout>
        <AppLayout />
      </RootLayout>
    ),
    children: [
      { path: "/", element: <LandingPage /> },
      {
        path: "/dashboard",
        element: withAuth(<DashboardPage />),
      },
      {
        path: "/q/:token",
        element: <CustomerMenuPage />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
