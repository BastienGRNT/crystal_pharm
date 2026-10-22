import { For } from 'solid-js';

export function StepIndicator(props: { stepTitles: readonly string[]; currentStepIndex: number }) {
  return (
    <ol class="at-step-indicator" aria-label={`Étape ${props.currentStepIndex + 1} sur ${props.stepTitles.length}`}>
      <For each={props.stepTitles}>
        {(stepTitle, stepIndex) => (
          <li
            class="at-step-indicator__step"
            classList={{
              'at-step-indicator__step--done': stepIndex() < props.currentStepIndex,
              'at-step-indicator__step--current': stepIndex() === props.currentStepIndex,
            }}
          >
            <span class="at-step-indicator__number">0{stepIndex() + 1}</span>
            <span class="at-step-indicator__title">{stepTitle}</span>
          </li>
        )}
      </For>
    </ol>
  );
}
