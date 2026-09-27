<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import ApplicationEditorCard from '$lib/ui/ApplicationEditorCard.svelte';
  import {
    createCatalogueEditor,
    type ApplicationDraft,
    type CatalogueEditor,
    type EditorApplications,
    type EditorSession
  } from '$lib/data/catalogue-editor';

  let editor: CatalogueEditor | null = null;
  let session: EditorSession = { status: 'loading' };
  let catalogue: EditorApplications = { status: 'loading', applications: [] };
  let unsubscribeApplications = () => {};
  let authMessage = '';
  let title = '';
  let url = '';
  let icon = '';
  let adding = false;
  let addMessage = '';

  onMount(() => {
    let cancelled = false;
    let unsubscribeSession = () => {};
    void createCatalogueEditor()
      .then((createdEditor) => {
        if (cancelled) return;
        editor = createdEditor;
        unsubscribeSession = createdEditor.subscribeSession((nextSession) => {
          session = nextSession;
          unsubscribeApplications();
          unsubscribeApplications = () => {};
          if (nextSession.status === 'authorized') {
            unsubscribeApplications = createdEditor.subscribeApplications(
              (nextCatalogue) => catalogue = nextCatalogue
            );
          } else {
            catalogue = { status: 'loading', applications: [] };
          }
        });
      })
      .catch((error) => session = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Could not start the catalogue editor.'
      });

    return () => {
      cancelled = true;
      unsubscribeSession();
      unsubscribeApplications();
    };
  });

  async function signIn() {
    authMessage = '';
    try {
      await editor?.signIn();
    } catch {
      authMessage = 'Sign-in did not complete. Allow the popup and try again.';
    }
  }

  async function signOut() {
    authMessage = '';
    try {
      await editor?.signOut();
    } catch {
      authMessage = 'Could not sign out. Try again.';
    }
  }

  async function addApplication() {
    if (!editor) return;
    adding = true;
    addMessage = '';
    try {
      await editor.addApplication({ title, url, icon });
      title = '';
      url = '';
      icon = '';
      addMessage = 'Game added to the catalogue.';
    } catch (error) {
      addMessage = error instanceof Error ? error.message : 'Could not add the game.';
    } finally {
      adding = false;
    }
  }

  async function saveApplication(id: string, draft: ApplicationDraft) {
    if (!editor) throw new Error('Editor unavailable.');
    await editor.updateApplication(id, draft);
  }

  async function toggleApplication(id: string, hidden: boolean) {
    if (!editor) throw new Error('Editor unavailable.');
    await editor.setApplicationHidden(id, hidden);
  }

</script>

<svelte:head>
  <title>Catalogue editor · Table Top Launcher</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main data-editor-layout data-status={session.status === 'authorized' && catalogue.status === 'ready' ? 'ready' : session.status}>
  <header class="masthead">
    <div>
      <a class="back" href={`${base}/`}>← Table Top Launcher</a>
      <p class="eyebrow">Maintenance surface</p>
      <h1>Catalogue editor</h1>
      <p>Add games, correct titles and URLs, or temporarily hide debug entries.</p>
    </div>
    {#if session.status === 'authorized'}
      <div class="identity">
        <span>{session.email}</span>
        <button type="button" on:click={signOut}>Sign out</button>
      </div>
    {/if}
  </header>

  {#if session.status === 'loading'}
    <section class="gate" aria-live="polite">
      <h2>Checking access…</h2>
      <p>The editor stays locked until Firebase verifies this account.</p>
    </section>
  {:else if session.status === 'signed-out'}
    <section class="gate">
      <h2>Administrator sign-in required</h2>
      <p>The tabletop launcher remains anonymous. Editing the shared catalogue requires an approved Google account.</p>
      <button class="primary" type="button" on:click={signIn}>Sign in with Google</button>
      <output aria-live="polite">{authMessage}</output>
    </section>
  {:else if session.status === 'denied'}
    <section class="gate denied">
      <h2>This account is not an editor</h2>
      <p><strong>{session.email}</strong> signed in successfully, but this verified email address is not in the editor allow-list.</p>
      <div class="gate-actions">
        <button class="secondary" type="button" on:click={signOut}>Use another account</button>
      </div>
      <output aria-live="polite">{authMessage}</output>
    </section>
  {:else if session.status === 'error'}
    <section class="gate denied">
      <h2>Editor unavailable</h2>
      <p>{session.message}</p>
      <button class="secondary" type="button" on:click={() => location.reload()}>Retry</button>
    </section>
  {:else if session.status === 'authorized'}
    <aside class="live-notice" aria-label="Live catalogue notice">
      Changes save to the shared LauncherUI catalogue and appear in the launcher immediately.
    </aside>
    <section class="new-game" aria-labelledby="new-game-title">
      <div>
        <p class="eyebrow">New catalogue entry</p>
        <h2 id="new-game-title">Add a game</h2>
        <p>Title and launch URL are required. New entries appear immediately unless you hide them below.</p>
      </div>
      <form on:submit|preventDefault={addApplication}>
        <label>
          Title
          <input bind:value={title} maxlength="120" required autocomplete="off" placeholder="Snappy Maria" />
        </label>
        <label>
          Launch URL
          <input bind:value={url} type="url" pattern="https://.*" required inputmode="url" placeholder="https://games.example.com/" />
        </label>
        <label>
          Icon URL <span>(optional)</span>
          <input bind:value={icon} type="text" inputmode="url" placeholder="https://…/icon.png or /icons/game.svg" />
        </label>
        <button class="primary" type="submit" disabled={adding}>Add game</button>
        <output aria-live="polite">{addMessage}</output>
      </form>
    </section>

    <section class="catalogue" aria-labelledby="catalogue-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Existing entries</p>
          <h2 id="catalogue-title">Games</h2>
        </div>
        {#if catalogue.status === 'ready'}
          <p>{catalogue.applications.length} total · {catalogue.applications.filter((item) => item.hidden).length} hidden</p>
        {/if}
      </div>

      {#if catalogue.status === 'loading'}
        <p class="loading" aria-live="polite">Loading catalogue…</p>
      {:else if catalogue.status === 'error'}
        <p class="error" role="alert">{catalogue.message}</p>
      {:else}
        <div class="application-grid">
          {#each catalogue.applications as application (`${application.id}:${application.title}:${application.url}:${application.icon}:${application.hidden}`)}
            <ApplicationEditorCard
              {application}
              onSave={saveApplication}
              onToggleHidden={toggleApplication}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html) { min-width: 70rem; background: #eaf2f4; }
  :global(body) { margin: 0; color: #0b2937; background: #eaf2f4; font-family: 'Atkinson Hyperlegible', sans-serif; }
  main { min-height: 100vh; padding: 2.5rem clamp(2rem, 5vw, 6rem) 5rem; }
  .masthead { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; max-width: 100rem; margin: 0 auto 2rem; }
  .masthead h1 { margin: .15rem 0 .35rem; font-size: clamp(2.4rem, 4vw, 4.5rem); line-height: .95; }
  .masthead p { max-width: 47rem; margin: 0; font-size: 1.15rem; }
  .back { display: inline-block; margin-bottom: 1.3rem; color: #075f6b; font-weight: 700; }
  .eyebrow { color: #43717f; font-size: .84rem !important; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .identity { display: flex; align-items: center; gap: .8rem; border: 1px solid #b4cbd3; border-radius: 999px; padding: .4rem .4rem .4rem 1rem; background: #fff; }
  .identity button, .secondary { min-height: 2.8rem; border: 1px solid #75939e; border-radius: 999px; padding: .5rem 1rem; color: #173d4d; background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
  .gate, .new-game, .catalogue { max-width: 100rem; margin: 0 auto; border: 1px solid #b4cbd3; border-radius: 1.25rem; padding: clamp(1.5rem, 3vw, 3rem); background: rgba(255, 255, 255, .82); box-shadow: 0 .7rem 2.5rem rgba(7, 37, 50, .08); }
  .gate { min-height: 24rem; display: grid; place-content: center; justify-items: start; gap: 1rem; }
  .gate h2 { margin: 0; font-size: 2.25rem; }
  .gate p { max-width: 45rem; margin: 0; font-size: 1.15rem; }
  .gate-actions { display: flex; gap: .7rem; }
  .primary { min-height: 3.2rem; border: 0; border-radius: .7rem; padding: .7rem 1.25rem; color: #fff; background: #076673; font: inherit; font-weight: 700; cursor: pointer; }
  .primary:disabled { cursor: wait; opacity: .55; }
  button:focus-visible, input:focus-visible, a:focus-visible { outline: .2rem solid #087e8b; outline-offset: .18rem; }
  output { min-height: 1.4em; color: #862e26; font-weight: 700; }
  .live-notice { max-width: 100rem; margin: 0 auto 1rem; border: 1px solid #b47b16; border-radius: .8rem; padding: .8rem 1rem; color: #633c00; background: #fff2c9; font-weight: 700; }
  .new-game { display: grid; grid-template-columns: minmax(16rem, .7fr) minmax(34rem, 1.3fr); gap: clamp(2rem, 4vw, 5rem); margin-bottom: 2rem; }
  .new-game h2, .catalogue h2 { margin: .2rem 0 .5rem; font-size: 2rem; }
  .new-game p { margin: 0; }
  .new-game form { display: grid; grid-template-columns: 1fr 1fr; gap: .9rem; }
  .new-game label { display: grid; gap: .35rem; color: #173c4c; font-weight: 700; }
  .new-game label:first-child { grid-column: 1 / -1; }
  .new-game label span { color: #647b85; font-weight: 400; }
  .new-game input { min-height: 3rem; border: 1px solid #8ba8b4; border-radius: .6rem; padding: 0 .8rem; font: inherit; }
  .new-game output { align-self: center; }
  .catalogue { background: rgba(247, 251, 252, .95); }
  .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 1.4rem; }
  .section-heading p { margin: 0; }
  .application-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .loading, .error { font-size: 1.2rem; font-weight: 700; }
  .error { color: #862e26; }
  @media (forced-colors: active) {
    .gate, .new-game, .catalogue, .identity { border: 2px solid CanvasText; }
  }
</style>
