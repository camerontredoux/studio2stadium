import * as React from "react";

export type ProfileContextValue = {
  /** True if viewing your own profile */
  isOwner: boolean;
  /** True when in preview mode (seeing profile as others see it) */
  isPreview: boolean;
  /** True when showing user is the owner and not in preview mode */
  showOwnerControls: boolean;
};

export const ProfileContext = React.createContext<ProfileContextValue | null>(
  null,
);
