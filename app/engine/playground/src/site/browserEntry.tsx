import type { SendPrescription } from '@crystal-pharm/renderer';
import { hydrate } from 'solid-js/web';
import { createSitePage } from './createSitePage';
import { htmlDocumentElementIds } from './html-document/htmlDocumentElementIds';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';

const prescriptionsApiPath = '/api/prescriptions';

/** Vers la fausse API du banc d'essai. Le tenant n'est pas envoyé : dans l'app des sites, il vient de la passerelle. */
const sendPrescriptionToPlaygroundApi: SendPrescription = async (request) => {
  const formData = new FormData();
  for (const [fieldName, value] of Object.entries(request)) formData.set(fieldName, value);
  try {
    const response = await fetch(prescriptionsApiPath, { method: 'POST', body: formData });
    return response.ok ? { outcome: 'sent' } : { outcome: 'failed' };
  } catch {
    return { outcome: 'failed' };
  }
};

// Relit les données écrites par le serveur et rattache Solid au HTML déjà affiché, avec exactement la même page.
const siteRootElement = document.getElementById(htmlDocumentElementIds.siteRoot);
if (!siteRootElement) throw new Error('Élément racine du site introuvable dans la page.');
const sitePage = createSitePage(readRenderData(), sendPrescriptionToPlaygroundApi);
if (sitePage.status === 'found') hydrate(() => <sitePage.Page />, siteRootElement);

function readRenderData(): TenantSiteRenderData {
  const renderDataElement = document.getElementById(htmlDocumentElementIds.renderData);
  if (!renderDataElement?.textContent) throw new Error('Données de rendu introuvables dans la page.');
  return JSON.parse(renderDataElement.textContent);
}
