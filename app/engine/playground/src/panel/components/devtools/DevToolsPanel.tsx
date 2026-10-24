import { For, Match, Show, Switch } from 'solid-js';
import { siteOrigin } from '../../../shared/playgroundHosts';
import type { PlaygroundState } from '../../state/createPlaygroundState';
import { panelTabs } from '../../state/panelTabs';
import { PreviewHealthBadges } from '../stage/PreviewFrame';
import { DataTab } from './tabs/DataTab';
import { JournalTab } from './tabs/JournalTab';
import { ModulesTab } from './tabs/ModulesTab';
import { ScenarioTab } from './tabs/ScenarioTab';
import { SettingsTab } from './tabs/SettingsTab';
import { ShortcutsTab } from './tabs/ShortcutsTab';
import { startPanelDrag } from './startPanelDrag';

/** Le panneau flottant, au-dessus de l'aperçu : il se déplace par son en-tête et se replie avec Alt + D. */
export function DevToolsPanel(props: { state: PlaygroundState }) {
  const state = props.state;
  const validationIssues = () => state.outcome()?.validationIssues ?? [];
  const isRenderable = () => state.outcome() !== undefined && validationIssues().length === 0 && !state.outcome()?.renderError;

  return (
    <aside
      class="devtools"
      classList={{ 'devtools--collapsed': state.panelPlacement().isCollapsed }}
      style={{ left: `${state.panelPlacement().left}px`, top: `${state.panelPlacement().top}px` }}
    >
      <header class="devtools__header" onPointerDown={(event) => startPanelDrag(event, state)}>
        <div class="devtools__title">
          <span class="devtools__grip" aria-hidden="true">
            ⠿
          </span>
          <strong>Banc d'essai</strong>
          <span class="devtools__subtitle">
            {state.currentMockTenant()?.pharmacyName} · {state.effectiveLayoutId()} · {state.currentPath()}
          </span>
        </div>
        <div class="devtools__actions">
          <button type="button" class="icon-button" title="Recharger les aperçus (Alt + R)" onClick={state.reloadPreviews}>
            ↻
          </button>
          <button type="button" class="icon-button" title="Ouvrir l'aperçu dans un onglet" onClick={() => window.open(`${siteOrigin()}${state.currentPath()}`, '_blank')}>
            ↗
          </button>
          <button type="button" class="icon-button" title="Réinitialiser le scénario (Alt + 0)" onClick={state.resetScenario}>
            ⟲
          </button>
          <button
            type="button"
            class="icon-button"
            title="Replier ou déplier (Alt + D)"
            onClick={() => state.setPanelPlacement((placement) => ({ ...placement, isCollapsed: !placement.isCollapsed }))}
          >
            {state.panelPlacement().isCollapsed ? '▾' : '▴'}
          </button>
        </div>
      </header>

      <div class="devtools__status">
        <Show when={state.isEngineRebuilding()}>
          <span class="badge badge--accent">recompilation…</span>
        </Show>
        <Switch>
          <Match when={state.scenarioError()}>
            <span class="badge badge--danger">scénario refusé</span>
          </Match>
          <Match when={validationIssues().length > 0}>
            <span class="badge badge--danger">
              {validationIssues().length} problème{validationIssues().length > 1 ? 's' : ''} de données
            </span>
          </Match>
          <Match when={state.outcome()?.renderError}>
            <span class="badge badge--danger">rendu en échec</span>
          </Match>
          <Match when={isRenderable()}>
            <span class="badge badge--success">données valides</span>
          </Match>
        </Switch>
        <Show when={state.scenario().editedTenantSite !== undefined}>
          <span class="badge badge--warning">données éditées</span>
        </Show>
        <Show when={!state.isComparingLayouts()}>
          <PreviewHealthBadges health={state.previewHealthByLabel()[state.mainPreviewLabel]} />
        </Show>
      </div>

      <Show when={!state.panelPlacement().isCollapsed}>
        <ProblemList state={state} />
        <nav class="devtools__tabs" role="tablist">
          <For each={panelTabs}>
            {(tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={state.activeTabId() === tab.tabId}
                class="devtools__tab"
                classList={{ 'devtools__tab--active': state.activeTabId() === tab.tabId }}
                onClick={() => state.setActiveTabId(tab.tabId)}
              >
                {tab.label}
                <Show when={tab.tabId === 'journal' && state.errorCount() > 0}>
                  <span class="devtools__tab-count">{state.errorCount()}</span>
                </Show>
              </button>
            )}
          </For>
        </nav>
        <div class="devtools__body">
          <Switch>
            <Match when={state.activeTabId() === 'scenario'}>
              <ScenarioTab state={state} />
            </Match>
            <Match when={state.activeTabId() === 'modules'}>
              <ModulesTab state={state} />
            </Match>
            <Match when={state.activeTabId() === 'settings'}>
              <SettingsTab state={state} />
            </Match>
            <Match when={state.activeTabId() === 'data'}>
              <DataTab state={state} />
            </Match>
            <Match when={state.activeTabId() === 'journal'}>
              <JournalTab state={state} />
            </Match>
            <Match when={state.activeTabId() === 'shortcuts'}>
              <ShortcutsTab />
            </Match>
          </Switch>
        </div>
      </Show>
    </aside>
  );
}

function ProblemList(props: { state: PlaygroundState }) {
  const problems = () => [
    ...(props.state.scenarioError() ? [props.state.scenarioError() ?? ''] : []),
    ...(props.state.outcome()?.validationIssues ?? []),
    ...(props.state.outcome()?.renderError ? [props.state.outcome()?.renderError ?? ''] : []),
  ];
  return (
    <Show when={problems().length > 0}>
      <ul class="problems">
        <For each={problems()}>
          {(problem) => (
            <li>
              <pre>{problem}</pre>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
