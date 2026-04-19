import type { DistractionCategory, SiteListMap } from "./types";
import { validateDomain } from "./url-utils";

/**
 * Adds a domain to a distraction category in the site list map.
 * Returns a new SiteListMap (immutable — does not mutate input).
 * Defaults to "custom" category if none specified.
 */
export function addSiteToCategory(
  siteLists: SiteListMap,
  domain: string,
  category?: DistractionCategory
): { success: boolean; siteLists: SiteListMap; error?: string } {
  if (!validateDomain(domain)) {
    return { success: false, siteLists, error: "Invalid domain" };
  }

  const targetCategory: DistractionCategory = category ?? "custom";
  const currentList = siteLists[targetCategory] ?? [];

  if (currentList.includes(domain)) {
    return {
      success: false,
      siteLists,
      error: `Domain already exists in ${targetCategory}`,
    };
  }

  const newSiteLists: SiteListMap = {
    ...siteLists,
    [targetCategory]: [...currentList, domain],
  };

  return { success: true, siteLists: newSiteLists };
}

/**
 * Removes a domain from a distraction category in the site list map.
 * Returns a new SiteListMap (immutable — does not mutate input).
 * If the domain is not found, returns the unchanged siteLists.
 */
export function removeSiteFromCategory(
  siteLists: SiteListMap,
  domain: string,
  category: DistractionCategory
): SiteListMap {
  const currentList = siteLists[category] ?? [];

  if (!currentList.includes(domain)) {
    return siteLists;
  }

  return {
    ...siteLists,
    [category]: currentList.filter((d) => d !== domain),
  };
}
