import type { ThemeConfig } from "../themes/theme.types";

export interface CustomerMenuRestaurant {
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
}

export interface CustomerMenuTable {
  label: string;
}

export interface CustomerMenuItemVariant {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface CustomerMenuItemAddon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface CustomerMenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  dietaryTags: string[];
  variants: CustomerMenuItemVariant[];
  addons: CustomerMenuItemAddon[];
}

export interface CustomerMenuSection {
  id: string;
  name: string;
  description: string | null;
  isHidden: boolean;
  items: CustomerMenuItem[];
}

export interface CustomerMenuSnapshot {
  menuId: string;
  name: string;
  description: string | null;
  publishedAt: string;
  sections: CustomerMenuSection[];
}

export interface CustomerMenuOffer {
  id: string;
  title: string;
  description: string | null;
  badgeText: string | null;
  imageUrl: string | null;
}

export interface CustomerMenuData {
  restaurant: CustomerMenuRestaurant;
  table: CustomerMenuTable;
  menu: CustomerMenuSnapshot | null;
  theme: ThemeConfig;
  offers: CustomerMenuOffer[];
}
