import * as Dialog from "@radix-ui/react-dialog";
import { formatPrice } from "../menus/format-price";
import type { CustomerDetail } from "./customer.types";

interface Props {
  customer: CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({ customer, open, onOpenChange }: Props) {
  if (!customer) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface-primary p-6 outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <Dialog.Title className="text-lg font-semibold text-text-primary">
            {customer.name}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-text-secondary">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </Dialog.Description>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Orders" value={String(customer.orderCount)} />
            <Stat label="Total spent" value={formatPrice(customer.totalSpent)} />
            <Stat label="Avg order" value={formatPrice(customer.averageOrderValue)} />
            <Stat label="Favorite" value={customer.favoriteItem ?? "—"} />
          </div>

          {customer.loyalty && (
            <>
              <h3 className="mt-5 text-sm font-semibold text-text-primary">
                Loyalty Program
              </h3>
              <div className="mt-2 flex items-center justify-between rounded-card border border-border-default p-3">
                <p className="text-sm text-text-secondary">
                  Balance{" "}
                  <span className="font-bold text-brand-primary">
                    {customer.loyalty.points} pts
                  </span>{" "}
                  · earned {customer.loyalty.lifetimeEarned} · redeemed{" "}
                  {customer.loyalty.lifetimeRedeemed}
                </p>
              </div>
              {customer.loyalty.transactions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {customer.loyalty.transactions.slice(0, 5).map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between text-xs text-text-secondary"
                    >
                      <span>
                        {t.type} {t.points > 0 ? `+${t.points}` : t.points}
                        {t.reason ? ` — ${t.reason}` : ""}
                      </span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <h3 className="mt-5 text-sm font-semibold text-text-primary">Order history</h3>
          {customer.recentOrders.length === 0 ? (
            <p className="mt-2 text-sm text-text-secondary">No orders yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {customer.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-card border border-border-default p-3 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-medium text-text-primary">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="font-semibold text-text-primary">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <p className="text-text-secondary">
                    {order.status} ·{" "}
                    {order.items
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border-default p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="truncate text-sm font-semibold text-text-primary" title={value}>
        {value}
      </p>
    </div>
  );
}
