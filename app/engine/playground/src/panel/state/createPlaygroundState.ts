import { batch, createEffect, createSignal, on, untrack } from 'solid-js';
import type { FrameMessage } from '../../shared/FrameMessage';
import type { PlaygroundCatalog, PrescriptionReceivedEvent, ScenarioOutcome } from '../../shared/PlaygroundCatalog';
import { createNeutralScenario, type PlaygroundScenario } from '../../shared/PlaygroundScenario';
import { mainPreviewLabel } from '../connections/listenToFrameMessages';
import { sendPlaygroundScenario } from '../connections/playgroundApi';
import type { JournalEntry, JournalLevel } from './JournalEntry';
import type { PanelTabId } from './panelTabs';
import { loadPreferences, savePreferences, type PanelPlacement } from './persistedPreferences';
import type { ViewportId } from './viewportPresets';

const scenarioSendingDelayInMilliseconds = 120;
const maximumJournalEntryCount = 300;
const prescriptionResponseLabels: Record<PrescriptionReceivedEvent['simulatedResponse'], string> = {
  accepted: 'acceptée (201)',
  serverError: 'erreur serveur (500)',
  slowThenAccepted: 'acceptée après 3 s',
  unreachable: 'connexion coupée',
};

export type PreviewHealth = { problemCount: number; reusedNodePercentage?: number };
export type PlaygroundState = ReturnType<typeof createPlaygroundState>;

/** L'état du panneau et des aperçus. Chaque changement de scénario part au serveur, puis recharge les aperçus. */
export function createPlaygroundState(catalog: PlaygroundCatalog) {
  const savedPreferences = loadPreferences();
  const [scenario, setScenario] = createSignal<PlaygroundScenario>(restoreScenario(catalog, savedPreferences?.scenario));
  const [outcome, setOutcome] = createSignal<ScenarioOutcome>();
  const [scenarioError, setScenarioError] = createSignal<string>();
  const [currentPath, setCurrentPath] = createSignal(savedPreferences?.currentPath ?? '/');
  const [viewportId, setViewportId] = createSignal<ViewportId>(savedPreferences?.viewportId ?? 'full');
  const [isComparingLayouts, setIsComparingLayouts] = createSignal(savedPreferences?.isComparingLayouts ?? false);
  const [activeTabId, setActiveTabId] = createSignal<PanelTabId>(savedPreferences?.activeTabId ?? 'scenario');
  const [panelPlacement, setPanelPlacement] = createSignal<PanelPlacement>(
    savedPreferences?.panelPlacement ?? { left: window.innerWidth - 440, top: 16, isCollapsed: false },
  );
  const [previewVersion, setPreviewVersion] = createSignal(0);
  const [isEngineRebuilding, setIsEngineRebuilding] = createSignal(false);
  const [journalEntries, setJournalEntries] = createSignal<JournalEntry[]>([]);
  const [previewHealthByLabel, setPreviewHealthByLabel] = createSignal<Record<string, PreviewHealth>>({});

  let nextJournalEntryId = 0;
  let latestScenarioSendingId = 0;
  let scenarioSendingTimer: ReturnType<typeof setTimeout> | undefined;

  const mockTenantIndex = () => catalog.mockTenants.findIndex((mockTenant) => mockTenant.tenantId === scenario().mockTenantId);
  const currentMockTenant = () => catalog.mockTenants[mockTenantIndex()];
  const effectiveLayoutId = () => outcome()?.effectiveLayoutId || scenario().layoutId || currentMockTenant()?.layoutId || '';
  const effectiveLayout = () => catalog.layouts.find((layout) => layout.layoutId === effectiveLayoutId());
  const errorCount = () => journalEntries().filter((entry) => entry.level === 'error').length;

  function addJournalEntry(level: JournalLevel, source: string, text: string): void {
    const entry: JournalEntry = { entryId: nextJournalEntryId++, loggedAt: new Date(), level, source, text };
    setJournalEntries((entries) => [entry, ...entries].slice(0, maximumJournalEntryCount));
  }

  function updatePreviewHealth(previewLabel: string, change: (health: PreviewHealth) => PreviewHealth): void {
    setPreviewHealthByLabel((healthByLabel) => ({ ...healthByLabel, [previewLabel]: change(healthByLabel[previewLabel] ?? { problemCount: 0 }) }));
  }

  function reloadPreviews(): void {
    batch(() => {
      setPreviewHealthByLabel({});
      setPreviewVersion((version) => version + 1);
    });
  }

  async function sendScenario(scenarioToSend: PlaygroundScenario): Promise<void> {
    const sendingId = ++latestScenarioSendingId;
    try {
      const receivedOutcome = await sendPlaygroundScenario(scenarioToSend, untrack(currentPath));
      if (sendingId !== latestScenarioSendingId) return;
      batch(() => {
        setOutcome(receivedOutcome);
        setScenarioError(undefined);
        reloadPreviews();
      });
    } catch (error) {
      if (sendingId === latestScenarioSendingId) setScenarioError(error instanceof Error ? error.message : String(error));
    }
  }

  createEffect(
    on(scenario, (changedScenario) => {
      clearTimeout(scenarioSendingTimer);
      scenarioSendingTimer = setTimeout(() => void sendScenario(changedScenario), scenarioSendingDelayInMilliseconds);
    }),
  );

  createEffect(() =>
    savePreferences({
      scenario: scenario(),
      currentPath: currentPath(),
      viewportId: viewportId(),
      isComparingLayouts: isComparingLayouts(),
      activeTabId: activeTabId(),
      panelPlacement: panelPlacement(),
    }),
  );

  function changeScenario(change: (current: PlaygroundScenario) => PlaygroundScenario): void {
    setScenario((current) => change(current));
  }

  function selectMockTenant(tenantId: string): void {
    // Les données éditées à la main sont celles d'une pharmacie : en changer les abandonne.
    changeScenario((current) => ({ ...current, mockTenantId: tenantId, editedTenantSite: undefined }));
  }

  function selectMockTenantByOffset(offset: number): void {
    const count = catalog.mockTenants.length;
    const nextMockTenant = catalog.mockTenants[(mockTenantIndex() + offset + count) % count];
    if (nextMockTenant) selectMockTenant(nextMockTenant.tenantId);
  }

  function selectLayoutByOffset(offset: number): void {
    const layoutIds = catalog.layouts.map((layout) => layout.layoutId);
    const nextLayoutId = layoutIds[(layoutIds.indexOf(effectiveLayoutId()) + offset + layoutIds.length) % layoutIds.length];
    changeScenario((current) => ({ ...current, layoutId: nextLayoutId }));
  }

  function selectGroupChoiceByOffset(offset: number, groupChoices: readonly string[]): void {
    const nextGroupChoice = groupChoices[(groupChoices.indexOf(scenario().groupChoice) + offset + groupChoices.length) % groupChoices.length];
    if (nextGroupChoice !== undefined) changeScenario((current) => ({ ...current, groupChoice: nextGroupChoice }));
  }

  function openPage(path: string): void {
    setCurrentPath(path);
    void sendScenario(scenario());
  }

  function resetScenario(): void {
    setScenario(createNeutralScenario(scenario().mockTenantId));
  }

  function receiveFrameMessage(message: FrameMessage, previewLabel: string): void {
    switch (message.kind) {
      case 'navigated':
        if (message.path === untrack(currentPath)) return;
        setCurrentPath(message.path);
        // En comparaison, tous les aperçus suivent la navigation du premier qui change de page.
        if (untrack(isComparingLayouts)) reloadPreviews();
        return;
      case 'problem':
        addJournalEntry(message.level, previewLabel, message.text);
        if (message.level === 'error') updatePreviewHealth(previewLabel, (health) => ({ ...health, problemCount: health.problemCount + 1 }));
        return;
      case 'hydrated':
        updatePreviewHealth(previewLabel, (health) => ({ ...health, reusedNodePercentage: message.reusedNodePercentage }));
        if (message.reusedNodePercentage < 100) {
          addJournalEntry(
            'warning',
            previewLabel,
            `Hydratation : ${message.reusedNodePercentage} % des ${message.nodeCount} nœuds viennent du serveur, le reste a été recréé dans le navigateur.`,
          );
        }
        return;
      case 'shortcut':
        return;
    }
  }

  function receiveEngineRebuilding(): void {
    setIsEngineRebuilding(true);
  }

  function receiveEngineRebuilt(): void {
    setIsEngineRebuilding(false);
    addJournalEntry('info', 'moteur', 'Moteur recompilé : aperçus rechargés.');
    void sendScenario(scenario());
  }

  function receivePrescription(event: PrescriptionReceivedEvent): void {
    const fileDescription = `${event.fileType}, ${event.fileSizeInKilobytes} Ko`;
    if (event.rejectionReason) {
      addJournalEntry('warning', 'ordonnance', `Envoi refusé par la validation (${fileDescription}) : ${event.rejectionReason}`);
    } else {
      addJournalEntry('info', 'ordonnance', `Ordonnance reçue (${fileDescription}) : réponse ${prescriptionResponseLabels[event.simulatedResponse]}.`);
    }
  }

  return {
    catalog,
    scenario,
    changeScenario,
    outcome,
    scenarioError,
    currentPath,
    openPage,
    viewportId,
    setViewportId,
    isComparingLayouts,
    setIsComparingLayouts,
    activeTabId,
    setActiveTabId,
    panelPlacement,
    setPanelPlacement,
    previewVersion,
    reloadPreviews,
    isEngineRebuilding,
    journalEntries,
    clearJournal: () => setJournalEntries([]),
    errorCount,
    previewHealthByLabel,
    currentMockTenant,
    effectiveLayoutId,
    effectiveLayout,
    selectMockTenant,
    selectMockTenantByOffset,
    selectLayoutByOffset,
    selectGroupChoiceByOffset,
    resetScenario,
    receiveFrameMessage,
    receiveEngineRebuilding,
    receiveEngineRebuilt,
    receivePrescription,
    mainPreviewLabel,
  };
}

function restoreScenario(catalog: PlaygroundCatalog, savedScenario: PlaygroundScenario | undefined): PlaygroundScenario {
  const savedMockTenantStillExists = catalog.mockTenants.some((mockTenant) => mockTenant.tenantId === savedScenario?.mockTenantId);
  if (savedScenario && savedMockTenantStillExists) return savedScenario;
  const firstMockTenant = catalog.mockTenants[0];
  if (!firstMockTenant) throw new Error('Le banc d’essai n’a aucun mock de pharmacie.');
  return createNeutralScenario(firstMockTenant.tenantId);
}
