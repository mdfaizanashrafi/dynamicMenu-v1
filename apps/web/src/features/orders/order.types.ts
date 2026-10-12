export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export interface DashboardOrderAddon {
  id: string;
  addonId: string;
  name: string;
  price: number;
}

export interface DashboardOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  variantId: string | null;
  variantName: string | null;
  variantPrice: number | null;
  subtotal: number;
  addons: DashboardOrderAddon[];
}

export interface DashboardOrder {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  offerId: string | null;
  createdAt: string;
  updatedAt: string;
  table: { id: string; label: string };
  items: DashboardOrderItem[];
}
