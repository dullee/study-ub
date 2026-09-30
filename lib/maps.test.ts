import { describe, expect, it } from "vitest";
import { isShortMapsLink, parseMapsLink } from "@/lib/maps";

describe("parseMapsLink", () => {
  it("prefers the place's pin (!3d…!4d…) over the map centre (@…)", () => {
    const link =
      "https://www.google.com/maps/place/Cafe+Bene/@47.9230000,106.8700000,17z/data=!3m1!4b1!4m6!3m5!1s0x5d96:0x1!8m2!3d47.9231692!4d106.8784409!16s";
    expect(parseMapsLink(link)).toEqual({ lat: 47.9231692, lng: 106.8784409, name: "Cafe Bene" });
  });

  it("decodes Cyrillic place names", () => {
    const name = encodeURIComponent("Оюутан зоог").replace("%20", "+");
    const link = `https://www.google.com/maps/place/${name}/@47.92,106.92,17z/data=!3d47.9218635!4d106.9258556`;
    expect(parseMapsLink(link)?.name).toBe("Оюутан зоог");
  });

  it.each([
    ["https://maps.google.com/?q=47.9188,106.9176", 47.9188, 106.9176],
    ["https://www.google.com/maps?ll=47.9188,106.9176&z=15", 47.9188, 106.9176],
    ["https://www.google.com/maps/dir/?api=1&destination=47.9188,106.9176", 47.9188, 106.9176],
    ["https://www.google.com/maps/search/47.9188,+106.9176", 47.9188, 106.9176],
    ["https://www.google.com/maps/place/47.9188,106.9176", 47.9188, 106.9176],
    ["https://www.google.com/maps/@47.9188,106.9176,15z", 47.9188, 106.9176],
    ["https://www.google.com/maps?q=loc:-33.8688+151.2093", -33.8688, 151.2093],
  ])("reads coordinates from %s", (link, lat, lng) => {
    expect(parseMapsLink(link)).toMatchObject({ lat, lng });
  });

  it("does not use coordinates as the place name", () => {
    expect(parseMapsLink("https://www.google.com/maps/place/47.9188,106.9176")?.name).toBeUndefined();
  });

  it("follows the real link on Google's cookie consent page", () => {
    const inner = encodeURIComponent("https://www.google.com/maps?q=47.9188,106.9176");
    expect(parseMapsLink(`https://consent.google.com/m?continue=${inner}`)).toMatchObject({
      lat: 47.9188,
      lng: 106.9176,
    });
  });

  it.each([
    "not a url",
    "https://www.google.com/maps/place/Cafe+Bene",
    "https://maps.app.goo.gl/AbCdEf123",
    "https://www.google.com/maps?q=95,106.9",
    "https://www.google.com/maps?q=47.9,200",
  ])("returns null when there are no valid coordinates: %s", (link) => {
    expect(parseMapsLink(link)).toBeNull();
  });
});

describe("isShortMapsLink", () => {
  it.each([
    ["https://maps.app.goo.gl/AbCdEf123", true],
    ["https://goo.gl/maps/AbCdEf123", true],
    ["https://goo.gl/other", false],
    ["https://www.google.com/maps?q=1,2", false],
    ["https://maps.app.goo.gl.evil.com/x", false],
    ["nonsense", false],
  ])("%s → %s", (link, expected) => {
    expect(isShortMapsLink(link)).toBe(expected);
  });
});
