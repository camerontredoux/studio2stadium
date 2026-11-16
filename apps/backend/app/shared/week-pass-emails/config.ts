import type { WeekPassEmailKind } from "#database/schema/week-pass-emails";
import env from "#start/env";
import {
  WEEK_PASS_ASSETS,
  weekPassAssetUrl,
  type WeekPassAssetName,
  type WeekPassAssetUrls,
} from "@stos/emails";
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
  /** Explicit image URLs from WEEK_PASS_EMAIL_ASSETS. */
  assets: WeekPassAssetUrls;
}

const ASSET_NAMES = new Set<string>([
  ...WEEK_PASS_ASSETS.welcome,
  ...WEEK_PASS_ASSETS.expired,
]);

/**
 * Read WEEK_PASS_EMAIL_ASSETS: a JSON object of image file name to https
 * URL. Anything malformed is a problem and contributes no URLs.
 */
export function parseAssetMap(raw: string | undefined): {
  assets: WeekPassAssetUrls;
  problems: string[];
} {
  if (!raw?.trim()) return { assets: {}, problems: [] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {
      assets: {},
      problems: ["WEEK_PASS_EMAIL_ASSETS is not valid JSON"],
    };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return {
      assets: {},
      problems: ["WEEK_PASS_EMAIL_ASSETS must be a JSON object"],
    };
  }
  const problems: string[] = [];
  const assets: WeekPassAssetUrls = {};
  for (const [name, url] of Object.entries(data)) {
    if (!ASSET_NAMES.has(name)) {
      problems.push(`WEEK_PASS_EMAIL_ASSETS names an unknown image "${name}"`);
      continue;
    }
    if (typeof url !== "string" || !isHttpsUrl(url)) {
      problems.push(`WEEK_PASS_EMAIL_ASSETS "${name}" is not an https URL`);
      continue;
    }
    assets[name as WeekPassAssetName] = url;
  }
  return { assets: problems.length ? {} : assets, problems };
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
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
  const explicitBase = env.get("WEEK_PASS_EMAIL_ASSET_BASE_URL")?.trim();
  const assetBaseUrl = (
    explicitBase || DEFAULT_WEEK_PASS_EMAIL_ASSET_BASE_URL
  ).replace(/\/$/, "");
  const assetMap = parseAssetMap(env.get("WEEK_PASS_EMAIL_ASSETS"));

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
  // Every attempt asks Sender whether the recipient opted out there.
  if (!env.get("SENDER_API_TOKEN")?.trim()) {
    shared.push(
      "SENDER_API_TOKEN is not set (needed for the send-time Sender opt-out check)"
    );
  }
  shared.push(...assetMap.problems);
  if (explicitBase && !isHttpsUrl(explicitBase)) {
    shared.push("WEEK_PASS_EMAIL_ASSET_BASE_URL is not an https URL");
  }
  if (!IANAZone.isValidZone(timezone)) {
    shared.push(`WEEK_PASS_EMAILS_TIMEZONE "${timezone}" is not an IANA zone`);
  }

  // Each image an email shows must be hosted somewhere real: named in
  // WEEK_PASS_EMAIL_ASSETS, or under an explicitly set base URL. The
  // built-in default base has nothing uploaded to it.
  const missingImages = (names: readonly WeekPassAssetName[]) =>
    names
      .filter((name) => !assetMap.assets[name] && !explicitBase)
      .map(
        (name) =>
          `image "${name}" has no hosted URL (WEEK_PASS_EMAIL_ASSETS or WEEK_PASS_EMAIL_ASSET_BASE_URL)`
      );

  const kind = (
    enabled: boolean,
    images: readonly WeekPassAssetName[]
  ): WeekPassEmailKindConfig => {
    const problems = [...shared, ...missingImages(images)];
    return { enabled, active: enabled && problems.length === 0, problems };
  };

  return {
    welcome: kind(
      env.get("WEEK_PASS_WELCOME_EMAIL_ENABLED") === true,
      WEEK_PASS_ASSETS.welcome
    ),
    expired: kind(
      env.get("WEEK_PASS_EXPIRED_EMAIL_ENABLED") === true,
      WEEK_PASS_ASSETS.expired
    ),
    activeFrom,
    timezone,
    postalAddress,
    assetBaseUrl,
    assets: assetMap.assets,
  };
}

export function activeKinds(config: WeekPassEmailConfig): WeekPassEmailKind[] {
  return (["welcome", "expired"] as const).filter((k) => config[k].active);
}

/** The URL an email will use for one image under this configuration. */
export function configuredAssetUrl(
  config: Pick<WeekPassEmailConfig, "assetBaseUrl" | "assets">,
  name: WeekPassAssetName
) {
  return weekPassAssetUrl(name, config.assetBaseUrl, config.assets);
}
