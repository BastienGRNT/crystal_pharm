import type { IncomingMessage, ServerResponse } from 'node:http';
import { PrescriptionUploadRequestSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { playgroundEvents, type PrescriptionReceivedEvent } from '../../shared/PlaygroundCatalog';
import type { PrescriptionResponseChoice } from '../../shared/PlaygroundScenario';
import { readRequestBody } from '../http/readRequestBody';
import { sendJson } from '../http/sendResponse';
import type { SiteRequestContext } from './SiteRequestContext';

const slowResponseDelayInMilliseconds = 3000;

/**
 * Une fausse API d'ordonnances : elle valide l'envoi comme le fera le C#, puis répond ce que le panneau a choisi.
 * Le tenant n'est pas dans l'envoi : dans l'app des sites, c'est la passerelle qui le donne.
 * Rien n'est gardé ni journalisé : seuls le type et la taille du fichier remontent au panneau.
 */
export async function handlePrescriptionUpload(request: IncomingMessage, response: ServerResponse, context: SiteRequestContext): Promise<void> {
  const simulatedResponse = context.readCurrentScenario().prescriptionResponseChoice;
  const formData = await readMultipartForm(request);
  const file = formData.get('prescriptionFile');
  const validation = v.safeParse(PrescriptionUploadRequestSchema, Object.fromEntries(formData));
  const receivedEvent: PrescriptionReceivedEvent = {
    receivedAt: new Date().toISOString(),
    fileType: file instanceof File ? file.type || 'inconnu' : 'aucun fichier',
    fileSizeInKilobytes: file instanceof File ? Math.round(file.size / 1024) : 0,
    simulatedResponse,
    rejectionReason: validation.success ? undefined : validation.issues.map((issue) => issue.message).join(' · '),
  };
  context.notifyPanel(playgroundEvents.prescriptionReceived, receivedEvent);

  if (!validation.success) {
    sendJson(response, 400, { error: 'invalid' });
    return;
  }
  await respondAsChosen(request, response, simulatedResponse);
}

async function readMultipartForm(request: IncomingMessage): Promise<FormData> {
  const body = new Uint8Array(await readRequestBody(request));
  const webRequest = new Request('http://playground.localhost/prescriptions', {
    method: 'POST',
    headers: { 'content-type': request.headers['content-type'] ?? '' },
    body,
  });
  try {
    return await webRequest.formData();
  } catch {
    return new FormData();
  }
}

async function respondAsChosen(request: IncomingMessage, response: ServerResponse, choice: PrescriptionResponseChoice): Promise<void> {
  switch (choice) {
    case 'accepted':
      sendJson(response, 201, { status: 'received' });
      return;
    case 'serverError':
      sendJson(response, 500, { error: 'simulated' });
      return;
    case 'slowThenAccepted':
      await new Promise((resolveDelay) => setTimeout(resolveDelay, slowResponseDelayInMilliseconds));
      sendJson(response, 201, { status: 'received' });
      return;
    case 'unreachable':
      request.socket.destroy();
      return;
  }
}
