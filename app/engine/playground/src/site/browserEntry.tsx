import { toPrescriptionFormData, type AppointmentGateway, type SendPrescription } from '@crystal-pharm/renderer';
import type { AppointmentConfirmation, AppointmentOptions, AvailableAppointmentDay, AvailableAppointmentSlot } from '@crystal-pharm/schema';
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

async function readJson<Value>(url: string): Promise<Value | undefined> {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as Value) : undefined;
  } catch {
    return undefined;
  }
}

const appointmentsFromPlaygroundApi: AppointmentGateway = {
  getOptions: async () => {
    const options = await readJson<AppointmentOptions>(`${appointmentsApiPath}/options`);
    return options ? { outcome: 'loaded', options } : { outcome: 'failed' };
  },
  listAvailableDays: async ({ reasonId, firstDay, lastDay }) => {
    const query = new URLSearchParams({ reasonId, from: firstDay, to: lastDay });
    const days = await readJson<AvailableAppointmentDay[]>(`${appointmentsApiPath}/availability?${query}`);
    return days ? { outcome: 'listed', days } : { outcome: 'failed' };
  },
  listAvailableSlots: async ({ reasonId, day }) => {
    const query = new URLSearchParams({ reasonId, day });
    const slots = await readJson<AvailableAppointmentSlot[]>(`${appointmentsApiPath}/slots?${query}`);
    return slots ? { outcome: 'listed', slots } : { outcome: 'failed' };
  },
  requestAppointment: async (request) => {
    try {
      const response = await fetch(appointmentsApiPath, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) });
      if (response.status === 409) return { outcome: 'slotTaken' };
      return response.ok ? { outcome: 'requested', confirmation: (await response.json()) as AppointmentConfirmation } : { outcome: 'failed' };
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
