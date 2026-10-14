import { describe, expect, it } from "vitest";
import { videoUploadErrorMessage } from "./video-duration";

describe("video upload errors", () => {
  it("replaces the Cloudflare duration error with the two-minute rule", () => {
    expect(
      videoUploadErrorMessage(
        "The video duration exceeded the constraint set by the account holder.",
      ),
    ).toBe("Videos can be up to 2 minutes.");
  });

  it("preserves other errors", () => {
    expect(videoUploadErrorMessage("Please try uploading again.")).toBe(
      "Please try uploading again.",
    );
  });
});
