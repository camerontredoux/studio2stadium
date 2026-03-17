import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

const sortableColumns = [
  "createdAt",
  "location",
  "gpa",
  "gradYear",
  "username",
  "firstName",
  "lastName",
  "verified",
  "email",
] as const;

export const validator = vine.create(
  vine.object({
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(100).optional(),
    sortBy: vine.enum(sortableColumns).optional(),
    sortDirection: vine.enum(["asc", "desc"]).optional(),
  })
);

export type Validator = Infer<typeof validator>;
export type SortableColumn = (typeof sortableColumns)[number];
