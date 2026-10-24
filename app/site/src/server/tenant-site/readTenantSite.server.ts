import { readTenantSiteContent } from '@crystal-pharm/content-db';
import { findGroupSiteProfileOfTenant } from '@crystal-pharm/group-db';
import { getPharmacyProfile, listEmployees } from '@crystal-pharm/pharmacy-db';
import { TenantSiteSchema, type TenantSite } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { toTenantSiteInput } from './toTenantSiteInput';

export type TenantSiteReading =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'ready'; tenantSite: TenantSite };

/** Le site d'un Tenant, tel que le moteur l'attend : `missing` tant qu'il ne l'a pas créé. */
export async function readTenantSite(tenantId: string): Promise<TenantSiteReading> {
  const content = await readTenantSiteContent(tenantId);
  if (!content) return { status: 'missing' };

  const [pharmacyProfile, employees, group] = await Promise.all([
    getPharmacyProfile(tenantId),
    listEmployees(tenantId),
    findGroupSiteProfileOfTenant(tenantId),
  ]);
  const { tenantSiteInput, unavailableMandatoryModules } = toTenantSiteInput({ tenantId, content, pharmacyProfile, employees, group });
  if (unavailableMandatoryModules.length > 0) {
    console.warn(`Site du tenant ${tenantId} : modules imposés sans données, masqués : ${unavailableMandatoryModules.join(', ')}.`);
  }

  const validation = v.safeParse(TenantSiteSchema, tenantSiteInput);
  if (!validation.success) {
    console.error(`Site du tenant ${tenantId} : données invalides.`, v.flatten(validation.issues));
    return { status: 'invalid' };
  }
  return { status: 'ready', tenantSite: validation.output };
}
