import * as Dialog from "@radix-ui/react-dialog";
import { formatPrice } from "../menus/format-price";
import type { DashboardOrder, OrderStatus } from "./order.types";
import { NEXT_STATUSES, STATUS_LABELS, statusClass } from "./order-status";

interface Props {
  order: DashboardOrder | null;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onTransition: (order: DashboardOrder, status: OrderStatus) => void;
}

export function OrderDetailDialog({
  order,
  open,
  busy,
  onOpenChange,
  onTransition,
}: Props) {
  if (!order) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface-primary p-6 outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                {order.table.label} · {formatPrice(order.total)}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-secondary">
                Placed {new Date(order.createdAt).toLocaleString()}
              </Dialog.Description>
              {order.discount > 0 && (
                <p className="mt-1 text-xs font-medium text-brand-primary">
                  Offer applied — saved {formatPrice(order.discount)}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.status)}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="mt-4 rounded-card border border-border-default p-3 text-sm">
            <p className="font-medium text-text-primary">{order.customerName}</p>
            <p className="text-text-secondary">{order.customerPhone}</p>
            {order.customerEmail && (
              <p className="text-text-secondary">{order.customerEmail}</p>
            )}
            {order.notes && (
              <p className="mt-2 border-t border-border-default pt-2 text-text-secondary">
                Note: {order.notes}
              </p>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="rounded-card border border-border-default p-3 text-sm"
              >
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-text-primary">
                    {item.quantity} × {item.name}
                  </p>
                  <p className="font-semibold text-text-primary">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
                {item.variantName && (
                  <p className="text-text-secondary">{item.variantName}</p>
                )}
                {item.addons.length > 0 && (
                  <p className="text-text-secondary">
                    + {item.addons.map((a) => a.name).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {NEXT_STATUSES[order.status].length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {NEXT_STATUSES[order.status].map((next) => (
                <button
                  key={next}
                  type="button"
                  disabled={busy}
                  onClick={() => onTransition(order, next)}
                  className={
                    next === "CANCELLED" || next === "REJECTED"
                      ? "h-10 rounded-lg border border-error px-4 text-sm font-medium text-error disabled:opacity-60"
                      : "h-10 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
                  }
                >
                  Mark {STATUS_LABELS[next]}
                </button>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
