import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';
import type { SiteRenderer } from '../site-rendering/createSiteRendererLoader';

/** Ce dont les réponses aux aperçus ont besoin, fourni par le plugin du banc d'essai. */
export type SiteRequestContext = {
  readCurrentScenario: () => PlaygroundScenario;
  loadSiteRenderer: () => Promise<SiteRenderer>;
  compiledClientDirectory: string;
  notifyPanel: (eventName: string, payload: unknown) => void;
};
