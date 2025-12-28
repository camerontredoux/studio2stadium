import { db } from "#database/connection";
import { DbConnectionCountCheck } from "#modules/health/db-check";
import {
  DiskSpaceCheck,
  HealthChecks,
  MemoryHeapCheck,
  MemoryRSSCheck,
} from "@adonisjs/core/health";
import { RedisCheck, RedisMemoryUsageCheck } from "@adonisjs/redis";
import redis from "@adonisjs/redis/services/main";

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  new MemoryRSSCheck(),
  new DbConnectionCountCheck(db),
  new RedisCheck(redis.connection()),
  new RedisMemoryUsageCheck(redis.connection()),
]);
