import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LANGUAGE_ID, getLanguageConfig, getLanguageList, normalizeLanguage } from "../languageConfig.js";

test("normalizeLanguage falls back to default for unknown ids", () => {
  assert.equal(normalizeLanguage("xx-YY"), DEFAULT_LANGUAGE_ID);
  assert.equal(normalizeLanguage("hi-IN"), "hi-IN");
});

test("getLanguageConfig returns configured locale", () => {
  const config = getLanguageConfig("en-US");
  assert.equal(config.locale, "en-US");
  assert.equal(typeof config.promptInstruction, "string");
});

test("language list contains unique ids and locales", () => {
  const list = getLanguageList();
  assert.ok(list.length >= 10);

  const ids = new Set(list.map((item) => item.id));
  const locales = new Set(list.map((item) => item.locale));

  assert.equal(ids.size, list.length);
  assert.equal(locales.size, list.length);
});
