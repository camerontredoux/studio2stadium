import { organizations } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...data }: Validator) {
    const values: Record<string, unknown> = {};

    if (data.name !== undefined) values.name = data.name;
    if (data.slug !== undefined) values.slug = data.slug;
    if (data.logoUrl !== undefined) values.logoUrl = data.logoUrl;
    if (data.primaryColor !== undefined) values.primaryColor = data.primaryColor;
    if (data.accentColor !== undefined) values.accentColor = data.accentColor;
    if (data.features !== undefined) values.features = data.features;
    if (data.settings !== undefined) values.settings = data.settings;

    if (Object.keys(values).length === 0) {
      return this.db.use((db) =>
        db.query.organizations.findFirst({ where: { id: params.id } })
      );
    }

    values.updatedAt = new Date();

    const [org] = await this.db.use((db) =>
      db
        .update(organizations)
        .set(values)
        .where(eq(organizations.id, params.id))
        .returning()
    );

    return org;
  }
}
