import { createSignal, For, onMount, Show } from 'solid-js';
import { listPlannedVisitChoices, type PlannedVisitChoice } from '@crystal-pharm/renderer';

/** Quand passer : « dès que c'est prêt » par défaut, les autres moments dépendent de l'heure, donc n'apparaissent qu'une fois la page ouverte. */
export function PlannedVisitChoices(props: { value: string; error: string | undefined; onChange: (value: string) => void }) {
  const [choices, setChoices] = createSignal<PlannedVisitChoice[]>([]);
  const [isChoosingAnotherMoment, setIsChoosingAnotherMoment] = createSignal(false);
  onMount(() => setChoices(listPlannedVisitChoices(new Date())));

  const isChosen = (plannedVisitAt: string) => !isChoosingAnotherMoment() && props.value === plannedVisitAt;

  function choose(plannedVisitAt: string): void {
    setIsChoosingAnotherMoment(false);
    props.onChange(plannedVisitAt);
  }

  return (
    <div class="cl-field">
      <span class="cl-field__label">Quand passez-vous ?</span>
      <div class="cl-choice" role="group" aria-label="Quand passez-vous ?">
        <button type="button" aria-pressed={isChosen('')} onClick={() => choose('')}>
          Dès que c'est prêt
        </button>
        <For each={choices()}>
          {(choice) => (
            <button type="button" aria-pressed={isChosen(choice.plannedVisitAt)} onClick={() => choose(choice.plannedVisitAt)}>
              {choice.label}
            </button>
          )}
        </For>
        <button
          type="button"
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
        <input class="cl-input" type="datetime-local" aria-label="Jour et heure de passage" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} />
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="cl-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
