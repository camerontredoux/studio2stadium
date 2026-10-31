import type { RosterType } from "@/features/org/api/roster-queries";
import type { ApiSchemas } from "@/lib/api/client";

export type AddRosterField =
  | "bibNumber"
  | "firstName"
  | "lastName"
  | "email"
  | "organization"
  | "paid";

/** Form state as typed; `paid` is "", "paid" or "unpaid". */
export type AddRosterValues = Record<AddRosterField, string>;
export type AddRosterErrors = Partial<Record<AddRosterField, string>>;
export type AddRosterBody = ApiSchemas["OrgsIdEventsIdRostersRequest"];

export const EMPTY_ADD_VALUES: AddRosterValues = {
  bibNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  organization: "",
  paid: "",
};

/**
 * The fields the form asks for: the CSV upload's required columns for this
 * type. A linked account brings its own email, so the email field goes.
 */
export function addRosterFields(
  type: RosterType,
  opts: { freeTier: boolean; linked: boolean },
): AddRosterField[] {
  const fields: AddRosterField[] =
    type === "dancer"
      ? ["bibNumber", "firstName", "lastName"]
      : ["firstName", "lastName"];
  if (!opts.linked) fields.push("email");
  if (type === "coach") fields.push("organization");
  if (type === "dancer" && opts.freeTier) fields.push("paid");
  return fields;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the backend: every field the form shows is required. */
export function validateAddRoster(
  values: AddRosterValues,
  fields: AddRosterField[],
): AddRosterErrors {
  const errors: AddRosterErrors = {};
  for (const field of fields) {
    const value = values[field].trim();
    switch (field) {
      case "bibNumber":
        if (!(/^\d+$/.test(value) && Number(value) > 0)) {
          errors.bibNumber = "Use a whole number above 0.";
        }
        break;
      case "firstName":
        if (!value) errors.firstName = "Enter a first name.";
        break;
      case "lastName":
        if (!value) errors.lastName = "Enter a last name.";
        break;
      case "email":
        if (!EMAIL.test(value)) errors.email = "Enter a valid email.";
        break;
      case "organization":
        if (!value) errors.organization = "Enter a school.";
        break;
      case "paid":
        if (!value) errors.paid = "Choose paid or unpaid.";
        break;
    }
  }
  return errors;
}

export function buildAddRosterBody(
  type: RosterType,
  values: AddRosterValues,
  fields: AddRosterField[],
  account: { id: string; email: string } | null,
): AddRosterBody {
  const body: AddRosterBody = {
    type,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: account?.email ?? values.email.trim(),
  };
  if (fields.includes("bibNumber")) body.bibNumber = Number(values.bibNumber);
  if (fields.includes("organization")) {
    body.organization = values.organization.trim();
  }
  if (fields.includes("paid")) body.paid = values.paid === "paid";
  if (account) body.userId = account.id;
  return body;
}

type ApiErrorLike = {
  code?: string;
  message?: string;
  field?: string;
  errors?: { field: string; message: string }[];
};

const API_FIELDS = new Set<string>(Object.keys(EMPTY_ADD_VALUES));

/** Splits a failed add into messages under its fields and one toast line. */
export function mapAddRosterError(
  err: unknown,
  linked: boolean,
): { fieldErrors: AddRosterErrors; message: string } {
  if (err instanceof TypeError) {
    return {
      fieldErrors: {},
      message: "Something went wrong. Check your connection.",
    };
  }
  const error = (err ?? {}) as ApiErrorLike;
  const fieldErrors: AddRosterErrors = {};
  for (const e of error.errors ?? []) {
    if (API_FIELDS.has(e.field) && !fieldErrors[e.field as AddRosterField]) {
      fieldErrors[e.field as AddRosterField] = e.message;
    }
  }
  let message: string | undefined;
  switch (error.code) {
    case "ROSTER_BIB_CONFLICT":
      fieldErrors.bibNumber = "Another entry already has this bib.";
      break;
    case "ROSTER_EMAIL_CONFLICT":
      if (linked) message = "This account's email is already on the roster.";
      else fieldErrors.email = "This email is already on the roster.";
      break;
    case "ROSTER_ACCOUNT_TAKEN":
      message = "This account is already on the roster.";
      break;
    case "ROSTER_ROLE_CONFLICT":
      if (linked) message = error.message;
      else fieldErrors.email = error.message;
      break;
  }
  return {
    fieldErrors,
    message:
      message ??
      Object.values(fieldErrors)[0] ??
      error.errors?.[0]?.message ??
      (error.message || "Request failed"),
  };
}
