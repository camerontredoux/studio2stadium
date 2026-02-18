import { CronJob } from "cron";
import CacheSkillsCommand from "../services/cache-skills.ts";

const service = new CacheSkillsCommand();

new CronJob("0 * * * *", async () => {
  await service.run();
}).start();
