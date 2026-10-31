import type { AppointmentGateway, SendPrescription } from '@crystal-pharm/renderer';
import type { TenantSite } from '@crystal-pharm/schema';
import { renderToString } from 'solid-js/web';
import { createSitePage } from './createSitePage';
import { renderHtmlDocument } from './html-document/renderHtmlDocument';
import { renderNotFoundDocument } from './html-document/renderNotFoundDocument';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';

export type RenderedDocument = { status: 200 | 404; html: string } | { status: 302; location: string };

// Un formulaire ne s'envoie que depuis le navigateur, une fois la page hydratée.
const sendPrescriptionFromServer: SendPrescription = () => Promise.reject(new Error('Une ordonnance ne s’envoie pas pendant le rendu serveur.'));

const appointmentsFromServer: AppointmentGateway = {
  listAvailableSlots: () => Promise.reject(new Error('Les créneaux ne se demandent que depuis le navigateur.')),
  requestAppointment: () => Promise.reject(new Error('Un rendez-vous ne se demande que depuis le navigateur.')),
};

/** Ce que le banc d'essai importe, compilé : le document HTML complet d'une page, comme le rendra l'app des sites. */
export function renderTenantSiteDocument(tenantSite: TenantSite, requestedPath: string): RenderedDocument {
  const renderData: TenantSiteRenderData = { tenantSite, requestedPath, renderedAt: new Date().toISOString() };
  const sitePage = createSitePage(renderData, sendPrescriptionFromServer, appointmentsFromServer);
  if (sitePage.status === 'redirect') return { status: 302, location: sitePage.location };
  if (sitePage.status === 'notFound') return { status: 404, html: renderNotFoundDocument(tenantSite.pharmacy) };

  const bodyHtml = renderToString(() => <sitePage.Page />);
  return { status: 200, html: renderHtmlDocument({ title: sitePage.title, bodyHtml, renderData }) };
}
