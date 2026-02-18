import { CronJob } from "cron";
import CacheSkillsCommand from "../services/cache-skills.ts";

const service = new CacheSkillsCommand();

new CronJob("0 * * * *", async () => {
  console.log("[Cron]: Staring cron job for skill rarity cache");
  await service.run();
}).start();
