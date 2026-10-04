import type {
  Menu,
  MenuItem,
  MenuSection,
  RestaurantMembership,
  User,
} from "@prisma/client";
import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Synced application user, set by requireAuth. */
      user?: User;
      /** Tenant membership for :restaurantId routes, set by requireMembership. */
      membership?: RestaurantMembership;
      /** Tenant-scoped menu tree, set by the menus module's requireMenu. */
      menu?: Menu;
      /** Section of req.menu, set by requireSection. */
      section?: MenuSection;
      /** Item of req.section, set by requireItem. */
      item?: MenuItem;
    }
  }
}

export type { Role };
