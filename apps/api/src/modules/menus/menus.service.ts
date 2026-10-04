import type { DietaryTag, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type {
  CreateItemInput,
  CreateMenuInput,
  CreateSectionInput,
  UpdateItemInput,
  UpdateMenuInput,
  UpdateSectionInput,
} from "./menus.schemas.js";

// ── Draft tree queries ────────────────────────────────────────────────────

const treeInclude = {
  currentRevision: {
    select: { id: true, publishedAt: true, sectionCount: true, itemCount: true },
  },
  sections: {
    orderBy: { position: "asc" as const },
    include: {
      items: {
        orderBy: { position: "asc" as const },
        include: {
          variants: { orderBy: { position: "asc" as const } },
          addons: { orderBy: { position: "asc" as const } },
        },
      },
    },
  },
} satisfies Prisma.MenuInclude;

export type MenuTree = Prisma.MenuGetPayload<{ include: typeof treeInclude }>;

export function loadMenuTree(menuId: string): Promise<MenuTree | null> {
  return prisma.menu.findFirst({
    where: { id: menuId, archivedAt: null },
    include: treeInclude,
  });
}

export async function listMenus(restaurantId: string) {
  const menus = await prisma.menu.findMany({
    where: { restaurantId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { sections: true } },
      currentRevision: {
        select: { id: true, publishedAt: true, itemCount: true },
      },
    },
  });
  // Item counts per menu (one grouped query instead of N+1).
  const itemCounts = await prisma.menuSection.groupBy({
    by: ["menuId"],
    where: { menuId: { in: menus.map((m) => m.id) } },
    _count: { _all: true },
  });
  const countsByMenu = new Map(itemCounts.map((c) => [c.menuId, c._count._all]));
  return menus.map((m) => ({
    ...m,
    itemCount: countsByMenu.get(m.id) ?? 0,
  }));
}

export function createMenu(restaurantId: string, input: CreateMenuInput) {
  return prisma.menu.create({
    data: { restaurantId, name: input.name, description: input.description },
  });
}

export function updateMenu(menuId: string, input: UpdateMenuInput) {
  return prisma.menu.update({ where: { id: menuId }, data: input });
}

/** Soft delete: archived menus disappear from dashboards but keep revision history. */
export function archiveMenu(menuId: string) {
  return prisma.menu.update({
    where: { id: menuId },
    data: { archivedAt: new Date() },
  });
}

// ── Sections ──────────────────────────────────────────────────────────────

export async function createSection(menuId: string, input: CreateSectionInput) {
  const last = await prisma.menuSection.findFirst({
    where: { menuId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return prisma.menuSection.create({
    data: {
      menuId,
      name: input.name,
      description: input.description,
      position: (last?.position ?? -1) + 1,
    },
  });
}

export function updateSection(sectionId: string, input: UpdateSectionInput) {
  return prisma.menuSection.update({ where: { id: sectionId }, data: input });
}

export function deleteSection(sectionId: string) {
  return prisma.menuSection.delete({ where: { id: sectionId } });
}

/** Apply a full ordering in one transaction; silently drops unknown ids. */
export async function reorderSections(menuId: string, sectionIds: string[]) {
  const existing = await prisma.menuSection.findMany({
    where: { menuId },
    select: { id: true },
  });
  const valid = new Set(existing.map((s) => s.id));
  const ordered = sectionIds.filter((id) => valid.has(id));
  await prisma.$transaction(
    ordered.map((id, index) =>
      prisma.menuSection.update({ where: { id }, data: { position: index } })
    )
  );
  return prisma.menuSection.findMany({
    where: { menuId },
    orderBy: { position: "asc" },
  });
}

// ── Items (with variants & add-ons) ───────────────────────────────────────

export async function createItem(sectionId: string, input: CreateItemInput) {
  const last = await prisma.menuItem.findFirst({
    where: { sectionId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.create({
      data: {
        sectionId,
        name: input.name,
        description: input.description,
        price: input.price,
        isAvailable: input.isAvailable ?? true,
        dietaryTags: (input.dietaryTags ?? []) as DietaryTag[],
        position: (last?.position ?? -1) + 1,
      },
    });
    if (input.variants?.length) {
      await tx.menuItemVariant.createMany({
        data: input.variants.map((v, i) => ({
          itemId: item.id,
          name: v.name,
          price: v.price,
          isAvailable: v.isAvailable ?? true,
          position: i,
        })),
      });
    }
    if (input.addons?.length) {
      await tx.menuItemAddon.createMany({
        data: input.addons.map((a, i) => ({
          itemId: item.id,
          name: a.name,
          price: a.price,
          isAvailable: a.isAvailable ?? true,
          position: i,
        })),
      });
    }
    return item;
  });
}

/** Scalar fields update in place; variants/add-ons are replaced wholesale. */
export async function updateItem(itemId: string, input: UpdateItemInput) {
  const { variants, addons, ...scalar } = input;
  return prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.update({
      where: { id: itemId },
      data: {
        ...scalar,
        ...(scalar.dietaryTags
          ? { dietaryTags: scalar.dietaryTags as DietaryTag[] }
          : {}),
      },
    });
    if (variants) {
      await tx.menuItemVariant.deleteMany({ where: { itemId } });
      if (variants.length) {
        await tx.menuItemVariant.createMany({
          data: variants.map((v, i) => ({
            itemId,
            name: v.name,
            price: v.price,
            isAvailable: v.isAvailable ?? true,
            position: i,
          })),
        });
      }
    }
    if (addons) {
      await tx.menuItemAddon.deleteMany({ where: { itemId } });
      if (addons.length) {
        await tx.menuItemAddon.createMany({
          data: addons.map((a, i) => ({
            itemId,
            name: a.name,
            price: a.price,
            isAvailable: a.isAvailable ?? true,
            position: i,
          })),
        });
      }
    }
    return item;
  });
}

export function deleteItem(itemId: string) {
  return prisma.menuItem.delete({ where: { id: itemId } });
}

export function setItemImage(itemId: string, imageUrl: string) {
  return prisma.menuItem.update({ where: { id: itemId }, data: { imageUrl } });
}

// ── Publishing (ARCHITECTURE.md §11) ──────────────────────────────────────

/** Serializable published-menu shape; customers are served this only. */
export interface MenuSnapshotItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  dietaryTags: DietaryTag[];
  variants: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
  }[];
  addons: { id: string; name: string; price: number; isAvailable: boolean }[];
}

export interface MenuSnapshot {
  menuId: string;
  name: string;
  description: string | null;
  publishedAt: string;
  sections: {
    id: string;
    name: string;
    description: string | null;
    isHidden: boolean;
    items: MenuSnapshotItem[];
  }[];
}

export function buildSnapshot(menu: MenuTree, publishedAt: Date): MenuSnapshot {
  return {
    menuId: menu.id,
    name: menu.name,
    description: menu.description,
    publishedAt: publishedAt.toISOString(),
    sections: menu.sections.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isHidden: s.isHidden,
      items: s.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        imageUrl: i.imageUrl,
        price: i.price.toNumber(),
        isAvailable: i.isAvailable,
        dietaryTags: i.dietaryTags,
        variants: i.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price.toNumber(),
          isAvailable: v.isAvailable,
        })),
        addons: i.addons.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price.toNumber(),
          isAvailable: a.isAvailable,
        })),
      })),
    })),
  };
}

/** Publish rules; empty array means the menu can go live. */
export function validateMenuForPublish(menu: MenuTree): string[] {
  const problems: string[] = [];
  const itemCount = menu.sections.reduce((n, s) => n + s.items.length, 0);
  if (menu.sections.length === 0) {
    problems.push("Add at least one section before publishing.");
  }
  if (itemCount === 0) {
    problems.push("Add at least one menu item before publishing.");
  }
  return problems;
}

/**
 * Validate the draft tree and store it as the new current revision.
 * The draft stays editable afterwards — customer endpoints read the
 * snapshot, so later draft changes never leak to the live menu.
 */
export async function publishMenu(menuId: string) {
  const menu = await loadMenuTree(menuId);
  if (!menu) {
    throw new ApiError(404, "MENU_NOT_FOUND", "The menu could not be found.");
  }
  const problems = validateMenuForPublish(menu);
  if (problems.length > 0) {
    throw new ApiError(400, "MENU_INCOMPLETE", problems.join(" "));
  }

  const publishedAt = new Date();
  const snapshot = buildSnapshot(menu, publishedAt);
  return prisma.$transaction(async (tx) => {
    const revision = await tx.menuRevision.create({
      data: {
        menuId,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        sectionCount: menu.sections.length,
        itemCount: menu.sections.reduce((n, s) => n + s.items.length, 0),
        publishedAt,
      },
    });
    return tx.menu.update({
      where: { id: menuId },
      data: { status: "PUBLISHED", currentRevisionId: revision.id },
      include: { currentRevision: true },
    });
  });
}

/** Take the menu offline; revision history is preserved. */
export function unpublishMenu(menuId: string) {
  return prisma.menu.update({
    where: { id: menuId },
    data: { status: "DRAFT", currentRevisionId: null },
  });
}

export function listRevisions(menuId: string) {
  return prisma.menuRevision.findMany({
    where: { menuId },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      publishedAt: true,
      sectionCount: true,
      itemCount: true,
    },
  });
}
