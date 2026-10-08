import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { createBrowserRouter } from "react-router-dom";
import { env } from "../config/env";
import { AppLayout } from "../components/layout/app-layout";
import { AuthGuard } from "../components/layout/auth-guard";
import { LandingPage } from "../features/landing/landing-page";
import { SignInPage } from "../features/auth/sign-in-page";
import { SignUpPage } from "../features/auth/sign-up-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { DashboardOverviewPage } from "../features/dashboard/dashboard-overview";
import { RestaurantSettingsPage } from "../features/restaurant/restaurant-settings-page";
import { MenusPage } from "../features/menus/menus-page";
import { MenuBuilderPage } from "../features/menus/menu-builder-page";
import { ThemesPage } from "../features/themes/themes-page";
import { CustomerMenuPage } from "../features/customer-menu/customer-menu-page";
import { NotFoundPage } from "../features/not-found/not-found-page";

const RootLayout = env.clerkPublishableKey
  ? ({ children }: { children: ReactNode }) => (
      <ClerkProvider publishableKey={env.clerkPublishableKey!}>
        {children}
      </ClerkProvider>
    )
  : ({ children }: { children: ReactNode }) => <>{children}</>;

export const router = createBrowserRouter([
  {
    element: (
      <RootLayout>
        <AppLayout />
      </RootLayout>
    ),
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
      {
        // Protected dashboard routes: require an authenticated session.
        element: <AuthGuard />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
            children: [
              { index: true, element: <DashboardOverviewPage /> },
              {
                path: "settings",
                element: <RestaurantSettingsPage />,
              },
              { path: "menus", element: <MenusPage /> },
              { path: "menus/:menuId", element: <MenuBuilderPage /> },
              { path: "themes", element: <ThemesPage /> },
            ],
          },
        ],
      },
      {
        // Public customer menu — no account required (PRD §customer-auth).
        path: "/q/:token",
        element: <CustomerMenuPage />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
