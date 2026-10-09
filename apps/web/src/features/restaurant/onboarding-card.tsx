import { Link } from "react-router-dom";
import type { OnboardingProgress } from "./restaurant.types";

interface Props {
  onboarding: OnboardingProgress;
}

/**
 * Setup checklist shown on the dashboard overview (DESIGN.md §9 step 2).
 * Incomplete steps link to the matching section of the settings page so the
 * owner can continue where they left off.
 */
export function OnboardingCard({ onboarding }: Props) {
  const percent = Math.round(
    (onboarding.completedCount / onboarding.total) * 100
  );

  return (
    <section className="rounded-card border border-border-default bg-surface-primary p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Restaurant setup
        </h2>
        <span className="text-sm font-medium text-text-secondary">
          {onboarding.completedCount} of {onboarding.total} · {percent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-secondary"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {onboarding.steps.map((step) => {
          const target =
            step.key === "menu"
              ? "/dashboard/menus"
              : step.key === "tables"
                ? "/dashboard/tables"
                : `/dashboard/settings#${step.key}`;
          return (
            <li key={step.key} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className={
                  step.completed ? "text-success" : "text-text-secondary"
                }
              >
                {step.completed ? "✓" : "○"}
              </span>
              {step.completed ? (
                <span className="text-text-secondary">{step.label}</span>
              ) : (
                <Link
                  to={target}
                  className="font-medium text-brand-primary hover:text-brand-primary-hover"
                >
                  {step.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
