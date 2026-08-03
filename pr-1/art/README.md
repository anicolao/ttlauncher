# Fixture emblem artwork

These eight fictional game emblems are production fixtures for the interactive
preview and deterministic E2E suite. They replace the earlier flat geometric
placeholders so the runnable wheel expresses the approved mockup's illustrated
cyan, midnight-blue, and warm-gold visual language. Firebase mode still displays
each legacy `Applications.Icon` value; these files do not replace backend art.

The images were generated with the built-in image generation tool on 2026-08-02,
using `docs/mockups/omnidirectional-launcher.png` as the style reference. Each
source was generated on a flat magenta chroma-key field, converted to RGBA with
the image-generation skill's `remove_chroma_key.py` helper, visually inspected on
the launcher background, stripped, and resized to 640 × 640.

Shared prompt contract:

> Premium hand-painted board-game box-art emblem with a crisp screen-readable
> silhouette, fine engraved detail, luminous cyan and warm-gold lighting matching
> the approved launcher mockup; centered with generous padding; no frame, card,
> UI, words, letters, numbers, logo, or watermark.

Subject prompts:

- `aurora-lines.png`: constellation chart, coral sun, cyan orbital lines, gold stars.
- `caravan.png`: three camel travelers crossing dunes below a huge setting sun.
- `dice-and-daggers.png`: faceted gold die crossed by two silver fantasy daggers.
- `forest-light.png`: luminous white stag in a moonlit enchanted forest.
- `hearthland.png`: glowing timber cottage in a snowy midnight pine forest.
- `mosaic.png`: symmetrical jeweled sapphire, turquoise, ivory, and gold lotus.
- `songbirds.png`: pale songbird on a flowering branch with musical sparkles.
- `tidelines.png`: lighthouse above curling teal waves under a crescent moon.
