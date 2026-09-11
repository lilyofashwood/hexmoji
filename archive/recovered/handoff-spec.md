# Hexmoji · recovered mechanism and gaps

Evidence: dated conversation retrieval for 2026-07-18 18:59:54 UTC attributes the design to Lily; the example below appears in the following assistant response. The original implementation and full named variant-prefix catalog were not found in Library or the returned owned-repository list.

The defining mechanism is direct hexadecimal low-byte encoding: preserve a selected Unicode block/prefix and replace its low two hex digits with a plaintext ASCII byte. Decode the low byte as ASCII. This is distinct from Ghost Hex’s variation selectors and from PURR-1.

Recovered example for the U+1F3xx family:

| Plaintext | ASCII hex | Encoded scalar | Glyph |
| --- | --- | --- | --- |
| L | 4C | U+1F34C | 🍌 |
| i | 69 | U+1F369 | 🍩 |
| l | 6C | U+1F36C | 🍬 |
| y | 79 | U+1F379 | 🍹 |

Thus Lily → 🍌🍩🍬🍹.

Historical discussion mentions selectable food/fruit, faces, body-part and flag categories, with roughly three sets recalled. The exact category count, prefixes and allowed byte domains were not recovered. Do not invent them and call them original variants. A Unicode block does not guarantee every resulting scalar is an assigned emoji or displays in the selected visual category.

Publish the recovered core with a documented alphabet/domain, recover the other historical variants where possible, and label new ones as new. If adding exact UTF-8 payloads, define a versioned byte mode and framing rather than silently changing the ASCII codec.
