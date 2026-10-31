import { toPrescriptionFormData, type AppointmentGateway, type SendPrescription } from '@crystal-pharm/renderer';
import { hydrate } from 'solid-js/web';
import { createSitePage } from './createSitePage';
import { htmlDocumentElementIds } from './html-document/htmlDocumentElementIds';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';

const prescriptionsApiPath = '/api/prescriptions';

/** Vers la fausse API du banc d'essai. Le tenant n'est pas envoyé : dans l'app des sites, il vient de la passerelle. */
const sendPrescriptionToPlaygroundApi: SendPrescription = async (request) => {
  try {
    const response = await fetch(prescriptionsApiPath, { method: 'POST', body: toPrescriptionFormData(request) });
    return response.ok ? { outcome: 'sent' } : { outcome: 'failed' };
  } catch {
    return { outcome: 'failed' };
  }
};

const appointmentsApiPath = '/api/appointments';

const appointmentsFromPlaygroundApi: AppointmentGateway = {
  listAvailableSlots: async (day) => {
    try {
      const response = await fetch(`${appointmentsApiPath}/slots?day=${encodeURIComponent(day)}`);
      return response.ok ? { outcome: 'listed', slots: await response.json() } : { outcome: 'failed' };
    } catch {
      return { outcome: 'failed' };
    }
  },
  requestAppointment: async (request) => {
    try {
      const response = await fetch(appointmentsApiPath, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) });
      if (response.status === 409) return { outcome: 'slotTaken' };
      return response.ok ? { outcome: 'requested' } : { outcome: 'failed' };
    } catch {
      return { outcome: 'failed' };
    }
  },
};

// Relit les données écrites par le serveur et rattache Solid au HTML déjà affiché, avec exactement la même page.
const siteRootElement = document.getElementById(htmlDocumentElementIds.siteRoot);
if (!siteRootElement) throw new Error('Élément racine du site introuvable dans la page.');
const sitePage = createSitePage(readRenderData(), sendPrescriptionToPlaygroundApi, appointmentsFromPlaygroundApi);
if (sitePage.status === 'found') hydrate(() => <sitePage.Page />, siteRootElement);

function readRenderData(): TenantSiteRenderData {
  const renderDataElement = document.getElementById(htmlDocumentElementIds.renderData);
  if (!renderDataElement?.textContent) throw new Error('Données de rendu introuvables dans la page.');
  return JSON.parse(renderDataElement.textContent);
}
