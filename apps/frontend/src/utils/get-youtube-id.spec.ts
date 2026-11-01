import { describe, expect, it } from "vitest";
import { getYouTubeId } from "./get-youtube-id";

const ID = "qAiivspEHmU";

describe("getYouTubeId", () => {
  it.each([
    "https://www.youtube.com/watch?v=qAiivspEHmU",
    "https://youtube.com/watch?v=qAiivspEHmU&list=PL123",
    // the `v` param is not always first — the mobile app and share sheets
    // routinely put app/feature/list ahead of it
    "https://www.youtube.com/watch?app=desktop&v=qAiivspEHmU",
    "https://m.youtube.com/watch?feature=share&v=qAiivspEHmU",
    "https://music.youtube.com/watch?v=qAiivspEHmU",
    "https://youtu.be/qAiivspEHmU",
    "https://youtu.be/qAiivspEHmU?si=abc123",
    "https://www.youtube.com/live/qAiivspEHmU",
    "https://www.youtube.com/shorts/qAiivspEHmU?feature=share",
    "https://www.youtube.com/embed/qAiivspEHmU",
    "https://www.youtube-nocookie.com/embed/qAiivspEHmU",
    "www.youtube.com/watch?v=qAiivspEHmU",
    "  https://www.youtube.com/watch?v=qAiivspEHmU  ",
    "qAiivspEHmU",
  ])("reads the id from %s", (url) => {
    expect(getYouTubeId(url)).toBe(ID);
  });

  it.each([
    "",
    "   ",
    "not a url",
    "https://vimeo.com/123456789",
    "https://notyoutube.com/watch?v=qAiivspEHmU",
    "https://www.youtube.com/watch?v=tooshort",
    "https://www.youtube.com/results?search_query=dance",
  ])("rejects %s", (url) => {
    expect(getYouTubeId(url)).toBeNull();
  });
});
