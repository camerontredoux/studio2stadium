import { test } from "@japa/runner";
import { parseCoachCsv, parseDancerCsv } from "./csv-parser.ts";

test.group("csv parser — coach", () => {
  test("parses valid coach CSV", ({ assert }) => {
    const csv = `email,firstName,lastName,organization
a@x.co,Alice,Smith,USC
b@x.co,Bob,Jones,UCLA`;
    const { rows, errors } = parseCoachCsv(csv);
    assert.lengthOf(rows, 2);
    assert.lengthOf(errors, 0);
    assert.equal(rows[0]!.email, "a@x.co");
    assert.equal(rows[0]!.organization, "USC");
  });

  test("reports row-level error for missing email", ({ assert }) => {
    const csv = `email,firstName,lastName,organization
,Alice,Smith,USC
b@x.co,Bob,Jones,UCLA`;
    const { rows, errors } = parseCoachCsv(csv);
    assert.lengthOf(rows, 1);
    assert.lengthOf(errors, 1);
    assert.equal(errors[0]!.row, 2);
    assert.include(errors[0]!.reason, "email");
  });

  test("normalizes email to lowercase", ({ assert }) => {
    const csv = `email,firstName,lastName,organization
Coach@USC.EDU,Coach,Mc,USC`;
    const { rows } = parseCoachCsv(csv);
    assert.equal(rows[0]!.email, "coach@usc.edu");
  });

  test("reports error for missing firstName", ({ assert }) => {
    const csv = `email,firstName,lastName,organization
a@x.co,,Smith,USC`;
    const { errors } = parseCoachCsv(csv);
    assert.lengthOf(errors, 1);
    assert.include(errors[0]!.reason, "firstName");
  });
});

test.group("csv parser — dancer", () => {
  test("parses valid dancer CSV", ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
a@x.co,A,B,101`;
    const { rows, errors } = parseDancerCsv(csv);
    assert.lengthOf(rows, 1);
    assert.lengthOf(errors, 0);
    assert.equal(rows[0]!.bibNumber, 101);
    assert.equal(rows[0]!.csvRow, 2);
  });

  test("reports error for missing bib number", ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
a@x.co,A,B,
c@x.co,C,D,102`;
    const { rows, errors } = parseDancerCsv(csv);
    assert.lengthOf(rows, 1);
    assert.lengthOf(errors, 1);
    assert.include(errors[0]!.reason, "bib");
  });

  test("reports error for non-numeric bib", ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
a@x.co,A,B,abc`;
    const { errors } = parseDancerCsv(csv);
    assert.lengthOf(errors, 1);
    assert.include(errors[0]!.reason, "bib");
  });
});
