import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";
import {
  OrgRosterAddedEmail,
  renderEmail,
  renderEmailText,
} from "@stos/emails";
import type { organizations } from "#database/schema/organizations";
import type { orgEvents } from "#database/schema/org-events";

interface OrgRosterAddedMailData {
  email: string;
  firstName: string;
  orgName: string;
  orgSlug: string;
  brandColor: string | null;
  eventName: string | null;
  eventDateLabel: string | null;
  venueName: string | null;
  type: "dancer" | "coach";
  welcomeVideoUrl: string | null;
}

class OrgRosterAddedMail extends BaseMail {
  subject: string;

  constructor(private data: OrgRosterAddedMailData) {
    super();
    this.subject = data.eventName
      ? `You've been added to ${data.eventName}`
      : `You've been added to ${data.orgName}`;
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const dashboardUrl = `${siteUrl}/o/${this.data.orgSlug}/login`;

    const template = OrgRosterAddedEmail({
      firstName: this.data.firstName,
      orgName: this.data.orgName,
      eventName: this.data.eventName,
      eventDateLabel: this.data.eventDateLabel,
      venueName: this.data.venueName,
      type: this.data.type,
      dashboardUrl,
      brandColor: this.data.brandColor,
      welcomeVideoUrl: this.data.welcomeVideoUrl,
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

export async function sendOrgRosterAddedEmail(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  type: "coach" | "dancer";
}): Promise<void> {
  const { org, event, email, firstName, type } = opts;

  try {
    await mail.send(
      new OrgRosterAddedMail({
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
        welcomeVideoUrl:
          type === "dancer"
            ? (org.settings as { welcome_video?: string })?.welcome_video ?? null
            : null,
      })
    );
  } catch {
    // Fire-and-forget: email failures must not block the upload response.
  }
}
