import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';
import { assembleTenantSiteInput } from '../scenario/assembleTenantSiteInput';
import { validateTenantSite } from '../scenario/validateTenantSite';
import type { SiteRenderer } from './createSiteRendererLoader';

export type ScenarioPageRendering = { tenantSiteInput: unknown } & (
  | { outcome: 'rendered'; status: 200 | 404; html: string }
  | { outcome: 'invalidData'; issues: string[] }
  | { outcome: 'renderFailed'; errorMessage: string }
);

export async function renderScenarioPage(input: {
  scenario: PlaygroundScenario;
  requestedPath: string;
  loadSiteRenderer: () => Promise<SiteRenderer>;
}): Promise<ScenarioPageRendering> {
  const tenantSiteInput = assembleTenantSiteInput(input.scenario);
  const validation = validateTenantSite(tenantSiteInput);
  if (!validation.success) return { tenantSiteInput, outcome: 'invalidData', issues: validation.issues };

  try {
    const { renderTenantSite, layoutRegistry } = await input.loadSiteRenderer();
    const result = renderTenantSite(validation.tenantSite, input.requestedPath, layoutRegistry);
    return { tenantSiteInput, outcome: 'rendered', ...result };
  } catch (error) {
    return { tenantSiteInput, outcome: 'renderFailed', errorMessage: error instanceof Error ? (error.stack ?? error.message) : String(error) };
  }
}
