#!/bin/sh

main_worktree=$(git worktree list --porcelain | awk 'NR == 1 { print substr($0, 10); exit }')

# Link the root clone's env files. Never apps/backend/.env.production.
for file in apps/backend/.env apps/frontend/.env.local apps/events/.env; do
  if [ ! -e "$file" ] && [ ! -L "$file" ] && [ -e "$main_worktree/$file" ]; then
    ln -s "$main_worktree/$file" "$file"
  fi
done

if [ ! -d node_modules ]; then
  corepack pnpm install || :
fi

exit 0
