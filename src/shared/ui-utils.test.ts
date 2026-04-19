import { describe, it, expect } from "vitest";
import { maskApiKey, getBadgeColor } from "./ui-utils";

describe("maskApiKey", () => {
  it("returns empty string for empty input", () => {
    expect(maskApiKey("")).toBe("");
  });

  it("fully masks keys shorter than 8 characters", () => {
    expect(maskApiKey("abc")).toBe("***");
    expect(maskApiKey("1234567")).toBe("*******");
  });

  it("shows first 4 and last 4 for keys of exactly 8 characters", () => {
    expect(maskApiKey("abcd1234")).toBe("abcd1234");
  });

  it("masks middle characters for keys longer than 8", () => {
    expect(maskApiKey("sk-abcdefghxyz1")).toBe("sk-a*******xyz1");
  });

  it("handles a typical API key", () => {
    const key = "sk-proj-abc123def456ghi789";
    const masked = maskApiKey(key);
    expect(masked.slice(0, 4)).toBe("sk-p");
    expect(masked.slice(-4)).toBe("i789");
    expect(masked.length).toBe(key.length);
  });
});

describe("getBadgeColor", () => {
  it("returns null when session is not active", () => {
    expect(getBadgeColor(false, false)).toBeNull();
    expect(getBadgeColor(false, true)).toBeNull();
  });

  it("returns green when active and not on distraction site", () => {
    expect(getBadgeColor(true, false)).toEqual({ color: "#22C55E", text: "✓" });
  });

  it("returns red when active and on distraction site", () => {
    expect(getBadgeColor(true, true)).toEqual({ color: "#EF4444", text: "!" });
  });
});
