import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
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
import { TablesPage } from "../features/tables/tables-page";
import { OrdersPage } from "../features/orders/orders-page";
import { CustomersPage } from "../features/customers/customers-page";
import { AnalyticsPage } from "../features/analytics/analytics-page";
import { LoyaltyPage } from "../features/loyalty/loyalty-page";
import { OffersPage } from "../features/offers/offers-page";
import { BillingPage } from "../features/billing/billing-page";
import { BranchesPage } from "../features/branches/branches-page";
import { NotFoundPage } from "../features/not-found/not-found-page";

// Customer pages are lazy-loaded so the scanned-QR experience (mobile, often
// slow connections) ships as a separate small chunk instead of the whole
// dashboard bundle (Phase 17 performance pass).
const CustomerMenuPage = lazy(() =>
  import("../features/customer-menu/customer-menu-page").then((m) => ({
    default: m.CustomerMenuPage,
  }))
);
const CustomerOrderPage = lazy(() =>
  import("../features/customer-menu/customer-order-page").then((m) => ({
    default: m.CustomerOrderPage,
  }))
);

function CustomerFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-warm px-6">
      <p className="text-sm text-text-secondary">Opening your table menu…</p>
    </div>
  );
}

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
              { path: "tables", element: <TablesPage /> },
              { path: "orders", element: <OrdersPage /> },
              { path: "customers", element: <CustomersPage /> },
              { path: "analytics", element: <AnalyticsPage /> },
              { path: "loyalty", element: <LoyaltyPage /> },
              { path: "offers", element: <OffersPage /> },
              { path: "billing", element: <BillingPage /> },
              { path: "branches", element: <BranchesPage /> },
            ],
          },
        ],
      },
      {
        // Public customer menu — no account required (PRD §customer-auth).
        path: "/q/:token",
        element: (
          <Suspense fallback={<CustomerFallback />}>
            <CustomerMenuPage />
          </Suspense>
        ),
      },
      {
        // Customer order tracking + review prompt (Phase 9).
        path: "/q/:token/order/:orderId",
        element: (
          <Suspense fallback={<CustomerFallback />}>
            <CustomerOrderPage />
          </Suspense>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
