# ADR 0003: Semantic DOM/CSS primary UI

- Status: Proposed
- Date: 2026-08-02

## Context

LauncherUI's orbit is visually distinctive but places essential interaction in
a Three.js scene and introduces GPU, focus, scaling, and visual-regression risk.
The product must work on shared displays, phones, keyboards, and assistive tech.

## Decision

Build all essential information and controls as semantic HTML styled with CSS.
Decorative canvas effects may be considered later only when the full journey
works without them.

## Consequences

- Accessibility, reflow, and deterministic snapshots have a simpler foundation.
- The new visual identity relies on typography, composition, colour, and art
  instead of a 3D metaphor.
- Motion is restrained and progressive rather than the navigation model.
