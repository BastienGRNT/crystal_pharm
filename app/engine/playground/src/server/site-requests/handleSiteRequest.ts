import type { IncomingMessage, ServerResponse } from 'node:http';
// Le fichier seul, comme la config de `layouts` : l'index du moteur charge du JSX Solid, inutile ici.
import { rendererClientAssetsPath } from '../../../../renderer/src/html-document/rendererClientAssetsPath';
import { readComparedLayoutId } from '../../shared/playgroundHosts';
import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';
import { sendHtml } from '../http/sendResponse';
import { mockImagesPath } from '../mocks/mockImageUrl';
import { injectFrameAgent } from '../site-rendering/injectFrameAgent';
import { renderPlaygroundErrorPage } from '../site-rendering/renderPlaygroundErrorPage';
import { renderScenarioPage } from '../site-rendering/renderScenarioPage';
import { handlePrescriptionUpload } from './handlePrescriptionUpload';
import { serveMockImage } from './serveMockImage';
import { serveRendererAsset } from './serveRendererAsset';
import type { SiteRequestContext } from './SiteRequestContext';

const prescriptionsApiPath = '/api/prescriptions';

/** Tout ce que demande un aperçu : la page du site, le JS et le CSS du moteur, les images des mocks, l'API simulée. */
export async function handleSiteRequest(request: IncomingMessage, response: ServerResponse, context: SiteRequestContext): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'site.localhost'}`);
  if (url.pathname.startsWith(`${rendererClientAssetsPath}/`)) {
    serveRendererAsset(response, context.compiledClientDirectory, url.pathname.slice(rendererClientAssetsPath.length));
  } else if (url.pathname.startsWith(`${mockImagesPath}/`)) {
    serveMockImage(response, url.pathname);
  } else if (url.pathname === prescriptionsApiPath && request.method === 'POST') {
    await handlePrescriptionUpload(request, response, context);
  } else {
    await renderSitePage(response, url, context);
  }
}

async function renderSitePage(response: ServerResponse, url: URL, context: SiteRequestContext): Promise<void> {
  const scenario = scenarioForHostname(context.readCurrentScenario(), url.hostname);
  const rendering = await renderScenarioPage({ scenario, requestedPath: url.pathname, loadSiteRenderer: context.loadSiteRenderer });
  switch (rendering.outcome) {
    case 'rendered':
      sendHtml(response, rendering.status, injectFrameAgent(rendering.html));
      return;
    case 'invalidData':
      sendHtml(response, 422, renderPlaygroundErrorPage({ title: 'Ces données ne passent pas TenantSiteSchema', details: rendering.issues }));
      return;
    case 'renderFailed':
      sendHtml(response, 500, renderPlaygroundErrorPage({ title: 'Le moteur a échoué pendant le rendu', details: [rendering.errorMessage] }));
      return;
  }
}

/** En comparaison, chaque aperçu a son sous-domaine `<layoutId>.layout.localhost` : seul le layout change. */
function scenarioForHostname(scenario: PlaygroundScenario, hostname: string): PlaygroundScenario {
  const comparedLayoutId = readComparedLayoutId(hostname);
  if (comparedLayoutId === undefined) return scenario;
  const editedTenantSite = isObject(scenario.editedTenantSite) ? { ...scenario.editedTenantSite, layoutId: comparedLayoutId } : scenario.editedTenantSite;
  return { ...scenario, layoutId: comparedLayoutId, editedTenantSite };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
