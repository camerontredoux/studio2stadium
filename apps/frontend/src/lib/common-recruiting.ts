// Matches the backend's graduatingClass in shared/prospect-emails/cutoff.ts:
// the recruiting cycle starts each August 1, Denver time, and the cycle that
// starts August 1 2026 graduates the class of 2027.
const CYCLE_TZ = "America/Denver";
const CYCLE_START_MONTH = 8;

export function graduatingClass(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CYCLE_TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")!.value);
  const month = Number(parts.find((part) => part.type === "month")!.value);
  return month >= CYCLE_START_MONTH ? year + 1 : year;
}

// Common recruiting video submission is open to this cycle's graduating
// seniors and older (lower grad year == older). The backend enforces the same
// rule in create-submission/service.ts.
export function canSubmitCommonRecruitingVideo(
  gradYear: number | null,
  now: Date = new Date(),
) {
  return gradYear != null && gradYear <= graduatingClass(now);
}
