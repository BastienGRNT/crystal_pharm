import { For } from 'solid-js';

export type SegmentOption<Value extends string> = { value: Value; label: string; title?: string };

export function SegmentedControl<Value extends string>(props: {
  options: readonly SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div class="segmented" role="radiogroup">
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            role="radio"
            aria-checked={option.value === props.value}
            class="segmented__option"
            classList={{ 'segmented__option--selected': option.value === props.value }}
            title={option.title}
            onClick={() => props.onChange(option.value)}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}
