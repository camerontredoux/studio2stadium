#!/usr/bin/env bash
# Node 24, installed packages, the built @stos/emails templates, Docker for
# this worktree's Redis, and the shared Postgres on 5432.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

case "$(node -v 2>/dev/null)" in
  v24.*) ;;
  *) die "Node is $(node -v 2>/dev/null || echo missing), not 24 (the root Dockerfile's): run 'fnm use 24' in your shell, then retry" ;;
esac

lock_hash=$(sha256sum <pnpm-lock.yaml)
lock_stamp=node_modules/.run-dev-server-lockfile.sha256
installed=""
if [ "$(cat "$lock_stamp" 2>/dev/null)" != "$lock_hash" ]; then
  echo "installing packages"
  pnpm install --frozen-lockfile >"$out_dir/run-dev-server-install.log" 2>&1 \
    || die "pnpm install failed: read $out_dir/run-dev-server-install.log"
  printf '%s\n' "$lock_hash" >"$lock_stamp"
  installed=1
fi

# The backend imports both workspace packages from their build/ folders,
# which are not committed.
for pkg in emails openapi; do
  src_hash=$(fdfind -t f -0 . "packages/$pkg" | sort -z | xargs -0 sha256sum | sha256sum)
  src_stamp=packages/$pkg/build/.run-dev-server-src.sha256
  if [ -n "$installed" ] || [ ! -f "packages/$pkg/build/index.js" ] \
    || [ "$(cat "$src_stamp" 2>/dev/null)" != "$src_hash" ]; then
    echo "building @stos/$pkg"
    pnpm --dir "packages/$pkg" build >"$out_dir/run-dev-server-$pkg-$slug.log" 2>&1 \
      || die "building @stos/$pkg failed: read $out_dir/run-dev-server-$pkg-$slug.log"
    printf '%s\n' "$src_hash" >"$src_stamp"
  fi
done

docker info >/dev/null 2>&1 || die "Docker is not running; it hosts this worktree's Redis"

if ! pg_isready -q -h localhost -p 5432; then
  # The explicit project name reuses the shared container and volume. Without
  # it, a worktree directory with another name starts a second container that
  # cannot bind 5432.
  echo "starting the shared Postgres container"
  docker compose -p studio2stadium up -d --wait db >/dev/null \
    || die "docker compose could not start Postgres on 5432"
  pg_isready -q -h localhost -p 5432 || die "Postgres on localhost:5432 is still not accepting connections"
fi
psql "$pg_admin" -Atc 'select 1' >/dev/null 2>&1 \
  || die "Postgres on localhost:5432 does not accept postgres/postgres"

echo "deps-ok"
