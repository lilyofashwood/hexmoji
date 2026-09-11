# Verification · September 10, 2026

`node --test tests/core.test.cjs`: 10/10 tests passed, including the evening intake's exact `Vesper Loom` direct vector. Coverage includes every recovered suite-artifact A/B letter-table mapping, the distinct direct/lookup Lily examples, all 95 printable ASCII bytes, shared-fish bit ambiguity, rejected unknown glyphs, strict channel-bit lengths, UTF-8 round trips for styled letters/ZWJ emoji/combining marks/BOM/controls, CRC-32 reference vector, independent lane corruption, malformed UTF-8, selectors, envelope and length errors. The evening provenance/label update changes no core mapping or wire format.

`node tests/browser-smoke.cjs`: passed with development-only Playwright and Chrome for Testing 151.0.7922.34. The demo opened directly from `file://`, kept Direct ASCII and the suite lookup variants distinct, exposed fish ambiguity, preserved styled Unicode and final newline through UTF-8 v2, and rejected malformed input. Desktop (1280px) and mobile (390px) screenshots were visually reviewed; no horizontal overflow, external HTTP requests, or uncaught page errors occurred.

Transport the exact encoded code points. Screenshots and OCR preserve appearance, not the underlying scalar stream; text edits and presentation-selector insertion alter that stream. The decoder rejects unsupported mutations.

Only the browser smoke needs Playwright; the core suite uses Node's standard library. Screenshots are in ignored `output/`.
