import { db } from "#database/connection";
import { sql } from "drizzle-orm";

export default class CacheSkillsCommand {
  async run() {
    await db.execute(sql`
      INSERT INTO skill_rarity (skill_id, rarity, count, updated_at)
      SELECT 
        skill_id,
        1 - (COUNT(*)::decimal / (SELECT MAX(c) FROM (SELECT COUNT(*) as c FROM dancer_skills GROUP BY skill_id) t)),
        COUNT(*),
        NOW()
      FROM dancer_skills
      GROUP BY skill_id
      ON CONFLICT (skill_id) 
      DO UPDATE SET 
        count = EXCLUDED.count,
        rarity = EXCLUDED.rarity,
        updated_at = EXCLUDED.updated_at
    `);
  }
}
