import { readGroupImageOfTenant } from '@crystal-pharm/group-db';
import type { APIEvent } from '@solidjs/start/server';
import { toImageResponse } from '../../../server/mediaResponse';
import { findTenantIdOfRequest } from '../../../server/requestTenant';

export async function GET(event: APIEvent) {
  const tenantId = findTenantIdOfRequest(event.request);
  const imageId = event.params.imageId;
  if (!tenantId || !imageId) return toImageResponse(undefined);
  return toImageResponse(await readGroupImageOfTenant(tenantId, imageId));
}
