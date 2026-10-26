import { useTernaryDarkMode, type TernaryDarkMode } from "usehooks-ts";

export const ORG_THEME_STORAGE_KEY = "org-theme";

/**
 * Used until the person picks a theme. The hook only writes `org-theme` when
 * someone picks, so an empty key means "never chose" and stored choices (dark
 * included) win. Keep the inline script in `index.html` in step with this.
 */
export const ORG_THEME_DEFAULT: TernaryDarkMode = "light";

export type OrgTheme = TernaryDarkMode;

/** The org pages' Light / Dark / System setting (localStorage `org-theme`). */
export function useOrgTheme() {
  return useTernaryDarkMode({
    localStorageKey: ORG_THEME_STORAGE_KEY,
    defaultValue: ORG_THEME_DEFAULT,
  });
}
