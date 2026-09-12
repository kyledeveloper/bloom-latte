import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePracticeMetrics,
  buildPourSharePayload,
  encodeShareUrl,
  decodeSharePayload,
} from "./share-payload.js";
import type { Pour } from "./pours.js";

const mockPours: Pour[] = [
  {
    id: "p1",
    createdAt: "2026-09-01T10:00:00.000Z",
    photo: "data:image/png;base64,1",
    pattern: "heart",
    rating: 4,
    beans: "埃塞俄比亚",
    milk: "全脂鲜奶",
    grind: "中细",
    notes: "练习爱心",
  },
  {
    id: "p2",
    createdAt: "2026-09-02T10:00:00.000Z",
    photo: "data:image/png;base64,2",
    pattern: "tulip",
    rating: 4.5,
    beans: "哥伦比亚",
    milk: "全脂鲜奶",
    grind: "中细",
    notes: "尖嘴缸、奶泡细密",
  },
  {
    id: "p3",
    createdAt: "2026-09-02T16:00:00.000Z",
    photo: "data:image/png;base64,3",
    pattern: "swan",
    rating: 5,
    beans: "耶加雪菲",
    milk: "燕麦奶",
    grind: "EK43 8.5",
    notes: "尖嘴缸、收口利落",
  },
];

test("calculatePracticeMetrics computes days, cups and streak accurately", () => {
  const metrics1 = calculatePracticeMetrics(mockPours, mockPours[0]!);
  assert.equal(metrics1.dayNumber, 1);
  assert.equal(metrics1.cupNumber, 1);

  const metrics3 = calculatePracticeMetrics(mockPours, mockPours[2]!);
  assert.equal(metrics3.dayNumber, 2); // 2 unique days: 09-01 and 09-02
  assert.equal(metrics3.cupNumber, 3);
});

test("encodeShareUrl and decodeSharePayload roundtrip cleanly", () => {
  const payload = buildPourSharePayload(mockPours[2]!, mockPours, "Kyle");
  assert.equal(payload.userName, "Kyle");
  assert.equal(payload.pattern, "swan");
  assert.equal(payload.rating, 5);

  const url = encodeShareUrl(payload, "https://bloom-latte.vercel.app");
  assert.ok(url.startsWith("https://bloom-latte.vercel.app/?"));
  assert.ok(url.includes("u=Kyle"));
  assert.ok(url.includes("p=swan"));
  assert.ok(url.includes("r=5"));

  const decoded = decodeSharePayload(url);
  assert.ok(decoded);
  assert.equal(decoded.userName, "Kyle");
  assert.equal(decoded.pattern, "swan");
  assert.equal(decoded.rating, 5);
  assert.equal(decoded.dayNumber, 2);
  assert.equal(decoded.cupNumber, 3);
  assert.equal(decoded.notes, "尖嘴缸、收口利落");
});

test("decodeSharePayload handles empty or missing params gracefully", () => {
  const empty = decodeSharePayload("https://bloom-latte.vercel.app/");
  assert.equal(empty, null);

  const fallback = decodeSharePayload("https://bloom-latte.vercel.app/?p=tulip");
  assert.ok(fallback);
  assert.equal(fallback.pattern, "tulip");
  assert.equal(fallback.rating, 5);
  assert.equal(fallback.dayNumber, 1);
});
