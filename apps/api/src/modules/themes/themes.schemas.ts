import { z } from "zod";
import { hexColorSchema } from "../../utils/validation.js";

/** Validatable subset of the preset config (controls shown in the editor). */
export const themeConfigSchema = z.object({
  preset: z.string().trim().min(1).max(40),
  colors: z.object({
    primary: hexColorSchema,
    secondary: hexColorSchema,
    background: hexColorSchema,
    surface: hexColorSchema,
    text: hexColorSchema,
  }),
  headingFont: z.enum(["sans", "serif", "rounded"]),
  cardStyle: z.enum(["flat", "outlined", "elevated", "soft"]),
  buttonStyle: z.enum(["pill", "rounded", "square"]),
  backgroundStyle: z.enum(["solid", "gradient", "pattern"]),
  headerStyle: z.enum(["minimal", "banner", "logo"]),
  decorations: z.object({
    garland: z.boolean(),
    cornerFlourish: z.boolean(),
  }),
  coverImageUrl: z.url().nullable(),
});

export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;
