import { Show, type JSX } from 'solid-js';

export function FieldRow(props: { label: string; hint?: string; aside?: JSX.Element; children: JSX.Element }) {
  return (
    <div class="field-row">
      <div class="field-row__heading">
        <span class="field-row__label">{props.label}</span>
        {props.aside}
      </div>
      {props.children}
      <Show when={props.hint}>
        <p class="field-row__hint">{props.hint}</p>
      </Show>
    </div>
  );
}
