import type { Prisma } from "@prisma/client";
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
