import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';
import type { ModuleOverride } from '../../../../shared/PlaygroundScenario';
import type { PlaygroundState } from '../../../state/createPlaygroundState';
import { SegmentedControl } from '../../fields/SegmentedControl';

const fromMockOverride = 'fromMock';
type ModuleOverrideChoice = ModuleOverride | typeof fromMockOverride;

const moduleLabels = {
  team: 'Équipe',
  services: 'Services',
  brands: 'Marques',
  news: 'Actualités',
  prescriptionUpload: "Envoi d'ordonnance",
  appointment: 'Prise de rendez-vous',
  onlineOrder: 'Commande en ligne',
  loyaltyCard: 'Carte de fidélité',
} satisfies Record<ModuleName, string>;

const overrideOptions: { value: ModuleOverrideChoice; label: string; title: string }[] = [
  { value: fromMockOverride, label: 'Mock', title: 'Comme dans le mock (un module imposé par le groupement est activé)' },
  { value: 'enabled', label: 'Activé', title: 'Activé, avec les données du mock ou des données d’exemple' },
  { value: 'disabled', label: 'Désactivé', title: 'Désactivé, même s’il est imposé : le schéma doit le refuser' },
];

export function ModulesTab(props: { state: PlaygroundState }) {
  const state = props.state;
  const isMandatory = (moduleName: ModuleName) => state.outcome()?.mandatoryModules.includes(moduleName) ?? false;
  const overrideOf = (moduleName: ModuleName): ModuleOverrideChoice => state.scenario().moduleOverrides[moduleName] ?? fromMockOverride;

  function changeOverride(moduleName: ModuleName, choice: ModuleOverrideChoice): void {
    state.changeScenario((current) => {
      const { [moduleName]: _replacedOverride, ...otherOverrides } = current.moduleOverrides;
      return { ...current, moduleOverrides: choice === fromMockOverride ? otherOverrides : { ...otherOverrides, [moduleName]: choice } };
    });
  }

  return (
    <div class="tab">
      <ul class="module-list">
        <For each={ModuleNameSchema.options}>
          {(moduleName) => (
            <li class="module-list__item">
              <div class="module-list__name">
                <span class="status-dot" classList={{ 'status-dot--on': isModuleEnabled(state.outcome()?.tenantSiteInput, moduleName) }} />
                <span>{moduleLabels[moduleName]}</span>
                <Show when={isMandatory(moduleName)}>
                  <span class="badge badge--accent" title="Imposé par le groupement">imposé</span>
                </Show>
              </div>
              <SegmentedControl options={overrideOptions} value={overrideOf(moduleName)} onChange={(choice) => changeOverride(moduleName, choice)} />
            </li>
          )}
        </For>
      </ul>
      <div class="inline">
        <button type="button" class="button" onClick={() => setEveryOverride(state, 'enabled')}>
          Tout activer
        </button>
        <button type="button" class="button" onClick={() => setEveryOverride(state, 'disabled')}>
          Tout désactiver
        </button>
        <button type="button" class="button" onClick={() => state.changeScenario((current) => ({ ...current, moduleOverrides: {} }))}>
          Comme le mock
        </button>
      </div>
    </div>
  );
}

function setEveryOverride(state: PlaygroundState, override: ModuleOverride): void {
  const moduleOverrides = Object.fromEntries(ModuleNameSchema.options.map((moduleName) => [moduleName, override]));
  state.changeScenario((current) => ({ ...current, moduleOverrides }));
}

function isModuleEnabled(tenantSiteInput: unknown, moduleName: ModuleName): boolean {
  if (typeof tenantSiteInput !== 'object' || tenantSiteInput === null || !('modules' in tenantSiteInput)) return false;
  const modules: unknown = tenantSiteInput.modules;
  if (typeof modules !== 'object' || modules === null || !(moduleName in modules)) return false;
  const toggleableModule: unknown = Reflect.get(modules, moduleName);
  return typeof toggleableModule === 'object' && toggleableModule !== null && 'enabled' in toggleableModule && toggleableModule.enabled === true;
}
