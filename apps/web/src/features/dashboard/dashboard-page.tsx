import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";

type Health = { status: string; database: string; timestamp: string };

export function DashboardPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Health>("/api/v1/health")
      .then(setHealth)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Unknown error")
      );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-2 text-text-secondary">
        Foundation check — API connectivity:
      </p>
      <div className="mt-4 rounded-card border border-border-default bg-surface-secondary p-4 font-mono text-sm">
        {error ? (
          <span className="text-error">API unreachable: {error}</span>
        ) : health ? (
          <span className="text-success">
            API status: {health.status} · database: {health.database}
          </span>
        ) : (
          <span className="text-text-secondary">Checking API…</span>
        )}
      </div>
    </div>
  );
}
