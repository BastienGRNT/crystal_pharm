import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';
import type { SiteRenderer } from '../site-rendering/createSiteRendererLoader';

export type PanelRequestContext = {
  replaceCurrentScenario: (scenario: PlaygroundScenario) => void;
  loadSiteRenderer: () => Promise<SiteRenderer>;
  layoutsSourceDirectory: string;
};
