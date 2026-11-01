import drive from "@adonisjs/drive/services/main";
import { test } from "@japa/runner";
import { randomUUID } from "node:crypto";

const PDF = Buffer.from("%PDF-1.1\n%%EOF\n");

// The browser's schedule upload: presign, then PUT the file to the signed URL.
test.group("Local disk signed uploads", (group) => {
  let key: string;

  group.each.setup(() => {
    key = `test/local-disk/${randomUUID()}.pdf`;
    return () => drive.use("fs").delete(key);
  });

  const signUpload = () =>
    drive.use("fs").getSignedUploadUrl(key, {
      expiresIn: "5 mins",
      contentType: "application/pdf",
    });

  const put = (url: string, contentType = "application/pdf", body = PDF) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body,
    });

  test("stores the file and serves it from its signed download URL", async ({
    assert,
  }) => {
    const upload = await put(await signUpload());
    assert.equal(upload.status, 200);

    const download = await fetch(
      await drive.use("fs").getSignedUrl(key, { expiresIn: "5 mins" })
    );
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-type"), "application/pdf");
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), PDF);
  });

  test("rejects a PUT whose signature does not match its key", async ({
    assert,
  }) => {
    const signed = await signUpload();
    const url = signed.replace(".pdf?", "-other.pdf?");

    const upload = await put(url);

    assert.equal(upload.status, 403);
    assert.isFalse(await drive.use("fs").exists(key));
  });

  test("rejects a PUT without a signature", async ({ assert }) => {
    const signed = await signUpload();

    const upload = await put(signed.split("?")[0]);

    assert.equal(upload.status, 403);
  });

  test("rejects a Content-Type other than the signed one", async ({
    assert,
  }) => {
    const upload = await put(await signUpload(), "text/html");

    assert.equal(upload.status, 403);
    assert.isFalse(await drive.use("fs").exists(key));
  });
});
