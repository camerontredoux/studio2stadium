// Common recruiting video submission is open to graduating seniors and older
// — dancers graduating in this year or earlier (lower grad year == older).
// The backend enforces the same cutoff in create-submission/service.ts.
export const LATEST_ELIGIBLE_GRAD_YEAR = 2027;

export function canSubmitCommonRecruitingVideo(gradYear: number | null) {
  return gradYear != null && gradYear <= LATEST_ELIGIBLE_GRAD_YEAR;
}
