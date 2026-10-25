import type { APIEvent } from '@solidjs/start/server';
import { forwardPrescription } from '../../server/prescriptions/forwardPrescription.server';

export async function POST(event: APIEvent) {
  return forwardPrescription(event.request);
}
