/**
 * Drives the ring with paused Web Animations that are scrubbed, rather than by
 * writing styles every frame.
 *
 * Why: writing a transform per frame — however cheaply — still costs a style
 * recalculation, and on the tabletop that was the ceiling. Traced during a
 * 2.5 second drag on an Orange Pi 5 Plus at 3840x2160: 140 style recalc passes
 * costing 431ms, touching ~39 elements each, against 40ms of paint. Setting
 * `currentTime` on an already-composited animation skips style entirely; the
 * same motion measured 60.6 fps against 55.
 *
 * The whole ring is one degree of freedom, so every slot shares a single
 * timeline: 360 degrees of rotation mapped onto DURATION_MS. Seeking is then
 * one assignment per animation and no DOM writes at all.
 */

const SLOT_COUNT = 8;

/**
 * 720 keyframes, one every half degree.
 *
 * Not arbitrary. Between keyframes the browser interpolates linearly, which
 * cuts the chord of an arc instead of following it, and the ring's radius here
 * is around 730px. At half-degree spacing that error is 0.007px — far below a
 * pixel. It also means every angle the launcher ever settles on lands exactly
 * on a keyframe rather than between two: the drag settles to multiples of 5
 * degrees and the slots sit 45 degrees apart, so no rendered position depends
 * on interpolation at all.
 */
const KEYFRAME_COUNT = 720;

/** 5ms per keyframe, so a half-degree step is exactly 5ms of timeline. */
const DURATION_MS = 3600;

const DEGREES_PER_KEYFRAME = 360 / KEYFRAME_COUNT;

const DEGREES_PER_SLOT = 360 / SLOT_COUNT;

function slotAngle(sweepDegrees: number): number {
  return -90 + sweepDegrees;
}

/**
 * Position keyframes for one slot, in container query units so they track the
 * ring's size without measuring it. A percentage inside translate() would
 * resolve against the element's own box, which is the wrong reference.
 */
function positionKeyframes(): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let k = 0; k <= KEYFRAME_COUNT; k++) {
    const radians = (slotAngle(k * DEGREES_PER_KEYFRAME) * Math.PI) / 180;
    const x = (Math.cos(radians) * 19).toFixed(4);
    const y = (Math.sin(radians) * 34).toFixed(4);
    frames.push({
      transform: `translate(-50%, -50%) translate(calc(${x} * 1cqw), calc(${y} * 1cqh))`,
      offset: k / KEYFRAME_COUNT
    });
  }
  return frames;
}

/**
 * Counter-rotation keyframes, so a tile stays upright as its slot travels.
 *
 * Deliberately not normalised to [-180, 180] the way ringPosition reports it.
 * Normalising introduces a jump from 180 to -180 partway round, and an
 * animation interpolating across that jump would spin the tile backwards
 * through a whole turn. Rotations are modulo 360 when rendered, so letting the
 * value run continuously is both correct and monotonic.
 */
function rotationKeyframes(): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let k = 0; k <= KEYFRAME_COUNT; k++) {
    const shell = slotAngle(k * DEGREES_PER_KEYFRAME) - 90;
    frames.push({
      transform: `translate(-50%, -50%) rotate(${shell.toFixed(3)}deg)`,
      offset: k / KEYFRAME_COUNT
    });
  }
  return frames;
}

/* Built once and shared. Every slot uses the same 1442 keyframes and differs
   only by seek offset, and a gate crossing creates a node — regenerating them
   per element made each crossing allocate thousands of keyframes. */
let positionFrames: Keyframe[] | null = null;
let rotationFrames: Keyframe[] | null = null;

function sharedPositionKeyframes(): Keyframe[] {
  return (positionFrames ??= positionKeyframes());
}

function sharedRotationKeyframes(): Keyframe[] {
  return (rotationFrames ??= rotationKeyframes());
}

interface Slot {
  seek(sweepDegrees: number): void;
}

/* Every slot shares one set of keyframes and differs only by a phase shift, so
   changing which slot an element occupies is a change of seek offset rather
   than a rebuild. That matters: a gate crossing moves surviving nodes to new
   indices, and rebuilding eight 720-keyframe animations each time took paging
   from 47 fps to 18. */

const slots = new Set<Slot>();
let sweep = 0;

function timeFor(sweepDegrees: number): number {
  const normalized = ((sweepDegrees % 360) + 360) % 360;
  return (normalized / 360) * DURATION_MS;
}

/** Seek every slot. One assignment per animation, no style writes. */
export function setRingSweep(sweepDegrees: number): void {
  sweep = sweepDegrees;
  for (const slot of slots) slot.seek(sweepDegrees);
}

/**
 * Svelte action for a `.game-position`. Builds the two animations for its slot
 * and keeps them seeked.
 *
 * Rebuilds when the slot number changes, which happens when a game crosses the
 * gate and the keyed each-block moves a surviving node to a different index —
 * roughly once per 45 degrees of travel, not per frame.
 */
export function ringSlot(node: HTMLElement, slot: number) {
  let mySlot = slot;

  // fill: "both" so a paused animation holds a value at every time, including
  // before it would nominally have started.
  const options: KeyframeAnimationOptions = {
    duration: DURATION_MS,
    easing: 'linear',
    fill: 'both'
  };

  const position = node.animate(sharedPositionKeyframes(), options);
  position.pause();

  const tile = node.querySelector<HTMLElement>('.game-tile');
  const rotation = tile ? tile.animate(sharedRotationKeyframes(), options) : null;
  rotation?.pause();

  const entry: Slot = {
    seek(sweepDegrees: number) {
      const time = timeFor(sweepDegrees + mySlot * DEGREES_PER_SLOT);
      position.currentTime = time;
      if (rotation) rotation.currentTime = time;
    }
  };

  slots.add(entry);
  entry.seek(sweep);

  return {
    update(nextSlot: number) {
      mySlot = nextSlot;
      entry.seek(sweep);
    },
    destroy() {
      slots.delete(entry);
      position.cancel();
      rotation?.cancel();
    }
  };
}
