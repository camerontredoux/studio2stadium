// Warm named routes on a running frontend dev server, so a browser's first
// visit does not wait for Vite to compile them. start.sh runs this for --warm.
// Usage: node warm.mjs <port> </path,/path>
//
// Vite compiles a browser module the first time something requests it. This
// requests what a browser loading the page would: the client, src/main.tsx
// and every module it imports statically (routeTree.gen.ts imports every
// route file), followed the way the browser follows them. The router plugin's
// autoCodeSplitting moves each route's component into a chunk the route file
// loads with a dynamic import(); those chunks are followed only for the route
// files that match a warm path. It needs no session; Vite serves modules
// without one.
//
// Warming is a convenience: it prints one line and exits 0 even when a route
// does not match or a module fails, so it never fails the start.

const [port, list = ""] = process.argv.slice(2);
const origin = `http://localhost:${port}`;
const paths = list.split(",").filter(Boolean);
const started = performance.now();
const deadline = Date.now() + 90_000;
const concurrency = 8;
const warnings = [];
const ROUTES = "/src/routes/";

const seen = new Set();
const bodies = new Map();
let modules = 0;

function finish() {
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const head = `warmed ${paths.join(",")}: ${Math.max(modules, seen.size)} modules in ${seconds}s`;
  console.log(warnings.length ? `${head}; warm-warning: ${warnings.join("; ")}` : head);
  process.exit(0);
}

async function get(url) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("gave up after 90s");
  const response = await fetch(new URL(url, origin), {
    signal: AbortSignal.timeout(Math.min(remaining, 60_000)),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return { body, type: response.headers.get("content-type") ?? "" };
}

// Static imports and re-exports in Vite's output. Vite rewrites every
// specifier to a server path, so only those starting with one / are followed.
const IMPORT = /(?:^|[;\n}])\s*(?:import|export)\s*(?:[^'"`();]*?\bfrom\s*)?["']([^"']+)["']/g;
// The dynamic import() of a route's split component chunk.
const SPLIT = /\bimport\(\s*["']([^"']*tsr-split[^"']*)["']\s*\)/g;

function serverPaths(body, pattern) {
  const found = [];
  for (const [, specifier] of body.matchAll(pattern)) {
    if (specifier.startsWith("/") && !specifier.startsWith("//")) found.push(specifier);
  }
  return found;
}

async function crawl(roots) {
  const queue = roots.filter((url) => !seen.has(url));
  for (const url of queue) seen.add(url);
  const failed = [];
  async function visit(url) {
    try {
      const { body, type } = await get(url);
      if (!type.includes("javascript")) return;
      if (url.startsWith(ROUTES)) bodies.set(url, body);
      for (const next of serverPaths(body, IMPORT)) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    } catch (error) {
      failed.push(error instanceof Error ? error.message : String(error));
    }
  }
  // Keep up to `concurrency` requests in flight until the queue drains.
  await new Promise((resolve) => {
    let active = 0;
    const pump = () => {
      while (active < concurrency && queue.length > 0) {
        active += 1;
        void visit(queue.shift()).finally(() => {
          active -= 1;
          pump();
        });
      }
      if (active === 0 && queue.length === 0) resolve();
    };
    pump();
  });
  return failed;
}

// The URL segments a route file answers, from its path under src/routes:
// `_layout` and `(group)` folders add none, `route` and `index` files add
// none, dots in a file name separate segments, and `$param` matches any one
// segment. Returns null for files that are not routes.
function routeSegments(url) {
  const file = decodeURIComponent(url.slice(ROUTES.length).split("?")[0]);
  if (!/\.tsx?$/.test(file)) return null;
  const parts = file.replace(/\.tsx?$/, "").split("/").flatMap((part) => part.split("."));
  const last = parts.at(-1);
  const index = last === "index";
  if (last === "route" || last === "index" || last === "__root") parts.pop();
  const segments = parts.filter((part) => !part.startsWith("_") && !/^\(.*\)$/.test(part));
  return { segments, index };
}

// A route file matches a path when its segments lead the path's: a layout
// wraps every path under it. An index file matches only its own path.
function matches(route, pathSegments) {
  if (route.segments.length > pathSegments.length) return false;
  if (route.index && route.segments.length !== pathSegments.length) return false;
  return route.segments.every(
    (segment, i) => segment === "$" || segment.startsWith("$") || segment === pathSegments[i]
  );
}

try {
  if (!/^\d+$/.test(port ?? "") || paths.length === 0) {
    warnings.push("usage: warm.mjs <port> </path,/path>");
    finish();
  }
  const roots = ["/@vite/client", "/@react-refresh", "/src/main.tsx"];
  // On a cold dependency cache the crawl makes Vite discover and re-bundle
  // dependencies; the modules it served before that answer 504 Outdated
  // Optimize Dep. Crawl again so the fresh versions get compiled too.
  let failed = [];
  for (let pass = 0; pass < 3; pass += 1) {
    const before = seen.size;
    if (pass > 0) seen.clear();
    failed = await crawl(roots);
    modules = Math.max(modules, before, seen.size);
    if (!failed.some((message) => message.endsWith(" answered 504"))) break;
  }

  const chunks = [];
  for (const path of paths) {
    const pathSegments = new URL(path, origin).pathname.split("/").filter(Boolean);
    let matched = 0;
    for (const [url, body] of bodies) {
      const route = routeSegments(url);
      if (!route || !matches(route, pathSegments)) continue;
      if (route.segments.length === pathSegments.length) matched += 1;
      chunks.push(...serverPaths(body, SPLIT));
    }
    if (matched === 0) warnings.push(`no route file matches ${path}`);
  }
  for (let pass = 0; pass < 3; pass += 1) {
    const before = seen.size;
    if (pass > 0) for (const chunk of chunks) seen.delete(chunk);
    const chunkFailed = await crawl(chunks);
    modules = Math.max(modules, before, seen.size);
    failed = [...failed.filter((m) => !m.endsWith(" answered 504")), ...chunkFailed];
    if (!chunkFailed.some((message) => message.endsWith(" answered 504"))) break;
  }
  if (failed.length > 0) warnings.push(`${failed.length} modules failed, first: ${failed[0]}`);
} catch (error) {
  warnings.push(error instanceof Error ? error.message : String(error));
}
finish();
