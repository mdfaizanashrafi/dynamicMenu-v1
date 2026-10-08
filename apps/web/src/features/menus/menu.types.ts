/** Menu domain types returned by the Phase 3 menu APIs. */

export interface MenuSummary {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Section count (_count.sections). */
  _count: { sections: number };
  /** Total items across sections (added by the list endpoint). */
  itemCount: number;
  currentRevision: {
    id: string;
    publishedAt: string;
    itemCount: number;
  } | null;
}

export interface MenuVariant {
  id: string;
  name: string;
  /** Decimal serialized as a string by the API. */
  price: string;
  isAvailable: boolean;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

export type DietaryTag =
  | "VEG"
  | "NON_VEG"
  | "VEGAN"
  | "SPICY"
  | "GLUTEN_FREE";

export interface MenuItemNode {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  isAvailable: boolean;
  dietaryTags: DietaryTag[];
  position: number;
  variants: MenuVariant[];
  addons: MenuAddon[];
}

export interface MenuSectionNode {
  id: string;
  name: string;
  description: string | null;
  position: number;
  isHidden: boolean;
  items: MenuItemNode[];
}

export interface MenuRevisionInfo {
  id: string;
  publishedAt: string;
  sectionCount: number;
  itemCount: number;
}

/** Full draft tree returned by GET /restaurants/:id/menus/:menuId. */
export interface MenuDetail {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  isActive: boolean;
  currentRevisionId: string | null;
  sections: MenuSectionNode[];
  currentRevision: MenuRevisionInfo | null;
}

/** Payload shape used by item create/update forms. */
export interface ItemFormValue {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  dietaryTags: DietaryTag[];
  variants: { name: string; price: string; isAvailable: boolean }[];
  addons: { name: string; price: string; isAvailable: boolean }[];
}
