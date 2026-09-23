import { configProvider } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import type { ConfigProvider } from "@adonisjs/core/types";
import { MailResponse } from "@adonisjs/mail";
import type {
  MailManagerTransportFactory,
  MailTransportContract,
  NodeMailerMessage,
  Recipient,
} from "@adonisjs/mail/types";

/**
 * Parsed MAIL_ALLOWLIST: exact addresses plus "@domain" patterns, all
 * lower-cased.
 */
export interface MailAllowlist {
  emails: Set<string>;
  domains: Set<string>;
}

type InfoLogger = { info: (obj: object, msg: string) => void };

/**
 * Parse a comma-separated MAIL_ALLOWLIST value. Returns null when it is unset
 * or has no entries, which means "send to everyone".
 */
export function parseMailAllowlist(
  raw: string | undefined
): MailAllowlist | null {
  const entries = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (entries.length === 0) return null;

  const allowlist: MailAllowlist = { emails: new Set(), domains: new Set() };
  for (const entry of entries) {
    if (entry.startsWith("@")) allowlist.domains.add(entry.slice(1));
    else allowlist.emails.add(entry);
  }
  return allowlist;
}

/**
 * The bare address of a recipient. Handles both `{ address, name }` and
 * string forms, including "Name <user@example.com>".
 */
export function recipientAddress(recipient: Recipient): string {
  const value = typeof recipient === "string" ? recipient : recipient.address;
  const angled = /<([^>]+)>/.exec(value);
  return (angled ? angled[1]! : value).trim().toLowerCase();
}

export function isAllowedRecipient(
  allowlist: MailAllowlist,
  recipient: Recipient
): boolean {
  const address = recipientAddress(recipient);
  if (allowlist.emails.has(address)) return true;
  const at = address.lastIndexOf("@");
  return at !== -1 && allowlist.domains.has(address.slice(at + 1));
}

/**
 * "jane.doe@example.com" -> "j***@example.com", for logs.
 */
export function maskEmail(address: string): string {
  const at = address.lastIndexOf("@");
  if (at <= 0) return "***";
  return `${address[0]}***${address.slice(at)}`;
}

const RECIPIENT_FIELDS = ["to", "cc", "bcc"] as const;

/**
 * Wraps a mail transport and drops every to/cc/bcc recipient that is not on
 * the allowlist. Every mail the app sends, through `mail.send`, `sendLater`
 * or the throttled sender, reaches the transport, so nothing gets past it.
 * When no recipient is left, the send is skipped.
 */
export class AllowlistTransport implements MailTransportContract {
  constructor(
    private inner: MailTransportContract,
    private allowlist: MailAllowlist,
    private log: InfoLogger = logger
  ) {}

  async send(
    message: NodeMailerMessage,
    config?: unknown
  ): Promise<MailResponse<unknown>> {
    const filtered: NodeMailerMessage = { ...message };
    let kept = 0;

    for (const field of RECIPIENT_FIELDS) {
      const recipients = message[field];
      if (!recipients) continue;

      const allowed = recipients.filter((recipient) => {
        if (isAllowedRecipient(this.allowlist, recipient)) return true;
        this.log.info(
          {
            subject: message.subject,
            recipient: maskEmail(recipientAddress(recipient)),
            field,
          },
          "Mail recipient not on MAIL_ALLOWLIST; dropped"
        );
        return false;
      });

      kept += allowed.length;
      if (allowed.length) filtered[field] = allowed;
      else delete filtered[field];
    }

    // An explicit SMTP envelope would override the headers above.
    delete filtered.envelope;

    if (kept === 0) {
      this.log.info(
        { subject: message.subject },
        "No MAIL_ALLOWLIST recipients left; mail not sent"
      );
      return new MailResponse("", { from: false, to: [] }, undefined);
    }

    return this.inner.send(filtered, config);
  }

  async close() {
    await this.inner.close?.();
  }
}

/**
 * Wrap a mailer's transport provider with the MAIL_ALLOWLIST filter. When
 * the allowlist is unset or empty, the provider is returned unchanged.
 */
export function withMailAllowlist(
  provider: ConfigProvider<MailManagerTransportFactory>,
  raw: string | undefined
): ConfigProvider<MailManagerTransportFactory> {
  const allowlist = parseMailAllowlist(raw);
  if (!allowlist) return provider;

  return configProvider.create(async (app) => {
    const factory = await provider.resolver(app);
    return () => new AllowlistTransport(factory(), allowlist);
  });
}
