import { readTenantSiteContent } from '@crystal-pharm/content-db';

/** Le Tenant a-t-il enregistré son site au moins une fois ? L'accueil s'en sert pour proposer de le configurer. */
export async function hasCreatedSite(tenantId: string): Promise<boolean> {
	return (await readTenantSiteContent(tenantId)) !== undefined;
}
