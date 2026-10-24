import { TenantSiteSchema, type TenantSite } from '@crystal-pharm/schema';
import * as v from 'valibot';

export type TenantSiteValidation = { success: true; tenantSite: TenantSite } | { success: false; issues: string[] };

/** La même validation que l'app des sites fera sur les données de l'API, avec des messages lisibles dans le panneau. */
export function validateTenantSite(tenantSiteInput: unknown): TenantSiteValidation {
  const result = v.safeParse(TenantSiteSchema, tenantSiteInput);
  if (result.success) return { success: true, tenantSite: result.output };
  return { success: false, issues: result.issues.map((issue) => `${v.getDotPath(issue) ?? 'TenantSite'} : ${issue.message}`) };
}
