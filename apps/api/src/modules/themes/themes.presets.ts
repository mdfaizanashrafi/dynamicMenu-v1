/**
 * Built-in theme presets (PHASES.md §8 initial themes). Presets are static
 * configuration defaults — adding a theme never touches menu data or the
 * menu rendering pipeline (ARCHITECTURE.md §12).
 */
export interface ThemeConfig {
  preset: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
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

const BASE = {
  headingFont: "sans",
  cardStyle: "soft",
  buttonStyle: "rounded",
  backgroundStyle: "solid",
  headerStyle: "logo",
  decorations: { garland: false, cornerFlourish: false },
  coverImageUrl: null,
} as const;

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean and bright with a single accent color.",
    config: {
      ...BASE,
      preset: "modern-minimal",
      colors: {
        primary: "#F97316",
        secondary: "#18181B",
        background: "#FFFFFF",
        surface: "#FAFAFA",
        text: "#18181B",
      },
    },
  },
  {
    key: "midnight-luxury",
    name: "Midnight Luxury",
    description: "Dark stone with gold accents for an upscale feel.",
    config: {
      ...BASE,
      preset: "midnight-luxury",
      headingFont: "serif",
      cardStyle: "outlined",
      buttonStyle: "pill",
      backgroundStyle: "gradient",
      colors: {
        primary: "#D4AF37",
        secondary: "#1C1917",
        background: "#0C0A09",
        surface: "#1C1917",
        text: "#F5F5F4",
      },
    },
  },
  {
    key: "traditional-indian",
    name: "Traditional Indian",
    description: "Warm marigold and deep reds with classic serif type.",
    config: {
      ...BASE,
      preset: "traditional-indian",
      headingFont: "serif",
      cardStyle: "outlined",
      backgroundStyle: "pattern",
      headerStyle: "banner",
      decorations: { garland: false, cornerFlourish: true },
      colors: {
        primary: "#C2410C",
        secondary: "#7C2D12",
        background: "#FFF8F1",
        surface: "#FFEDD5",
        text: "#431407",
      },
    },
  },
  {
    key: "festive",
    name: "Festive",
    description: "Bright celebratory colors with decorative garlands.",
    config: {
      ...BASE,
      preset: "festive",
      cardStyle: "elevated",
      buttonStyle: "pill",
      headerStyle: "banner",
      decorations: { garland: true, cornerFlourish: false },
      colors: {
        primary: "#DC2626",
        secondary: "#F59E0B",
        background: "#FEF3C7",
        surface: "#FFFFFF",
        text: "#7F1D1D",
      },
    },
  },
];

export const DEFAULT_PRESET_KEY = "modern-minimal";

export function presetByKey(key: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.key === key);
}
