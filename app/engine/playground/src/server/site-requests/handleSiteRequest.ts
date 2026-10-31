import type { IncomingMessage, ServerResponse } from 'node:http';
import { readComparedLayoutId } from '../../shared/playgroundHosts';
import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';
import { siteClientAssetsPath } from '../../shared/siteClientAssetsPath';
import { sendHtml } from '../http/sendResponse';
import { mockImagesPath } from '../mocks/mockImageUrl';
import { injectFrameAgent } from '../site-rendering/injectFrameAgent';
import { renderPlaygroundErrorPage } from '../site-rendering/renderPlaygroundErrorPage';
import { renderScenarioPage } from '../site-rendering/renderScenarioPage';
import { handleAppointmentRequest } from './handleAppointmentRequest';
import { handlePrescriptionUpload } from './handlePrescriptionUpload';
import { serveMockImage } from './serveMockImage';
import { serveSiteAsset } from './serveSiteAsset';
import type { SiteRequestContext } from './SiteRequestContext';

const prescriptionsApiPath = '/api/prescriptions';
const appointmentsApiPath = '/api/appointments';

/** Tout ce que demande un aperçu : la page du site, le JS et le CSS du moteur, les images des mocks, l'API simulée. */
export async function handleSiteRequest(request: IncomingMessage, response: ServerResponse, context: SiteRequestContext): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'site.localhost'}`);
  if (url.pathname.startsWith(`${siteClientAssetsPath}/`)) {
    serveSiteAsset(response, context.compiledClientDirectory, url.pathname.slice(siteClientAssetsPath.length));
  } else if (url.pathname.startsWith(`${mockImagesPath}/`)) {
    serveMockImage(response, url.pathname);
  } else if (url.pathname === prescriptionsApiPath && request.method === 'POST') {
    await handlePrescriptionUpload(request, response, context);
  } else if (url.pathname.startsWith(appointmentsApiPath)) {
    handleAppointmentRequest(request, response, url);
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
    case 'redirected':
      response.writeHead(302, { location: rendering.location, 'cache-control': 'no-store' });
      response.end();
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
