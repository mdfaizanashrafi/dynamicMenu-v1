/** Theme domain types returned by the Phase 4 theme APIs. */

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
}

export interface ThemeConfig {
  preset: string;
  colors: ThemeColors;
  headingFont: "sans" | "serif" | "rounded";
  cardStyle: "flat" | "outlined" | "elevated" | "soft";
  buttonStyle: "pill" | "rounded" | "square";
  backgroundStyle: "solid" | "gradient" | "pattern";
  headerStyle: "minimal" | "banner" | "logo";
  decorations: {
    garland: boolean;
    cornerFlourish: boolean;
  };
  coverImageUrl: string | null;
}

export interface ThemePreset {
  key: string;
  name: string;
  description: string;
  config: ThemeConfig;
}

export interface ThemeState {
  draft: ThemeConfig;
  published: ThemeConfig | null;
  publishedAt: string | null;
  presets: ThemePreset[];
}

export interface ThemePreviewData {
  theme: ThemeConfig;
  restaurant: { name: string; logoUrl: string | null };
  menu: PreviewMenuSnapshot | null;
}

export interface PreviewMenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
}

export interface PreviewMenuSection {
  id: string;
  name: string;
  isHidden: boolean;
  items: PreviewMenuItem[];
}

export interface PreviewMenuSnapshot {
  name: string;
  description: string | null;
  sections: PreviewMenuSection[];
}
