import type { APIEvent } from '@solidjs/start/server';
import { findSiteRequest } from '../../../../server/site-request/siteRequest';
import { forwardPrescriptionUploadCompletion } from '../../../../server/prescriptions/forwardPrescriptionUpload.server';

export async function POST(event: APIEvent) {
  return forwardPrescriptionUploadCompletion(event.request, findSiteRequest(event.locals)?.tenantId);
}
