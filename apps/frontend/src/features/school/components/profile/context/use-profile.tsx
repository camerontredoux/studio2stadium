import React from "react";
import { ProfileContext } from "./profile-context";

export function useProfile() {
  const context = React.useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
