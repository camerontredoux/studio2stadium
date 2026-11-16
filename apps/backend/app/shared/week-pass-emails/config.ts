import type { WeekPassEmailKind } from "#database/schema/week-pass-emails";
import env from "#start/env";
import { IANAZone } from "luxon";

export const DEFAULT_WEEK_PASS_EMAIL_TIMEZONE = "America/Denver";
export const DEFAULT_WEEK_PASS_EMAIL_ASSET_BASE_URL =
  "https://studio2stadium.com/img/week-pass";

export interface WeekPassEmailKindConfig {
  /** The switch is on. */
  enabled: boolean;
  /** The switch is on and nothing it needs is missing. */
  active: boolean;
  /** What stops the email from activating, by setting name. Empty when ready. */
  problems: string[];
}

export interface WeekPassEmailConfig {
  welcome: WeekPassEmailKindConfig;
  expired: WeekPassEmailKindConfig;
  activeFrom: Date | null;
  timezone: string;
  postalAddress: string | null;
  assetBaseUrl: string;
}

function parseInstant(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  // Only a full ISO 8601 instant with a zone; a bare date would depend on the
  // server's time zone.
  if (!/T.*(Z|[+-]\d{2}:?\d{2})$/.test(value.trim())) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Reads the Week Pass email settings. Fails closed: an email is active only
 * when its own switch is on and every setting it needs is present and valid.
 * Read on every call, so a changed setting needs no restart in tests.
 */
export function weekPassEmailConfig(): WeekPassEmailConfig {
  const activeFrom = parseInstant(env.get("WEEK_PASS_EMAILS_ACTIVE_FROM"));
  const timezone =
    env.get("WEEK_PASS_EMAILS_TIMEZONE")?.trim() ||
    DEFAULT_WEEK_PASS_EMAIL_TIMEZONE;
  const postalAddress = env.get("MAIL_POSTAL_ADDRESS")?.trim() || null;
  const suppressionImportedAt = parseInstant(
    env.get("EMAIL_SUPPRESSION_IMPORTED_AT")
  );

  const shared: string[] = [];
  if (!activeFrom) {
    shared.push(
      "WEEK_PASS_EMAILS_ACTIVE_FROM is missing or not an ISO 8601 instant with a zone"
    );
  }
  if (!postalAddress) {
    shared.push(
      "MAIL_POSTAL_ADDRESS is missing (the business's physical postal address)"
    );
  }
  // Both emails honor opt-outs, so neither may go out before the Sender and
  // SES suppression history is in email_suppressions.
  if (!suppressionImportedAt) {
    shared.push(
      "EMAIL_SUPPRESSION_IMPORTED_AT is missing: import the Sender and SES suppression history into email_suppressions first"
    );
  }
  if (!IANAZone.isValidZone(timezone)) {
    shared.push(`WEEK_PASS_EMAILS_TIMEZONE "${timezone}" is not an IANA zone`);
  }

  const kind = (enabled: boolean): WeekPassEmailKindConfig => {
    const problems = [...shared];
    return { enabled, active: enabled && problems.length === 0, problems };
  };

  return {
    welcome: kind(env.get("WEEK_PASS_WELCOME_EMAIL_ENABLED") === true),
    expired: kind(env.get("WEEK_PASS_EXPIRED_EMAIL_ENABLED") === true),
    activeFrom,
    timezone,
    postalAddress,
    assetBaseUrl: (
      env.get("WEEK_PASS_EMAIL_ASSET_BASE_URL")?.trim() ||
      DEFAULT_WEEK_PASS_EMAIL_ASSET_BASE_URL
    ).replace(/\/$/, ""),
  };
}

export function activeKinds(config: WeekPassEmailConfig): WeekPassEmailKind[] {
  return (["welcome", "expired"] as const).filter((k) => config[k].active);
}
