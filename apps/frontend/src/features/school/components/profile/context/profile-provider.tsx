import React from "react";
import { ProfileContext } from "./profile-context";

type ProfileProviderProps = {
  username: string;
  isOwner: boolean;
  isPreview: boolean;
  children: React.ReactNode;
};

export function ProfileProvider({
  username,
  isOwner,
  isPreview,
  children,
}: ProfileProviderProps) {
  const value = React.useMemo(
    () => ({
      username,
      isOwner,
      isPreview,
      showOwnerControls: isOwner && !isPreview,
    }),
    [username, isOwner, isPreview],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
