import { $api } from "@/lib/api/client";
import { recruitingQueries } from "./queries";

export function useSubmitVideo() {
  return $api.useMutation("post", "/dancers/submissions", {
    meta: {
      invalidateQueries: [
        recruitingQueries.submissions().queryKey,
        recruitingQueries.schools().queryKey,
      ],
    },
  });
}

export function useEditSubmission() {
  return $api.useMutation("patch", "/dancers/submissions/video", {
    meta: {
      invalidateQueries: [recruitingQueries.submission().queryKey],
    },
  });
}

export function useUpdateSubmissionStatus() {
  return $api.useMutation("patch", "/schools/me/submissions/{id}", {
    meta: {
      invalidateQueries: [recruitingQueries.schoolSubmissions().queryKey],
    },
  });
}
