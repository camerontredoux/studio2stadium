import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const posts = await this.db.use((db) =>
      db.query.posts.findMany({
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnail: true,
          attachments: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );

    // Never expose the private R2 key: clients download by attachment id via
    // GET /blog/posts/:postId/attachments/:attachmentId.
    return posts.map((post) => ({
      ...post,
      attachments:
        post.attachments?.map(({ key: _key, ...rest }) => rest) ?? null,
    }));
  }
}
