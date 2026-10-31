import { createTenantSitePage, type AppointmentGateway, type SendPrescription, type TenantSitePage } from '@crystal-pharm/renderer';
import { layoutRegistry } from '@crystal-pharm/layouts';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';

/** Le même appel au moteur sur le serveur et dans le navigateur : c'est ce qui garantit une hydratation sans écart. */
export function createSitePage(renderData: TenantSiteRenderData, sendPrescription: SendPrescription, appointments: AppointmentGateway): TenantSitePage {
  return createTenantSitePage({
    tenantSite: renderData.tenantSite,
    requestedPath: renderData.requestedPath,
    renderedAt: new Date(renderData.renderedAt),
    layouts: layoutRegistry,
    sendPrescription,
    appointments,
  });
}
