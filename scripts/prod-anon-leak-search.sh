#!/usr/bin/env bash
#
# The leak check's search step for scripts/prod-anon-template.sh: write every
# case-insensitive fixed-string match of a needle in the dumped data to hits.
#
#   scripts/prod-anon-leak-search.sh <needles> <data.sql> <hits>
#
# rg exits 1 when it finds nothing, which is the passing case. Any other
# failure (rg missing, a file it cannot read, a bad pattern file) means the
# search never ran, so this exits non-zero with rg's own error visible, and
# the template is not published.
set -uo pipefail

[ "$#" -eq 3 ] || {
  echo "usage: $0 <needles> <data.sql> <hits>" >&2
  exit 2
}

# A case-insensitive fixed-string search finds every candidate fast (rg -w
# with this many needles took over 20 minutes). prod-anon-leak-report.py
# keeps the whole-word matches.
rc=0
rg -i -F -n -b -o -f "$1" "$2" >"$3" || rc=$?
if [ "$rc" -gt 1 ]; then
  echo "prod-anon-template: leak check: rg failed (exit $rc), not publishing" >&2
  exit 1
fi
