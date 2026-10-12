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

/**
 * Restaurants the user can access, with their role in each. Includes the
 * branches of any root restaurant the user belongs to (Phase 15): parent
 * members inherit branch access, so the branches appear in their workspace
 * switcher with the same role.
 */
export async function listMyRestaurants(userId: string) {
  const memberships = await prisma.restaurantMembership.findMany({
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
          parentId: true,
          createdAt: true,
        },
      },
    },
  });

  const rootIds = memberships.map((m) => m.restaurant.id);
  const branches = rootIds.length
    ? await prisma.restaurant.findMany({
        where: { parentId: { in: rootIds } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          parentId: true,
          createdAt: true,
        },
      })
    : [];

  const roleByRoot = new Map(rootIds.map((id, i) => [id, memberships[i]!.role]));
  const seen = new Set(memberships.map((m) => m.restaurant.id));
  const branchEntries = branches
    .filter((branch) => !seen.has(branch.id))
    .map((branch) => ({
      role: roleByRoot.get(branch.parentId!) ?? ("STAFF" as const),
      restaurant: branch,
    }));

  return [...memberships, ...branchEntries];
}

/** Branches of a restaurant (one level deep). */
export async function listBranches(restaurantId: string) {
  return prisma.restaurant.findMany({
    where: { parentId: restaurantId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: { select: { tables: true, menus: true } },
    },
  });
}

/**
 * Create a branch: a full child restaurant (own menus/tables/orders/customers,
 * preserving tenant isolation) whose members inherit access from the parent.
 * Branches can only be created under root restaurants, one level deep.
 */
export async function createBranch(
  userId: string,
  parentId: string,
  input: CreateRestaurantInput
) {
  const parent = await prisma.restaurant.findUnique({
    where: { id: parentId },
    select: { parentId: true },
  });
  if (!parent || parent.parentId) {
    throw new ApiError(
      400,
      "BRANCH_OF_BRANCH",
      "Branches can only be created under the main restaurant."
    );
  }
  const existing = await prisma.restaurant.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "SLUG_TAKEN", "This restaurant URL name is already taken.");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const branch = await tx.restaurant.create({
      data: { name: input.name, slug: input.slug, parentId },
    });
    // The creating owner gets explicit branch membership; other parent
    // members inherit access through the parent chain.
    await tx.restaurantMembership.create({
      data: { userId, restaurantId: branch.id, role: "OWNER" },
    });
    return branch;
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
  const [restaurant, publishedMenu, activeTable] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: restaurantId } }),
    prisma.menu.findFirst({
      where: {
        restaurantId,
        archivedAt: null,
        status: "PUBLISHED",
        isActive: true,
      },
      select: { id: true },
    }),
    prisma.restaurantTable.findFirst({
      where: { restaurantId, isActive: true },
      select: { id: true },
    }),
  ]);
  if (!restaurant) {
    throw new ApiError(
      404,
      "RESTAURANT_NOT_FOUND",
      "The requested restaurant could not be found."
    );
  }
  return {
    ...restaurant,
    onboarding: computeOnboarding(
      restaurant,
      !!publishedMenu,
      !!activeTable
    ),
  };
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
 * Profile onboarding checklist (DESIGN.md §9). Derived from the profile
 * fields so progress never drifts from the actual data; later phases can
 * extend this with table/QR and review-flow steps.
 */
export function computeOnboarding(
  r: Restaurant,
  hasPublishedMenu = false,
  hasActiveTable = false
): OnboardingProgress {
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
    {
      key: "menu",
      label: "First menu published",
      completed: hasPublishedMenu,
    },
    {
      key: "tables",
      label: "Tables with QR codes",
      completed: hasActiveTable,
    },
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
