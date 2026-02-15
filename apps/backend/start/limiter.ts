/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from "@adonisjs/limiter/services/main";
import { type LimitersList } from "@adonisjs/limiter/types";

export const throttle = (
  key: string,
  requests: number = 10,
  store: keyof LimitersList = "redis"
) =>
  limiter.define("api", (ctx) => {
    const id = ctx.auth.user?.id ?? ctx.request.ip();
    return limiter
      .allowRequests(requests)
      .every("1 minute")
      .store(store)
      .usingKey(`${key}:${id}`)
      .limitExceeded((error) => {
        error.setMessage("Slow down! You're making too many requests.");
      });
  });
