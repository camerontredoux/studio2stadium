import { format } from "date-fns";

import type { RosterEntry } from "@/features/org/api/roster-queries";
import type { ApiSchemas } from "@/lib/api/client";

export type RosterField =
  | "bibNumber"
  | "firstName"
  | "lastName"
  | "email"
  | "organization"
  | "gradYear"
  | "gpa";

/** Form state as typed: every field is the input's string, parsed on save. */
export type RosterFormValues = Record<RosterField, string>;
export type RosterFieldErrors = Partial<Record<RosterField, string>>;
export type RosterPatch = ApiSchemas["OrgsIdEventsIdRostersIdRequest"];
export type DancerCallback =
  ApiSchemas["OrgsIdAdminDancersIdCallbacksResponse"][number];

type EntryShape = Pick<
  RosterEntry,
  | "type"
  | "isRegistered"
  | "bibNumber"
  | "firstName"
  | "lastName"
  | "email"
  | "organization"
  | "profile"
>;

/**
 * The fields an admin may change. Registered entries belong to the person's
 * own profile: a registered dancer keeps only the bib, a registered coach
 * nothing (the backend rejects anything else with ROSTER_ACTIVE_READONLY).
 */
export function editableFields(
  entry: Pick<EntryShape, "type" | "isRegistered">,
): RosterField[] {
  if (entry.type === "dancer") {
    return entry.isRegistered
      ? ["bibNumber"]
      : ["bibNumber", "firstName", "lastName", "email", "gradYear", "gpa"];
  }
  return entry.isRegistered
    ? []
    : ["firstName", "lastName", "email", "organization"];
}

export function formFromEntry(entry: EntryShape): RosterFormValues {
  return {
    bibNumber: entry.bibNumber?.toString() ?? "",
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    organization: entry.organization ?? "",
    gradYear: entry.profile?.gradYear?.toString() ?? "",
    gpa: entry.profile?.gpa?.toString() ?? "",
  };
}

/** The editable fields whose trimmed value differs from the saved one. */
export function changedFields(
  saved: RosterFormValues,
  values: RosterFormValues,
  fields: RosterField[],
): RosterField[] {
  return fields.filter((f) => values[f].trim() !== saved[f].trim());
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the backend validator, for the fields being saved. */
export function validateRosterFields(
  values: RosterFormValues,
  fields: RosterField[],
): RosterFieldErrors {
  const errors: RosterFieldErrors = {};
  for (const field of fields) {
    const value = values[field].trim();
    switch (field) {
      case "firstName":
        if (!value) errors.firstName = "Enter a first name.";
        break;
      case "lastName":
        if (!value) errors.lastName = "Enter a last name.";
        break;
      case "email":
        if (!EMAIL.test(value)) errors.email = "Enter a valid email.";
        break;
      case "bibNumber":
        if (value && !(/^\d+$/.test(value) && Number(value) > 0)) {
          errors.bibNumber = "Use a whole number above 0.";
        }
        break;
      case "gradYear": {
        const year = Number(value);
        if (value && !(/^\d{4}$/.test(value) && year >= 1900 && year <= 2100)) {
          errors.gradYear = "Use a year from 1900 to 2100.";
        }
        break;
      }
      case "gpa": {
        const gpa = Number(value);
        if (value && !(Number.isFinite(gpa) && gpa >= 0 && gpa <= 5)) {
          errors.gpa = "Use a number from 0 to 5.";
        }
        break;
      }
      case "organization":
        break;
    }
  }
  return errors;
}

const toNumber = (value: string) => (value.trim() ? Number(value) : null);

/** The PATCH body for the changed fields only, so the audit log records just those. */
export function buildRosterPatch(
  values: RosterFormValues,
  fields: RosterField[],
): RosterPatch {
  const patch: RosterPatch = {};
  const profile: NonNullable<RosterPatch["profile"]> = {};
  for (const field of fields) {
    const value = values[field].trim();
    if (field === "bibNumber") patch.bibNumber = toNumber(value);
    else if (field === "gradYear") profile.gradYear = toNumber(value);
    else if (field === "gpa") profile.gpa = toNumber(value);
    else if (field === "organization") patch.organization = value || null;
    else patch[field] = value;
  }
  if (Object.keys(profile).length > 0) patch.profile = profile;
  return patch;
}

const FIELD_FROM_API: Record<string, RosterField> = {
  bibNumber: "bibNumber",
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  organization: "organization",
  "profile.gradYear": "gradYear",
  "profile.gpa": "gpa",
};

type ApiErrorLike = {
  code?: string;
  message?: string;
  errors?: { field: string; message: string }[];
};

/**
 * Splits a failed save into messages under the fields they belong to and one
 * line for the error toast.
 */
export function mapRosterSaveError(err: unknown): {
  fieldErrors: RosterFieldErrors;
  message: string;
} {
  if (err instanceof TypeError) {
    return {
      fieldErrors: {},
      message: "Something went wrong. Check your connection.",
    };
  }
  const error = (err ?? {}) as ApiErrorLike;
  const fieldErrors: RosterFieldErrors = {};
  for (const e of error.errors ?? []) {
    const field = FIELD_FROM_API[e.field];
    if (field && !fieldErrors[field]) fieldErrors[field] = e.message;
  }
  if (error.code === "ROSTER_BIB_CONFLICT") {
    fieldErrors.bibNumber = "Another entry already has this bib.";
  }
  if (error.code === "ROSTER_EMAIL_CONFLICT") {
    fieldErrors.email = "Another entry already uses this email.";
  }
  const message =
    Object.values(fieldErrors)[0] ??
    error.errors?.[0]?.message ??
    (error.message || "Request failed");
  return { fieldErrors, message };
}

export function initials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const letters = `${firstName?.trim()[0] ?? ""}${lastName?.trim()[0] ?? ""}`;
  return letters.toUpperCase() || "?";
}

/** 24-hour local clock time, "10:12". */
export function clockTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function checkInSummary(checkedInAt: string | null | undefined): string {
  return checkedInAt
    ? `Checked in ${clockTime(checkedInAt)}`
    : "Not checked in";
}

/**
 * One chip per school: "UCLA · Showcase 3", with "+N" when the school called
 * the dancer back in more showcases. Falls back to the coach's name when the
 * coach has no school on the roster.
 */
export function callbackChipLabel(callback: DancerCallback): string {
  const school =
    callback.organization?.trim() ||
    `${callback.firstName} ${callback.lastName}`.trim();
  const more = callback.showcaseNumbers.length - 1;
  return `${school} · Showcase ${callback.latestShowcaseNumber}${more > 0 ? ` +${more}` : ""}`;
}

export function callbackChipTitle(callback: DancerCallback): string {
  const showcases = callback.showcaseNumbers.join(", ");
  const published =
    callback.releasedCount === callback.callbackCount
      ? "published"
      : `${callback.releasedCount} of ${callback.callbackCount} published`;
  return `Showcase ${showcases} · ${published}`;
}
