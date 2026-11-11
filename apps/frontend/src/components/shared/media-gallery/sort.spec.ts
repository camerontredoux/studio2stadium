import { describe, expect, it } from "vitest";
import { sortMedia } from "./sort";
import type { Image, Video } from "./types";

const image = (id: string, createdAt: string, position: number | null) =>
  ({ id, createdAt, position }) as Image;
const video = (id: string, createdAt: string, position: number | null) =>
  ({ id, createdAt, position }) as Video;

const ids = (images: Image[], videos: Video[]) =>
  sortMedia(images, videos).map((item) => item.data.id);

describe("sortMedia", () => {
  it("shows never-ordered media newest first, as before", () => {
    expect(
      ids(
        [image("old", "2026-01-01", null), image("new", "2026-03-01", null)],
        [video("mid", "2026-02-01", null)],
      ),
    ).toEqual(["new", "mid", "old"]);
  });

  it("follows the saved order across images and videos", () => {
    expect(
      ids(
        [image("a", "2026-01-01", 2), image("b", "2026-03-01", 0)],
        [video("c", "2026-02-01", 1)],
      ),
    ).toEqual(["b", "c", "a"]);
  });

  it("puts uploads made after reordering first", () => {
    expect(
      ids(
        [image("a", "2026-01-01", 1), image("upload", "2026-05-01", null)],
        [video("c", "2026-02-01", 0)],
      ),
    ).toEqual(["upload", "c", "a"]);
  });
});
