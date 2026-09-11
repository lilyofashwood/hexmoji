const test = require("node:test");
const assert = require("node:assert/strict");
const codec = require("../core.js");

test("all letter mappings match the recovered Python tables exactly", () => {
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "../archive/recovered/hexmoji.py"), "utf8");
  for (const channel of ["A", "B"]) {
    const pairs = ["UPPER", "LOWER"].flatMap((caseName) => {
      const body = new RegExp(`CHAN_${channel}_${caseName} = \\{([\\s\\S]*?)\\n\\}`).exec(source)[1];
      return [...body.matchAll(/'([A-Za-z])': '([^']+)'/g)].map((match) => [match[1], match[2]]);
    });
    assert.equal(pairs.length, 52);
    for (const [letter, glyph] of pairs) assert.equal(codec.encodeLookup(letter, { channel }).text, glyph);
  }
});

test("direct low-byte example and recovered lookup identity stay distinct", () => {
  assert.equal(codec.encodeDirect("Lily"), "🍌🍩🍬🍹");
  assert.equal(codec.encodeLookup("Lily").text, "🍐🍩🍬🍹");
  assert.equal(codec.decodeDirect("🍌🍩🍬🍹"), "Lily");
  assert.equal(codec.decodeLookup("🍌🍩🍬🍹").text, "Hily");
});
test("newly supplied Vesper Loom teaching vector validates without changing direct wire", () => {
  const text = "Vesper Loom", wire = "🍖🍥🍳🍰🍥🍲🌠🍌🍯🍯🍭";
  assert.equal(codec.encodeDirect(text), wire);
  assert.equal(codec.decodeDirect(wire), text);
  assert.deepEqual([...wire].map(glyph => glyph.codePointAt(0) & 0xff), [...text].map(letter => letter.charCodeAt(0)));
});
test("all recovered suite-table letters round trip in each page", () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (const channel of ["A", "B"]) {
    const encoded = codec.encodeLookup(letters, { channel });
    const result = codec.decodeLookup(encoded.text);
    assert.equal(result.text, letters);
    assert.equal(result.status, "exact");
    assert(result.bits.every((bit) => bit === (channel === "B" ? 1 : 0)));
  }
});
test("historical shared space exposes loss instead of inventing a channel", () => {
  const one = codec.encodeLookup("A B", { bits: [0, 1, 1] });
  const zero = codec.encodeLookup("A B", { bits: [0, 0, 1] });
  assert.equal(one.text, zero.text);
  assert.deepEqual(one.ambiguousPositions, [1]);
  const decoded = codec.decodeLookup(one.text);
  assert.equal(decoded.text, "A B");
  assert.equal(decoded.channelStatus, "ambiguous");
  assert.deepEqual(decoded.bits, [0, null, 1]);
});
test("legacy unsafe domains and unknown transport scalars fail visibly", () => {
  assert.throws(() => codec.encodeLookup("Hello!"), /ASCII letters/);
  assert.throws(() => codec.encodeLookup("A", { bits: [] }), /binary/);
  assert.throws(() => codec.encodeLookup("A", { channel: "C" }), /channel/);
  const result = codec.decodeLookup("🍐!🍩");
  assert.equal(result.status, "rejected");
  assert.equal(result.text, null);
  assert.equal(result.unknown[0].position, 1);
  assert.throws(() => codec.decodeDirect("🍌\uFE0F"), /outside/);
  assert.throws(() => codec.encodeDirect("é"), /ASCII/);
});
test("all printable ASCII direct bytes round trip including exact spaces", () => {
  const text = Array.from({ length: 95 }, (_, index) => String.fromCharCode(index + 32)).join("");
  assert.equal(codec.decodeDirect(codec.encodeDirect(text)), text);
  assert.equal(codec.encodeDirect(" "), "🌠");
});
test("new UTF-8 frame preserves Unicode, BOM, normalization form, case and whitespace", () => {
  for (const text of ["", "Lily\n\t ", "𝓵𝓲𝓵𝔂 🧑🏽‍💻 🏳️‍🌈", "e\u0301 é", "\uFEFFhello", "\u0000\uE000\uE001\r\n"]) {
    const byteCount = new TextEncoder().encode(text).length;
    const bits = Array.from({ length: byteCount }, (_, index) => index % 2);
    const decoded = codec.decodeUtf8(codec.encodeUtf8(text, bits));
    assert.equal(decoded.status, "exact");
    assert.equal(decoded.text, text);
    assert.deepEqual(decoded.bits, bits);
  }
});
test("checksum vector and independent lane-corruption outcomes", () => {
  assert.equal(codec.crc32(new TextEncoder().encode("123456789")), "cbf43926");
  const wire = codec.encodeUtf8("Lily", [0, 1, 0, 1]);
  const parts = wire.split(":");
  const symbols = [...parts[4]];
  symbols[0] = String.fromCodePoint(symbols[0].codePointAt(0) + 0x100);
  const changedPage = codec.decodeUtf8([...parts.slice(0, 4), symbols.join("")].join(":"));
  assert.equal(changedPage.primaryStatus, "exact");
  assert.equal(changedPage.text, "Lily");
  assert.equal(changedPage.channelStatus, "rejected");
  const payload = [...parts[4]];
  payload[0] = String.fromCodePoint(payload[0].codePointAt(0) + 1);
  const changedByte = codec.decodeUtf8([...parts.slice(0, 4), payload.join("")].join(":"));
  assert.equal(changedByte.primaryStatus, "rejected");
  assert.equal(changedByte.text, null);
  assert.equal(changedByte.channelStatus, "exact");
  assert.deepEqual(changedByte.bits, [0, 1, 0, 1]);
});
test("malformed Unicode, UTF-8, selectors, counts and framing are rejected", () => {
  assert.throws(() => codec.encodeUtf8("\uD800"), /surrogate/);
  assert.throws(() => codec.decodeUtf8("HX2:00:00000000:00000000:"), /envelope/);
  assert.throws(() => codec.decodeUtf8(codec.encodeUtf8("x") + "\n"), /count/);
  assert.throws(() => codec.decodeUtf8(codec.encodeUtf8("x") + "\uFE0F"), /count/);
  assert.throws(() => codec.decodeUtf8(codec.encodeUtf8("x").replace("HX2:1:", "HX2:2:")), /count/);
  assert.throws(() => codec.decodeUtf8(" " + codec.encodeUtf8("x")), /envelope/);
  const invalid = `HX2:1:${codec.crc32([0xFF])}:${codec.crc32([0])}:${String.fromCodePoint(0x1F3FF)}`;
  const decoded = codec.decodeUtf8(invalid);
  assert.equal(decoded.primaryStatus, "rejected");
  assert.equal(decoded.channelStatus, "exact");
});
