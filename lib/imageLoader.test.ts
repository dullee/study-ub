import { describe, expect, it } from "vitest";
import { canResize, imageLoader } from "@/lib/imageLoader";

describe("imageLoader: Cloudinary", () => {
  it("adds a size to a plain upload URL", () => {
    expect(imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/v1712/spots/abc.jpg", width: 640 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1712/spots/abc.jpg"
    );
  });

  it("replaces the fixed w_800 that uploads were saved with", () => {
    expect(
      imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v1712/abc.jpg", width: 384 })
    ).toBe("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_384/v1712/abc.jpg");
  });

  it("replaces chained transformations and works without a version segment", () => {
    expect(imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/w_800/c_fill,h_200/abc.jpg", width: 256 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_256/abc.jpg"
    );
  });

  it("uses the requested quality when given", () => {
    expect(imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/abc.jpg", width: 100, quality: 60 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_60,c_limit,w_100/abc.jpg"
    );
  });
});

describe("imageLoader: Unsplash", () => {
  it("sets width, quality and auto format, keeping other params", () => {
    const url = new URL(
      imageLoader({ src: "https://images.unsplash.com/photo-1?w=600&auto=format&fit=crop", width: 1080 })
    );
    expect(url.searchParams.get("w")).toBe("1080");
    expect(url.searchParams.get("q")).toBe("75");
    expect(url.searchParams.get("auto")).toBe("format");
    expect(url.searchParams.get("fit")).toBe("crop");
  });
});

describe("canResize", () => {
  it.each([
    ["https://res.cloudinary.com/demo/image/upload/abc.jpg", true],
    ["https://images.unsplash.com/photo-1", true],
    ["https://res.cloudinary.com/demo/video/upload/abc.mp4", false],
    ["https://example.com/photo.jpg", false],
    ["https://i.ytimg.com/vi/abc/hqdefault.jpg", false],
    ["blob:http://localhost:3000/1234", false],
    ["https://images.unsplash.com.evil.com/x", false],
  ])("%s → %s", (src, expected) => {
    expect(canResize(src)).toBe(expected);
  });

  it("leaves other URLs untouched", () => {
    expect(imageLoader({ src: "https://example.com/photo.jpg", width: 640 })).toBe("https://example.com/photo.jpg");
  });
});
