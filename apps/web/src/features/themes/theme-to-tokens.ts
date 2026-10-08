import type { ThemeConfig } from "./theme.types";

/** Design tokens mapped from a theme config (DESIGN.md §25). */
export interface ThemeTokens {
  cssVars: Record<string, string>;
  background: string;
}

const HEADING_FONTS: Record<ThemeConfig["headingFont"], string> = {
  sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  rounded: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
};

const CARD_RADIUS: Record<ThemeConfig["cardStyle"], string> = {
  flat: "0px",
  outlined: "8px",
  elevated: "16px",
  soft: "12px",
};

const BUTTON_RADIUS: Record<ThemeConfig["buttonStyle"], string> = {
  pill: "9999px",
  rounded: "10px",
  square: "4px",
};

/** Convert a theme config to CSS custom properties + background value. */
export function themeToTokens(config: ThemeConfig): ThemeTokens {
  const { colors } = config;
  const cssVars: Record<string, string> = {
    "--tm-primary": colors.primary,
    "--tm-secondary": colors.secondary,
    "--tm-bg": colors.background,
    "--tm-surface": colors.surface,
    "--tm-text": colors.text,
    "--tm-font": HEADING_FONTS[config.headingFont],
    "--tm-card-radius": CARD_RADIUS[config.cardStyle],
    "--tm-button-radius": BUTTON_RADIUS[config.buttonStyle],
  };

  let background = colors.background;
  if (config.coverImageUrl) {
    background = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${config.coverImageUrl}) center/cover no-repeat, ${colors.background}`;
  } else if (config.backgroundStyle === "gradient") {
    background = `linear-gradient(160deg, ${colors.background} 0%, ${colors.surface} 100%)`;
  } else if (config.backgroundStyle === "pattern") {
    background = `radial-gradient(${colors.primary}22 1.5px, transparent 1.5px) 0 0/22px 22px, ${colors.background}`;
  }
  return { cssVars, background };
}
