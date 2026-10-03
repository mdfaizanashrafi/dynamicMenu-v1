import { Outlet } from "react-router-dom";

/** Shared app chrome wrapping every route (dashboard supplies its own header/sidebar). */
export function AppLayout() {
  return (
    <main className="min-h-dvh bg-surface-primary">
      <Outlet />
    </main>
  );
}
