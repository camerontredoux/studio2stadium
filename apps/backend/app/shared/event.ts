import { isAdmin } from "#utils/auth";
import { BaseEvent } from "@adonisjs/core/events";

export class AppEvent extends BaseEvent {
  static dispatch<T extends typeof AppEvent>(
    this: T,
    ...args: ConstructorParameters<T>
  ): Promise<void> {
    if (isAdmin()) return Promise.resolve();
    return super.dispatch(...args);
  }
}
