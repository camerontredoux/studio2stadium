import type { ApiSchemas } from "../api/client";

export type Role = ApiSchemas["AuthSessionResponse"]["role"];
export type Platform = ApiSchemas["AuthSessionResponse"]["platforms"][number];
export type AccountType = ApiSchemas["AuthSessionResponse"]["type"];

export type Domain = `${Platform}:${AccountType}`;
