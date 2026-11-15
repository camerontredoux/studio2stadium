import logger from "@adonisjs/core/services/logger";
import * as Sentry from "@sentry/node";

type ListenerClass<Event> = new () => { handle(event: Event): unknown };

/**
 * Wrap an event listener so a failure is logged and reported to Sentry
 * instead of rejecting. Events are dispatched without `await`, so a rejected
 * listener (an SES error from `mail.send`, say) becomes an unhandled
 * rejection, and Node exits on those.
 *
 * Do not wrap a listener whose dispatcher awaits it to learn whether it
 * failed, such as the Org-ready email.
 */
export function guardListener<Event>(Listener: ListenerClass<Event>) {
  return class GuardedListener {
    async handle(event: Event) {
      try {
        await new Listener().handle(event);
      } catch (error) {
        const context = {
          listener: Listener.name,
          event: (event as object)?.constructor?.name,
        };
        logger.error({ ...context, err: error }, "Event listener failed");
        Sentry.captureException(error, { extra: context });
      }
    }
  };
}
