import { createSignal, For, onMount, Show } from 'solid-js';
import { listPlannedVisitChoices, type PlannedVisitChoice } from '@crystal-pharm/renderer';

/** Quand passer, en grandes tuiles : « dès que c'est prêt » sur toute la largeur, les autres moments dessous ; ils dépendent de l'heure, donc n'apparaissent qu'une fois la page ouverte. */
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
    <div class="sc-field">
      <span class="sc-field__label">Quand passez-vous ?</span>
      <div class="sc-tiles" role="group" aria-label="Quand passez-vous ?">
        <button type="button" class="sc-tiles__tile sc-tiles__tile--wide" aria-pressed={isChosen('')} onClick={() => choose('')}>
          <span class="sc-tiles__title">Dès que c'est prêt</span>
          <span class="sc-tiles__caption">Nous vous prévenons.</span>
        </button>
        <For each={choices()}>
          {(choice) => (
            <button type="button" class="sc-tiles__tile" aria-pressed={isChosen(choice.plannedVisitAt)} onClick={() => choose(choice.plannedVisitAt)}>
              <span class="sc-tiles__title">{choice.label}</span>
            </button>
          )}
        </For>
        <button
          type="button"
          class="sc-tiles__tile"
          aria-pressed={isChoosingAnotherMoment()}
          onClick={() => {
            setIsChoosingAnotherMoment(true);
            props.onChange('');
          }}
        >
          <span class="sc-tiles__title">Un autre jour</span>
        </button>
      </div>
      <Show when={isChoosingAnotherMoment()}>
        <input class="sc-input" type="datetime-local" aria-label="Jour et heure de passage" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} />
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="sc-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
