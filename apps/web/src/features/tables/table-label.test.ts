import { describe, expect, it } from "vitest";
import { suggestTableLabel } from "./table-label";

describe("suggestTableLabel", () => {
  it("numbers tables from existing count", () => {
    expect(suggestTableLabel(0)).toBe("Table 1");
    expect(suggestTableLabel(2)).toBe("Table 3");
  });
});
