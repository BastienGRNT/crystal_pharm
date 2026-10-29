import { readEmployeePhoto } from '@crystal-pharm/pharmacy-db';
import type { APIEvent } from '@solidjs/start/server';
import { toImageResponse } from '../../../server/mediaResponse';
import { findSiteRequest } from '../../../server/site-request/siteRequest';

export async function GET(event: APIEvent) {
  const tenantId = findSiteRequest(event.locals)?.tenantId;
  const photoId = event.params.photoId;
  if (!tenantId || !photoId) return toImageResponse(undefined);
  return toImageResponse(await readEmployeePhoto(tenantId, photoId));
}
