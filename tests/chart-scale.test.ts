import test from "node:test";
import assert from "node:assert/strict";
import { chartScale } from "../lib/chart-scale";

test("mixed revenue/cost axis has round ticks, includes zero and contains all values", () => {
  const values = [48000,272000,112000,4000,-36000,288000,31000,201000,80000,3000,-27000,218497];
  const original = [...values], axis = chartScale(values);
  assert.deepEqual(axis.ticks,[300000,200000,100000,0,-100000]);
  assert(values.every(v => v >= axis.lower && v <= axis.upper));
  assert.deepEqual(values, original);
});
test("zero, negative-only, fractional cost and large amounts have finite nonzero domains", () => {
  for (const values of [[],[0,0],[-20,-100],[.25,1.8],[2e8,-4e7]]) {
    const axis = chartScale(values);
    assert(Number.isFinite(axis.span) && axis.span > 0);
    assert(axis.ticks.includes(0)); assert(axis.ticks.every(Number.isInteger));
    assert(values.every(v => v >= axis.lower && v <= axis.upper));
  }
});
