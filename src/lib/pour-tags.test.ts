import test from "node:test";
import assert from "node:assert/strict";
import {
  isTagActive,
  removeTagText,
  toggleTagInNotes,
  createCustomTag,
  updateTagLabel,
  deleteTag,
  EQUIPMENT_TAGS,
  TECHNIQUE_TAGS,
} from "./pour-tags.ts";

test("isTagActive correctly detects Chinese and English tags", () => {
  const sharp = EQUIPMENT_TAGS[0]!;
  assert.equal(isTagActive("尖嘴缸、奶泡细密", sharp), true);
  assert.equal(isTagActive("Sharp pitcher · Silky microfoam", sharp), true);
  assert.equal(isTagActive("圆嘴缸、奶泡偏厚", sharp), false);
  assert.equal(isTagActive("", sharp), false);
});

test("removeTagText cleanly removes tag and separators", () => {
  assert.equal(removeTagText("尖嘴缸、奶泡细密、收口干净", "奶泡细密"), "尖嘴缸、收口干净");
  assert.equal(removeTagText("奶泡细密、收口干净", "奶泡细密"), "收口干净");
  assert.equal(removeTagText("奶泡细密", "奶泡细密"), "");
  assert.equal(
    removeTagText("150ml Flat White · Silky microfoam · Clean cut", "Silky microfoam"),
    "150ml Flat White · Clean cut",
  );
});

test("toggleTagInNotes adds and removes tags seamlessly", () => {
  const sharp = EQUIPMENT_TAGS[0]!;
  const silky = TECHNIQUE_TAGS[0]!;

  // 1. Add first tag in zh
  let notes = toggleTagInNotes("", sharp, "zh");
  assert.equal(notes, "尖嘴缸");

  // 2. Add second tag in zh
  notes = toggleTagInNotes(notes, silky, "zh");
  assert.equal(notes, "尖嘴缸、奶泡细密");

  // 3. Remove first tag
  notes = toggleTagInNotes(notes, sharp, "zh");
  assert.equal(notes, "奶泡细密");

  // 4. Remove second tag
  notes = toggleTagInNotes(notes, silky, "zh");
  assert.equal(notes, "");

  // 5. English toggle
  let enNotes = toggleTagInNotes("", sharp, "en");
  assert.equal(enNotes, "Sharp pitcher");
  enNotes = toggleTagInNotes(enNotes, silky, "en");
  assert.equal(enNotes, "Sharp pitcher · Silky microfoam");
  enNotes = toggleTagInNotes(enNotes, sharp, "en");
  assert.equal(enNotes, "Silky microfoam");
});

test("createCustomTag, updateTagLabel, and deleteTag work properly", () => {
  const custom = createCustomTag("轰炸机尖嘴缸", "equipment");
  assert.equal(custom.labelZh, "轰炸机尖嘴缸");
  assert.equal(custom.labelEn, "轰炸机尖嘴缸");
  assert.equal(custom.category, "equipment");
  assert.equal(custom.isCustom, true);

  const list = [custom];
  const updated = updateTagLabel(list, custom.id, "斜口尖嘴缸", "zh");
  assert.equal(updated[0]?.labelZh, "斜口尖嘴缸");

  const deleted = deleteTag(updated, custom.id);
  assert.equal(deleted.length, 0);
});
