import type { RestaurantMembership, User } from "@prisma/client";
import type { Role } from "@prisma/client";
import type { MenuTree } from "../modules/menus/menus.service.js";

type MenuTreeSection = MenuTree["sections"][number];
type MenuTreeItem = MenuTreeSection["items"][number];

declare global {
  namespace Express {
    interface Request {
      /** Synced application user, set by requireAuth. */
      user?: User;
      /** Tenant membership for :restaurantId routes, set by requireMembership. */
      membership?: RestaurantMembership;
      /** Tenant-scoped menu tree (sections → items → variants/addons). */
      menu?: MenuTree;
      /** A section belonging to req.menu. */
      section?: MenuTreeSection;
      /** An item belonging to req.section. */
      item?: MenuTreeItem;
    }
  }
}

export type { Role };
