import type { RestaurantMembership, User } from "@prisma/client";
import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Synced application user, set by requireAuth. */
      user?: User;
      /** Tenant membership for :restaurantId routes, set by requireMembership. */
      membership?: RestaurantMembership;
    }
  }
}

export type { Role };
