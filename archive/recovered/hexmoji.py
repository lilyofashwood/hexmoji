#!/usr/bin/env python3
"""
hexmoji.py — Emoji-based dual-channel steganographic cipher.

by Lily of Ashwood, 2026

Two channels, two emoji pages, one hidden bit per emoji hop.

Channel A: U+1F3xx — "food aisle" (fruit/dessert)
  Uppercase (A-Z) → Fruit emoji (U+1F345–1F35A): 🍅🍆🍇🍈🍉🍊🍋🍌🍍🎍🎎🍏🍐🍑🍒🍓...
  Lowercase (a-z) → Dessert emoji (U+1F361–1F37A): 🍡🍢🍣🍤🍥🍦🍧🍨🍩🍪🍫🍬🍭🍮...
  Space: 🐠 (U+1F420) — the fish

Channel B: U+1F4xx — "people aisle" (body parts/people)
  Uppercase (A-Z) → Body/accessories (U+1F441–1F45A): 👁👂👃👄👅👆👇👈👉👊...
  Lowercase (a-z) → Shoes/people/creatures (U+1F461–1F47A): 👡👢👣👤👥👦👧👨👩👪...
  Space: 🐠 (same fish)

Case detection is FREE: fruit = uppercase, dessert = lowercase.
The semantic category leaks the case bit, which is either a bug or a feature
depending on your threat model.

Channel hopping: switching from A to B (or B to A) encodes a hidden binary signal.
A = 0, B = 1 (or configurable). The HOP is the second layer.

Design: The cards aren't decorating the cipher. The cards ARE the cipher.
"""

# ─────────────────────────────────────────────
# CHANNEL A: Food aisle (U+1F3xx)
# ─────────────────────────────────────────────

# Uppercase A-Z → fruit/veg (0x1F345 onward)
CHAN_A_UPPER = {
    'A': '🍅', 'B': '🍆', 'C': '🍇', 'D': '🍈', 'E': '🍉',
    'F': '🍊', 'G': '🍋', 'H': '🍌', 'I': '🍍', 'J': '🍎',
    'K': '🍏', 'L': '🍐', 'M': '🍑', 'N': '🍒', 'O': '🍓',
    'P': '🍔', 'Q': '🍕', 'R': '🍖', 'S': '🍗', 'T': '🍘',
    'U': '🍙', 'V': '🍚', 'W': '🍛', 'X': '🍜', 'Y': '🍝',
    'Z': '🍞',
}

# Lowercase a-z → dessert/drinks (0x1F361 onward)
CHAN_A_LOWER = {
    'a': '🍡', 'b': '🍢', 'c': '🍣', 'd': '🍤', 'e': '🍥',
    'f': '🍦', 'g': '🍧', 'h': '🍨', 'i': '🍩', 'j': '🍪',
    'k': '🍫', 'l': '🍬', 'm': '🍭', 'n': '🍮', 'o': '🍯',
    'p': '🍰', 'q': '🍱', 'r': '🍲', 's': '🍳', 't': '🍴',
    'u': '🍵', 'v': '🍶', 'w': '🍷', 'x': '🍸', 'y': '🍹',
    'z': '🍺',
}

CHAN_A_SPACE = '🐠'  # tropical fish — hex 20 = space — the fish lives

# ─────────────────────────────────────────────
# CHANNEL B: People aisle (U+1F4xx)
# ─────────────────────────────────────────────

# Uppercase A-Z → body parts/accessories (0x1F441 onward)
CHAN_B_UPPER = {
    'A': '👁', 'B': '👂', 'C': '👃', 'D': '👄', 'E': '👅',
    'F': '👆', 'G': '👇', 'H': '👈', 'I': '👉', 'J': '👊',
    'K': '👋', 'L': '👌', 'M': '👍', 'N': '👎', 'O': '👏',
    'P': '👐', 'Q': '👑', 'R': '👒', 'S': '👓', 'T': '👔',
    'U': '👕', 'V': '👖', 'W': '👗', 'X': '👘', 'Y': '👙',
    'Z': '👚',
}

# Lowercase a-z → shoes/people/creatures (0x1F461 onward)
CHAN_B_LOWER = {
    'a': '👡', 'b': '👢', 'c': '👣', 'd': '👤', 'e': '👥',
    'f': '👦', 'g': '👧', 'h': '👨', 'i': '👩', 'j': '👪',
    'k': '👫', 'l': '👬', 'm': '👭', 'n': '👮', 'o': '👯',
    'p': '👰', 'q': '👱', 'r': '👲', 's': '👳', 't': '👴',
    'u': '👵', 'v': '👶', 'w': '👷', 'x': '👸', 'y': '👹',
    'z': '👺',
}

CHAN_B_SPACE = '🐠'  # same fish — space is universal

# ─────────────────────────────────────────────
# Reverse lookups
# ─────────────────────────────────────────────

_A_REV = {**{v: k for k, v in CHAN_A_UPPER.items()},
          **{v: k for k, v in CHAN_A_LOWER.items()},
          CHAN_A_SPACE: ' '}

_B_REV = {**{v: k for k, v in CHAN_B_UPPER.items()},
          **{v: k for k, v in CHAN_B_LOWER.items()},
          CHAN_B_SPACE: ' '}

_ALL_REV = {}  # emoji → (char, channel)
for emoji, char in _A_REV.items():
    _ALL_REV[emoji] = (char, 'A')
for emoji, char in _B_REV.items():
    if emoji not in _ALL_REV:
        _ALL_REV[emoji] = (char, 'B')


def _char_to_emoji(char: str, channel: str) -> str:
    """Convert a single character to its emoji in the given channel."""
    table_upper = CHAN_A_UPPER if channel == 'A' else CHAN_B_UPPER
    table_lower = CHAN_A_LOWER if channel == 'A' else CHAN_B_LOWER
    space_emoji = CHAN_A_SPACE if channel == 'A' else CHAN_B_SPACE

    if char == ' ':
        return space_emoji
    if char.isupper() and char in table_upper:
        return table_upper[char]
    if char.islower() and char in table_lower:
        return table_lower[char]
    return char  # pass through non-alpha


# ─────────────────────────────────────────────
# ENCODE
# ─────────────────────────────────────────────

def encode(text: str, channel: str = 'A') -> str:
    """
    Encode text using a single channel.
    channel: 'A' (food) or 'B' (people)
    """
    return ''.join(_char_to_emoji(c, channel) for c in text)


def encode_dual(text: str, layer2_bits: list = None) -> str:
    """
    Encode text with channel hopping for a second hidden layer.

    The primary message is encoded in the emoji characters.
    The channel choice (A=0, B=1) encodes layer2_bits.

    layer2_bits: list of 0s and 1s (one per character in text).
                 If None, defaults to all channel A.
    """
    if layer2_bits is None:
        layer2_bits = [0] * len(text)

    result = []
    for i, char in enumerate(text):
        bit = layer2_bits[i] if i < len(layer2_bits) else 0
        channel = 'B' if bit else 'A'
        result.append(_char_to_emoji(char, channel))
    return ''.join(result)


# ─────────────────────────────────────────────
# DECODE
# ─────────────────────────────────────────────

def decode(emoji_text: str) -> dict:
    """
    Decode emoji text, detecting channel for each character.

    Returns:
        message:    the decoded text (primary layer)
        channels:   list of channels used per char ('A' or 'B')
        layer2:     binary signal from channel hops (A=0, B=1)
        hop_message: the second layer if channel hops encode a message
    """
    message = []
    channels = []

    for char in emoji_text:
        if char in _ALL_REV:
            decoded_char, channel = _ALL_REV[char]
            message.append(decoded_char)
            channels.append(channel)

    # Extract second layer from channel hops
    layer2 = [0 if c == 'A' else 1 for c in channels]

    return {
        'message': ''.join(message),
        'channels': channels,
        'layer2': layer2,
    }


# ─────────────────────────────────────────────
# DEMO
# ─────────────────────────────────────────────

if __name__ == '__main__':
    print("🎭 Hexmoji Cipher Demo")
    print("=" * 50)

    # Basic encode/decode
    msg = "Hello World"
    encoded_a = encode(msg, 'A')
    encoded_b = encode(msg, 'B')
    print(f"\nMessage: {msg}")
    print(f"Channel A: {encoded_a}")
    print(f"Channel B: {encoded_b}")

    decoded = decode(encoded_a)
    print(f"\nDecoded: '{decoded['message']}'")
    print(f"Round-trip: {'✓' if decoded['message'] == msg else '✗'}")

    # Dual channel with second layer
    print("\n--- Dual Channel (with hidden bit layer) ---")
    layer2 = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]  # alternating
    dual = encode_dual("Hello World", layer2)
    print(f"Dual: {dual}")
    result = decode(dual)
    print(f"Message: '{result['message']}'")
    print(f"Channels: {result['channels']}")
    print(f"Layer 2 bits: {result['layer2']}")

    # The fish
    print(f"\n🐠 Space in both channels: {CHAN_A_SPACE} / {CHAN_B_SPACE}")
    print(f"   (hex 0x20 = U+1F420 — the fish lives)")

    # Case detection demo
    print("\n--- Case is free (semantic category = case bit) ---")
    print(f"'H' in Channel A: {CHAN_A_UPPER['H']} (fruit = uppercase)")
    print(f"'h' in Channel A: {CHAN_A_LOWER['h']} (dessert = lowercase)")
    print(f"'H' in Channel B: {CHAN_B_UPPER['H']} (body part = uppercase)")
    print(f"'h' in Channel B: {CHAN_B_LOWER['h']} (person = lowercase)")
