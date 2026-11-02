import { createSignal, For, onMount, Show } from 'solid-js';
import { listPlannedVisitChoices, type PlannedVisitChoice } from '@crystal-pharm/renderer';

/** Quand passer, comme un sélecteur à diodes : une seule diode allumée. Les moments dépendent de l'heure, donc n'apparaissent qu'une fois la page ouverte. */
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
    <div class="sb-field">
      <span class="sb-field__label">Quand passez-vous ?</span>
      <ul class="sb-selector" role="group" aria-label="Quand passez-vous ?">
        <li>
          <button type="button" class="sb-selector__option" aria-pressed={isChosen('')} onClick={() => choose('')}>
            <span class="sb-selector__led" aria-hidden="true" />
            Dès que c'est prêt
          </button>
        </li>
        <For each={choices()}>
          {(choice) => (
            <li>
              <button type="button" class="sb-selector__option" aria-pressed={isChosen(choice.plannedVisitAt)} onClick={() => choose(choice.plannedVisitAt)}>
                <span class="sb-selector__led" aria-hidden="true" />
                {choice.label}
              </button>
            </li>
          )}
        </For>
        <li>
          <button
            type="button"
            class="sb-selector__option"
            aria-pressed={isChoosingAnotherMoment()}
            onClick={() => {
              setIsChoosingAnotherMoment(true);
              props.onChange('');
            }}
          >
            <span class="sb-selector__led" aria-hidden="true" />
            Un autre jour
          </button>
        </li>
      </ul>
      <Show when={isChoosingAnotherMoment()}>
        <input class="sb-input" type="datetime-local" aria-label="Jour et heure de passage" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} />
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="sb-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
