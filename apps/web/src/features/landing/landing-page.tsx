import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface-warm px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-text-primary">
        DynamicMenu
      </h1>
      <p className="max-w-md text-text-secondary">
        QR-based digital menus for restaurants. Create, customize, and publish
        themed menus your customers will love.
      </p>
      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="inline-flex h-11 items-center rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-hover"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  );
}
