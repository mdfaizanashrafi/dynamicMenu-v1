import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../../services/api";
import { useRestaurantContext } from "../restaurant/restaurant-context";
import type { RestaurantTableDto } from "./table.types";
import { QrImage } from "./qr-image";
import { QrViewDialog } from "./qr-view-dialog";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { suggestTableLabel } from "./table-label";

/** /dashboard/tables — table + QR management (DESIGN.md §14). */
export function TablesPage() {
  const { getToken } = useAuth();
  const { current } = useRestaurantContext();
  const restaurantId = current?.restaurant.id;
  const canEdit =
    current?.role === "OWNER" ||
    current?.role === "ADMIN" ||
    current?.role === "MANAGER";

  const [tables, setTables] = useState<RestaurantTableDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<RestaurantTableDto | null>(null);
  const [rotating, setRotating] = useState<RestaurantTableDto | null>(null);
  const [deleting, setDeleting] = useState<RestaurantTableDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<RestaurantTableDto[]>(
        `/api/v1/restaurants/${restaurantId}/tables`,
        { token }
      );
      setTables(data);
      setLabel((existing) =>
        existing || data.length === 0 ? existing : suggestTableLabel(data.length)
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tables.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!current) {
    return <p className="text-text-secondary">Select a restaurant to continue.</p>;
  }

  const call = async (
    path: string,
    init: { method: string; body?: string }
  ) => {
    const rid = restaurantId;
    if (!rid) throw new Error("No restaurant selected.");
    const token = await getToken();
    return apiFetch(`/api/v1/restaurants/${rid}/tables${path}`, {
      ...init,
      token,
    });
  };

  const createTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setNotice(null);
    try {
      await call("", { method: "POST", body: JSON.stringify({ label }) });
      setLabel("");
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to add table.");
    } finally {
      setCreating(false);
    }
  };

  const patchTable = async (
    table: RestaurantTableDto,
    body: Record<string, unknown>,
    successMessage?: string
  ) => {
    setBusy(true);
    setNotice(null);
    try {
      await call(`/${table.id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (successMessage) setNotice(successMessage);
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeTable = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await call(`/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await refresh();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (table: RestaurantTableDto) => {
    try {
      await navigator.clipboard.writeText(table.menuUrl);
      setCopied(table.id);
      setTimeout(() => setCopied((c) => (c === table.id ? null : c)), 1500);
    } catch {
      setNotice("Copy failed — select the link text manually.");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-text-primary">Tables & QR</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Every table gets a unique QR code that opens your menu on the
          customer&apos;s phone.
        </p>
      </section>

      {canEdit && (
        <form
          onSubmit={createTable}
          className="flex flex-wrap items-end gap-3 rounded-card border border-border-default bg-surface-primary p-4"
        >
          <label className="block text-sm font-medium text-text-primary">
            Add table
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Table 1"
              className="mt-1 h-11 w-56 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {creating ? "Adding…" : "Add table"}
          </button>
        </form>
      )}

      {notice && <p className="text-sm text-error">{notice}</p>}
      {loading ? (
        <p className="text-sm text-text-secondary">Loading tables…</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : tables.length === 0 ? (
        <div className="rounded-card border border-border-default bg-surface-primary p-10 text-center">
          <p className="font-medium text-text-primary">No tables yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Add your first table to generate its QR code.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <li
              key={table.id}
              className="flex flex-col rounded-card border border-border-default bg-surface-primary p-4"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setViewing(table)}
                  aria-label={`View QR for ${table.label}`}
                  className="shrink-0 rounded-lg hover:opacity-80"
                >
                  <QrImage value={table.menuUrl} size={72} />
                </button>
                <div className="min-w-0 flex-1">
                  <input
                    aria-label="Table label"
                    defaultValue={table.label}
                    disabled={!canEdit || busy}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== table.label) {
                        void patchTable(table, { label: next });
                      }
                    }}
                    className="w-full rounded-lg border border-transparent px-1 text-base font-semibold text-text-primary outline-none hover:border-border-default focus:border-brand-primary disabled:opacity-70"
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={
                        table.isActive
                          ? "rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"
                          : "rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary"
                      }
                    >
                      {table.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyLink(table)}
                    className="mt-2 block max-w-full truncate text-left text-xs text-text-secondary underline hover:text-brand-primary"
                    title={table.menuUrl}
                  >
                    {copied === table.id ? "Copied!" : table.menuUrl}
                  </button>
                </div>
              </div>
              {canEdit && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setViewing(table)}
                    className="h-9 rounded-lg border border-border-default px-3 text-sm font-medium text-text-primary hover:border-text-secondary"
                  >
                    View QR
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patchTable(
                        table,
                        { isActive: !table.isActive },
                        table.isActive
                          ? "Table deactivated — its QR code no longer resolves."
                          : undefined
                      )
                    }
                    className="h-9 rounded-lg border border-border-default px-3 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-50"
                  >
                    {table.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRotating(table)}
                    className="h-9 rounded-lg border border-border-default px-3 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-50"
                  >
                    New QR
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDeleting(table)}
                    className="h-9 rounded-lg border border-border-default px-3 text-sm text-error hover:border-error disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <QrViewDialog
        table={viewing}
        restaurantName={current.restaurant.name}
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
      <ConfirmDialog
        open={rotating !== null}
        title={`Generate a new QR for “${rotating?.label}”?`}
        description="The current QR code will stop working. Print the new code and replace the old one."
        confirmLabel="Rotate token"
        busy={busy}
        onConfirm={() => {
          if (rotating) {
            void patchTable(rotating, { rotateToken: true }).then(() =>
              setRotating(null)
            );
          }
        }}
        onCancel={() => setRotating(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.label}”?`}
        description="The table and its QR code will be removed. Printed codes for this table will stop working."
        confirmLabel="Delete table"
        destructive
        busy={busy}
        onConfirm={() => void removeTable()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
