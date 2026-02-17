import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetActivityController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();

    console.time("get-activity");
    // const data = await cache.getOrSet({
    //   key: `users:activity:${session.id}`,
    //   factory: () => service.execute(session.type, session.profileId),
    //   ttl: "1m",
    // });
    const data = await service.execute(session.type, session.profileId);
    console.timeEnd("get-activity");

    return ctx.response.ok(data);
  }
}
