import logger from "@adonisjs/core/services/logger";
import Stripe from "stripe";

type EventHandler = (event: Stripe.Event) => Promise<void>;

export class StripeService {
  readonly api: Stripe;
  private eventHandlers: Map<Stripe.Event["type"], EventHandler[]> = new Map();

  constructor(config: StripeConfig) {
    this.api = new Stripe(config.apiKey, {
      apiVersion: config.apiVersion,
      maxNetworkRetries: config.maxNetworkRetries,
      timeout: config.timeout,
      telemetry: config.telemetry,
      host: config.host,
      port: config.port,
      protocol: config.protocol,
      appInfo: config.appInfo,
      httpAgent: config.httpAgent,
      stripeAccount: config.stripeAccount,
    });
  }

  /**
   * Register a handler for a specific Stripe event type
   */
  onEvent(eventType: Stripe.Event["type"], handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Dispatch an event to all registered handlers
   */
  async dispatchEvent(event: Stripe.Event): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) ?? [];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { err: error, eventType: event.type, eventId: event.id },
          "Stripe event handler failed"
        );
        throw error;
      }
    }
  }

  /**
   * Construct and verify a webhook event from a raw payload
   */
  constructEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    return this.api.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
  apiVersion?: Stripe.LatestApiVersion;
  maxNetworkRetries?: number;
  timeout?: number;
  telemetry?: boolean;
  host?: string;
  port?: number;
  protocol?: "https" | "http";
  appInfo?: Stripe.AppInfo;
  httpAgent?: Stripe.HttpAgent;
  stripeAccount?: string;
}

export function defineConfig(config: StripeConfig): StripeConfig {
  return config;
}
