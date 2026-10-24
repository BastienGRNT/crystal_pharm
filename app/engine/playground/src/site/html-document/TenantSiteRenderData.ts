import type { TenantSite } from '@crystal-pharm/schema';

/** Les données écrites dans la page : le navigateur les relit pour réhydrater exactement le même rendu. */
export type TenantSiteRenderData = {
  tenantSite: TenantSite;
  requestedPath: string;
  /** L'instant du rendu serveur, réutilisé par le navigateur pour afficher les mêmes horaires et la même garde. */
  renderedAt: string;
};
