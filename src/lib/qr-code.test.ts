import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createQrMatrix, getWebsiteShareUrl } from "./qr-code.ts";

describe("createQrMatrix", () => {
  it("encodes a short URL into a valid version 2 QR matrix", () => {
    // "http://127.0.0.1:8080" is 21 bytes -> fits in Version 2 (28 bytes capacity in Level M)
    const qr = createQrMatrix("http://127.0.0.1:8080", "M");
    assert.equal(qr.version, 2);
    assert.equal(qr.size, 25);
    assert.equal(qr.modules.length, 25);
    assert.equal(qr.modules[0].length, 25);

    // Verify Top-Left Finder Pattern (7x7)
    // Corners and edges are dark
    assert.equal(qr.modules[0][0], true);
    assert.equal(qr.modules[0][6], true);
    assert.equal(qr.modules[6][0], true);
    assert.equal(qr.modules[6][6], true);
    // Inner ring is light
    assert.equal(qr.modules[1][1], false);
    assert.equal(qr.modules[1][5], false);
    assert.equal(qr.modules[5][1], false);
    assert.equal(qr.modules[5][5], false);
    // Center 3x3 is dark
    assert.equal(qr.modules[2][2], true);
    assert.equal(qr.modules[3][3], true);
    assert.equal(qr.modules[4][4], true);

    // Verify Top-Right Finder Pattern
    assert.equal(qr.modules[0][24], true);
    assert.equal(qr.modules[0][18], true);
    assert.equal(qr.modules[6][24], true);
    assert.equal(qr.modules[6][18], true);

    // Verify Bottom-Left Finder Pattern
    assert.equal(qr.modules[24][0], true);
    assert.equal(qr.modules[18][0], true);
    assert.equal(qr.modules[24][6], true);
    assert.equal(qr.modules[18][6], true);

    // Verify Timing Pattern on Row 6 (alternating dark/light between finders)
    for (let c = 8; c < 17; c++) {
      assert.equal(qr.modules[6][c], c % 2 === 0, `timing row 6 col ${c}`);
      assert.equal(qr.modules[c][6], c % 2 === 0, `timing col 6 row ${c}`);
    }
  });

  it("encodes a typical production URL in Version 3 or 4", () => {
    // "https://bloom-latte.vercel.app" is 30 bytes -> fits in Version 3 Level M (44 bytes capacity)
    const qr = createQrMatrix("https://bloom-latte.vercel.app", "M");
    assert.equal(qr.version, 3);
    assert.equal(qr.size, 29);
    assert.equal(qr.modules.length, 29);

    // Dark module at (N-8, 8)
    assert.equal(qr.modules[21][8], true);
  });

  it("handles longer URLs with query parameters", () => {
    const url = "https://bloom-latte.vercel.app/?ref=poster&source=latte_art_share_2026";
    const qr = createQrMatrix(url, "M");
    assert.ok(qr.version >= 4);
    assert.equal(qr.size, 17 + 4 * qr.version);
    assert.ok(qr.modules.length > 0);
  });
});

describe("getWebsiteShareUrl", () => {
  it("returns https://bloom-latte.vercel.app as default", () => {
    assert.equal(getWebsiteShareUrl(), "https://bloom-latte.vercel.app");
  });
});
