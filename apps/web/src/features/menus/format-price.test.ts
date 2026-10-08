import { describe, expect, it } from "vitest";
import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("formats Decimal strings without forcing decimals", () => {
    expect(formatPrice("320")).toBe("320");
    expect(formatPrice("320.5")).toBe("320.5");
    expect(formatPrice(40)).toBe("40");
  });

  it("separates thousands and guards invalid input", () => {
    expect(formatPrice("123456.78")).toBe("1,23,456.78");
    expect(formatPrice("abc")).toBe("—");
    expect(formatPrice("")).toBe("—");
  });
});
