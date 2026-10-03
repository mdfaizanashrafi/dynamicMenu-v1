/** Tenant shape returned by GET /api/v1/restaurants. */
export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export interface Membership {
  role: "OWNER" | "ADMIN" | "MANAGER" | "STAFF";
  restaurant: RestaurantSummary;
}

export interface Me {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface OnboardingStep {
  key: string;
  label: string;
  completed: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  total: number;
}

/** Full profile returned by GET /api/v1/restaurants/:id (Phase 2). */
export interface RestaurantDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  cuisine: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  googleMapsUrl: string | null;
  createdAt: string;
  updatedAt: string;
  onboarding: OnboardingProgress;
}
