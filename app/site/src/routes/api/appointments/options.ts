import type { APIEvent } from '@solidjs/start/server';
import { forwardAppointmentOptionsRequest } from '../../../server/appointments/forwardAppointment.server';
import { findSiteRequest } from '../../../server/site-request/siteRequest';

export async function GET(event: APIEvent) {
  return forwardAppointmentOptionsRequest(findSiteRequest(event.locals)?.tenantId);
}
