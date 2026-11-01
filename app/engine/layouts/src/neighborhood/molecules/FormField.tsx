import { Show, type JSX } from 'solid-js';

export function FormField(props: { label: string; hint?: string; optional?: boolean; error: string | undefined; children: JSX.Element }) {
  return (
    <label class="nb-field" classList={{ 'nb-field--invalid': props.error !== undefined }}>
      <span class="nb-field__label">
        {props.label}
        <Show when={props.optional}>
          <span class="nb-field__optional">facultatif</span>
        </Show>
      </span>
      <Show when={props.hint}>{(hint) => <span class="nb-field__hint">{hint()}</span>}</Show>
      {props.children}
      <Show when={props.error}>
        {(error) => (
          <span class="nb-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </label>
  );
}
