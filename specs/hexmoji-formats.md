# Hexmoji formats / recovery edition 1 + UTF-8 extension 2

## Identity and mode selection

Direct ASCII and the suite lookup tables are unframed. Select the same mode at both ends; the mode supplies the mapping. UTF-8 v2 identifies itself with the `HX2:` envelope.

## Direct ASCII / Lily's low-byte design

For each printable ASCII byte b in 0x20..0x7E, emit scalar U+1F300+b. Decode by subtraction with strict range validation. `Lily → U+1F34C U+1F369 U+1F36C U+1F379 → 🍌🍩🍬🍹`. Space maps to U+1F320 (🌠).

Lily's teaching examples include that vector and `Vesper Loom → 🍖🍥🍳🍰🍥🍲🌠🍌🍯🍯🍭`. Both are executable round-trip tests. The direct mode implements the 95-byte printable-ASCII domain. Its substitution is carried in the visible scalar itself, rather than in an attached invisible variation selector.

## Lookup A / Lookup B / separate recovered suite artifact

These tables preserve the suite's Python mappings as their own selectable variants. They have a separate identity from Direct ASCII.

The exact 52-letter arrays in `core.js` match the recovered `CHAN_A_UPPER`, `CHAN_A_LOWER`, `CHAN_B_UPPER`, and `CHAN_B_LOWER` mappings. A's uppercase sequence is a handpicked table, not the direct byte formula. B's letter mappings coincide with U+1F400+ASCII. Both spaces are U+1F420 (🐠).

The encoder accepts only A-Z, a-z, and U+0020. A fixed channel chooses one table; an explicit bits array chooses A=0/B=1 per plaintext scalar. Bits must have exact length and binary values. Spaces always emit the same fish and report their ambiguous positions.

The decoder recognizes both tables. It returns exact primary text only if every scalar belongs to the recovered alphabet. Unknown scalars make the primary result rejected and are listed by position/code point; partial text is diagnostic only. At a space, its channel and bit are null. An all-letter ciphertext has exact page bits; one or more fish make the bit channel ambiguous. Page selections are bits, not differences between consecutive pages: this matches the recovered implementation despite its “hopping” terminology.

The archived original Python encoder passed other characters through and its decoder discarded them. It also reported fish as page A even if the encoder chose B. The original file is retained unchanged. The current decoder validates the primary alphabet and returns `null` for the shared fish's page bit.

## UTF-8 v2 / NEW September 10, 2026

Wire syntax, with literal colons and no surrounding whitespace:

```text
HX2:<decimal-byte-length>:<primary-crc32>:<channel-crc32>:<scalar-body>
```

1. Validate the input as Unicode scalar text; reject isolated UTF-16 surrogates. Apply no Unicode normalization.
2. Encode exact text as UTF-8 bytes, preserving U+FEFF at the start if present.
3. Accept exactly one binary channel bit per byte, or default all bits to zero. Bits are represented as individual values 0x00 or 0x01 for checksumming; they are not packed.
4. For each byte b, emit U+1F300+b for bit 0 or U+1F400+b for bit 1. Read the body by Unicode scalar/code point, not grapheme.
5. Write the byte length in canonical decimal (`0` or an unpadded positive integer). The body must have exactly that many scalars.
6. Compute two standard reflected CRC-32/ISO-HDLC values independently, with initial/final XOR 0xFFFFFFFF and reflected polynomial 0xEDB88320: first over payload bytes, second over the unpacked bit values. Print each as eight lowercase hex digits. The CRC of ASCII `123456789` is `cbf43926`.

For each received scalar, require U+1F300..U+1F4FF. Its low byte reconstructs payload data; its page reconstructs the bit. Verify both checksums independently. An intact primary checksum still requires strict valid UTF-8; decoding is fatal on malformed sequences and does not strip BOM. Only an exact primary lane returns text. Only an exact secondary lane returns bits. If either fails, the overall frame is rejected while an intact independent lane remains available with its own `exact` receipt.

Length/header corruption or out-of-page scalars reject the envelope before either lane is interpreted. Appended newline, added variation selector, omitted scalar, or unpaired surrogate is never silently repaired. Transport the exact code points. Fonts control appearance; decoding uses scalar values. Text normalization and inserted or removed characters change the wire.

CRC-32 detects accidental mutations. This is artistic encoding; encryption and sender authentication are separate layers.
