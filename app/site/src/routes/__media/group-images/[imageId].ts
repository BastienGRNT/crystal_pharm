import { readGroupImageOfTenant } from '@crystal-pharm/group-db';
import type { APIEvent } from '@solidjs/start/server';
import { toImageResponse } from '../../../server/mediaResponse';
import { findSiteRequest } from '../../../server/site-request/siteRequest';

export async function GET(event: APIEvent) {
  const tenantId = findSiteRequest(event.locals)?.tenantId;
  const imageId = event.params.imageId;
  if (!tenantId || !imageId) return toImageResponse(undefined);
  return toImageResponse(await readGroupImageOfTenant(tenantId, imageId));
}
