<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import './tabletop-polish.css';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import type { CatalogueSnapshot } from '$lib/data/catalogue-source';
  import { createFixtureCatalogue } from '$lib/data/fixture-catalogue';
  import { createFirebaseCatalogue } from '$lib/data/firebase-catalogue';
  import type { GameTile } from '$lib/domain/game-tile';
  import { gamesForPage, nextPage, normalizePage, pageCount } from '$lib/domain/pagination';
  import {
    angleFromPoint,
    ringPosition,
    shortestAngleDelta
  } from '$lib/domain/ring-geometry';

  const TAP_THRESHOLD = 18;
  const PAGE_SPIN_STEP = 45;
  let snapshot: CatalogueSnapshot = {
    status: 'loading',
    games: [],
    rejected: []
  };
  let pageIndex = 0;
  let ringAngle = 0;
  let launchLocked = false;
  let drag: {
    pointerId: number;
    startX: number;
    startY: number;
    lastAngle: number;
    gameId: string | null;
    moved: boolean;
  } | null = null;

  $: totalPages = pageCount(snapshot.games.length);
  $: pageIndex = Math.min(pageIndex, totalPages - 1);
  $: visibleGames = gamesForPage(snapshot.games, pageIndex);
  $: pageLabel = `${pageIndex + 1} / ${totalPages}`;
  $: hasPages = snapshot.games.length > 8;
  $: statusLabel = statusText(snapshot);

  onMount(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    const start = async () => {
      try {
        const mode = import.meta.env.PUBLIC_DATA_MODE ?? 'fixture';
        if (mode !== 'firebase' && mode !== 'fixture') throw new Error('Unknown data mode');
        const source = mode === 'firebase'
          ? await createFirebaseCatalogue()
          : createFixtureCatalogue(base);
        if (!cancelled) unsubscribe = source.subscribe((value) => (snapshot = value));
      } catch {
        snapshot = { status: 'error', games: [], rejected: [], message: 'Launcher unavailable' };
      }
    };
    void start();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  });

  function showNextPage() {
    if (!hasPages || drag) return;
    pageIndex = nextPage(pageIndex, snapshot.games.length);
    ringAngle = 0;
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || drag || launchLocked) return;
    const surface = event.currentTarget as HTMLElement;
    const bounds = surface.getBoundingClientRect();
    const target = event.target as HTMLElement;
    const tile = target.closest<HTMLElement>('[data-game-id]');
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastAngle: angleFromPoint(event.clientX, event.clientY, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2),
      gameId: tile?.dataset.gameId ?? null,
      moved: false
    };
    surface.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance >= TAP_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const current = angleFromPoint(
      event.clientX,
      event.clientY,
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2
    );
    ringAngle += shortestAngleDelta(drag.lastAngle, current);
    drag.lastAngle = current;

    if (!hasPages) return;
    while (ringAngle >= PAGE_SPIN_STEP) {
      pageIndex = normalizePage(pageIndex + 1, snapshot.games.length);
      ringAngle -= PAGE_SPIN_STEP;
    }
    while (ringAngle <= -PAGE_SPIN_STEP) {
      pageIndex = normalizePage(pageIndex - 1, snapshot.games.length);
      ringAngle += PAGE_SPIN_STEP;
    }
  }

  function pointerUp(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const completed = drag;
    drag = null;
    if (completed.moved) {
      ringAngle = Math.round(ringAngle / 5) * 5;
      return;
    }
    if (completed.gameId) {
      const releaseTile = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-game-id]');
      if (releaseTile?.dataset.gameId !== completed.gameId) return;
      const game = snapshot.games.find(({ id }) => id === completed.gameId);
      if (game) launchGame(game);
    }
  }

  function pointerCancel(event: PointerEvent) {
    if (drag?.pointerId === event.pointerId) drag = null;
  }

  function keyboardActivate(event: MouseEvent, game: GameTile) {
    if (event.detail === 0) launchGame(game);
  }

  function launchGame(game: GameTile) {
    if (launchLocked) return;
    try {
      const url = new URL(game.launchUrl);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid');
      launchLocked = true;
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      queueMicrotask(() => (launchLocked = false));
    } catch {
      snapshot = { ...snapshot, message: "Couldn't open game" };
    }
  }

  function statusText(value: CatalogueSnapshot): string {
    if (value.message) return value.message;
    if (value.status === 'loading') return 'Loading games';
    if (value.status === 'offline') return 'Offline';
    if (value.status === 'empty') return 'No games available';
    if (value.status === 'error') return 'Try again';
    return import.meta.env.PUBLIC_DATA_MODE === 'fixture' ? 'Fixture preview' : 'Games ready';
  }
</script>

<svelte:head>
  <title>Table Top Launcher</title>
  <meta
    name="description"
    content="An omnidirectional game launcher for a shared touch table"
  />
</svelte:head>

<main
  class:dragging={drag?.moved}
  class="tabletop"
  data-e2e-layout
  data-status={snapshot.status}
  aria-label="Table Top Launcher"
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerUp}
  onpointercancel={pointerCancel}
>
  <svg class="shape-definitions" aria-hidden="true" width="0" height="0" focusable="false">
    <defs>
      <clipPath id="rounded-game-token" clipPathUnits="objectBoundingBox">
        <path d="M .2,.015 Q .16,.015 .145,.07 L .006,.89 Q -.003,.948 .055,.975 Q .5,1 .945,.975 Q 1.003,.948 .994,.89 L .855,.07 Q .84,.015 .8,.015 Z" />
      </clipPath>
    </defs>
  </svg>
  <div class="ambient-grid" aria-hidden="true"></div>
  <div class="wheel-halo" aria-hidden="true"></div>
  <div class="wheel-bezel" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="orbit orbit-outer" aria-hidden="true"></div>
  <div class="orbit orbit-middle" aria-hidden="true"></div>
  <div class="orbit orbit-inner" aria-hidden="true"></div>

  {#each ['north', 'east', 'south', 'west'] as edge}
    <div class="edge-status {edge}" aria-hidden={edge !== 'south'}>
      <span class:ready={snapshot.status === 'current'}></span>{statusLabel}
    </div>
  {/each}

  {#each ['north', 'east', 'south', 'west'] as edge}
    <div class="edge-handle {edge}" data-handle={edge} aria-hidden="true">
      <i></i><i></i><i></i>
    </div>
  {/each}

  {#if snapshot.status === 'current' || snapshot.status === 'offline'}
    <section class="game-ring" aria-label={`Games, page ${pageIndex + 1} of ${totalPages}`}>
      {#each visibleGames as game, index (game.id)}
        {@const position = ringPosition(index, visibleGames.length, ringAngle)}
        <button
          class="game-tile"
          class:pressed={drag?.gameId === game.id && !drag.moved}
          data-game-id={game.id}
          data-edge={position.edge}
          data-angle={position.angle.toFixed(2)}
          aria-label={`Launch ${game.title}`}
          style={`--tile-x:${position.xPercent}%;--tile-y:${position.yPercent}%;--tile-rotation:${position.rotation}deg;--tile-shell-rotation:${position.shellRotation}deg;`}
          onclick={(event) => keyboardActivate(event, game)}
        >
          <span class="icon-frame tile-art">
            {#if game.iconSrc}
              <img src={game.iconSrc} alt="" draggable="false" />
            {:else}
              <span class="icon-fallback" aria-hidden="true">{game.title.slice(0, 2)}</span>
            {/if}
          </span>
          <strong class="tile-title">{game.title}</strong>
        </button>
      {/each}
    </section>
  {/if}

  <div class="center-shell" class:paged={hasPages}>
    {#if hasPages}
      <button
        class="center-logo"
        aria-label={`Show next games, page ${nextPage(pageIndex, snapshot.games.length) + 1} of ${totalPages}`}
        onclick={showNextPage}
        onpointerdown={(event) => event.stopPropagation()}
      >
        <span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        {#each ['north', 'east', 'south', 'west'] as edge}
          <span class="page-count {edge}" aria-hidden="true">{pageLabel}</span>
        {/each}
      </button>
    {:else}
      <div class="center-logo inert" aria-hidden="true">
        <span class="logo-mark"><i></i><i></i><i></i></span>
        {#each ['north', 'east', 'south', 'west'] as edge}
          <span class="page-count {edge}">{pageLabel}</span>
        {/each}
      </div>
    {/if}
  </div>

  {#if snapshot.status === 'empty' || snapshot.status === 'error'}
    <div class="system-state" role="status">{statusLabel}</div>
  {:else}
    <p class="sr-only" aria-live="polite">{statusLabel}. Page {pageIndex + 1} of {totalPages}.</p>
  {/if}
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html), :global(body) { width: 100%; height: 100%; overflow: hidden; }
  :global(body) { margin: 0; background: #07141d; color: #f5fbfc; font-family: 'Atkinson Hyperlegible', sans-serif; }
  :global(button) { font: inherit; }

  .tabletop {
    position: fixed;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    background:
      radial-gradient(ellipse at center, rgba(28, 96, 113, .3) 0 25%, transparent 58%),
      linear-gradient(145deg, #07141d, #091923 48%, #061119);
    isolation: isolate;
  }
  .tabletop::after {
    content: '';
    position: absolute;
    inset: 1.2rem;
    border: 1px solid rgba(103, 219, 231, .2);
    border-radius: 2rem;
    pointer-events: none;
  }
  .ambient-grid {
    position: absolute;
    inset: 0;
    opacity: .18;
    background-image:
      linear-gradient(rgba(103,219,231,.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(103,219,231,.18) 1px, transparent 1px);
    background-size: 4.5rem 4.5rem;
    mask-image: radial-gradient(ellipse, black, transparent 72%);
  }
  .orbit { position: absolute; left: 50%; top: 50%; translate: -50% -50%; border-radius: 50%; pointer-events: none; }
  .orbit-outer { width: 78%; height: 78%; border: 2px solid rgba(103,219,231,.34); box-shadow: 0 0 2rem rgba(103,219,231,.14), inset 0 0 2rem rgba(103,219,231,.08); }
  .orbit-inner { width: 37%; aspect-ratio: 1; border: 1px solid rgba(255,228,92,.28); }

  .game-ring { position: absolute; inset: 0; z-index: 2; }
  .game-tile {
    --tile-x: 50%; --tile-y: 50%; --tile-rotation: 0deg;
    position: absolute;
    left: var(--tile-x);
    top: var(--tile-y);
    width: clamp(9.5rem, 13vw, 15.5rem);
    height: clamp(8.5rem, 20vh, 13.5rem);
    padding: .7rem;
    border: 2px solid #67dbe7;
    border-radius: 1.4rem;
    transform: translate(-50%, -50%) rotate(var(--tile-rotation));
    display: grid;
    grid-template-rows: 1fr auto;
    gap: .55rem;
    color: #f5fbfc;
    background: linear-gradient(160deg, rgba(20,61,75,.98), rgba(7,24,34,.98));
    box-shadow: 0 0 0 .35rem rgba(7,20,29,.95), 0 0 1.25rem rgba(103,219,231,.24);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .game-tile:hover, .game-tile:focus-visible, .game-tile.pressed {
    border-color: #ffe45c;
    box-shadow: 0 0 0 .35rem rgba(7,20,29,.95), 0 0 2rem rgba(255,228,92,.5);
    outline: none;
  }
  .game-tile.pressed { border-color: #ff765f; scale: .98; }
  .icon-frame { display: grid; place-items: center; min-height: 0; border-radius: .9rem; background: radial-gradient(circle, rgba(103,219,231,.13), transparent 68%); overflow: hidden; }
  .icon-frame img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
  .icon-fallback { display: grid; place-items: center; width: 72%; aspect-ratio: 1; border: 2px solid #ffe45c; border-radius: 50%; color: #ffe45c; font-size: 2.5rem; }
  .game-tile strong { min-width: 0; font-size: clamp(1rem, 1.1vw, 1.25rem); line-height: 1; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .center-shell { position: absolute; left: 50%; top: 50%; z-index: 4; translate: -50% -50%; width: clamp(12rem, 17vw, 19rem); aspect-ratio: 1; border-radius: 50%; padding: .65rem; background: conic-gradient(from 0deg, #67dbe7 0 23%, transparent 23% 25%, #ffe45c 25% 48%, transparent 48% 50%, #67dbe7 50% 73%, transparent 73% 75%, #ffe45c 75% 98%, transparent 98%); filter: drop-shadow(0 0 1.5rem rgba(103,219,231,.22)); }
  .center-logo { position: relative; width: 100%; height: 100%; border: .5rem solid #07141d; border-radius: 50%; display: grid; place-items: center; align-content: center; gap: .7rem; color: #f5fbfc; background: radial-gradient(circle at 50% 42%, #173949, #091923 68%); }
  button.center-logo { cursor: pointer; }
  button.center-logo:hover, button.center-logo:focus-visible { outline: .3rem solid #ffe45c; outline-offset: .25rem; }
  button.center-logo:active { scale: .98; }
  .logo-mark { position: relative; display: block; width: 4.4rem; height: 3.9rem; transform: rotate(45deg); }
  .logo-mark i { position: absolute; inset: .65rem; border: 2px solid #67dbe7; }
  .logo-mark i:nth-child(2) { inset: 0; border-color: #ffe45c; }
  .logo-mark i:nth-child(3) { inset: 1.3rem; border-color: #f5fbfc; }
  .page-count { position: absolute; font-size: clamp(.65rem, .7vw, .8rem); font-weight: 700; letter-spacing: .12em; color: #9fc2ca; }
  .page-count.north { top: .8rem; left: 50%; transform: translateX(-50%) rotate(180deg); }
  .page-count.east { right: .8rem; top: 50%; transform: translateY(-50%) rotate(-90deg); }
  .page-count.south { bottom: .8rem; left: 50%; transform: translateX(-50%); }
  .page-count.west { left: .8rem; top: 50%; transform: translateY(-50%) rotate(90deg); }

  .edge-handle { position: absolute; z-index: 3; display: flex; gap: .3rem; padding: .7rem 1.2rem; border: 1px solid rgba(103,219,231,.55); border-radius: 999px; background: rgba(7,20,29,.85); box-shadow: 0 0 1rem rgba(103,219,231,.18); pointer-events: none; }
  .edge-handle i { width: .8rem; height: .8rem; border-top: .2rem solid #ffe45c; border-right: .2rem solid #ffe45c; transform: rotate(45deg); }
  .edge-handle.north { top: 2.8%; left: 50%; transform: translateX(-50%) rotate(90deg); }
  .edge-handle.east { right: 2.3%; top: 50%; transform: translateY(-50%) rotate(180deg); }
  .edge-handle.south { bottom: 2.8%; left: 50%; transform: translateX(-50%) rotate(-90deg); }
  .edge-handle.west { left: 2.3%; top: 50%; transform: translateY(-50%); }

  .edge-status { position: absolute; z-index: 5; display: flex; align-items: center; gap: .45rem; color: #9fc2ca; font-size: clamp(.65rem, .75vw, .85rem); text-transform: uppercase; letter-spacing: .14em; pointer-events: none; }
  .edge-status span { width: .55rem; aspect-ratio: 1; border-radius: 50%; background: #ff765f; }
  .edge-status span.ready { background: #67dbe7; box-shadow: 0 0 .7rem #67dbe7; }
  .edge-status.north { top: 2.5%; left: 7%; transform: rotate(180deg); }
  .edge-status.east { right: 2.1%; bottom: 9%; transform-origin: right bottom; transform: rotate(-90deg); }
  .edge-status.south { bottom: 2.5%; right: 7%; }
  .edge-status.west { left: 2.1%; top: 9%; transform-origin: left top; transform: rotate(90deg); }

  .system-state { position: absolute; inset: 0; display: grid; place-items: center; color: #f5fbfc; font-size: clamp(2rem, 5vw, 5rem); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .dragging .game-tile { pointer-events: none; }

  @media (prefers-reduced-motion: no-preference) {
    .game-tile { transition: left .18s ease-out, top .18s ease-out, transform .18s ease-out, border-color .1s, box-shadow .1s, scale .1s; }
    .dragging .game-tile { transition: none; }
  }
  @media (forced-colors: active) {
    .game-tile, .center-logo, .edge-handle { forced-color-adjust: none; }
  }
</style>
