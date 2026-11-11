import { test } from "@japa/runner";
import { biographyText } from "./biography.ts";

test.group("biographyText", () => {
  test("returns a plain biography untouched", ({ assert }) => {
    const bio = "Loves *jazz* and\n- hip hop";
    assert.equal(biographyText(bio, "plain"), bio);
  });

  test("strips formatting from a rich biography", ({ assert }) => {
    assert.equal(
      biographyText(
        "I'm **Kaia**, a *dancer*.\n\n- Jazz\n- Pom\n\n5\\*6\\*7 \\- go \\\\",
        "rich"
      ),
      "I'm Kaia, a dancer.\n\n• Jazz\n• Pom\n\n5*6*7 - go \\"
    );
  });

  test("keeps null", ({ assert }) => {
    assert.isNull(biographyText(null, "rich"));
  });
});
