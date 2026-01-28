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

export const throttle = (key: string, store: keyof LimitersList = "redis") =>
  limiter.define(key, () => {
    return limiter
      .allowRequests(10)
      .every("1 minute")
      .store(store)
      .limitExceeded((error) => {
        error.setMessage("Slow down! You're making too many requests.");
      });
  });
