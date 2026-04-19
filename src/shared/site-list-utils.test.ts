import { describe, it, expect } from "vitest";
import { addSiteToCategory, removeSiteFromCategory } from "./site-list-utils";
import type { SiteListMap } from "./types";

const emptySiteLists: SiteListMap = {
  "social-media": [],
  entertainment: [],
  news: [],
  gaming: [],
  shopping: [],
  custom: [],
};

describe("addSiteToCategory", () => {
  it("adds a valid domain to the specified category", () => {
    const result = addSiteToCategory(emptySiteLists, "example.com", "news");
    expect(result.success).toBe(true);
    expect(result.siteLists.news).toContain("example.com");
    expect(result.error).toBeUndefined();
  });

  it("defaults to custom category when none specified", () => {
    const result = addSiteToCategory(emptySiteLists, "mysite.org");
    expect(result.success).toBe(true);
    expect(result.siteLists.custom).toContain("mysite.org");
  });

  it("rejects invalid domains", () => {
    const result = addSiteToCategory(emptySiteLists, "no-tld");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid domain");
    expect(result.siteLists).toBe(emptySiteLists);
  });

  it("rejects empty string", () => {
    const result = addSiteToCategory(emptySiteLists, "");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid domain");
  });

  it("rejects domain with spaces", () => {
    const result = addSiteToCategory(emptySiteLists, "my site.com");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid domain");
  });

  it("returns error when domain already exists in category", () => {
    const lists: SiteListMap = {
      ...emptySiteLists,
      "social-media": ["facebook.com"],
    };
    const result = addSiteToCategory(lists, "facebook.com", "social-media");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Domain already exists in social-media");
    expect(result.siteLists).toBe(lists);
  });

  it("does not mutate the input siteLists", () => {
    const original: SiteListMap = { ...emptySiteLists };
    const originalCustom = [...original.custom];
    addSiteToCategory(original, "test.com");
    expect(original.custom).toEqual(originalCustom);
  });
});

describe("removeSiteFromCategory", () => {
  it("removes an existing domain from the category", () => {
    const lists: SiteListMap = {
      ...emptySiteLists,
      news: ["cnn.com", "bbc.com"],
    };
    const result = removeSiteFromCategory(lists, "cnn.com", "news");
    expect(result.news).toEqual(["bbc.com"]);
  });

  it("returns unchanged siteLists when domain not found", () => {
    const result = removeSiteFromCategory(emptySiteLists, "nothere.com", "news");
    expect(result).toBe(emptySiteLists);
  });

  it("does not mutate the input siteLists", () => {
    const lists: SiteListMap = {
      ...emptySiteLists,
      custom: ["test.com"],
    };
    const originalCustom = [...lists.custom];
    removeSiteFromCategory(lists, "test.com", "custom");
    expect(lists.custom).toEqual(originalCustom);
  });
});
