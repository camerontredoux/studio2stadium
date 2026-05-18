import { useTernaryDarkMode } from "usehooks-ts";

export const ORG_THEME_STORAGE_KEY = "org-theme";

export function useOrgTheme() {
  return useTernaryDarkMode({
    localStorageKey: ORG_THEME_STORAGE_KEY,
    defaultValue: "light",
  });
}
