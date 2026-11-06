import type { SendPrescription } from '@crystal-pharm/renderer';
import type { PrescriptionUploadRequest } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { PrescriptionUploadStartResultSchema, type DocumentUploadLink } from '../server/prescriptions/prescriptionUploadSchemas';
import { announceDocument, type AnnouncedDocumentFile } from './prescriptionDocumentAnnouncement';

/**
 * L'envoi en trois temps. Le navigateur annonce l'envoi au serveur du site (qui ajoute le Tenant et l'identité de
 * service), dépose chaque fichier directement dans le stockage de santé par son lien pré-signé, puis fait confirmer
 * l'envoi : les fichiers ne passent jamais par un serveur Node, et le navigateur n'appelle jamais le C#.
 */
export const sendPrescriptionToSiteServer: SendPrescription = async (request) => {
  const idempotencyKey = crypto.randomUUID();
  try {
    const documents = await Promise.all(listDocumentFiles(request).map(announceDocument));
    const started = await startUpload(idempotencyKey, request, documents);
    if (!started) return { outcome: 'failed' };
    if (!started.alreadyReceived) {
      const allUploaded = await uploadDocuments(started.uploadLinks, documents);
      if (!allUploaded) return { outcome: 'failed' };
    }
    return (await completeUpload(idempotencyKey)) ? { outcome: 'sent' } : { outcome: 'failed' };
  } catch {
    return { outcome: 'failed' };
  }
};

/** Dans l'ordre que le C# attend : les pages de l'ordonnance, la carte Vitale, puis la mutuelle (recto, verso). */
function listDocumentFiles(request: PrescriptionUploadRequest): { kind: AnnouncedDocumentFile['kind']; file: File }[] {
  return [
    { kind: 'prescription' as const, file: request.prescriptionFile },
    ...(request.additionalPrescriptionPages ?? []).map((page) => ({ kind: 'prescription' as const, file: page })),
    ...(request.vitalCardPhoto ? [{ kind: 'vitalCard' as const, file: request.vitalCardPhoto }] : []),
    ...(request.mutualCardFront ? [{ kind: 'mutualCardFront' as const, file: request.mutualCardFront }] : []),
    ...(request.mutualCardBack ? [{ kind: 'mutualCardBack' as const, file: request.mutualCardBack }] : []),
  ];
}

async function startUpload(
  idempotencyKey: string,
  request: PrescriptionUploadRequest,
  documents: readonly AnnouncedDocumentFile[],
): Promise<v.InferOutput<typeof PrescriptionUploadStartResultSchema> | undefined> {
  const response = await fetch('/api/prescriptions/uploads', {
    method: 'POST',
    headers: { 'idempotency-key': idempotencyKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      firstName: request.firstName,
      lastName: request.lastName,
      birthDate: request.birthDate,
      phone: request.phone,
      email: request.email,
      plannedVisitAt: request.plannedVisitAt,
      hasAlreadyVisited: request.hasAlreadyVisited,
      isRenewal: request.isRenewal,
      noteFromPatient: request.noteFromPatient,
      socialSecurityNumber: request.socialSecurityNumber,
      documents: documents.map(({ kind, sizeInBytes, contentType }) => ({ kind, sizeInBytes, contentType })),
    }),
  });
  if (!response.ok) return undefined;
  const parsed = v.safeParse(PrescriptionUploadStartResultSchema, await response.json());
  return parsed.success ? parsed.output : undefined;
}

async function uploadDocuments(uploadLinks: readonly DocumentUploadLink[], documents: readonly AnnouncedDocumentFile[]): Promise<boolean> {
  const uploads = uploadLinks.map(async (uploadLink) => {
    const document = documents[uploadLink.position];
    if (!document) return false;
    const response = await fetch(uploadLink.url, {
      method: 'PUT',
      headers: uploadLink.requiredHeaders,
      body: document.file,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    return response.ok;
  });
  return (await Promise.all(uploads)).every(Boolean);
}

async function completeUpload(idempotencyKey: string): Promise<boolean> {
  const response = await fetch('/api/prescriptions/uploads/completion', {
    method: 'POST',
    headers: { 'idempotency-key': idempotencyKey },
  });
  return response.ok;
}
