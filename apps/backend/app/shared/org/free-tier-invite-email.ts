import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";
import { FreeTierInviteEmail, renderEmail, renderEmailText } from "@stos/emails";
import type { organizations } from "#database/schema/organizations";
import type { orgEvents } from "#database/schema/org-events";

interface FreeTierInviteMailData {
  email: string;
  firstName: string;
  orgName: string;
  orgSlug: string;
  eventName: string | null;
  token: string;
  upgradeUrl: string;
  contactEmail: string | null;
  tierExpiryMonths: number;
  brandName: string | null;
  brandColor: string | null;
  welcomeVideoUrl: string | null;
  logoUrl: string | null;
}

class FreeTierInviteMail extends BaseMail {
  subject: string;

  constructor(private data: FreeTierInviteMailData) {
    super();
    const brand = data.brandName?.trim() || data.orgName;
    this.subject = `You're officially in ${brand}`;
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const inviteUrl = `${siteUrl}/o/${this.data.orgSlug}/register?t=${this.data.token}`;

    const template = FreeTierInviteEmail({
      firstName: this.data.firstName,
      orgName: this.data.orgName,
      eventName: this.data.eventName,
      inviteUrl,
      upgradeUrl: this.data.upgradeUrl,
      contactEmail: this.data.contactEmail,
      tierExpiryMonths: this.data.tierExpiryMonths,
      brandName: this.data.brandName,
      brandColor: this.data.brandColor,
      welcomeVideoUrl: this.data.welcomeVideoUrl,
      logoUrl: this.data.logoUrl,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}

export async function sendFreeTierInviteEmailOrThrow(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  token: string;
  upgradeUrl: string;
  tierExpiryMonths: number;
}): Promise<void> {
  const { org, event, email, firstName, token, upgradeUrl, tierExpiryMonths } =
    opts;

  await mail.send(
    new FreeTierInviteMail({
      email,
      firstName,
      orgName: org.name,
      orgSlug: org.slug,
      eventName: event?.name ?? null,
      token,
      upgradeUrl,
      contactEmail: event?.contactEmail ?? null,
      tierExpiryMonths,
      // "free_tier_vault_name" is a legacy persisted settings key; renaming it
      // requires migrating org settings JSON.
      brandName:
        (org.settings as { free_tier_vault_name?: string })
          ?.free_tier_vault_name ?? null,
      brandColor: org.primaryColor ?? null,
      welcomeVideoUrl:
        (org.settings as { welcome_video_dancer?: string })
          ?.welcome_video_dancer ?? null,
      logoUrl: org.logoUrl ?? null,
    })
  );
}

export async function sendFreeTierInviteEmail(opts: {
  org: typeof organizations.$inferSelect;
  event?: typeof orgEvents.$inferSelect | null;
  email: string;
  firstName: string;
  token: string;
  upgradeUrl: string;
  tierExpiryMonths: number;
}): Promise<void> {
  try {
    await sendFreeTierInviteEmailOrThrow(opts);
  } catch {
    // Fire-and-forget: email failures must not block the upload response.
  }
}
