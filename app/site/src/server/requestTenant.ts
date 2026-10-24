import * as v from 'valibot';

/** L'en-tête posé par la passerelle, qui écrase celui qu'enverrait le navigateur. */
export const tenantIdHeaderName = 'x-tenant-id';

const TenantIdSchema = v.pipe(v.string(), v.uuid());

/** Le Tenant dont la passerelle sert le site ; `undefined` hors passerelle (l'aperçu de site-manager). */
export function findTenantIdOfRequest(request: Request): string | undefined {
  const tenantId = request.headers.get(tenantIdHeaderName);
  return v.is(TenantIdSchema, tenantId) ? tenantId : undefined;
}
