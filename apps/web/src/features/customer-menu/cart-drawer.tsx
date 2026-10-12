import { useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { apiFetch } from "../../services/api";
import { formatPrice } from "../menus/format-price";
import { useCart, type CartItem } from "./cart-context";

interface Props {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedOrder {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  items: CartItem[];
}

export function CartDrawer({ token, open, onOpenChange }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          variantId: i.variant?.id,
          addonIds: i.addons.map((a) => a.id),
        })),
      };
      const created = await apiFetch<CreatedOrder>(
        `/api/v1/public/qr/${token}/orders`,
        { method: "POST", body: JSON.stringify(payload) }
      );
      setOrder(created);
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    if (order) {
      setOrder(null);
      setName("");
      setPhone("");
      setError(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl p-5 outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          style={{ background: "var(--tm-surface)", color: "var(--tm-text)" }}
        >
          <Dialog.Title className="text-lg font-bold">
            {order ? "Order placed" : "Your order"}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Review your cart and place your table order.
          </Dialog.Description>

          {order ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm opacity-80">
                Thank you, {order.status.toLowerCase()} order received.
              </p>
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--tm-bg)", borderRadius: "var(--tm-card-radius)" }}
              >
                {order.discount > 0 && (
                  <p className="text-sm opacity-80">
                    Subtotal {formatPrice(order.subtotal)} · Offer applied −
                    {formatPrice(order.discount)}
                  </p>
                )}
                <p className="text-sm">Order total</p>
                <p className="text-2xl font-bold" style={{ color: "var(--tm-primary)" }}>
                  {formatPrice(order.total)}
                </p>
              </div>
              <Link
                to={`/q/${token}/order/${order.id}`}
                className="block h-12 w-full rounded-xl border border-current text-center text-sm font-bold leading-[3rem]"
              >
                Track order status
              </Link>
              <button
                type="button"
                onClick={close}
                className="h-12 w-full text-sm font-bold"
                style={{
                  background: "var(--tm-primary)",
                  color: "var(--tm-bg)",
                  borderRadius: "var(--tm-button-radius)",
                }}
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="mt-4 text-sm opacity-70">Your cart is empty.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-xl p-3"
                      style={{ background: "var(--tm-bg)", borderRadius: "var(--tm-card-radius)" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.name}</p>
                        {item.variant && (
                          <p className="text-xs opacity-70">{item.variant.name}</p>
                        )}
                        {item.addons.length > 0 && (
                          <p className="text-xs opacity-70">
                            + {item.addons.map((a) => a.name).join(", ")}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg font-bold"
                            style={{ background: "var(--tm-surface)" }}
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg font-bold"
                            style={{ background: "var(--tm-surface)" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <span className="font-bold" style={{ color: "var(--tm-primary)" }}>
                          {formatPrice(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs underline opacity-70"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold" style={{ color: "var(--tm-primary)" }}>
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {items.length > 0 && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">
                    Name
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm outline-none focus:border-current"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Phone
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm outline-none focus:border-current"
                    />
                  </label>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy || items.length === 0}
                    className="h-12 w-full text-sm font-bold disabled:opacity-60"
                    style={{
                      background: "var(--tm-primary)",
                      color: "var(--tm-bg)",
                      borderRadius: "var(--tm-button-radius)",
                    }}
                  >
                    {busy ? "Placing order…" : "Place order"}
                  </button>
                </form>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
