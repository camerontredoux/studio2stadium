import { test } from "@japa/runner";
import { csvCell, toCsv } from "./csv.ts";

test.group("Dancer access CSV escaping", () => {
  test("neutralizes cells a spreadsheet would run as a formula", ({
    assert,
  }) => {
    assert.equal(csvCell("=1+1"), "'=1+1");
    assert.equal(csvCell("+15550100"), "'+15550100");
    assert.equal(csvCell("-2"), "'-2");
    assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
    assert.equal(csvCell("\tTAB"), "'\tTAB");
    assert.equal(
      csvCell('=HYPERLINK("http://x.test","y")'),
      `"'=HYPERLINK(""http://x.test"",""y"")"`
    );
  });

  test("quotes commas, quotes, newlines and edge whitespace", ({ assert }) => {
    assert.equal(csvCell("a,b"), '"a,b"');
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
    assert.equal(csvCell(" padded "), '" padded "');
    assert.equal(csvCell("plain"), "plain");
  });

  test("writes empty for null, ISO for dates and text for booleans", ({
    assert,
  }) => {
    assert.equal(csvCell(null), "");
    assert.equal(csvCell(undefined), "");
    assert.equal(
      csvCell(new Date("2026-11-27T05:00:00.000Z")),
      "2026-11-27T05:00:00.000Z"
    );
    assert.equal(csvCell(true), "true");
    assert.equal(csvCell(false), "false");
  });

  test("ends every row with CRLF", ({ assert }) => {
    assert.equal(
      toCsv([
        ["a", "b"],
        ["c", null],
      ]),
      "a,b\r\nc,\r\n"
    );
  });
});
