import type { IncomingMessage, ServerResponse } from 'node:http';
import { ModuleNameSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { ScenarioOutcome } from '../../shared/PlaygroundCatalog';
import { PlaygroundScenarioSchema } from '../../shared/PlaygroundScenario';
import { readRequestBody } from '../http/readRequestBody';
import { sendJson } from '../http/sendResponse';
import { renderScenarioPage, type ScenarioPageRendering } from '../site-rendering/renderScenarioPage';
import { buildPlaygroundCatalog } from './buildPlaygroundCatalog';
import type { PanelRequestContext } from './PanelRequestContext';

export const panelApiPath = '/__playground';

/** De quoi renseigner le panneau même quand les données sont invalides : c'est là qu'il en a le plus besoin. */
const ScenarioSummarySchema = v.object({
  layoutId: v.optional(v.string(), ''),
  pharmacy: v.optional(
    v.object({ group: v.optional(v.object({ mandatoryModules: v.optional(v.array(ModuleNameSchema), []) })) }),
    {},
  ),
});

export async function handlePanelApiRequest(request: IncomingMessage, response: ServerResponse, context: PanelRequestContext): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname === `${panelApiPath}/catalog` && request.method === 'GET') {
    sendJson(response, 200, buildPlaygroundCatalog(context.layoutsSourceDirectory));
  } else if (url.pathname === `${panelApiPath}/scenario` && request.method === 'PUT') {
    await replaceScenario(request, response, url.searchParams.get('path') ?? '/', context);
  } else {
    sendJson(response, 404, { error: `Route inconnue du banc d'essai : ${request.method} ${url.pathname}` });
  }
}

/** Le scénario est remplacé, puis rendu une fois à blanc : le panneau affiche les erreurs sans attendre l'aperçu. */
async function replaceScenario(request: IncomingMessage, response: ServerResponse, requestedPath: string, context: PanelRequestContext): Promise<void> {
  const parsedBody = parseJson((await readRequestBody(request)).toString('utf8'));
  const scenarioValidation = v.safeParse(PlaygroundScenarioSchema, parsedBody);
  if (!scenarioValidation.success) {
    sendJson(response, 400, { error: v.summarize(scenarioValidation.issues) });
    return;
  }
  context.replaceCurrentScenario(scenarioValidation.output);
  try {
    const rendering = await renderScenarioPage({ scenario: scenarioValidation.output, requestedPath, loadSiteRenderer: context.loadSiteRenderer });
    sendJson(response, 200, toScenarioOutcome(rendering));
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}

function toScenarioOutcome(rendering: ScenarioPageRendering): ScenarioOutcome {
  const summary = v.safeParse(ScenarioSummarySchema, rendering.tenantSiteInput);
  return {
    tenantSiteInput: rendering.tenantSiteInput,
    validationIssues: rendering.outcome === 'invalidData' ? rendering.issues : [],
    renderError: rendering.outcome === 'renderFailed' ? rendering.errorMessage : undefined,
    effectiveLayoutId: summary.success ? summary.output.layoutId : '',
    mandatoryModules: summary.success ? (summary.output.pharmacy.group?.mandatoryModules ?? []) : [],
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
