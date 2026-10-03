import type { Prisma, Restaurant } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type {
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from "./restaurants.schemas.js";

/** Create a restaurant and its OWNER membership atomically. */
export async function createRestaurant(
  userId: string,
  input: CreateRestaurantInput
) {
  const existing = await prisma.restaurant.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(
      409,
      "SLUG_TAKEN",
      "This restaurant URL name is already taken."
    );
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const restaurant = await tx.restaurant.create({
      data: { name: input.name, slug: input.slug },
    });
    await tx.restaurantMembership.create({
      data: { userId, restaurantId: restaurant.id, role: "OWNER" },
    });
    return restaurant;
  });
}

/** Restaurants the user belongs to, with their role in each. */
export async function listMyRestaurants(userId: string) {
  return prisma.restaurantMembership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function updateRestaurant(
  restaurantId: string,
  input: UpdateRestaurantInput
) {
  if (input.slug) {
    const clash = await prisma.restaurant.findFirst({
      where: { slug: input.slug, NOT: { id: restaurantId } },
      select: { id: true },
    });
    if (clash) {
      throw new ApiError(
        409,
        "SLUG_TAKEN",
        "This restaurant URL name is already taken."
      );
    }
  }

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: input,
  });
}

export async function listMembers(restaurantId: string) {
  return prisma.restaurantMembership.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Full profile plus onboarding progress for the dashboard. */
export async function getRestaurantDetail(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) {
    throw new ApiError(
      404,
      "RESTAURANT_NOT_FOUND",
      "The requested restaurant could not be found."
    );
  }
  return { ...restaurant, onboarding: computeOnboarding(restaurant) };
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

/**
 * Profile onboarding checklist (DESIGN.md §9 step 2). Derived from the
 * profile fields so progress never drifts from the actual data; later
 * phases extend this with menu/theme/table steps.
 */
export function computeOnboarding(r: Restaurant): OnboardingProgress {
  const steps: OnboardingStep[] = [
    { key: "identity", label: "Restaurant name", completed: !!r.name },
    {
      key: "profile",
      label: "Cuisine & description",
      completed: !!r.cuisine && !!r.description,
    },
    {
      key: "contact",
      label: "Contact details",
      completed: !!r.phone || !!r.email,
    },
    {
      key: "address",
      label: "Address",
      completed: !!r.addressLine1 && !!r.city,
    },
    { key: "logo", label: "Logo", completed: !!r.logoUrl },
    { key: "maps", label: "Google Maps link", completed: !!r.googleMapsUrl },
  ];
  return {
    steps,
    completedCount: steps.filter((s) => s.completed).length,
    total: steps.length,
  };
}

export async function setRestaurantLogo(restaurantId: string, logoUrl: string) {
  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: { logoUrl },
  });
}
