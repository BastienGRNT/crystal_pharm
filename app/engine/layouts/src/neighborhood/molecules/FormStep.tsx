import { Show, type JSX } from 'solid-js';

/** Un groupe de questions numéroté : on sait où on en est sans avoir à changer d'écran. */
export function FormStep(props: { number: number; title: string; hint?: string; children: JSX.Element }) {
  return (
    <fieldset class="nb-form-step">
      <legend class="nb-form-step__legend">
        <span class="nb-form-step__number" aria-hidden="true">
          {props.number}
        </span>
        {props.title}
      </legend>
      <Show when={props.hint}>{(hint) => <p class="nb-form-step__hint">{hint()}</p>}</Show>
      <div class="nb-form-step__body">{props.children}</div>
    </fieldset>
  );
}
