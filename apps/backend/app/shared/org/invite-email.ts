import mail from "@adonisjs/mail/services/main";
import type { organizations } from "#database/schema/organizations";

export async function sendOrgInviteEmail(opts: {
  org: typeof organizations.$inferSelect;
  email: string;
  firstName: string;
  type: "coach" | "dancer";
  token?: string;
}): Promise<void> {
  const { org, email, firstName, type, token } = opts;
  const registerPath =
    type === "dancer" && token
      ? `/${org.slug}/register?t=${token}`
      : `/${org.slug}/login`;

  try {
    await mail.send((message) => {
      message
        .to(email)
        .subject(`You're invited to ${org.name}`)
        .html(
          `<p>Hi ${firstName},</p><p>You have been invited to ${org.name}. <a href="${registerPath}">Click here to get started.</a></p>`
        );
    });
  } catch {
    // Fire-and-forget: email failures must not block the upload response
  }
}
