import type { APIEvent } from '@solidjs/start/server';
import { forwardAppointmentRequest } from '../../../server/appointments/forwardAppointment.server';
import { findSiteRequest } from '../../../server/site-request/siteRequest';

export async function POST(event: APIEvent) {
  return forwardAppointmentRequest(event.request, findSiteRequest(event.locals)?.tenantId);
}
