import type { ApiSchemas } from "../api/client";

export type Role = ApiSchemas["Role"];
export type Platform = ApiSchemas["PlatformName"];
export type AccountType = ApiSchemas["AccountType"];

export type Domain = `${Platform}:${AccountType}`;
