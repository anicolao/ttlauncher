# ADR 0003: Semantic DOM/CSS omnidirectional ring

- Status: Proposed
- Date: 2026-08-02

## Context

LauncherUI's mockups correctly frame the product as a shared touch table with an
orbital game picker. Its implementation puts essential interaction in Three.js
and adds a fixed top-left header. The rebirth must retain radial tactility while
making large targets, pointer state, orientation, and visual tests explicit.

## Decision

Build every game tile as semantic HTML positioned and rotated with CSS around a
radial/elliptical ring. Use Pointer Events for touch. The surface has no global
top, header, phone layout, or essential canvas/WebGL layer.

## Consequences

- Tiles keep browser semantics, measurable rectangles, and deterministic pixels.
- Outward or four-band text rotation and multi-touch arbitration become explicit
  product logic with physical-device acceptance.
- Decorative canvas may be added only behind the DOM and cannot own hit testing.
- The interaction remains visually related to LauncherUI's tabletop mockups
  without carrying their category, details, or setup scope.
