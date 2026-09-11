# Hexmoji · authorship and editions

Hexmoji is Lily of Ashwood's hexadecimal substitution cipher. Lily's September 11, 2026 clarification describes her design as placing data directly in the low byte, or in higher bytes, of Unicode code points across chosen glyph sets. The direct ASCII mode shipped here implements her low-byte form: keep a Unicode prefix, place the plaintext ASCII byte in its low two hexadecimal digits, and read that byte back as ASCII. Its selected prefix is `0x1F3`; this implementation does not define the full scope of Hexmoji.

Ghost Hex is Lily's separate variation-selector cipher. [Ghost Hex's attribution](https://github.com/lilyofashwood/ghost-hex#readme) credits Paul Butler for the variation-selector carrier precursor. That credit applies to Ghost Hex; it does not attribute Hexmoji's direct glyph/byte substitution design to Butler.

Specifications, logic and experiments are Lily's. Code and design were developed with AI assistance, including Claude's earlier implementation and Codex's September 2026 continuation.

## Direct ASCII

The supplied teaching material records `Lily → 🍌🍩🍬🍹` and `Vesper Loom → 🍖🍥🍳🍰🍥🍲🌠🍌🍯🍯🍭`. Both pass the direct encoder and decoder: `U+1F300 + ASCII byte`. This implementation covers all 95 printable ASCII bytes, including spaces and punctuation.

The source intake `HEXMOJI_RECOVERY_STATUS.md` was preserved unchanged in the local archive: 199 lines, 12,736 bytes; SHA-256 `4883d0b8ff08452f02c8392393cbca4790f367dba078bdd0fb3493a438439ff1`. It records a later teaching/reconstruction exchange. The original creation thread/date and full named-prefix catalog (names, prefix assignments and ordering) remain archival retrieval items. Those gaps concern reconstructing the project's early versions, not Lily's authorship. The shipped modes are enumerated in the [format specification](specs/hexmoji-formats.md).

## Suite lookup variants

`ashwood-steg-suite/hexmoji/hexmoji.py` supplied explicit A/B letter tables and a second-bit scheme. Its exact source is preserved in `archive/recovered/hexmoji.py`, whose heading credits Lily of Ashwood. `archive/recovered/handoff-spec.md` preserves the accompanying direct-low-byte handoff.

The suite's table A encodes `Lily → 🍐🍩🍬🍹`; the direct formula encodes `Lily → 🍌🍩🍬🍹`. They are distinct mappings and remain distinct selectable modes. The archived files establish these implementations; their exact chronology and place in the original named-prefix catalog have not been reconstructed. All 104 A/B letter mappings are checked against the archived Python file. The shared fish recovers a space in the text lane; the secondary page bit is `null` at that position.

## UTF-8 v2 · September 10, 2026

The continuation adds the `HX2` envelope, UTF-8 byte transport, explicit length, two independently checked lanes, strict validation, offline browser workshop, CLI and tests. Its `0x1F3`/`0x1F4` page pairing and framing are a versioned extension, separate from the direct teaching examples and suite tables.

## License and source care

Released under the MIT license in [LICENSE](LICENSE), copyright © 2026 `lilyofashwood`. The scoped source review found Lily-authored project material and no bundled third-party code with conflicting license terms. Original archived source files remain unchanged.
