/**
 * An email address as a log line may carry it: the first character of the
 * mailbox and the whole domain, which is enough to tell two recipients apart
 * or spot a corporate domain bouncing mail, without writing the address itself
 * to the logs.
 *
 *   - `grace.hopper@example.com` → `g***@example.com`
 *   - `a@example.com` → `a***@example.com`
 *   - anything without a mailbox and a domain → `***`
 */
export function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return "***";

  return `${email[0]}***${email.slice(at)}`;
}
