import type { APIEvent } from '@solidjs/start/server';
import { findSiteRequest } from '../../../../server/site-request/siteRequest';
import { forwardPrescriptionUploadStart } from '../../../../server/prescriptions/forwardPrescriptionUpload.server';

export async function POST(event: APIEvent) {
  return forwardPrescriptionUploadStart(event.request, findSiteRequest(event.locals)?.tenantId);
}
