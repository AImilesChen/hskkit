import test from "node:test";
import assert from "node:assert/strict";
import { travelEntries, travelCategories, filterTravelEntries } from "../src/lib/travel/phrasebook.ts";
import { createPreviewSession, ratePreview } from "../src/lib/learning/flashcard-preview.ts";

test("travel collection has 50 unique, complete entries across six useful situations", () => {
  assert.equal(travelEntries.length, 50);
  assert.equal(new Set(travelEntries.map((item) => item.id)).size, 50);
  assert.equal(travelEntries.filter((item) => item.kind === "word").length, 30);
  assert.equal(travelEntries.filter((item) => item.kind === "phrase").length, 20);
  for (const group of travelCategories) assert.ok(travelEntries.filter((item) => item.category === group.id).length >= 8);
  for (const item of travelEntries) {
    assert.match(item.hanzi, /\p{Script=Han}/u);
    assert.ok(item.pinyin && item.english && item.note);
  }
});

test("practical searches find aliases, Chinese, accented and unaccented pinyin", () => {
  for (const query of ["toilet", "bathroom", "洗手间", "xishoujian", "xǐshǒujiān"]) {
    assert.ok(filterTravelEntries(travelEntries, query).some((entry) => entry.hanzi === "洗手间"), query);
  }
  for (const query of ["nǐ hǎo", "ni hao", "nihao", "HELLO"]) assert.ok(filterTravelEntries(travelEntries, query).some((entry) => entry.hanzi === "你好"));
  assert.ok(filterTravelEntries(travelEntries, "cab").some((entry) => entry.hanzi === "出租车"));
  assert.ok(filterTravelEntries(travelEntries, "no spice").some((entry) => entry.hanzi === "请不要放辣椒。"));
  assert.equal(filterTravelEntries(travelEntries, "definitelynotaword").length, 0);
});

test("category, saved filter and search combine without exposing unsaved entries", () => {
  const taxi = travelEntries.find((entry) => entry.hanzi === "出租车")!;
  const saved = new Set([taxi.id]);
  assert.deepEqual(filterTravelEntries(travelEntries, "", "all", saved), [taxi]);
  assert.deepEqual(filterTravelEntries(travelEntries, "taxi", "transport", saved), [taxi]);
  assert.equal(filterTravelEntries(travelEntries, "taxi", "food", saved).length, 0);
  assert.equal(filterTravelEntries(travelEntries, "", "all", new Set()).length, 0);
});

test("single-item and full-collection practice terminate and revisit uncertain items once", () => {
  for (const count of [1, 8, 50]) {
    let session = createPreviewSession(count);
    for (let index = 0; index < count; index++) session = ratePreview(session, "retry");
    assert.equal(session.round, 2);
    for (let index = 0; index < count; index++) session = ratePreview(session, "known");
    assert.equal(session.complete, true);
    assert.equal(Object.values(session.ratings).filter((value) => value === "known").length, count);
  }
});
