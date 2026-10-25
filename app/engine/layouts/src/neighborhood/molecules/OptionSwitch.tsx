import { For } from 'solid-js';

/** Deux ou trois choix côte à côte, dont un seul est actif. */
export function OptionSwitch<Value extends string>(props: {
  label: string;
  options: ReadonlyArray<{ value: Value; title: string }>;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div class="nb-switch" role="group" aria-label={props.label}>
      <For each={props.options}>
        {(option) => (
          <button class="nb-switch__option" type="button" aria-pressed={props.value === option.value} onClick={() => props.onChange(option.value)}>
            {option.title}
          </button>
        )}
      </For>
    </div>
  );
}
