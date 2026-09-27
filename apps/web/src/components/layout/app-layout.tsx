import { Outlet } from "react-router-dom";

/** Shared chrome: header/sidebar composition lands with the dashboard (Phase 1+). */
export function AppLayout() {
  return (
    <main className="min-h-dvh bg-surface-primary">
      <Outlet />
    </main>
  );
}
