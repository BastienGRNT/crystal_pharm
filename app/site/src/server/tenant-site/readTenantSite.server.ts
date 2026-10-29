import { readTenantSiteContentInOneStatement } from '@crystal-pharm/content-db';
import { findGroupSiteProfileOfTenantInOneStatement } from '@crystal-pharm/group-db';
import { getPharmacyProfileInOneStatement, listEmployeesInOneStatement } from '@crystal-pharm/pharmacy-db';
import { TenantSiteSchema, type TenantSite } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { toTenantSiteInput } from './toTenantSiteInput';

export type TenantSiteReading =
  | { status: 'missing' }
  | { status: 'invalid' }
  | {
      status: 'ready';
      tenantSite: TenantSite;
      /** Le groupement dont la page affiche des données. */
      displayedGroupId: string | undefined;
    };

/**
 * Le site d'un Tenant, tel que le moteur l'attend : `missing` tant qu'il ne l'a pas créé.
 * Le deuxième aller-retour : le contenu, la fiche, l'équipe et le groupement se lisent
 * en parallèle, chacun en une seule instruction, et on décide ensuite.
 */
export async function readTenantSite(tenantId: string): Promise<TenantSiteReading> {
  const [content, pharmacyProfile, employees, group] = await Promise.all([
    readTenantSiteContentInOneStatement(tenantId),
    getPharmacyProfileInOneStatement(tenantId),
    listEmployeesInOneStatement(tenantId),
    findGroupSiteProfileOfTenantInOneStatement(tenantId),
  ]);
  if (!content) return { status: 'missing' };

  const { tenantSiteInput, unavailableMandatoryModules, isGroupNewsMissing } = toTenantSiteInput({ tenantId, content, pharmacyProfile, employees, group });
  if (unavailableMandatoryModules.length > 0) {
    console.warn(`Site du tenant ${tenantId} : modules imposés sans données, masqués : ${unavailableMandatoryModules.join(', ')}.`);
  }
  if (isGroupNewsMissing) {
    console.warn(`Site du tenant ${tenantId} : actualités du groupement demandées, mais aucune publiée : bloc masqué.`);
  }

  const validation = v.safeParse(TenantSiteSchema, tenantSiteInput);
  if (!validation.success) {
    console.error(`Site du tenant ${tenantId} : données invalides.`, v.flatten(validation.issues));
    return { status: 'invalid' };
  }
  return { status: 'ready', tenantSite: validation.output, displayedGroupId: group?.groupId };
}
