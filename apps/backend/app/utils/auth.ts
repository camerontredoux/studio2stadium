import { HttpContext } from "@adonisjs/core/http";

export function isAdmin(): boolean {
  const ctx = HttpContext.get();
  const user = ctx?.auth?.user;
  return user?.role === "admin" || user?.role === "prodigy_admin";
}
