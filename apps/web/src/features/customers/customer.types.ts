export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerOrderLine {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

export interface CustomerDetail extends CustomerSummary {
  firstOrderAt: string | null;
  averageOrderValue: number;
  favoriteItem: string | null;
  recentOrders: CustomerOrderLine[];
  loyalty: {
    points: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    transactions: {
      id: string;
      type: string;
      points: number;
      reason: string | null;
      createdAt: string;
    }[];
  } | null;
}
