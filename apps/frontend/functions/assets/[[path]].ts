// Cloudflare Pages Function in front of /assets/*.
//
// Pages answers a request for a missing file with the SPA fallback (index.html,
// 200, text/html). For a hashed chunk that means a stale tab, or a request that
// races a deploy, gets HTML under a .js URL: the browser rejects it on MIME
// grounds, and the edge caches the HTML for hours so a reload cannot recover.
// Return a real 404, uncached, whenever the asset lookup falls back to HTML.
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) => {
  const response = await env.ASSETS.fetch(request);

  if (response.headers.get("content-type")?.startsWith("text/html")) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return response;
};
