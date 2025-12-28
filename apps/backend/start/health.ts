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
  new DiskSpaceCheck().cacheFor("1 minute"),
  new MemoryHeapCheck(),
  new MemoryRSSCheck(),
  new DbConnectionCountCheck(db).cacheFor("1 minute"),
  new RedisCheck(redis.connection()).cacheFor("1 minute"),
  new RedisMemoryUsageCheck(redis.connection()).cacheFor("1 minute"),
]);
