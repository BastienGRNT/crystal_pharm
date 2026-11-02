import { createSignal, For, onMount, Show } from 'solid-js';
import { listPlannedVisitChoices, type PlannedVisitChoice } from '@crystal-pharm/renderer';

/** Quand passer, en liste de boutons radio : « dès que c'est prêt » d'abord ; les autres moments dépendent de l'heure, donc n'apparaissent qu'une fois la page ouverte. */
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
    <fieldset class="cl-radios">
      <legend class="cl-field__label">Quand passez-vous ?</legend>
      <label class="cl-radio">
        <input type="radio" name="cl-planned-visit" checked={isChosen('')} onChange={() => choose('')} />
        <span>Dès que c'est prêt</span>
      </label>
      <For each={choices()}>
        {(choice) => (
          <label class="cl-radio">
            <input type="radio" name="cl-planned-visit" checked={isChosen(choice.plannedVisitAt)} onChange={() => choose(choice.plannedVisitAt)} />
            <span>{choice.label}</span>
          </label>
        )}
      </For>
      <label class="cl-radio">
        <input
          type="radio"
          name="cl-planned-visit"
          checked={isChoosingAnotherMoment()}
          onChange={() => {
            setIsChoosingAnotherMoment(true);
            props.onChange('');
          }}
        />
        <span>Un autre jour</span>
      </label>
      <Show when={isChoosingAnotherMoment()}>
        <input class="cl-input cl-radios__moment" type="datetime-local" aria-label="Jour et heure de passage" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} />
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="cl-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </fieldset>
  );
}
