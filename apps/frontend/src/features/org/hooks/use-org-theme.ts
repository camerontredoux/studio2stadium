import { useTernaryDarkMode, type TernaryDarkMode } from "usehooks-ts";

export const ORG_THEME_STORAGE_KEY = "org-theme";

/**
 * Used until the person picks a theme. Dark: the S2S dashboard was designed
 * dark-first, and before the light palette existed every org page rendered
 * dark whatever was stored, so people who never chose see no change.
 */
export const ORG_THEME_DEFAULT: TernaryDarkMode = "dark";

export type OrgTheme = TernaryDarkMode;

/** The org pages' Light / Dark / System setting (localStorage `org-theme`). */
export function useOrgTheme() {
  return useTernaryDarkMode({
    localStorageKey: ORG_THEME_STORAGE_KEY,
    defaultValue: ORG_THEME_DEFAULT,
  });
}
