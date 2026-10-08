import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import {
  DEFAULT_PRESET_KEY,
  presetByKey,
  THEME_PRESETS,
  type ThemeConfig,
} from "./themes.presets.js";
import type { ThemeConfigInput } from "./themes.schemas.js";

function defaultConfig(): ThemeConfig {
  return presetByKey(DEFAULT_PRESET_KEY)!.config;
}

type ThemeRow = Prisma.RestaurantThemeGetPayload<object> | null;

function rowFor(restaurantId: string): Promise<ThemeRow> {
  return prisma.restaurantTheme.findUnique({ where: { restaurantId } });
}

/** Draft = saved draft, or the current preset's defaults before first save. */
export function effectiveDraft(row: ThemeRow): ThemeConfig {
  if (row?.draftConfig) return row.draftConfig as unknown as ThemeConfig;
  if (row?.publishedConfig) {
    return (row.publishedConfig as unknown as ThemeConfig);
  }
  return defaultConfig();
}

export async function getThemeState(restaurantId: string) {
  const row = await rowFor(restaurantId);
  const published = row?.publishedConfig ?? null;
  return {
    draft: effectiveDraft(row),
    published,
    publishedAt: row?.publishedAt ?? null,
    presets: THEME_PRESETS.map(({ key, name, description, config }) => ({
      key,
      name,
      description,
      config,
    })),
  };
}

export function saveDraft(restaurantId: string, config: ThemeConfigInput) {
  const data = {
    draftConfig: config as unknown as Prisma.InputJsonValue,
  };
  return prisma.restaurantTheme.upsert({
    where: { restaurantId },
    create: { restaurantId, ...data },
    update: data,
  });
}

/** Copy the effective draft onto the published slot. */
export async function publishTheme(restaurantId: string) {
  const row = await rowFor(restaurantId);
  const publishedAt = new Date();
  const publishedConfig = effectiveDraft(row) as unknown as Prisma.InputJsonValue;
  await prisma.restaurantTheme.upsert({
    where: { restaurantId },
    create: { restaurantId, publishedConfig, publishedAt },
    update: { publishedConfig, publishedAt },
  });
  return { published: publishedConfig, publishedAt };
}

/** Menu snapshot for the builder preview (published menus only). */
async function latestPublishedSnapshot(restaurantId: string) {
  const menu = await prisma.menu.findFirst({
    where: {
      restaurantId,
      archivedAt: null,
      isActive: true,
      status: "PUBLISHED",
      currentRevisionId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    include: { currentRevision: { select: { snapshot: true } } },
  });
  return menu?.currentRevision?.snapshot ?? null;
}

export async function getThemePreview(restaurantId: string) {
  const [restaurant, theme, menu] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, logoUrl: true },
    }),
    rowFor(restaurantId),
    latestPublishedSnapshot(restaurantId),
  ]);
  if (!restaurant) {
    throw new ApiError(
      404,
      "RESTAURANT_NOT_FOUND",
      "The requested restaurant could not be found."
    );
  }
  return {
    theme: effectiveDraft(theme),
    restaurant,
    menu,
  };
}
