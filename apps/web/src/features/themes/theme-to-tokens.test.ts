import { describe, expect, it } from "vitest";
import type { ThemeConfig } from "./theme.types";
import { themeToTokens } from "./theme-to-tokens";

const config: ThemeConfig = {
  preset: "test",
  colors: {
    primary: "#FF0000",
    secondary: "#00FF00",
    background: "#FFFFFF",
    surface: "#FAFAFA",
    text: "#111111",
  },
  headingFont: "serif",
  cardStyle: "elevated",
  buttonStyle: "pill",
  backgroundStyle: "solid",
  headerStyle: "logo",
  decorations: { garland: false, cornerFlourish: false },
  coverImageUrl: null,
};

describe("themeToTokens", () => {
  it("maps colors, font and radii to CSS variables", () => {
    const { cssVars } = themeToTokens(config);
    expect(cssVars["--tm-primary"]).toBe("#FF0000");
    expect(cssVars["--tm-text"]).toBe("#111111");
    expect(cssVars["--tm-font"]).toContain("Georgia");
    expect(cssVars["--tm-card-radius"]).toBe("16px");
    expect(cssVars["--tm-button-radius"]).toBe("9999px");
  });

  it("builds solid, gradient and pattern backgrounds", () => {
    expect(themeToTokens(config).background).toBe("#FFFFFF");

    const gradient = themeToTokens({ ...config, backgroundStyle: "gradient" });
    expect(gradient.background).toContain("linear-gradient");

    const pattern = themeToTokens({ ...config, backgroundStyle: "pattern" });
    expect(pattern.background).toContain("radial-gradient");
  });

  it("layers the cover image under an overlay for text contrast", () => {
    const withCover = themeToTokens({
      ...config,
      coverImageUrl: "http://localhost:4000/uploads/cover.png",
    });
    expect(withCover.background).toContain("cover.png");
    expect(withCover.background).toContain("rgba(0,0,0,0.35)");
  });
});
