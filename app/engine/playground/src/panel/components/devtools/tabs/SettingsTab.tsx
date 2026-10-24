import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { layoutSettingsFieldsByLayoutId, type LayoutSettingsField } from '../../../layoutSettingsFields';
import type { PlaygroundState } from '../../../state/createPlaygroundState';
import { ChoiceSelect } from '../../fields/ChoiceSelect';
import { FieldRow } from '../../fields/FieldRow';
import { ToggleSwitch } from '../../fields/ToggleSwitch';

const defaultValueChoice = '';

export function SettingsTab(props: { state: PlaygroundState }) {
  const state = props.state;
  const layoutId = () => state.effectiveLayoutId();
  const fields = () => layoutSettingsFieldsByLayoutId[layoutId()] ?? [];
  const overrides = () => state.scenario().layoutSettingsOverridesByLayoutId[layoutId()] ?? {};
  const mockSettings = () => readLayoutSettings(state.outcome()?.tenantSiteInput);

  function changeSetting(settingKey: string, value: unknown): void {
    state.changeScenario((current) => {
      const { [settingKey]: _replacedValue, ...otherOverrides } = current.layoutSettingsOverridesByLayoutId[layoutId()] ?? {};
      const layoutOverrides = value === undefined ? otherOverrides : { ...otherOverrides, [settingKey]: value };
      return { ...current, layoutSettingsOverridesByLayoutId: { ...current.layoutSettingsOverridesByLayoutId, [layoutId()]: layoutOverrides } };
    });
  }

  function resetLayoutSettings(): void {
    state.changeScenario((current) => ({
      ...current,
      layoutSettingsOverridesByLayoutId: { ...current.layoutSettingsOverridesByLayoutId, [layoutId()]: {} },
    }));
  }

  return (
    <div class="tab">
      <p class="tab__intro">
        Réglages du layout <strong>{layoutId()}</strong>, lus dans son schéma : les valeurs saisies ici sont gardées par layout.
      </p>
      <Show when={fields().length > 0} fallback={<p class="notice">Ce layout n'a aucun réglage.</p>}>
        <For each={fields()}>
          {(field) => (
            <SettingsFieldEditor
              field={field}
              isOverridden={field.settingKey in overrides()}
              currentValue={field.settingKey in overrides() ? overrides()[field.settingKey] : mockSettings()[field.settingKey]}
              onChange={(value) => changeSetting(field.settingKey, value)}
              onReset={() => changeSetting(field.settingKey, undefined)}
            />
          )}
        </For>
        <button type="button" class="button" onClick={resetLayoutSettings}>
          Revenir aux réglages du mock
        </button>
      </Show>
    </div>
  );
}

function SettingsFieldEditor(props: {
  field: LayoutSettingsField;
  isOverridden: boolean;
  currentValue: unknown;
  onChange: (value: unknown) => void;
  onReset: () => void;
}) {
  const [jsonError, setJsonError] = createSignal<string>();
  const choiceOptions = () => (props.field.kind === 'choice' ? props.field.options : []);
  const defaultHint = () => (props.field.defaultValue === undefined ? 'Aucune valeur par défaut.' : `Par défaut : ${JSON.stringify(props.field.defaultValue)}`);

  return (
    <FieldRow
      label={props.field.settingKey}
      hint={jsonError() ?? defaultHint()}
      aside={
        <Show when={props.isOverridden}>
          <button type="button" class="link-button" onClick={props.onReset}>
            annuler
          </button>
        </Show>
      }
    >
      <Switch>
        <Match when={props.field.kind === 'text'}>
          <input
            class="text-input"
            type="text"
            value={typeof props.currentValue === 'string' ? props.currentValue : ''}
            placeholder={typeof props.field.defaultValue === 'string' ? props.field.defaultValue : ''}
            onInput={(event) => props.onChange(event.currentTarget.value)}
          />
        </Match>
        <Match when={props.field.kind === 'toggle'}>
          <ToggleSwitch
            label={props.isOverridden ? 'Valeur essayée' : 'Valeur du mock ou par défaut'}
            checked={typeof props.currentValue === 'boolean' ? props.currentValue : props.field.defaultValue === true}
            onChange={props.onChange}
          />
        </Match>
        <Match when={props.field.kind === 'choice'}>
          <ChoiceSelect
            ariaLabel={props.field.settingKey}
            value={typeof props.currentValue === 'string' ? props.currentValue : defaultValueChoice}
            choices={[
              { value: defaultValueChoice, label: 'Valeur par défaut' },
              ...choiceOptions().map((option) => ({ value: option, label: option })),
            ]}
            onChange={(value) => props.onChange(value === defaultValueChoice ? undefined : value)}
          />
        </Match>
        <Match when={props.field.kind === 'json'}>
          <textarea
            class="code-input"
            rows={4}
            value={props.currentValue === undefined ? '' : JSON.stringify(props.currentValue, null, 2)}
            onChange={(event) => {
              try {
                props.onChange(event.currentTarget.value.trim() === '' ? undefined : JSON.parse(event.currentTarget.value));
                setJsonError(undefined);
              } catch {
                setJsonError('JSON invalide : la valeur n’a pas été appliquée.');
              }
            }}
          />
        </Match>
      </Switch>
    </FieldRow>
  );
}

function readLayoutSettings(tenantSiteInput: unknown): Record<string, unknown> {
  if (typeof tenantSiteInput !== 'object' || tenantSiteInput === null || !('layoutSettings' in tenantSiteInput)) return {};
  const layoutSettings: unknown = tenantSiteInput.layoutSettings;
  return typeof layoutSettings === 'object' && layoutSettings !== null ? { ...layoutSettings } : {};
}
