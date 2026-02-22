import { formatDate } from "@/components/utils/format";
import type { Submission } from "@/shared/types";

export function groupByDate(submissions: Submission[]) {
  const groups: { date: string; submissions: Submission[] }[] = [];
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  for (const sub of sorted) {
    const dateStr = formatDate(sub.updatedAt);
    const last = groups[groups.length - 1];
    if (last?.date === dateStr) {
      last.submissions.push(sub);
    } else {
      groups.push({ date: dateStr, submissions: [sub] });
    }
  }
  return groups;
}

export function filterSubmissions(
  submissions: Submission[],
  status: string,
  watched: string,
) {
  return submissions.filter((s) => {
    if (status !== "all" && s.status !== status) return false;
    if (watched !== "all") {
      const isWatched = s.watched;
      if (watched === "watched" && !isWatched) return false;
      if (watched === "not_watched" && isWatched) return false;
    }
    return true;
  });
}
