#!/usr/bin/env node
// login-stress.mjs — sustained-concurrency load test for POST /auth/login
//
// Zero dependencies. Node 22+ (uses global fetch, AbortSignal.timeout).
//
// It holds N logins in flight at once for a fixed duration (a "soak" test):
// every time a request finishes, another is launched immediately, so exactly
// --concurrency requests are always in flight. Prints live stats and a final
// report with latency percentiles and a status-code breakdown.
//
// ─────────────────────────────────────────────────────────────────────────
// SAFETY: the default target is PRODUCTION (a single 1 vCPU Fly box that runs
// an argon2 verify per login and is shared with real users). Firing 200
// concurrent logins at it can degrade or take down the live site. The script
// REFUSES to hit a *.studio2stadium.com host unless you pass --yes-production.
// Ctrl-C stops launching new requests and drains cleanly.
// ─────────────────────────────────────────────────────────────────────────
//
// Credentials come from the environment (never hardcode / never commit them):
//   export LOGIN_EMAIL='you@example.com'
//   export LOGIN_PASSWORD='your-test-password'   # must be >= 8 chars
//
// Usage:
//   LOGIN_EMAIL=… LOGIN_PASSWORD=… node apps/backend/scratch/login-stress.mjs \
//       --concurrency 200 --duration 60 --yes-production
//
// Common flags (all optional):
//   -c, --concurrency <n>   in-flight requests to sustain      (default 200)
//   -d, --duration <sec>    how long to hold the load          (default 60)
//   -u, --url <url>         login endpoint          (default prod /auth/login)
//   -t, --timeout <ms>      per-request timeout                (default 30000)
//       --mobile            send X-Client-Type: mobile (200 JSON, no cookies)
//       --abort-on-5xx <r>  auto-stop if 5xx rate over the last window exceeds
//                           r (0..1) after a warmup of samples   (default off)
//       --yes-production    required to target a *.studio2stadium.com host
//       --insecure          allow non-2xx creds check to still run (no-op flag)
//
// Exit code is non-zero if any request failed (network error, timeout, or 5xx).

import process from "node:process";
import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";

// ── arg parsing ────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function flag(names, def, { bool = false } = {}) {
  for (let i = 0; i < argv.length; i++) {
    if (names.includes(argv[i])) {
      if (bool) return true;
      return argv[i + 1];
    }
  }
  return def;
}

const config = {
  url: flag(["-u", "--url"], "https://api.studio2stadium.com/auth/login"),
  concurrency: Number(flag(["-c", "--concurrency"], "200")),
  duration: Number(flag(["-d", "--duration"], "60")),
  timeout: Number(flag(["-t", "--timeout"], "30000")),
  mobile: flag(["--mobile"], false, { bool: true }),
  yesProduction: flag(["--yes-production"], false, { bool: true }),
  abortOn5xx: flag(["--abort-on-5xx"], null),
  email: process.env.LOGIN_EMAIL,
  password: process.env.LOGIN_PASSWORD,
};
config.abortOn5xx = config.abortOn5xx == null ? null : Number(config.abortOn5xx);

// ── validation & safety gates ────────────────────────────────────────────────
function die(msg) {
  console.error(`\x1b[31m✖ ${msg}\x1b[0m`);
  process.exit(2);
}

if (!config.email || !config.password) {
  die(
    "Missing credentials. Set LOGIN_EMAIL and LOGIN_PASSWORD in the environment.\n" +
      "  e.g.  export LOGIN_EMAIL='you@example.com'  export LOGIN_PASSWORD='…'",
  );
}
if (config.password.length < 8) {
  die("LOGIN_PASSWORD is < 8 chars — the server 422s before auth, so the test would measure nothing real.");
}
if (!Number.isFinite(config.concurrency) || config.concurrency < 1) die("--concurrency must be a positive number.");
if (!Number.isFinite(config.duration) || config.duration < 1) die("--duration (seconds) must be a positive number.");

let host;
let target;
try {
  target = new URL(config.url);
  host = target.host;
} catch {
  die(`--url is not a valid URL: ${config.url}`);
}
const transport = target.protocol === "https:" ? https : http;
const isProd = /(^|\.)studio2stadium\.com$/.test(host);
if (isProd && !config.yesProduction) {
  die(
    `Target ${host} is PRODUCTION (single 1 vCPU box, argon2 per login, real users).\n` +
      "  Re-run with --yes-production once you accept it may degrade the live site.\n" +
      "  Have a plan to watch it and press Ctrl-C to abort.",
  );
}

// ── request logic ────────────────────────────────────────────────────────────
const body = JSON.stringify({ email: config.email, password: config.password });
const headers = {
  "content-type": "application/json",
  accept: "application/json",
  // Cloudflare 403s User-Agent-less POSTs as bots — send one, or every
  // request dies at the edge before ever reaching the app.
  "user-agent": "studio2stadium-loadtest/1.0",
  ...(config.mobile ? { "x-client-type": "mobile" } : {}),
};
// NB: no Origin header on purpose — prod CORS only allows the two app origins;
// a plain server-side client sends none and is treated as a simple request.

// Bucketed outcomes. Keys: "2xx", "400", "422", "429", "5xx", "other", "error".
const counts = new Map();
const latencies = []; // ms, successes + non-2xx HTTP responses (not network errors)
let total = 0;
let firstError = null;
let lastRetryAfter = null;

function bump(key) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

// Each login opens a FRESH connection (agent:false → no keep-alive) and closes
// it after the response. A single client therefore behaves like many distinct
// clients, so Fly's proxy spreads requests across BOTH machines instead of
// pinning them to one — closely mimicking the "200 different phones" case.
function oneLogin() {
  return new Promise((resolve) => {
    const started = performance.now();
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    const req = transport.request(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path: target.pathname + target.search,
        method: "POST",
        headers: { ...headers, "content-length": Buffer.byteLength(body) },
        agent: false, // no keep-alive: new connection per request, closed after
        timeout: config.timeout,
      },
      (res) => {
        const s = res.statusCode;
        let raw = "";
        res.on("data", (c) => {
          if (raw.length < 4096) raw += c; // only need the small JSON error body
        });
        res.on("end", () => {
          if (settled) return;
          latencies.push(performance.now() - started);
          total++;
          if (s >= 200 && s < 300) bump("2xx");
          else if (s === 400) bump("400");
          else if (s === 422) bump("422");
          else if (s === 429) {
            bump("429");
            // retryAfter lives in the JSON body for this API, not a header.
            try {
              const j = JSON.parse(raw);
              if (j && j.retryAfter != null) lastRetryAfter = j.retryAfter;
            } catch {}
          } else if (s >= 500) bump("5xx");
          else bump("other");
          done();
        });
      },
    );

    req.on("timeout", () => req.destroy(new Error(`timeout after ${config.timeout}ms`)));
    req.on("error", (err) => {
      if (settled) return;
      total++;
      bump("error");
      if (!firstError) firstError = String(err?.message || err);
      done();
    });

    req.write(body);
    req.end();
  });
}

// ── live stats ───────────────────────────────────────────────────────────────
function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}
function fmtMs(x) {
  return `${x.toFixed(0)}ms`;
}

let lastTotal = 0;
let lastTick = performance.now();
function renderLive(inFlight, elapsedSec) {
  const now = performance.now();
  const dt = (now - lastTick) / 1000;
  const rps = dt > 0 ? (total - lastTotal) / dt : 0;
  lastTotal = total;
  lastTick = now;

  const ok = counts.get("2xx") ?? 0;
  const c400 = counts.get("400") ?? 0;
  const c429 = counts.get("429") ?? 0;
  const c5xx = counts.get("5xx") ?? 0;
  const errs = counts.get("error") ?? 0;
  const sorted = [...latencies].sort((a, b) => a - b);

  const line =
    `\r\x1b[2K` +
    `t=${elapsedSec.toFixed(0)}s/${config.duration}s ` +
    `inflight=${inFlight} ` +
    `req=${total} ` +
    `\x1b[32m2xx=${ok}\x1b[0m ` +
    `400=${c400} ` +
    (c429 ? `\x1b[33m429=${c429}\x1b[0m ` : `429=0 `) +
    (c5xx ? `\x1b[31m5xx=${c5xx}\x1b[0m ` : `5xx=0 `) +
    (errs ? `\x1b[31merr=${errs}\x1b[0m ` : `err=0 `) +
    `| ${rps.toFixed(0)} r/s ` +
    `p50=${fmtMs(pct(sorted, 50))} p95=${fmtMs(pct(sorted, 95))}`;
  process.stdout.write(line);
}

// ── run loop ─────────────────────────────────────────────────────────────────
let stopping = false;
function requestStop(reason) {
  if (stopping) return;
  stopping = true;
  process.stdout.write("\n");
  console.log(`\x1b[33m⏹  stopping: ${reason} — draining in-flight requests…\x1b[0m`);
}
process.on("SIGINT", () => requestStop("Ctrl-C"));

async function main() {
  console.log("\x1b[1mlogin stress test\x1b[0m");
  console.log(`  target      : ${config.url}${isProd ? "  \x1b[31m(PRODUCTION)\x1b[0m" : ""}`);
  console.log(`  account     : ${config.email}${config.mobile ? "  [mobile mode]" : ""}`);
  console.log(`  concurrency : ${config.concurrency} sustained in flight  (fresh connection per request, no keep-alive)`);
  console.log(`  duration    : ${config.duration}s   (per-request timeout ${config.timeout}ms)`);
  if (config.abortOn5xx != null) console.log(`  auto-abort  : when 5xx share > ${config.abortOn5xx}`);
  console.log("");

  // 3-2-1 so there's a window to Ctrl-C before anything fires at prod.
  for (let i = 3; i > 0; i--) {
    process.stdout.write(`\r\x1b[2K  firing in ${i}…`);
    await sleep(1000);
    if (stopping) return finish(performance.now(), performance.now());
  }
  process.stdout.write("\r\x1b[2K");

  const startedAt = performance.now();
  const endAt = startedAt + config.duration * 1000;
  let inFlight = 0;

  // Worker: keep pulling new logins until we're past endAt or stopping.
  async function worker() {
    while (!stopping && performance.now() < endAt) {
      inFlight++;
      await oneLogin();
      inFlight--;
      maybeAutoAbort();
    }
  }

  const liveTimer = setInterval(() => {
    if (stopping) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    renderLive(inFlight, elapsed);
  }, 1000);

  const durationTimer = setTimeout(() => requestStop("duration reached"), config.duration * 1000);

  // Launch the pool.
  const workers = Array.from({ length: config.concurrency }, () => worker());
  await Promise.all(workers);

  clearInterval(liveTimer);
  clearTimeout(durationTimer);
  finish(startedAt, performance.now());
}

function maybeAutoAbort() {
  if (config.abortOn5xx == null || stopping) return;
  if (total < config.concurrency) return; // warm up past one full wave first
  const c5xx = counts.get("5xx") ?? 0;
  const errs = counts.get("error") ?? 0;
  if ((c5xx + errs) / total > config.abortOn5xx) {
    requestStop(`5xx/error share exceeded ${config.abortOn5xx}`);
  }
}

function finish(startedAt, endedAt) {
  const wall = (endedAt - startedAt) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);
  const ok = counts.get("2xx") ?? 0;
  const c5xx = counts.get("5xx") ?? 0;
  const errs = counts.get("error") ?? 0;

  process.stdout.write("\n\n");
  console.log("\x1b[1m── results ──────────────────────────────────────────\x1b[0m");
  console.log(`  wall time        : ${wall.toFixed(1)}s`);
  console.log(`  total requests   : ${total}`);
  console.log(`  throughput       : ${(total / wall).toFixed(1)} req/s`);
  console.log("");
  console.log("  outcomes:");
  const label = {
    "2xx": "\x1b[32msuccess (2xx)\x1b[0m ",
    "400": "invalid creds (400)",
    "422": "validation (422)  ",
    "429": "\x1b[33mrate limited (429)\x1b[0m",
    "5xx": "\x1b[31mserver error (5xx)\x1b[0m",
    other: "other status      ",
    error: "\x1b[31mnetwork/timeout\x1b[0m   ",
  };
  for (const key of ["2xx", "400", "422", "429", "5xx", "other", "error"]) {
    const n = counts.get(key) ?? 0;
    if (n === 0) continue;
    const share = total ? ((n / total) * 100).toFixed(1) : "0.0";
    console.log(`    ${label[key] ?? key}  ${String(n).padStart(6)}  (${share}%)`);
  }
  if (lastRetryAfter != null) console.log(`    (last 429 retryAfter: ${lastRetryAfter}s)`);
  console.log("");
  if (sorted.length) {
    console.log("  latency (HTTP responses):");
    console.log(`    min ${fmtMs(sorted[0])}  p50 ${fmtMs(pct(sorted, 50))}  p90 ${fmtMs(pct(sorted, 90))}  p95 ${fmtMs(pct(sorted, 95))}  p99 ${fmtMs(pct(sorted, 99))}  max ${fmtMs(sorted[sorted.length - 1])}`);
  }
  if (firstError) console.log(`\n  first error: ${firstError}`);
  console.log("\x1b[1m─────────────────────────────────────────────────────\x1b[0m");

  const clean = ok === total;
  if (!clean) {
    console.log(
      `\x1b[33m⚠ ${total - ok} of ${total} requests were not 2xx — see the breakdown above.\x1b[0m`,
    );
  }
  process.exit(c5xx > 0 || errs > 0 ? 1 : 0);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("\n\x1b[31mfatal:\x1b[0m", err);
  process.exit(3);
});
