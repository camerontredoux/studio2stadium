import vine from "@vinejs/vine";

/**
 * Normalize a user-provided email address to prevent duplicate accounts
 * using variations of the same address.
 *
 * This is particularly useful for Gmail addresses,
 * where addresses like `user+test@gmail.com` and `user@gmail.com`
 * are treated as the same mailbox by Gmail.
 *
 * Normalization converts emails to canonical form:
 *   - `user+test@gmail.com` → `user@gmail.com`
 *   - `user+scam@gmail.com` → `user@gmail.com`
 *
 * This ensures that users cannot register multiple accounts using
 * Gmail aliasing, reducing duplicate accounts and potential confusion
 * in email delivery.
 *
 * @param email The email address provided by the user
 * @returns The normalized email address
 */
export async function normalizeEmail(email: string) {
  return await vine.validate({
    schema: vine.string().normalizeEmail(),
    data: email,
  });
}
