import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";
import { OrgInviteEmail, renderEmail, renderEmailText } from "@stos/emails";
import type { organizations } from "#database/schema/organizations";
import type { orgEvents } from "#database/schema/org-events";

interface OrgInviteMailData {
  email: string;
  firstName: string;
  orgName: string;
  orgSlug: string;
  brandColor: string | null;
  eventName: string | null;
  eventDateLabel: string | null;
  venueName: string | null;
  type: "dancer" | "coach";
  token?: string;
}

class OrgInviteMail extends BaseMail {
  subject: string;

  constructor(private data: OrgInviteMailData) {
    super();
    this.subject = data.eventName
      ? `You're invited to ${data.eventName}`
      : `You're invited to ${data.orgName}`;
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const path =
      this.data.type === "dancer" && this.data.token
        ? `/${this.data.orgSlug}/register?t=${this.data.token}`
        : `/${this.data.orgSlug}/login`;
    const inviteUrl = `${siteUrl}${path}`;

    const template = OrgInviteEmail({
      firstName: this.data.firstName,
      orgName: this.data.orgName,
      eventName: this.data.eventName,
      eventDateLabel: this.data.eventDateLabel,
      venueName: this.data.venueName,
      type: this.data.type,
      inviteUrl,
      brandColor: this.data.brandColor,
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
  const start = fmt(startYmd);
  const end = fmt(endYmd);
  return `${start} – ${end}`;
}

export async function sendOrgInviteEmail(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  type: "coach" | "dancer";
  token?: string;
}): Promise<void> {
  const { org, event, email, firstName, type, token } = opts;

  try {
    await mail.send(
      new OrgInviteMail({
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
        type,
        token,
      })
    );
  } catch {
    // Fire-and-forget: email failures must not block the upload response.
  }
}

export async function sendOrgInviteEmailOrThrow(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  type: "coach" | "dancer";
  token?: string;
}): Promise<void> {
  const { org, event, email, firstName, type, token } = opts;
  await mail.send(
    new OrgInviteMail({
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
      type,
      token,
    })
  );
}
