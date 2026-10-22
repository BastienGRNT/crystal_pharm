import { Show, type JSX } from 'solid-js';

export function FormField(props: { label: string; error: string | undefined; children: JSX.Element }) {
  return (
    <label class="at-field" classList={{ 'at-field--invalid': props.error !== undefined }}>
      <span class="at-field__label">{props.label}</span>
      {props.children}
      <Show when={props.error}>
        {(error) => (
          <span class="at-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </label>
  );
}
