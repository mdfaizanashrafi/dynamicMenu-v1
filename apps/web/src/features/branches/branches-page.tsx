import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";

interface Branch {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  _count: { tables: number; menus: number };
}

/** /dashboard/branches — multi-branch management (PHASES.md §19). */
export function BranchesPage() {
  const { getToken } = useAuth();
  const { current, memberships } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const isOwner = current?.role === "OWNER";
  const isRoot = !current?.restaurant.parentId;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId || !isRoot) return;
    try {
      const token = await getToken();
      const data = await apiFetch<Branch[]>(
        `/api/v1/restaurants/${restaurantId}/branches`,
        { token }
      );
      setBranches(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isRoot, getToken]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setBusy(true);
    setNotice(null);
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/restaurants/${restaurantId}/branches`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
        token,
      });
      setNotice(`Branch “${name.trim()}” created — switch to it from the restaurant picker.`);
      setName("");
      setSlug("");
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  if (!isRoot) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-text-primary">Branches</h1>
        <p className="text-sm text-text-secondary">
          “{current.restaurant.name}” is a branch. Switch to the main restaurant
          (from the picker) to manage branches.
        </p>
      </div>
    );
  }

  const rootCount = memberships.filter((m) => !m.restaurant.parentId).length;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Branches</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Each branch gets its own menus, tables, QR codes, orders, and staff —
          data stays isolated per branch, and your plan covers the whole
          organization.
        </p>
      </section>

      {isOwner && (
        <form
          onSubmit={create}
          className="flex flex-wrap items-end gap-3 rounded-card border border-border-default bg-surface-primary p-4"
        >
          <label className="block text-sm font-medium text-text-primary">
            Branch name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Downtown"
              className="mt-1 h-11 w-56 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="block text-sm font-medium text-text-primary">
            URL slug
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="downtown"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Lowercase letters, numbers, hyphens"
              className="mt-1 h-11 w-56 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {busy ? "Creating…" : "Add branch"}
          </button>
          {notice && <p className="w-full text-sm text-text-secondary">{notice}</p>}
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-secondary">Loading branches…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : branches.length === 0 ? (
        <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
          <p className="font-medium text-text-primary">No branches yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Add your first branch to manage multiple locations from one account.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {branches.map((branch) => (
            <li
              key={branch.id}
              className="flex items-center justify-between gap-3 rounded-card border border-border-default bg-surface-primary p-4"
            >
              <div>
                <p className="font-semibold text-text-primary">{branch.name}</p>
                <p className="text-sm text-text-secondary">/{branch.slug}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {branch._count.menus} menu{branch._count.menus === 1 ? "" : "s"} ·{" "}
                  {branch._count.tables} table{branch._count.tables === 1 ? "" : "s"}
                </p>
              </div>
              <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                {branch.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-text-secondary">
        You have access to {memberships.length} workspace{memberships.length === 1 ? "" : "s"} (
        {rootCount} main, {memberships.length - rootCount}{" "}
        {memberships.length - rootCount === 1 ? "branch" : "branches"}). Switch between them
        from the restaurant picker in the header.
      </p>
    </div>
  );
}
