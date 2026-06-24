import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";
import {
  SchoolAccountInviteEmail,
  renderEmail,
  renderEmailText,
} from "@stos/emails";
import type { organizations } from "#database/schema/organizations";
import type { orgEvents } from "#database/schema/org-events";

interface SchoolAccountInviteMailData {
  email: string;
  firstName: string;
  orgName: string;
  orgSlug: string;
  brandColor: string | null;
  eventName: string | null;
  eventDateLabel: string | null;
  venueName: string | null;
  token: string;
  logoUrl: string | null;
}

class SchoolAccountInviteMail extends BaseMail {
  subject: string;

  constructor(private data: SchoolAccountInviteMailData) {
    super();
    this.subject = data.eventName
      ? `Create your account to join ${data.eventName}`
      : `Create your account to join ${data.orgName}`;
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const registerUrl = `${siteUrl}/o/${this.data.orgSlug}/register-school?t=${this.data.token}`;

    const template = SchoolAccountInviteEmail({
      firstName: this.data.firstName,
      orgName: this.data.orgName,
      eventName: this.data.eventName,
      eventDateLabel: this.data.eventDateLabel,
      venueName: this.data.venueName,
      registerUrl,
      brandColor: this.data.brandColor,
      logoUrl: this.data.logoUrl,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}

function formatDateRange(
  startYmd: string | null,
  endYmd: string | null
): string | null {
  if (!startYmd) return null;
  const fmt = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  if (!endYmd || endYmd === startYmd) return fmt(startYmd);
  return `${fmt(startYmd)} – ${fmt(endYmd)}`;
}

export async function sendSchoolAccountInviteEmailOrThrow(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  token: string;
}): Promise<void> {
  const { org, event, email, firstName, token } = opts;

  await mail.send(
    new SchoolAccountInviteMail({
      email,
      firstName,
      orgName: org.name,
      orgSlug: org.slug,
      brandColor: org.primaryColor ?? null,
      eventName: event?.name ?? null,
      eventDateLabel: event
        ? formatDateRange(
            event.startDate as string | null,
            event.endDate as string | null
          )
        : null,
      venueName: event?.venueName ?? null,
      token,
      logoUrl: org.logoUrl ?? null,
    })
  );
}

export async function sendSchoolAccountInviteEmail(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  token: string;
}): Promise<void> {
  try {
    await sendSchoolAccountInviteEmailOrThrow(opts);
  } catch {
    // Fire-and-forget: email failures must not block the upload response.
  }
}
