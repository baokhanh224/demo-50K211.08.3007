import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDateInput } from "../lib/date-input";

test("Date input adds separators as day and month are completed", () => {
  for (const [raw, formatted] of [["", ""], ["1", "1"], ["14", "14/"], ["140", "14/0"], ["1405", "14/05/"], ["14052026", "14/05/2026"], ["140520269", "14/05/2026"]])
    assert.equal(formatDateInput(raw), formatted);
});

test("Date input handles pasted dates without coercing invalid calendar dates", () => {
  assert.equal(formatDateInput("14/05/2026"), "14/05/2026");
  assert.equal(formatDateInput("1/5/2026"), "01/05/2026");
  assert.equal(formatDateInput("14.05.2026"), "14/05/2026");
  assert.equal(formatDateInput("2026-05-14"), "14/05/2026");
  assert.equal(formatDateInput("31/02/2027"), "31/02/2027");
  assert.equal(formatDateInput("1/"), "01/");
});

test("Deleting separators and editing the month preserve the remaining segments", () => {
  assert.equal(formatDateInput("1/", { deleting: true, preserveSegments: true }), "1");
  assert.equal(formatDateInput("/", { deleting: true, preserveSegments: true }), "");
  assert.equal(formatDateInput("14/0/2026", { deleting: true, preserveSegments: true }), "14/0/2026");
  assert.equal(formatDateInput("14/06/2026", { preserveSegments: true }), "14/06/2026");
});
