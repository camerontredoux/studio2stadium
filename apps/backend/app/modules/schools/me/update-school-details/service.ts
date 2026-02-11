import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { type Schema } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, data: Schema) {
    // TODO: implement
  }
}
