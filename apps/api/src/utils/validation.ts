import { z } from "zod";

/** Hex color like #F97316 or #fff (shared by profile branding and themes). */
export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #F97316");
