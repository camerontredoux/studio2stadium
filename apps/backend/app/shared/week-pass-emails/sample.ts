import {
  isValidAddress,
  normalizeAddress,
} from "#shared/email-suppressions/parse";
import env from "#start/env";
import type { BaseMail } from "@adonisjs/mail";
import { IANAZone } from "luxon";
import { WEEK_PASS_ASSETS } from "@stos/emails";
import { configuredAssetUrl, type WeekPassEmailConfig } from "./config.ts";
import { WeekPassWelcomeMail } from "./mails.ts";
import { formatEmailDate } from "./schedule.ts";

/**
 * Internal samples of the Week Pass welcome, for checking the real email in a
 * real mailbox before launch. Built only from fake data: no customer is looked
 * up, nothing is read from or written to the database, and no welcome is
 * recorded as owed. The links, postal address and images come from the
 * running configuration, so the sample shows what customers would get.
 */

export type SampleVariant = "current" | "queued";

/** Fake recipient details. The user id matches no account. */
export const SAMPLE_USER = {
  userId: "00000000-0000-4000-8000-000000000000",
  firstName: "Sample",
  username: "sample-dancer",
};

/** Header marking the message as an internal sample. */
export const SAMPLE_HEADER = "X-S2S-Internal-Sample";

const DAY_MS = 86_400_000;

export interface SamplePlan {
  to: string;
  from: string;
  variants: {
    variant: SampleVariant;
    subject: string;
    startsAt: string;
    accessEndsAt: string;
  }[];
  links: {
    profile: string;
    preferences: string;
    unsubscribe: string;
  };
  images: { name: string; url: string }[];
  postalAddressConfigured: boolean;
  timezone: string;
  /** What stops a send. Empty when a send would be allowed. */
  problems: string[];
}

export function sampleDates(variant: SampleVariant, now: Date) {
  // A queued pass starts when the current one ends, three days from now.
  const startsAt =
    variant === "current" ? now : new Date(now.getTime() + 3 * DAY_MS);
  return {
    startsAt,
    accessEndsAt: new Date(startsAt.getTime() + 7 * DAY_MS),
  };
}

export function buildSampleMail(
  variant: SampleVariant,
  to: string,
  config: WeekPassEmailConfig,
  now: Date
): WeekPassWelcomeMail {
  const { startsAt, accessEndsAt } = sampleDates(variant, now);
  const mail = new WeekPassWelcomeMail({
    ...SAMPLE_USER,
    email: to,
    variant,
    startsAt,
    accessEndsAt,
    timezone: config.timezone,
    postalAddress:
      config.postalAddress ?? "[MAIL_POSTAL_ADDRESS is not configured]",
    assetBaseUrl: config.assetBaseUrl,
    assets: config.assets,
  });
  return mail;
}

/**
 * Check a requested sample against the safety rules and describe exactly
 * what would be sent.
 */
export function planSamples(
  requestedTo: string,
  variants: SampleVariant[],
  config: WeekPassEmailConfig,
  now: Date
): SamplePlan {
  const problems: string[] = [];
  const to = normalizeAddress(requestedTo);

  if (!isValidAddress(to) || /[\s,;]/.test(requestedTo.trim())) {
    problems.push("--to must be exactly one email address");
  }

  const allowed = env.get("WEEK_PASS_SAMPLE_RECIPIENT")?.trim();
  if (!allowed) {
    problems.push(
      "WEEK_PASS_SAMPLE_RECIPIENT is not set: name the one internal mailbox allowed to receive samples"
    );
  } else if (normalizeAddress(allowed) !== to) {
    problems.push(
      "--to does not exactly match WEEK_PASS_SAMPLE_RECIPIENT; samples go only to that mailbox"
    );
  }

  if (!config.postalAddress) {
    problems.push("MAIL_POSTAL_ADDRESS is not set");
  }
  if (!IANAZone.isValidZone(config.timezone)) {
    problems.push(
      `WEEK_PASS_EMAILS_TIMEZONE "${config.timezone}" is not valid`
    );
  }
  // The sample must show the images customers would get, from where they
  // are really hosted.
  problems.push(
    ...config.welcome.problems.filter(
      (p) => p.startsWith("image ") || p.startsWith("WEEK_PASS_EMAIL_ASSET")
    )
  );

  const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
  const apiUrl = env.get("API_URL").replace(/\/$/, "");

  return {
    to,
    from: `${env.get("MAIL_FROM_NAME")} <${env.get("MAIL_FROM_ADDRESS")}>`,
    variants: variants.map((variant) => {
      const { startsAt, accessEndsAt } = sampleDates(variant, now);
      return {
        variant,
        subject: buildSampleMail(variant, to, config, now).subject,
        startsAt: formatEmailDate(startsAt, config.timezone),
        accessEndsAt: formatEmailDate(accessEndsAt, config.timezone),
      };
    }),
    links: {
      profile: `${siteUrl}/${SAMPLE_USER.username}`,
      preferences: `${siteUrl}/settings/account`,
      unsubscribe: `${apiUrl}/unsubscribe?token=… (signed for a user id that matches no account)`,
    },
    images: WEEK_PASS_ASSETS.welcome.map((name) => ({
      name,
      url: configuredAssetUrl(config, name),
    })),
    postalAddressConfigured: Boolean(config.postalAddress),
    timezone: config.timezone,
    problems,
  };
}

/** Build a sample ready to send, marked as an internal sample. */
export async function prepareSample(
  variant: SampleVariant,
  to: string,
  config: WeekPassEmailConfig,
  now: Date
): Promise<BaseMail> {
  const mail = buildSampleMail(variant, to, config, now);
  await mail.build();
  mail.message.header(SAMPLE_HEADER, `week-pass-welcome; variant=${variant}`);
  return mail;
}
