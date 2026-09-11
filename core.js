(function (root) {
  "use strict";
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", LOWER = UPPER.toLowerCase();
  const TABLES = {
    A: [..."🍅🍆🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍔🍕🍖🍗🍘🍙🍚🍛🍜🍝🍞🍡🍢🍣🍤🍥🍦🍧🍨🍩🍪🍫🍬🍭🍮🍯🍰🍱🍲🍳🍴🍵🍶🍷🍸🍹🍺"],
    B: [...UPPER + LOWER].map((character) => String.fromCodePoint(0x1F400 + character.charCodeAt(0)))
  };
  const ALPHABET = UPPER + LOWER;
  const FISH = "🐠";
  const reverse = new Map();
  for (const channel of ["A", "B"]) TABLES[channel].forEach((glyph, index) => reverse.set(glyph, { character: ALPHABET[index], channel, bit: channel === "A" ? 0 : 1 }));
  function scalars(text) {
    if (typeof text !== "string") throw new TypeError("Expected a string.");
    const characters = [...text];
    if (characters.some((character) => { const cp = character.codePointAt(0); return cp >= 0xD800 && cp <= 0xDFFF; })) throw new TypeError("Unpaired UTF-16 surrogates are not valid Unicode scalar text.");
    return characters;
  }
  function validateBits(bits, count) {
    if (bits === undefined) return new Array(count).fill(0);
    if (!Array.isArray(bits) || bits.length !== count || bits.some((bit) => bit !== 0 && bit !== 1)) throw new TypeError(`Expected exactly ${count} binary channel bits.`);
    return bits;
  }
  function encodeLookup(text, options = {}) {
    const characters = scalars(text);
    if (options.channel !== undefined && !["A", "B"].includes(options.channel)) throw new TypeError("Lookup channel must be A or B.");
    const bits = options.bits === undefined ? new Array(characters.length).fill(options.channel === "B" ? 1 : 0) : validateBits(options.bits, characters.length);
    const ambiguousPositions = [];
    const encoded = characters.map((character, position) => {
      if (character === " ") { ambiguousPositions.push(position); return FISH; }
      const index = ALPHABET.indexOf(character);
      if (index < 0) throw new TypeError(`Recovered lookup mode accepts ASCII letters and spaces only (unsupported scalar at position ${position}). Use UTF-8 v2 for exact general text.`);
      return TABLES[bits[position] ? "B" : "A"][index];
    }).join("");
    return { text: encoded, ambiguousPositions, channelStatus: ambiguousPositions.length ? "ambiguous" : "exact" };
  }
  function decodeLookup(text) {
    const channels = [], bits = [], message = [], unknown = [];
    scalars(text).forEach((glyph, position) => {
      if (glyph === FISH) { message.push(" "); channels.push(null); bits.push(null); return; }
      const decoded = reverse.get(glyph);
      if (!decoded) { unknown.push({ position, codePoint: `U+${glyph.codePointAt(0).toString(16).toUpperCase()}`, glyph }); return; }
      message.push(decoded.character); channels.push(decoded.channel); bits.push(decoded.bit);
    });
    return { status: unknown.length ? "rejected" : "exact", text: unknown.length ? null : message.join(""), diagnosticPartialText: message.join(""), channelStatus: unknown.length ? "rejected" : bits.includes(null) ? "ambiguous" : "exact", channels, bits, unknown };
  }
  function encodeDirect(text) {
    return scalars(text).map((character, position) => {
      const byte = character.codePointAt(0);
      if (byte < 0x20 || byte > 0x7E) throw new TypeError(`Direct ASCII mode requires printable ASCII at scalar position ${position}.`);
      return String.fromCodePoint(0x1F300 + byte);
    }).join("");
  }
  function decodeDirect(text) {
    return scalars(text).map((glyph, position) => {
      const byte = glyph.codePointAt(0) - 0x1F300;
      if (byte < 0x20 || byte > 0x7E) throw new TypeError(`Scalar position ${position} is outside the direct printable-ASCII page.`);
      return String.fromCharCode(byte);
    }).join("");
  }
  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0); }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, "0");
  }
  function encodeUtf8(text, bits) {
    scalars(text);
    const bytes = new TextEncoder().encode(text);
    const lane = validateBits(bits, bytes.length);
    const body = [...bytes].map((byte, index) => String.fromCodePoint((lane[index] ? 0x1F400 : 0x1F300) + byte)).join("");
    return `HX2:${bytes.length}:${crc32(bytes)}:${crc32(lane)}:${body}`;
  }
  function decodeUtf8(wire) {
    scalars(wire);
    const match = /^HX2:(0|[1-9]\d*):([0-9a-f]{8}):([0-9a-f]{8}):([\s\S]*)$/.exec(wire);
    if (!match) throw new TypeError("Expected an exact HX2 length/checksum envelope; surrounding text or presentation selectors are not ignored.");
    const glyphs = [...match[4]];
    if (!Number.isSafeInteger(Number(match[1])) || glyphs.length !== Number(match[1])) throw new TypeError("HX2 scalar count does not match its declared UTF-8 byte length.");
    const bytes = [], bits = [];
    glyphs.forEach((glyph, position) => {
      const cp = glyph.codePointAt(0);
      if (cp < 0x1F300 || cp > 0x1F4FF) throw new TypeError(`HX2 scalar ${position} is outside the two declared pages.`);
      bytes.push(cp & 0xFF); bits.push(cp >= 0x1F400 ? 1 : 0);
    });
    const primaryIntegrity = crc32(bytes) === match[2];
    const channelIntegrity = crc32(bits) === match[3];
    let text = null;
    if (primaryIntegrity) {
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(bytes)); }
      catch (_error) { /* The check below exposes invalid UTF-8 as a rejected primary channel. */ }
    }
    const primaryStatus = primaryIntegrity && text !== null ? "exact" : "rejected";
    return { version: "utf8-2", status: primaryStatus === "exact" && channelIntegrity ? "exact" : "rejected", primaryStatus, channelStatus: channelIntegrity ? "exact" : "rejected", text, bits: channelIntegrity ? bits : null, byteLength: bytes.length };
  }
  const api = Object.freeze({ version: "2.0.0", TABLES: Object.freeze({ A: Object.freeze(TABLES.A), B: Object.freeze(TABLES.B) }), encodeLookup, decodeLookup, encodeDirect, decodeDirect, encodeUtf8, decodeUtf8, crc32 });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Hexmoji = api;
})(globalThis);
