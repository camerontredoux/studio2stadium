import { posts } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { BlogPostCreatedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    const slug = slugify(payload.title);

    const [created] = await this.db.use((db) =>
      db
        .insert(posts)
        .values({
          slug,
          title: payload.title,
          content: payload.content,
          description: payload.description,
          thumbnail: payload.thumbnail,
          tags: payload.tags,
        })
        .returning({ id: posts.id })
    );

    await BlogPostCreatedEvent.dispatch({ postId: created.id });

    return { id: created.id };
  }
}
