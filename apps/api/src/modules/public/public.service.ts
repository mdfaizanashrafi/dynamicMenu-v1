import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type { MenuSnapshot } from "../menus/menus.service.js";
import { DEFAULT_PRESET_KEY, presetByKey } from "../themes/themes.presets.js";
import type { ThemeConfig } from "../themes/themes.presets.js";
import { listActiveOffers, type OfferDto } from "../offers/offers.service.js";

export interface CustomerMenuData {
  restaurant: {
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
  };
  table: { label: string };
  menu: MenuSnapshot | null;
  theme: ThemeConfig;
  offers: OfferDto[];
}

function defaultTheme(): ThemeConfig {
  return presetByKey(DEFAULT_PRESET_KEY)!.config;
}

/**
 * Resolve a scanned QR token to the full customer-facing payload:
 * restaurant identity, table identity, published menu snapshot, published
 * theme (or default preset), and active offers.
 */
export async function resolveCustomerMenu(token: string): Promise<CustomerMenuData> {
  const table = await prisma.restaurantTable.findFirst({
    where: { qrToken: token, isActive: true },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
        },
      },
    },
  });

  if (!table) {
    throw new ApiError(
      404,
      "INVALID_QR",
      "This QR code is unavailable. Please ask restaurant staff for a new QR code."
    );
  }

  const restaurantId = table.restaurant.id;

  const [menuRow, themeRow, offers] = await Promise.all([
    prisma.menu.findFirst({
      where: {
        restaurantId,
        archivedAt: null,
        isActive: true,
        status: "PUBLISHED",
        currentRevisionId: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      include: { currentRevision: { select: { snapshot: true } } },
    }),
    prisma.restaurantTheme.findUnique({ where: { restaurantId } }),
    listActiveOffers(restaurantId),
  ]);

  const snapshot = menuRow?.currentRevision?.snapshot ?? null;
  const theme: ThemeConfig =
    (themeRow?.publishedConfig as ThemeConfig | undefined) ?? defaultTheme();

  return {
    restaurant: {
      name: table.restaurant.name,
      slug: table.restaurant.slug,
      logoUrl: table.restaurant.logoUrl,
      description: table.restaurant.description,
    },
    table: { label: table.label },
    menu: snapshot as MenuSnapshot | null,
    theme,
    offers,
  };
}
