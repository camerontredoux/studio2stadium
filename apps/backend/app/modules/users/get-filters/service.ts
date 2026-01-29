import { inject } from "@adonisjs/core";
import { dancerFilters, schoolFilters } from "./filters.ts";
import { GetFiltersValidator } from "./validator.ts";

@inject()
export class GetFiltersService {
  async execute({ type }: GetFiltersValidator) {
    if (type === "dancer") {
      return dancerFilters;
    }

    return schoolFilters;
  }
}
