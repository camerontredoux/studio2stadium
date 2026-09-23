import { withMailAllowlist } from "#shared/mail/allowlist";
import env from "#start/env";
import { defineConfig, transports } from "@adonisjs/mail";

const mailConfig = defineConfig({
  default: "ses",

  from: {
    address: env.get("MAIL_FROM_ADDRESS"),
    name: env.get("MAIL_FROM_NAME"),
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    /**
     * MAIL_ALLOWLIST (staging) drops recipients not on the list at the
     * transport, which every send path goes through. Unset: plain SES.
     */
    ses: withMailAllowlist(
      transports.ses({
        apiVersion: "2010-12-01",
        region: env.get("AWS_REGION"),
        credentials: {
          accessKeyId: env.get("AWS_ACCESS_KEY_ID"),
          secretAccessKey: env.get("AWS_SECRET_ACCESS_KEY"),
        },
      }),
      env.get("MAIL_ALLOWLIST")
    ),
  },
});

export default mailConfig;

declare module "@adonisjs/mail/types" {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
