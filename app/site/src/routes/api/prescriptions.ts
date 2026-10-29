import type { APIEvent } from '@solidjs/start/server';
import { findSiteRequest } from '../../server/site-request/siteRequest';
import { forwardPrescription } from '../../server/prescriptions/forwardPrescription.server';

export async function POST(event: APIEvent) {
  return forwardPrescription(event.request, findSiteRequest(event.locals)?.tenantId);
}
