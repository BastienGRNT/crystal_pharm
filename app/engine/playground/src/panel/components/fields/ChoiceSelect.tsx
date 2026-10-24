import { For } from 'solid-js';

export type Choice = { value: string; label: string };

export function ChoiceSelect(props: { choices: readonly Choice[]; value: string; onChange: (value: string) => void; ariaLabel?: string }) {
  return (
    <select class="select" aria-label={props.ariaLabel} value={props.value} onChange={(event) => props.onChange(event.currentTarget.value)}>
      <For each={props.choices}>
        {(choice) => (
          <option value={choice.value} selected={choice.value === props.value}>
            {choice.label}
          </option>
        )}
      </For>
    </select>
  );
}
