# Mockup provenance and prompts

These PNGs were generated with Codex's built-in image-generation tool on
2026-08-02 for design review. They are project-bound references committed under
the repository license. All depicted games and icons are fictional.

The first-round personal desktop/detail/mobile mockups were removed after the
device requirement was corrected. They are not part of the design history in
this PR because they describe the wrong product.

## `omnidirectional-launcher.png`

Generated using LauncherUI's `launcher_home_screen.png`,
`launcher_orbit_selection.png`, and `launcher_library_grid.png` as references for
shared-table context, orbital selection, and large tactile tiles. The final
prompt requested a perfectly top-down 16:9 application surface with:

- no privileged top, header, or reading direction;
- a neutral center and one broad circular carousel;
- eight large fictional icon/title tiles facing outward radially;
- four equivalent edge swipe handles;
- one pressed highlight that does not open a panel; and
- only the exact title/icon game contract.

The prompt explicitly prohibited phones, profiles, auth controls, search,
filters, metadata, details, setup, settings, confirmations, launch buttons,
keyboards, category suns, commercial games, and 3D planets.

## `tabletop-in-context.png`

Generated using the new top-down ring as the interface reference and
LauncherUI's embedded-table home concept as the physical context reference. The
final prompt requested a real 16:9 display embedded in a walnut game table, seen
from high overhead, with people at north/east/south/west and one participant
directly tapping a highlighted game tile. Every edge had to be an equal approach
position.

The prompt retained only large title/icon tiles and swipe handles and prohibited
personal devices, single-user orientation, login/profile, discovery metadata,
details, setup, configuration, confirmation, and futuristic holograms.

## Interpretation

Generated-image text is not a correctness mechanism. Production geometry,
titles, icons, contrast, pointer behavior, accessible names, and launch behavior
are governed by [`../UX_DESIGN.md`](../UX_DESIGN.md) and tested in live markup.
