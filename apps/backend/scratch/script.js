import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  vus: 5,
  duration: "60s",
};

export function setup() {
  const res = http.post(
    "http://localhost:3333/auth/login",
    JSON.stringify({
      email: "test@test.com",
      password: "password",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const cookies = res.cookies;
  const sessionCookie = cookies["auth_session"] ? cookies["auth_session"][0].value : null;
  const cacheCookie = cookies["auth_cache"] ? cookies["auth_cache"][0].value : null;

  console.log(`Logged in, session ${sessionCookie}, cache ${cacheCookie}`);

  return {
    sessionCookie,
    cacheCookie,
  };
}

let cacheCookie = null;

export default function (data) {
  const jar = http.cookieJar();

  jar.set("http://localhost:3333", "auth_session", data.sessionCookie);
  jar.set("http://localhost:3333", "auth_cache", cacheCookie || data.cacheCookie);

  let res = http.get("http://localhost:3333/auth/session");
  console.log(res.status, res.status_text);

  if (res.cookies && res.cookies["auth_cache"]) {
    cacheCookie = res.cookies["auth_cache"][0].value;
  }
  check(res, { "status is 200": (res) => res.status === 200 });
  sleep(1);
}
