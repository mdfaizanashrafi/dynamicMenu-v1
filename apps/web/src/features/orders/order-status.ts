import type { OrderStatus } from "./order.types";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "PAID",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

/** Mirrors the backend ALLOWED_TRANSITIONS map (apps/api/.../orders.service.ts). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED"],
  SERVED: ["PAID"],
  PAID: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  PAID: "Paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export function statusClass(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "CONFIRMED":
    case "PREPARING":
      return "bg-blue-100 text-blue-800";
    case "READY":
      return "bg-violet-100 text-violet-800";
    case "SERVED":
      return "bg-teal-100 text-teal-800";
    case "PAID":
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
  }
}
