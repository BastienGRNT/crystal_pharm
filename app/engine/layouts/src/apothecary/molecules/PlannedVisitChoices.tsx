import { createSignal, createUniqueId, For, onMount, Show } from 'solid-js';
import { listPlannedVisitChoices, type PlannedVisitChoice } from '@crystal-pharm/renderer';

const anotherMomentKey = 'another-moment';

/** Quand passer, dans un menu déroulant : « dès que c'est prêt » d'abord ; les autres moments dépendent de l'heure, donc n'apparaissent qu'une fois la page ouverte. */
export function PlannedVisitChoices(props: { value: string; error: string | undefined; onChange: (value: string) => void }) {
  const selectId = createUniqueId();
  const [choices, setChoices] = createSignal<PlannedVisitChoice[]>([]);
  const [isChoosingAnotherMoment, setIsChoosingAnotherMoment] = createSignal(false);
  onMount(() => setChoices(listPlannedVisitChoices(new Date())));

  function choose(selectedKey: string): void {
    const isAnotherMoment = selectedKey === anotherMomentKey;
    setIsChoosingAnotherMoment(isAnotherMoment);
    props.onChange(isAnotherMoment ? '' : selectedKey);
  }

  return (
    <div class="ap-field">
      <label class="ap-field__label" for={selectId}>
        Quand passerez-vous ?
      </label>
      <select id={selectId} class="ap-input ap-select" onChange={(event) => choose(event.currentTarget.value)}>
        <option value="" selected={!isChoosingAnotherMoment() && props.value === ''}>
          Dès que c'est prêt
        </option>
        <For each={choices()}>
          {(choice) => (
            <option value={choice.plannedVisitAt} selected={!isChoosingAnotherMoment() && props.value === choice.plannedVisitAt}>
              {choice.label}
            </option>
          )}
        </For>
        <option value={anotherMomentKey} selected={isChoosingAnotherMoment()}>
          Un autre jour, à préciser
        </option>
      </select>
      <Show when={isChoosingAnotherMoment()}>
        <input class="ap-input" type="datetime-local" aria-label="Jour et heure de passage" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} />
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="ap-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
