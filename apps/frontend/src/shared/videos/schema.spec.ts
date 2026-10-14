import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { videoUploadSchema } from "./schema";

const file = new File(["clip"], "clip.mp4", { type: "video/mp4" });
let video: {
  duration: number;
  onloadedmetadata: (() => void) | null;
  onerror: (() => void) | null;
  preload: string;
  src: string;
  removeAttribute: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  video = {
    duration: 121,
    onloadedmetadata: null,
    onerror: null,
    preload: "",
    get src() {
      return "blob:clip";
    },
    set src(_value: string) {
      queueMicrotask(() => video.onloadedmetadata?.());
    },
    removeAttribute: vi.fn(),
    load: vi.fn(),
  };
  vi.stubGlobal("document", { createElement: vi.fn(() => video) });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:clip");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Stream video form validation", () => {
  it("rejects a clip over two minutes before the form can submit", async () => {
    const result = await videoUploadSchema.safeParseAsync({ files: [file] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Videos can be up to 2 minutes.",
      );
    }
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:clip");
    expect(video.onloadedmetadata).toBeNull();
    expect(video.onerror).toBeNull();
  });

  it("allows a clip exactly two minutes long", async () => {
    video.duration = 120;
    expect(
      (await videoUploadSchema.safeParseAsync({ files: [file] })).success,
    ).toBe(true);
  });

  it("allows an upload when metadata cannot be read", async () => {
    Object.defineProperty(video, "src", {
      set: () => queueMicrotask(() => video.onerror?.()),
    });
    expect(
      (await videoUploadSchema.safeParseAsync({ files: [file] })).success,
    ).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:clip");
  });

  it("allows an upload after the metadata timeout and cleans up", async () => {
    vi.useFakeTimers();
    Object.defineProperty(video, "src", { set: () => {} });
    const result = videoUploadSchema.safeParseAsync({ files: [file] });
    await vi.advanceTimersByTimeAsync(5000);
    expect((await result).success).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:clip");
  });

  it("allows unknown durations and unavailable metadata APIs", async () => {
    video.duration = Infinity;
    expect(
      (await videoUploadSchema.safeParseAsync({ files: [file] })).success,
    ).toBe(true);
    vi.mocked(URL.createObjectURL).mockImplementation(() => {
      throw new Error("unavailable");
    });
    expect(
      (await videoUploadSchema.safeParseAsync({ files: [file] })).success,
    ).toBe(true);
  });
});
