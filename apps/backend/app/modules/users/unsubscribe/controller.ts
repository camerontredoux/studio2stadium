import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UnsubscribeService } from "./service.ts";

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Plain, dependency-free confirmation page. The token is echoed back into a
 * hidden field so the confirming POST can carry it, but it is not otherwise
 * validated here (see `confirm` below) — so it's HTML-attribute-escaped
 * defensively even though it is not proven valid at this point.
 */
function confirmationPage(token: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirm unsubscribe</title>
</head>
<body>
<h1>Unsubscribe from Studio 2 Stadium emails?</h1>
<p>Click the button below to stop receiving prospect emails from Studio 2 Stadium.</p>
<form method="POST" action="/unsubscribe">
<input type="hidden" name="token" value="${escapeHtmlAttribute(token)}">
<button type="submit">Unsubscribe</button>
</form>
</body>
</html>`;
}

export default class UnsubscribeController {
  /**
   * GET: renders a confirmation page. Never writes to the database.
   *
   * Corporate mail security scanners (Outlook SafeLinks, Proofpoint URL
   * Defense) and browser prefetchers fetch link targets in emails with no
   * human intent. Because recipient selection filters on
   * `users.notifications = true`, a mutating GET would silently and
   * permanently opt a coach out the moment a scanner touched the link —
   * before the coach ever saw the email. The token is intentionally not
   * verified here: this handler only checks it's present, so there is no
   * valid/forged branch whose response could leak which tokens are real.
   */
  async confirm(ctx: HttpContext) {
    const token = ctx.request.input("token");

    if (typeof token !== "string" || token.length === 0) {
      return ctx.response.badRequest({ message: "Missing unsubscribe token." });
    }

    return ctx.response.type("html").send(confirmationPage(token));
  }

  /**
   * POST: performs the actual opt-out. This is what the confirmation
   * page's form submits to, and what a mailbox provider's RFC 8058
   * one-click POSTs to directly.
   */
  @inject()
  async handle(ctx: HttpContext, service: UnsubscribeService) {
    const token = ctx.request.input("token");

    if (typeof token !== "string" || token.length === 0) {
      return ctx.response.badRequest({ message: "Missing unsubscribe token." });
    }

    const ok = await service.execute(token);

    if (!ok) {
      return ctx.response.badRequest({
        message: "This unsubscribe link is invalid or has expired.",
      });
    }

    return ctx.response.ok({
      message: "You have been unsubscribed from Studio 2 Stadium emails.",
    });
  }
}
