import { createEffect, createSignal, Show } from 'solid-js';
import type { PlaygroundState } from '../../../state/createPlaygroundState';

/** Le TenantSite exact envoyé au moteur, modifiable à la main pour essayer n'importe quel cas, valide ou non. */
export function DataTab(props: { state: PlaygroundState }) {
  const state = props.state;
  const [draft, setDraft] = createSignal('');
  const [isDraftModified, setIsDraftModified] = createSignal(false);
  const [draftError, setDraftError] = createSignal<string>();
  const assembledText = () => JSON.stringify(state.outcome()?.tenantSiteInput ?? null, null, 2);

  createEffect(() => {
    const latestAssembledText = assembledText();
    if (!isDraftModified()) setDraft(latestAssembledText);
  });

  function applyDraft(): void {
    try {
      const editedTenantSite: unknown = JSON.parse(draft());
      state.changeScenario((current) => ({ ...current, editedTenantSite }));
      setIsDraftModified(false);
      setDraftError(undefined);
    } catch (error) {
      setDraftError(`JSON invalide : ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function returnToMock(): void {
    state.changeScenario((current) => ({ ...current, editedTenantSite: undefined }));
    setIsDraftModified(false);
    setDraftError(undefined);
  }

  return (
    <div class="tab tab--fill">
      <Show when={state.scenario().editedTenantSite !== undefined}>
        <p class="notice notice--warning">Ces données remplacent le mock : les choix des autres onglets sont ignorés.</p>
      </Show>
      <textarea
        class="code-input code-input--fill"
        spellcheck={false}
        value={draft()}
        onInput={(event) => {
          setDraft(event.currentTarget.value);
          setIsDraftModified(true);
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') applyDraft();
        }}
      />
      <Show when={draftError()}>{(message) => <p class="notice notice--danger">{message()}</p>}</Show>
      <div class="inline">
        <button type="button" class="button button--primary" disabled={!isDraftModified()} onClick={applyDraft} title="Ctrl + Entrée">
          Appliquer
        </button>
        <button type="button" class="button" disabled={!isDraftModified()} onClick={() => setIsDraftModified(false)}>
          Annuler les modifications
        </button>
        <button type="button" class="button" disabled={state.scenario().editedTenantSite === undefined} onClick={returnToMock}>
          Revenir au mock
        </button>
        <button type="button" class="button" onClick={() => void navigator.clipboard.writeText(draft())}>
          Copier
        </button>
      </div>
    </div>
  );
}
