import { Show, type JSX } from 'solid-js';

export function CheckboxLine(props: { checked: boolean; onChange: (checked: boolean) => void; hint?: string; children: JSX.Element }) {
  return (
    <label class="nb-checkbox">
      <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.currentTarget.checked)} />
      <span>
        {props.children}
        <Show when={props.hint}>{(hint) => <span class="nb-checkbox__hint">{hint()}</span>}</Show>
      </span>
    </label>
  );
}
