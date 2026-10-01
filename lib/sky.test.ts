import { describe, expect, it } from "vitest";
import { skyState, SKY_INLINE_SCRIPT } from "@/lib/sky";

// Улаанбаатарын цагаар (UTC+8) огноо, цаг.
const ub = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour - 8, minute);

describe("skyState", () => {
  it("gives long summer days and short winter days", () => {
    const june = skyState(ub(6, 21, 12));
    const december = skyState(ub(12, 21, 12));
    expect((june.sunset - june.sunrise) / 60).toBeGreaterThan(15);
    expect((december.sunset - december.sunrise) / 60).toBeLessThan(9);
  });

  it("is day at noon and night at 2am", () => {
    expect(skyState(ub(9, 30, 13)).phase).toBe("day");
    expect(skyState(ub(9, 30, 2)).phase).toBe("night");
  });

  it("is already dark at 18:00 in December but still day in June", () => {
    expect(skyState(ub(12, 21, 18)).phase).toBe("night");
    expect(skyState(ub(6, 21, 18)).phase).toBe("day");
  });

  it("has a dusk window around sunset", () => {
    const s = skyState(ub(9, 30, 12));
    const atSunset = s.sunset;
    expect(skyState(ub(9, 30, Math.floor(atSunset / 60), atSunset % 60)).phase).toBe("dusk");
  });

  it("casts shadows west in the morning, east in the evening, none at night", () => {
    expect(skyState(ub(9, 30, 9)).sunX).toBeLessThan(0);
    expect(skyState(ub(9, 30, 17)).sunX).toBeGreaterThan(0);
    expect(skyState(ub(9, 30, 2)).sunX).toBe(0);
  });

  it("ships a self-contained inline script", () => {
    // The script must run with no imports: evaluate it against a fake document.
    const root = { dataset: {} as Record<string, string>, style: { props: {} as Record<string, string>, setProperty(k: string, v: string) { this.props[k] = v; } } };
    new Function("document", SKY_INLINE_SCRIPT)({ documentElement: root });
    expect(["dawn", "day", "dusk", "night"]).toContain(root.dataset.sky);
    expect(root.style.props["--sun-x"]).toMatch(/^-?\d+px$/);
  });
});
