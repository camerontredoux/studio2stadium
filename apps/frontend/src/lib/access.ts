import { redirect } from "@tanstack/react-router";
import type { ApiSchemas } from "./api/client";
import type { Session } from "./session";

export type { Session };

export type Role = ApiSchemas["Role"];
export type Platform = ApiSchemas["PlatformName"];
export type AccountType = ApiSchemas["AccountType"];

export type Domain = `${Platform}:${AccountType}`;

type PermissionAction = "view";
type PermissionConfig = Record<Domain, ReadonlyArray<PermissionAction>>;

type InferPermissions<T extends PermissionConfig> = {
  [K in keyof T]: T[K] extends readonly (infer U)[]
    ? `${U & string}:${K & string}`
    : never;
}[keyof T];

export const makePermissions = <T extends PermissionConfig>(
  config: T,
): Array<InferPermissions<T>> => {
  return Object.entries(config).flatMap(([domain, actions]) =>
    actions.map((action) => `${action}:${domain}` as InferPermissions<T>),
  );
};

export const permissions = makePermissions({
  "core:school": ["view"],
  "core:dancer": ["view"],
  "prodigy:dancer": ["view"],
  "prodigy:school": ["view"],
} as const);

export type Permission = (typeof permissions)[number];
export type Policy = () => boolean;

type Policies = Policy[];

export const createAccess = (session: Session) => {
  const _permissions = new Set<Permission>();

  if (session.type === "dancer" && !session.platforms)
    throw new Error("Unauthorized: Dancer has no platforms");

  const platforms = session.platforms;

  for (const platform of platforms) {
    _permissions.add(`view:${platform}:${session.type}` as Permission);
  }
  // Type-safe helper to create policies
  const policy = (predicate: Policy) => session.role === "admin" || predicate();

  /**
   * @returns Boolean value indicating if the user has the permission
   */
  const can = (permission: Permission) => {
    return () => policy(() => _permissions.has(permission));
  };

  /**
   * @returns Boolean value indicating if the user is on the given platform and type
   */
  const is = (platform: Platform, type: AccountType) => () =>
    policy(() => platforms.includes(platform) && session.type === type);

  /**
   * @returns Boolean value indicating if any of the policies are met
   */
  const any = (...policies: Policies) => {
    return () => policy(() => policies.some((policy) => policy()));
  };

  /**
   * @returns Boolean value indicating if all of the policies are met
   */
  const all = (...policies: Policies) => {
    return () => policy(() => policies.every((policy) => policy()));
  };

  /**
   * Throws a redirect to `/unauthorized` if none of the policies are met
   * @param policies - The policies to check with `access.any()`
   */
  const guard = (...policies: Policies) => {
    const check = any(...policies);
    if (!check()) {
      throw redirect({ to: "/unauthorized", replace: true });
    }
  };

  /**
   * @returns Boolean value indicating if the user is viewing their own profile
   */
  const self = (username: string) => () =>
    policy(() => session.username === username);

  return {
    can,
    any,
    all,
    guard,
    self,
    is,
  };
};
