import { errors } from "@adonisjs/limiter";
import limiter from "@adonisjs/limiter/services/main";
import type { LimiterConsumptionOptions } from "@adonisjs/limiter/types";

export async function rateLimit<R>(
  action: () => Promise<R>,
  options: LimiterConsumptionOptions & { key: string }
): Promise<R> {
  const limiterFn = limiter.use(options);

  const [error, result] = await limiterFn.penalize(options.key, action);

  if (error) {
    throw new errors.E_TOO_MANY_REQUESTS(error.response);
  }

  return result;
}

export async function multiRateLimit<R>(
  action: () => Promise<R>,
  options: Array<LimiterConsumptionOptions & { key: string }>
): Promise<R> {
  const limiterFn = limiter.multi(options);

  const [error, result] = await limiterFn.penalize(action);

  if (error) {
    throw new errors.E_TOO_MANY_REQUESTS(error.response);
  }

  return result;
}
