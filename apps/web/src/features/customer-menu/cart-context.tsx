import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CustomerMenuItem, CustomerMenuItemVariant } from "./customer-menu.types";

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  quantity: number;
  variant: CustomerMenuItemVariant | null;
  addons: CartAddon[];
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  addItem: (
    item: CustomerMenuItem,
    variant: CustomerMenuItemVariant | null,
    addons: CartAddon[],
    quantity?: number
  ) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartState | null>(null);

function cartItemId(
  menuItemId: string,
  variantId: string | undefined,
  addonIds: string[]
): string {
  return [menuItemId, variantId ?? "", ...addonIds.sort()].join("|");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (
      item: CustomerMenuItem,
      variant: CustomerMenuItemVariant | null,
      addons: CartAddon[],
      quantity = 1
    ) => {
      const id = cartItemId(item.id, variant?.id, addons.map((a) => a.id));
      const unitPrice =
        item.price + (variant?.price ?? 0) + addons.reduce((s, a) => s + a.price, 0);

      setItems((prev) => {
        const existing = prev.find((i) => i.id === id);
        if (existing) {
          return prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                  subtotal: (i.quantity + quantity) * unitPrice,
                }
              : i
          );
        }
        return [
          ...prev,
          {
            id,
            menuItemId: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            basePrice: item.price,
            quantity,
            variant,
            addons,
            subtotal: quantity * unitPrice,
          },
        ];
      });
    },
    []
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const unitPrice =
            i.basePrice + (i.variant?.price ?? 0) + i.addons.reduce((s, a) => s + a.price, 0);
          return quantity <= 0 ? null : { ...i, quantity, subtotal: quantity * unitPrice };
        })
        .filter((i): i is CartItem => i !== null)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.subtotal, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
