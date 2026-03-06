import { posts } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { BlogPostDeletedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    await this.db.use((db) => db.delete(posts).where(eq(posts.id, params.id)));

    await BlogPostDeletedEvent.dispatch({ postId: params.id });
  }
}
