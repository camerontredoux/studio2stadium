import React from "react";
import { ProfileContext } from "./profile-context";

type ProfileProviderProps = {
  isOwner: boolean;
  isPreview: boolean;
  children: React.ReactNode;
};

export function ProfileProvider({
  isOwner,
  isPreview,
  children,
}: ProfileProviderProps) {
  const value = React.useMemo(
    () => ({ isOwner, isPreview, showOwnerControls: isOwner && !isPreview }),
    [isOwner, isPreview],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
