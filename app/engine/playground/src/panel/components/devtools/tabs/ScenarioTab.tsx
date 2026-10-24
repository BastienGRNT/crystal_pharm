import { Show } from 'solid-js';
import { fromMockChoice, withoutGroupChoice, type OnDutyChoice, type PrescriptionResponseChoice } from '../../../../shared/PlaygroundScenario';
import type { PlaygroundState } from '../../../state/createPlaygroundState';
import { viewportPresets, type ViewportId } from '../../../state/viewportPresets';
import { ChoiceSelect } from '../../fields/ChoiceSelect';
import { FieldRow } from '../../fields/FieldRow';
import { SegmentedControl } from '../../fields/SegmentedControl';
import { ToggleSwitch } from '../../fields/ToggleSwitch';

const fromMockLayoutChoice = '';

const onDutyOptions: { value: OnDutyChoice; label: string }[] = [
  { value: fromMockChoice, label: 'Mock' },
  { value: 'onDutyNow', label: 'En cours' },
  { value: 'onDutyInOneHour', label: 'Dans 1 h' },
  { value: 'noOnDuty', label: 'Aucune' },
];

const prescriptionResponseOptions: { value: PrescriptionResponseChoice; label: string; title: string }[] = [
  { value: 'accepted', label: 'Acceptée', title: 'La fausse API répond 201' },
  { value: 'serverError', label: 'Erreur', title: 'La fausse API répond 500' },
  { value: 'slowThenAccepted', label: 'Lente', title: 'Réponse 201 après 3 secondes' },
  { value: 'unreachable', label: 'Coupée', title: 'La connexion est coupée sans réponse' },
];

export function ScenarioTab(props: { state: PlaygroundState }) {
  const state = props.state;
  const groupDescription = () => state.catalog.pharmacyGroups.find((group) => group.groupId === state.scenario().groupChoice)?.description;

  return (
    <div class="tab">
      <FieldRow label="Pharmacie" hint={state.currentMockTenant()?.description}>
        <div class="inline">
          <button type="button" class="icon-button" title="Pharmacie précédente (Alt + ←)" onClick={() => state.selectMockTenantByOffset(-1)}>
            ←
          </button>
          <ChoiceSelect
            ariaLabel="Pharmacie"
            value={state.scenario().mockTenantId}
            choices={state.catalog.mockTenants.map((mockTenant) => ({
              value: mockTenant.tenantId,
              label: `${mockTenant.pharmacyName} · ${mockTenant.layoutId}${mockTenant.groupName ? ' · groupement' : ''}`,
            }))}
            onChange={state.selectMockTenant}
          />
          <button type="button" class="icon-button" title="Pharmacie suivante (Alt + →)" onClick={() => state.selectMockTenantByOffset(1)}>
            →
          </button>
        </div>
      </FieldRow>

      <div class="columns">
        <FieldRow label="Layout">
          <ChoiceSelect
            ariaLabel="Layout"
            value={state.scenario().layoutId ?? fromMockLayoutChoice}
            choices={[
              { value: fromMockLayoutChoice, label: `Celui du mock (${state.currentMockTenant()?.layoutId ?? '?'})` },
              ...state.catalog.layouts.map((layout) => ({ value: layout.layoutId, label: layout.layoutId })),
            ]}
            onChange={(layoutId) => state.changeScenario((current) => ({ ...current, layoutId: layoutId === fromMockLayoutChoice ? undefined : layoutId }))}
          />
        </FieldRow>
        <FieldRow label="Page">
          <ChoiceSelect
            ariaLabel="Page"
            value={state.currentPath()}
            choices={pageChoices(state.effectiveLayout()?.pagePaths ?? ['/'], state.currentPath())}
            onChange={state.openPage}
          />
        </FieldRow>
      </div>

      <FieldRow label="Groupement" hint={groupDescription()}>
        <ChoiceSelect
          ariaLabel="Groupement"
          value={state.scenario().groupChoice}
          choices={[
            { value: fromMockChoice, label: `Celui du mock (${state.currentMockTenant()?.groupName ?? 'aucun'})` },
            { value: withoutGroupChoice, label: 'Sans groupement' },
            ...state.catalog.pharmacyGroups.map((group) => ({ value: group.groupId, label: group.name })),
          ]}
          onChange={(groupChoice) => state.changeScenario((current) => ({ ...current, groupChoice }))}
        />
      </FieldRow>

      <FieldRow label="Garde">
        <SegmentedControl
          options={onDutyOptions}
          value={state.scenario().onDutyChoice}
          onChange={(onDutyChoice) => state.changeScenario((current) => ({ ...current, onDutyChoice }))}
        />
      </FieldRow>

      <FieldRow label="Données extrêmes">
        <div class="stack">
          <ToggleSwitch
            label="Sans aucune image"
            checked={state.scenario().withoutImages}
            onChange={(withoutImages) => state.changeScenario((current) => ({ ...current, withoutImages }))}
          />
          <ToggleSwitch
            label="Textes très longs"
            checked={state.scenario().withLongTexts}
            onChange={(withLongTexts) => state.changeScenario((current) => ({ ...current, withLongTexts }))}
          />
          <ToggleSwitch
            label="Listes vides"
            checked={state.scenario().withEmptyLists}
            onChange={(withEmptyLists) => state.changeScenario((current) => ({ ...current, withEmptyLists }))}
          />
        </div>
      </FieldRow>

      <FieldRow label="Réponse à l'envoi d'ordonnance">
        <SegmentedControl
          options={prescriptionResponseOptions}
          value={state.scenario().prescriptionResponseChoice}
          onChange={(prescriptionResponseChoice) => state.changeScenario((current) => ({ ...current, prescriptionResponseChoice }))}
        />
      </FieldRow>

      <FieldRow label="Largeur">
        <SegmentedControl<ViewportId>
          options={viewportPresets.map((preset) => ({ value: preset.viewportId, label: preset.label, title: preset.width ? `${preset.width} px` : undefined }))}
          value={state.viewportId()}
          onChange={state.setViewportId}
        />
      </FieldRow>

      <ToggleSwitch label="Comparer tous les layouts côte à côte" checked={state.isComparingLayouts()} onChange={state.setIsComparingLayouts} />

      <Show when={state.scenario().editedTenantSite !== undefined}>
        <p class="notice notice--warning">
          Données éditées à la main (onglet Données) : seul le layout comparé s'applique encore, les autres choix sont ignorés.
        </p>
      </Show>
    </div>
  );
}

/** La page en cours reste dans la liste même si le layout ne l'a pas : l'aperçu montre alors la page 404. */
function pageChoices(pagePaths: readonly string[], currentPath: string) {
  const allPaths = pagePaths.includes(currentPath) ? pagePaths : [...pagePaths, currentPath];
  return allPaths.map((path) => ({ value: path, label: pagePaths.includes(path) ? path : `${path} (absente de ce layout)` }));
}
