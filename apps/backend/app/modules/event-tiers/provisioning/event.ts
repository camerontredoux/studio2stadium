import { maskEmail } from "#utils/mask-email";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import logger from "@adonisjs/core/services/logger";
import mail from "@adonisjs/mail/services/main";
import * as Sentry from "@sentry/node";
import OrgReadyEmail, { type OrgReadyEmailData } from "./email.ts";

/** An Event Tier purchase was provisioned; its buyer needs to get in. */
export class OrgReadyEvent extends BaseEvent {
  constructor(public data: OrgReadyEmailData) {
    super();
  }
}

class OrgReadyHandler {
  async handle(event: OrgReadyEvent) {
    await mail.send(new OrgReadyEmail(event.data));
  }
}

emitter.listen(OrgReadyEvent, [OrgReadyHandler]);

/** Which of the Org-ready email's variants a send is. */
export type OrgReadyPurpose = "claim" | "set_password" | "sign_in";

export function orgReadyPurpose(data: OrgReadyEmailData): OrgReadyPurpose {
  if (data.claimUrl) return "claim";
  if (data.setPasswordUrl) return "set_password";
  return "sign_in";
}

/**
 * Send the Org-ready email and record what happened to it: an info line for
 * each send and an error line, reported to Sentry, for each failure. Each
 * line carries the variant, the Org's slug and the recipient masked, so a
 * buyer who says the email never came can be traced without the address
 * sitting in the logs.
 *
 * Never throws. Every caller sends after its transaction commits, when a
 * failed email cannot undo the purchase or claim it is about. Returns whether
 * the email went, for a caller that must tell someone it did not.
 */
export async function sendOrgReadyEmail(
  data: OrgReadyEmailData,
  { orgSlug }: { orgSlug: string }
): Promise<boolean> {
  const context = {
    purpose: orgReadyPurpose(data),
    orgSlug,
    recipient: maskEmail(data.to),
  };

  try {
    await OrgReadyEvent.dispatch(data);
  } catch (error) {
    logger.error({ ...context, err: error }, "Failed to send Org-ready email");
    Sentry.captureException(error, { extra: context });
    return false;
  }

  logger.info(context, "Sent Org-ready email");
  return true;
}
