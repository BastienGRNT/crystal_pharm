import { Show, type JSX } from 'solid-js';

/** Un libellé, le champ passé en enfant, et son message d'erreur éventuel. */
export function FormField(props: { label: string; hint?: string; error: string | undefined; children: JSX.Element }) {
  return (
    <label class="ap-field">
      <span class="ap-field__label">{props.label}</span>
      <Show when={props.hint}>{(hint) => <span class="ap-field__hint">{hint()}</span>}</Show>
      {props.children}
      <Show when={props.error}>
        {(error) => (
          <span class="ap-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </label>
  );
}
