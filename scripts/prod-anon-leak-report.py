"""Report the production values that survived anonymizing, without the values.

scripts/prod-anon-template.sh dumps the anonymized data as text (pg_dump
--data-only), searches it with `rg -i -F -n -b -o -f <needle values>`, and
passes the dump, the search output and the needles (`kind<TAB>value` per
line) here. The search matches inside words too, because `rg -w` with this
many needles is too slow, so this keeps only the matches that no letter,
digit or underscore touches on either side. For each one it prints
`table.column (kind)`, never the value.
"""

import re
import sys
from collections import defaultdict

WORD = re.compile(rb"\w")
COPY = re.compile(rb"^COPY (\S+) \((.*)\) FROM stdin;$")


def main(data_path: str, hits_path: str, needles_path: str) -> None:
    kinds = defaultdict(set)
    with open(needles_path, "rb") as needles:
        for row in needles:
            kind, value = row.rstrip(b"\n").split(b"\t", 1)
            kinds[value.lower()].add(kind.decode())

    hits = defaultdict(list)
    with open(hits_path, "rb") as found:
        for hit in found:
            line, offset, match = hit.rstrip(b"\n").split(b":", 2)
            hits[int(line)].append((int(offset), match))

    table, columns = "?", []
    with open(data_path, "rb") as data:
        start = 0
        for number, line in enumerate(data, 1):
            header = COPY.match(line.rstrip(b"\n"))
            if header:
                table = header.group(1).decode()
                columns = [c.strip().strip('"') for c in header.group(2).decode().split(",")]
            for offset, match in hits.get(number, ()):
                at = offset - start
                before = line[at - 1 : at] if at else b""
                after = line[at + len(match) : at + len(match) + 1]
                if WORD.match(before) or WORD.match(after):
                    continue
                index = line[:at].count(b"\t")
                column = columns[index] if index < len(columns) else "?"
                kind = ",".join(sorted(kinds.get(match.lower(), {"?"})))
                print(f"{table}.{column} ({kind})")
            start += len(line)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
