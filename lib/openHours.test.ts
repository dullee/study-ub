import { describe, expect, it } from "vitest";
import { openStatus } from "@/lib/openHours";
import { dictionaries } from "@/lib/i18n/dictionaries";

const t = dictionaries.en;

// Улаанбаатар UTC+8, зуны цаггүй. ub(14, 30) — УБ-ын цагаар 14:30 болох мөч.
const ub = (hours: number, minutes = 0) => Date.UTC(2026, 8, 30, hours - 8, minutes);

const status = (hours: string, at: number, is_24h?: boolean) => openStatus({ hours, is_24h }, at, t);

describe("openStatus: parsing", () => {
  it.each([
    ["09:00 - 18:00", "09:00 – 18:00"],
    ["9:00–18:00", "09:00 – 18:00"],
    ["9.00-18.00", "09:00 – 18:00"],
    ["07:30 - 16:30 (ажлын өдөр)", "07:30 – 16:30"],
    ["09:00 - 18:00 (Да-Ба)", "09:00 – 18:00"],
  ])("reads %j", (hours, schedule) => {
    expect(status(hours, ub(12))?.schedule).toBe(schedule);
  });

  it.each(["Тодорхойгүй", "", "by appointment", "25:00 - 26:00"])("returns null for %j", (hours) => {
    expect(status(hours, ub(12))).toBeNull();
  });

  it.each(["24/7", "24 цаг", "24 / 7", "00:00 - 24:00", "00:00 - 00:00"])("treats %j as open 24 hours", (hours) => {
    const result = status(hours, ub(3));
    expect(result?.open).toBe(true);
    expect(result?.schedule).toBe(t.schedule24);
  });

  it("respects the is_24h flag whatever the text says", () => {
    expect(status("Тодорхойгүй", ub(3), true)?.open).toBe(true);
  });

  // Өмнө нь текстэд "24" байхад л 24 цаг гэж тэмдэглэдэг байсан.
  it("does not treat a midnight closing time as 24 hours", () => {
    expect(status("08:00 - 24:00", ub(7))?.open).toBe(false);
    expect(status("08:00 - 24:00", ub(23, 30))?.open).toBe(true);
  });
});

describe("openStatus: open / closed", () => {
  const hours = "09:00 - 18:00";

  it("is open during the day and closes soon within 3 hours of closing", () => {
    expect(status(hours, ub(12))).toMatchObject({ open: true, tone: "open" });
    expect(status(hours, ub(17))).toMatchObject({ open: true, tone: "soon" });
  });

  it("opens exactly at the opening time and closes exactly at the closing time", () => {
    expect(status(hours, ub(9))?.open).toBe(true);
    expect(status(hours, ub(8, 59))?.open).toBe(false);
    expect(status(hours, ub(18))?.open).toBe(false);
  });

  it("says it opens tomorrow after closing, and today before opening", () => {
    expect(status(hours, ub(20))?.detail).toBe(t.closedOpensAt(true, "09:00", t.durationLong({ h: 13, m: 0 })));
    expect(status(hours, ub(7, 30))?.detail).toBe(t.closedOpensAt(false, "09:00", t.durationLong({ h: 1, m: 30 })));
  });

  it("handles places open past midnight", () => {
    const late = "20:00 - 02:00";
    expect(status(late, ub(23))?.open).toBe(true);
    expect(status(late, ub(1))?.open).toBe(true);
    expect(status(late, ub(3))?.open).toBe(false);
    expect(status(late, ub(19))?.open).toBe(false);
  });
});
