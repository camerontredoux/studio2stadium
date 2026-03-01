import { db } from "#database/connection";
import { schoolProfiles } from "#database/schema/schools";
import { ilike } from "drizzle-orm";
import { type Validator } from "./validator.ts";

export class Service {
  async execute({ schoolName }: Validator): Promise<boolean> {
    const [school] = await db
      .select({ id: schoolProfiles.id })
      .from(schoolProfiles)
      .where(ilike(schoolProfiles.name, schoolName))
      .limit(1);

    return !school;
  }
}
