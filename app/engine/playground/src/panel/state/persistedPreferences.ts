import * as v from 'valibot';
import { PlaygroundScenarioSchema } from '../../shared/PlaygroundScenario';
import { panelTabIds } from './panelTabs';
import { viewportIds } from './viewportPresets';

const preferencesStorageKey = 'crystal-pharm-playground';

/** Tout ce qui survit à un rechargement du panneau : on reprend exactement là où on en était. */
const PlaygroundPreferencesSchema = v.object({
  scenario: PlaygroundScenarioSchema,
  currentPath: v.string(),
  viewportId: v.picklist(viewportIds),
  isComparingLayouts: v.boolean(),
  activeTabId: v.picklist(panelTabIds),
  panelPlacement: v.object({ left: v.number(), top: v.number(), isCollapsed: v.boolean() }),
});

export type PlaygroundPreferences = v.InferOutput<typeof PlaygroundPreferencesSchema>;
export type PanelPlacement = PlaygroundPreferences['panelPlacement'];

export function loadPreferences(): PlaygroundPreferences | undefined {
  try {
    const savedText = localStorage.getItem(preferencesStorageKey);
    if (savedText === null) return undefined;
    const result = v.safeParse(PlaygroundPreferencesSchema, JSON.parse(savedText));
    return result.success ? result.output : undefined;
  } catch {
    return undefined;
  }
}

export function savePreferences(preferences: PlaygroundPreferences): void {
  try {
    localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences));
  } catch {
    // Navigation privée ou stockage plein : le banc d'essai marche quand même, il oubliera seulement.
  }
}
