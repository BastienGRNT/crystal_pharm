import type { APIEvent } from '@solidjs/start/server';
import { forwardAvailableSlotsRequest } from '../../../server/appointments/forwardAppointment.server';
import { findSiteRequest } from '../../../server/site-request/siteRequest';

export async function GET(event: APIEvent) {
  return forwardAvailableSlotsRequest(new URL(event.request.url).searchParams, findSiteRequest(event.locals)?.tenantId);
}
