/**
 * The dev sign-in link exists only on a local dev server that opted in: the
 * HTTP server (`web`, not ace or tests) running with NODE_ENV=development and
 * DEV_SIGN_IN_LINK_ENABLED=true. The run-dev-server skill's env-copy.sh sets
 * the flag in a worktree's private .env only. Production runs with
 * NODE_ENV=production (Dockerfile), so the route is never registered there,
 * even if the flag leaks into its environment.
 */
export function isDevSignInEnabled(input: {
  nodeEnvironment: string;
  appEnvironment: string;
  flag: boolean | undefined;
}): boolean {
  return (
    input.nodeEnvironment === "development" &&
    input.appEnvironment === "web" &&
    input.flag === true
  );
}
