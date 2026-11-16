import { test } from "@japa/runner";
import {
  checkSenderSubscriber,
  SENDER_API_BASE,
  SenderCheckUnavailable,
} from "./sender-check.ts";

// A fake token: no request in these tests leaves the process.
const TOKEN = "test-token-not-real";
const ADDRESS = "Dancer+wp@Example.com";

interface Call {
  url: string;
  init: RequestInit;
}

function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return respond();
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const subscriber = (email: string, status: string) =>
  json(200, { data: { email, status: { email: status, temail: "active" } } });

async function failure(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof SenderCheckUnavailable) return error.message;
    throw error;
  }
  throw new Error("expected the check to fail closed");
}

test.group("Sender send-time check", () => {
  test("one read-only GET for the encoded address, with Bearer auth", async ({
    assert,
  }) => {
    const { fetch, calls } = fakeFetch(() =>
      subscriber("dancer+wp@example.com", "active")
    );

    const decision = await checkSenderSubscriber(ADDRESS, {
      token: TOKEN,
      fetch,
    });

    assert.deepEqual(decision, { allow: true, reason: "sender_active" });
    assert.lengthOf(calls, 1);
    assert.equal(
      calls[0]!.url,
      `${SENDER_API_BASE}/subscribers/Dancer%2Bwp%40Example.com`
    );
    assert.equal(calls[0]!.init.method, "GET");
    assert.isUndefined(calls[0]!.init.body);
    assert.equal(
      (calls[0]!.init.headers as Record<string, string>).Authorization,
      `Bearer ${TOKEN}`
    );
    assert.instanceOf(calls[0]!.init.signal, AbortSignal);
  });

  for (const status of [
    "unsubscribed",
    "bounced",
    "spam_reported",
    "UNCONFIRMED",
  ]) {
    test(`a ${status} subscriber is suppressed`, async ({ assert }) => {
      const { fetch } = fakeFetch(() => subscriber(ADDRESS, status));
      const decision = await checkSenderSubscriber(ADDRESS, {
        token: TOKEN,
        fetch,
      });
      assert.deepEqual(decision, {
        allow: false,
        reason: `sender_${status.toLowerCase()}`,
      });
    });
  }

  test("a 404 from the API means not in Sender: the app's consent decides", async ({
    assert,
  }) => {
    const { fetch } = fakeFetch(() =>
      json(404, { message: "Subscriber not found" })
    );
    assert.deepEqual(
      await checkSenderSubscriber(ADDRESS, { token: TOKEN, fetch }),
      { allow: true, reason: "not_in_sender" }
    );
  });

  test("a 404 that is not an API answer fails closed", async ({ assert }) => {
    const { fetch } = fakeFetch(
      () =>
        new Response("<html>Not Found</html>", {
          status: 404,
          headers: { "content-type": "text/html" },
        })
    );
    assert.include(
      await failure(checkSenderSubscriber(ADDRESS, { token: TOKEN, fetch })),
      "404"
    );
  });

  for (const status of [401, 403, 429, 500, 502, 503, 302]) {
    test(`HTTP ${status} fails closed`, async ({ assert }) => {
      const { fetch } = fakeFetch(() => json(status, { message: "nope" }));
      const message = await failure(
        checkSenderSubscriber(ADDRESS, { token: TOKEN, fetch })
      );
      assert.include(message, `HTTP ${status}`);
    });
  }

  for (const [name, respond] of [
    ["a body that is not JSON", () => new Response("<html>", { status: 200 })],
    ["no data", () => json(200, { ok: true })],
    ["no status", () => json(200, { data: { email: ADDRESS } })],
    [
      "an empty status",
      () => json(200, { data: { email: ADDRESS, status: { email: "" } } }),
    ],
    ["another address", () => subscriber("someone@example.com", "active")],
  ] as const) {
    test(`${name} fails closed`, async ({ assert }) => {
      const { fetch } = fakeFetch(respond);
      await failure(checkSenderSubscriber(ADDRESS, { token: TOKEN, fetch }));
      assert.isTrue(true);
    });
  }

  test("network errors and timeouts fail closed", async ({ assert }) => {
    const broken = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof globalThis.fetch;
    assert.include(
      await failure(
        checkSenderSubscriber(ADDRESS, { token: TOKEN, fetch: broken })
      ),
      "network error"
    );

    const hangs = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(init.signal!.reason)
        );
      })) as typeof globalThis.fetch;
    const started = Date.now();
    assert.include(
      await failure(
        checkSenderSubscriber(ADDRESS, {
          token: TOKEN,
          fetch: hangs,
          timeoutMs: 50,
        })
      ),
      "timed out"
    );
    assert.isBelow(Date.now() - started, 2_000);
  });

  test("no token fails closed without calling Sender", async ({ assert }) => {
    const { fetch, calls } = fakeFetch(() => subscriber(ADDRESS, "active"));
    assert.include(
      await failure(checkSenderSubscriber(ADDRESS, { token: " ", fetch })),
      "SENDER_API_TOKEN"
    );
    assert.lengthOf(calls, 0);
  });

  test("failure messages never include the token or the address", async ({
    assert,
  }) => {
    for (const respond of [
      () => json(401, { message: TOKEN }),
      () => subscriber("someone@example.com", "active"),
      () => new Response("x", { status: 200 }),
    ]) {
      const { fetch } = fakeFetch(respond);
      const message = await failure(
        checkSenderSubscriber(ADDRESS, { token: TOKEN, fetch })
      );
      assert.notInclude(message, TOKEN);
      assert.notInclude(message.toLowerCase(), "example.com");
    }
  });
});
