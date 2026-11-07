<script lang="ts">
  import type { ApplicationDraft, EditableApplication } from '$lib/data/catalogue-editor';

  export let application: EditableApplication;
  export let onSave: (id: string, draft: ApplicationDraft) => Promise<void>;

  let title = application.title;
  let url = application.url;
  let icon = application.icon;
  let tabletop = !application.hidden;
  let gameroomEnabled = application.gameroomEnabled;
  let webUrl = application.webUrl;
  let saving = false;
  let message = '';

  async function save() {
    saving = true;
    message = '';
    try {
      await onSave(application.id, { title, url, icon, hidden: !tabletop, webUrl, gameroomEnabled });
      message = 'Saved';
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not save this game.';
    } finally {
      saving = false;
    }
  }

</script>

<article class:hidden={application.hidden && application.gameroomEnabled === 'disabled'} data-application-id={application.id}>
  <header>
    <div>
      <p class="document-id">{application.id}</p>
      <h2>{application.title || 'Untitled application'}</h2>
    </div>
    <span class:off={application.hidden && application.gameroomEnabled === 'disabled'} class="visibility">
      {[!application.hidden ? 'Tabletop' : '', application.gameroomEnabled !== 'disabled' ? 'Gameroom' : ''].filter(Boolean).join(' · ') || 'Disabled'}
    </span>
  </header>

  <form on:submit|preventDefault={save}>
    <label>
      Title
      <input disabled={saving} bind:value={title} maxlength="120" required autocomplete="off" />
    </label>
    <label>
      Launch URL (tabletop)
      <input disabled={saving} bind:value={url} type="url" pattern="https://.*" required={tabletop} inputmode="url" />
    </label>
    <label>
      WebURL (Gameroom)
      <input disabled={saving} bind:value={webUrl} type="url" pattern="https://.*" required={gameroomEnabled !== 'disabled'} inputmode="url" />
    </label>
    <label class="audience"><input disabled={saving} type="checkbox" bind:checked={tabletop} /> Tabletop</label>
    <label>Gameroom<select aria-label="Gameroom" disabled={saving} bind:value={gameroomEnabled}><option value="disabled">Disabled</option><option value="integrated">Integrated</option><option value="new-tab">New tab</option></select></label>

    <label>
      Icon URL <span>(optional)</span>
      <input disabled={saving} bind:value={icon} type="text" inputmode="url" />
    </label>
    <div class="actions">
      <button class="save" type="submit" disabled={saving}>Save changes</button>
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
  input, select {
    min-height: 3rem;
    border: 1px solid #8ba8b4;
    border-radius: .6rem;
    padding: 0 .8rem;
    color: #071f2b;
    background: #fff;
    font: inherit;
  }
  input:focus-visible, select:focus-visible, button:focus-visible { outline: .2rem solid #087e8b; outline-offset: .15rem; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem; margin-top: .2rem; }
  button { min-height: 3rem; border-radius: .65rem; padding: .65rem 1rem; font: inherit; font-weight: 700; cursor: pointer; }
  button:disabled { cursor: wait; opacity: .55; }
  .save { border: 1px solid #075f6b; color: #fff; background: #075f6b; }
  output { color: #7b2b24; font-weight: 700; }
  label.audience { display: flex; align-items: center; gap: .6rem; }
  label.audience input { min-height: 1.5rem; width: 1.5rem; padding: 0; }
</style>
