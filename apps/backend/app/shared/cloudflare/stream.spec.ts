import { test } from "@japa/runner";
import { streamUploadHeaders } from "./stream.ts";

const encode = (value: string) => Buffer.from(value).toString("base64");

function metadataOf(headers: { "Upload-Metadata": string }) {
  return headers["Upload-Metadata"].split(",");
}

test.group("Cloudflare Stream / upload headers", () => {
  test("sets the user as creator and in the metadata, keeping the client's filename", ({
    assert,
  }) => {
    const headers = streamUploadHeaders(
      `filename ${encode("solo.mov")},filetype ${encode("video/quicktime")}`,
      "user-1"
    );

    assert.equal(headers["Upload-Creator"], "user-1");
    assert.deepEqual(metadataOf(headers), [
      `filename ${encode("solo.mov")}`,
      `filetype ${encode("video/quicktime")}`,
      `maxDurationSeconds ${encode("120")}`,
      `userId ${encode("user-1")}`,
    ]);
  });

  test("drops a client userId or maxDurationSeconds in any case", ({
    assert,
  }) => {
    const headers = streamUploadHeaders(
      `userId ${encode("someone-else")},USERID ${encode("x")},maxDurationSeconds ${encode("9999")},name ${encode("a")}`,
      "user-1"
    );

    assert.deepEqual(metadataOf(headers), [
      `name ${encode("a")}`,
      `maxDurationSeconds ${encode("120")}`,
      `userId ${encode("user-1")}`,
    ]);
  });

  test("works without client metadata", ({ assert }) => {
    const headers = streamUploadHeaders("", "user-1");

    assert.deepEqual(metadataOf(headers), [
      `maxDurationSeconds ${encode("120")}`,
      `userId ${encode("user-1")}`,
    ]);
  });
});
