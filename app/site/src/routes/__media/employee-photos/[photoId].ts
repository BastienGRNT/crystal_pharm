import { readEmployeePhoto } from '@crystal-pharm/pharmacy-db';
import type { APIEvent } from '@solidjs/start/server';
import { toImageResponse } from '../../../server/mediaResponse';
import { findTenantIdOfRequest } from '../../../server/requestTenant';

export async function GET(event: APIEvent) {
  const tenantId = findTenantIdOfRequest(event.request);
  const photoId = event.params.photoId;
  if (!tenantId || !photoId) return toImageResponse(undefined);
  return toImageResponse(await readEmployeePhoto(tenantId, photoId));
}
