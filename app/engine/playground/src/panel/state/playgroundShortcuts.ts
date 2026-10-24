import { fromMockChoice, withoutGroupChoice } from '../../shared/PlaygroundScenario';
import type { PlaygroundState } from './createPlaygroundState';
import { viewportPresets } from './viewportPresets';

export type ShortcutPress = { code: string; altKey: boolean; ctrlKey: boolean; shiftKey: boolean };

type PlaygroundShortcut = { keys: string; description: string; matches: (press: ShortcutPress) => boolean; run: (state: PlaygroundState) => void };

const withAlt = (code: string, shiftKey = false) => (press: ShortcutPress) => press.altKey && !press.ctrlKey && press.shiftKey === shiftKey && press.code === code;

/** Avec Alt, pour ne gêner ni la saisie dans le panneau ni les raccourcis du navigateur ; ils marchent aussi depuis l'aperçu. */
export const playgroundShortcuts: readonly PlaygroundShortcut[] = [
  { keys: 'Alt + D', description: 'Replier ou déplier le panneau', matches: withAlt('KeyD'), run: togglePanel },
  { keys: 'Alt + →', description: 'Pharmacie suivante', matches: withAlt('ArrowRight'), run: (state) => state.selectMockTenantByOffset(1) },
  { keys: 'Alt + ←', description: 'Pharmacie précédente', matches: withAlt('ArrowLeft'), run: (state) => state.selectMockTenantByOffset(-1) },
  { keys: 'Alt + L', description: 'Layout suivant', matches: withAlt('KeyL'), run: (state) => state.selectLayoutByOffset(1) },
  { keys: 'Alt + Maj + L', description: 'Layout précédent', matches: withAlt('KeyL', true), run: (state) => state.selectLayoutByOffset(-1) },
  { keys: 'Alt + G', description: 'Groupement suivant (sans, comme le mock, les démos)', matches: withAlt('KeyG'), run: (state) => cycleGroupChoice(state) },
  { keys: 'Alt + C', description: 'Comparer tous les layouts côte à côte', matches: withAlt('KeyC'), run: (state) => state.setIsComparingLayouts((isComparing) => !isComparing) },
  { keys: 'Alt + R', description: 'Recharger les aperçus', matches: withAlt('KeyR'), run: (state) => state.reloadPreviews() },
  { keys: 'Alt + 0', description: 'Réinitialiser le scénario', matches: withAlt('Digit0'), run: (state) => state.resetScenario() },
  ...viewportPresets.map((preset, index) => ({
    keys: `Alt + ${index + 1}`,
    description: `Largeur : ${preset.label.toLowerCase()}`,
    matches: withAlt(`Digit${index + 1}`),
    run: (state: PlaygroundState) => state.setViewportId(preset.viewportId),
  })),
];

export function runMatchingShortcut(press: ShortcutPress, state: PlaygroundState): boolean {
  const shortcut = playgroundShortcuts.find((candidate) => candidate.matches(press));
  shortcut?.run(state);
  return shortcut !== undefined;
}

function togglePanel(state: PlaygroundState): void {
  state.setPanelPlacement((placement) => ({ ...placement, isCollapsed: !placement.isCollapsed }));
}

function cycleGroupChoice(state: PlaygroundState): void {
  const groupChoices = [fromMockChoice, withoutGroupChoice, ...state.catalog.pharmacyGroups.map((group) => group.groupId)];
  state.selectGroupChoiceByOffset(1, groupChoices);
}
