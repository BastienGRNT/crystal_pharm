import { createSignal, For, onMount, Show } from 'solid-js';
import { listPlannedVisitChoices, type PlannedVisitChoice } from '@crystal-pharm/renderer';

/**
 * Quand passer, d'un geste. « Dès que c'est prêt » par défaut : la plupart des patients ne savent pas encore.
 * Les autres moments dépendent de l'heure qu'il est : ils n'apparaissent qu'une fois la page ouverte.
 */
export function PlannedVisitPicker(props: { value: string; error: string | undefined; onChange: (value: string) => void }) {
  const [choices, setChoices] = createSignal<PlannedVisitChoice[]>([]);
  const [isChoosingAnotherMoment, setIsChoosingAnotherMoment] = createSignal(false);
  onMount(() => setChoices(listPlannedVisitChoices(new Date())));

  const isChosen = (plannedVisitAt: string) => !isChoosingAnotherMoment() && props.value === plannedVisitAt;

  function choose(plannedVisitAt: string): void {
    setIsChoosingAnotherMoment(false);
    props.onChange(plannedVisitAt);
  }

  return (
    <div class="nb-field" classList={{ 'nb-field--invalid': props.error !== undefined }}>
      <div class="nb-chips" role="group" aria-label="Quand passez-vous ?">
        <button type="button" class="nb-chip" aria-pressed={isChosen('')} onClick={() => choose('')}>
          Dès que c’est prêt
        </button>
        <For each={choices()}>
          {(choice) => (
            <button type="button" class="nb-chip" aria-pressed={isChosen(choice.plannedVisitAt)} onClick={() => choose(choice.plannedVisitAt)}>
              {choice.label}
            </button>
          )}
        </For>
        <button
          type="button"
          class="nb-chip"
          aria-pressed={isChoosingAnotherMoment()}
          onClick={() => {
            setIsChoosingAnotherMoment(true);
            props.onChange('');
          }}
        >
          Un autre jour
        </button>
      </div>
      <Show when={isChoosingAnotherMoment()}>
        <label class="nb-field">
          <span class="nb-field__label">Le jour et l’heure de votre passage</span>
          <input class="nb-input nb-input--short" type="datetime-local" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} />
        </label>
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="nb-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
