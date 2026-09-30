import { describe, expect, it } from "vitest";
import { osmHoursToText } from "@/lib/osmHours";

describe("osmHoursToText", () => {
  it.each([
    ["Mo-Su 10:00-22:00", "10:00 - 22:00"],
    ["09:00-17:00", "09:00 - 17:00"],
    ["8:00 - 21:00", "08:00 - 21:00"],
    ["24/7", "24/7"],
  ])("same hours every day: %s → %s", (input, expected) => {
    expect(osmHoursToText(input, "mn")).toBe(expected);
  });

  it("lists the days when only some days have hours", () => {
    expect(osmHoursToText("Mo-Fr 09:00-18:00", "mn")).toBe("09:00 - 18:00 (Да-Ба)");
    expect(osmHoursToText("Mo-Fr 09:00-18:00", "en")).toBe("09:00 - 18:00 (Mon-Fri)");
  });

  it("uses the rule covering the most days and lists every rule when they differ", () => {
    expect(osmHoursToText("Mo-Fr 09:00-18:00; Sa 10:00-16:00; Su off", "mn")).toBe(
      "09:00 - 18:00 (Да-Ба 09:00-18:00; Бя 10:00-16:00)"
    );
    expect(osmHoursToText("Sa 10:00-16:00; Mo-Fr 09:00-18:00", "en")).toBe(
      "09:00 - 18:00 (Sat 10:00-16:00; Mon-Fri 09:00-18:00)"
    );
  });

  it("spans a lunch break from first opening to last closing", () => {
    expect(osmHoursToText("Mo-Su 09:00-12:00,13:00-18:00", "mn")).toBe("09:00 - 18:00");
  });

  it("wraps day ranges across the week", () => {
    expect(osmHoursToText("Sa-Mo 10:00-16:00", "en")).toBe("10:00 - 16:00 (Sat-Mon)");
  });

  it("ignores public/school holiday and closed rules", () => {
    expect(osmHoursToText("PH off; Mo-Su 09:00-20:00", "mn")).toBe("09:00 - 20:00");
    expect(osmHoursToText("Mo-Su 09:00-20:00; PH 10:00-14:00", "mn")).toBe("09:00 - 20:00");
    expect(osmHoursToText("Mo-Su 09:00-20:00; SH closed", "mn")).toBe("09:00 - 20:00");
  });

  it("keeps a midnight closing time as 24:00 (not a 24-hour place)", () => {
    expect(osmHoursToText("Mo-Su 08:00-24:00", "mn")).toBe("08:00 - 24:00");
  });

  it.each(["sunrise-sunset", "Mo-Fr 09:00-18:00; Sa sunrise-sunset", "open", "", "Jan-Mar 09:00-17:00"])(
    "returns null for formats it can't represent: %j",
    (input) => {
      expect(osmHoursToText(input, "mn")).toBeNull();
    }
  );

  it("falls back to the main range when the full text would be too long for the hours field", () => {
    const long = "Mo 08:00-20:00; Tu 08:30-20:00; We 09:00-20:00; Th 09:30-20:00; Fr 10:00-20:00; Sa 10:30-20:00; Su 11:00-20:00";
    const result = osmHoursToText(long, "mn");
    expect(result).toBe("08:00 - 20:00");
  });
});
