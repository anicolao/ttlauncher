import { describe, expect, it } from 'vitest';
import { nearestEdge, ringPosition, shortestAngleDelta } from './ring-geometry';

describe('omnidirectional ring geometry', () => {
  it('places eight games around every edge and faces labels outward', () => {
    const positions = Array.from({ length: 8 }, (_, index) => ringPosition(index, 8));
    expect(new Set(positions.map(({ edge }) => edge))).toEqual(
      new Set(['north', 'east', 'south', 'west'])
    );
    expect(positions[0]).toMatchObject({ angle: 270, edge: 'north', rotation: 180 });
    expect(positions[2]).toMatchObject({ angle: 0, edge: 'east', rotation: 90 });
    expect(positions[4]).toMatchObject({ angle: 90, edge: 'south', rotation: 0 });
    expect(positions[6]).toMatchObject({ angle: 180, edge: 'west', rotation: -90 });
  });

  it('normalizes edge bands and drag deltas across zero degrees', () => {
    expect(nearestEdge(359)).toBe('east');
    expect(shortestAngleDelta(355, 5)).toBe(10);
    expect(shortestAngleDelta(5, 355)).toBe(-10);
  });
});
