import { UserRepository } from "./user.repository.ts";

export type CreateUserDto = Awaited<ReturnType<UserRepository["create"]>>;
