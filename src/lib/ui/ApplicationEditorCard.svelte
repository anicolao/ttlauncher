<script lang="ts">
  import type { ApplicationDraft, EditableApplication } from '$lib/data/catalogue-editor';

  export let application: EditableApplication;
  export let onSave: (id: string, draft: ApplicationDraft) => Promise<void>;
  export let onToggleHidden: (id: string, hidden: boolean) => Promise<void>;

  let title = application.title;
  let url = application.url;
  let icon = application.icon;
  let saving = false;
  let message = '';

  async function save() {
    saving = true;
    message = '';
    try {
      await onSave(application.id, { title, url, icon });
      message = 'Saved';
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not save this game.';
    } finally {
      saving = false;
    }
  }

  async function toggleHidden() {
    saving = true;
    message = '';
    try {
      await onToggleHidden(application.id, !application.hidden);
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not change visibility.';
    } finally {
      saving = false;
    }
  }
</script>

<article class:hidden={application.hidden} data-application-id={application.id}>
  <header>
    <div>
      <p class="document-id">{application.id}</p>
      <h2>{application.title || 'Untitled application'}</h2>
    </div>
    <span class:off={application.hidden} class="visibility">
      {application.hidden ? 'Hidden' : 'Visible'}
    </span>
  </header>

  <form on:submit|preventDefault={save}>
    <label>
      Title
      <input bind:value={title} maxlength="120" required autocomplete="off" />
    </label>
    <label>
      Launch URL
      <input bind:value={url} type="url" pattern="https://.*" required inputmode="url" />
    </label>
    <label>
      Icon URL <span>(optional)</span>
      <input bind:value={icon} type="text" inputmode="url" />
    </label>
    <div class="actions">
      <button class="save" type="submit" disabled={saving}>Save changes</button>
      <button class="visibility-toggle" type="button" disabled={saving} on:click={toggleHidden}>
        {application.hidden ? 'Show on launcher' : 'Hide from launcher'}
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  </form>
</article>

<style>
  article {
    border: 1px solid #bfd6df;
    border-radius: 1rem;
    padding: 1.25rem;
    background: #fff;
    box-shadow: 0 .4rem 1.4rem rgba(4, 27, 39, .08);
  }
  article.hidden { background: #f3f5f6; border-color: #ccd3d6; }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
  h2 { margin: .15rem 0 0; font-size: 1.35rem; color: #092637; }
  .document-id { margin: 0; color: #54717d; font-size: .78rem; overflow-wrap: anywhere; }
  .visibility { flex: none; border-radius: 999px; padding: .4rem .7rem; color: #064c3c; background: #c8f4e5; font-weight: 700; }
  .visibility.off { color: #6b3232; background: #f2dddd; }
  form { display: grid; gap: .9rem; }
  label { display: grid; gap: .35rem; color: #173c4c; font-weight: 700; }
  label span { color: #647b85; font-weight: 400; }
  input {
    min-height: 3rem;
    border: 1px solid #8ba8b4;
    border-radius: .6rem;
    padding: 0 .8rem;
    color: #071f2b;
    background: #fff;
    font: inherit;
  }
  input:focus-visible, button:focus-visible { outline: .2rem solid #087e8b; outline-offset: .15rem; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem; margin-top: .2rem; }
  button { min-height: 3rem; border-radius: .65rem; padding: .65rem 1rem; font: inherit; font-weight: 700; cursor: pointer; }
  button:disabled { cursor: wait; opacity: .55; }
  .save { border: 1px solid #075f6b; color: #fff; background: #075f6b; }
  .visibility-toggle { border: 1px solid #9a5e19; color: #693b08; background: #fff4d2; }
  output { color: #7b2b24; font-weight: 700; }
</style>
