import type { components } from '@crystal-pharm/api-client';
import type { ReceivedPrescription, ReceivedPrescriptionSummary } from '../../domain/receivedPrescription';
import { createPrescriptionsApiClient, type PrescriptionsCaller } from './prescriptionsApiClient.server';

type SummaryDto = components['schemas']['ReceivedPrescriptionSummaryDto'];
type DetailDto = components['schemas']['ReceivedPrescriptionDto'];

// Ni l'URL ni la réponse dans le message : elles peuvent contenir des données de santé.
function unexpectedResponse(operation: string, response: Response): Error {
	return new Error(`The prescriptions API refused ${operation} with status ${response.status}.`);
}

const toSummary = (dto: SummaryDto): ReceivedPrescriptionSummary => ({
	id: dto.id,
	submittedAt: dto.submittedAt,
	firstName: dto.firstName,
	lastName: dto.lastName,
	phone: dto.phone,
	plannedVisitAt: dto.plannedVisitAt,
	hasAlreadyVisited: dto.hasAlreadyVisited,
	documentCount: dto.documentCount
});

const toPrescription = (dto: DetailDto): ReceivedPrescription => ({
	id: dto.id,
	submittedAt: dto.submittedAt,
	firstName: dto.firstName,
	lastName: dto.lastName,
	phone: dto.phone,
	plannedVisitAt: dto.plannedVisitAt,
	hasAlreadyVisited: dto.hasAlreadyVisited,
	birthDate: dto.birthDate,
	socialSecurityNumber: dto.socialSecurityNumber ?? null,
	documents: dto.documents.map((document) => ({ id: document.id, kind: document.kind }))
});

export async function listReceivedPrescriptions(caller: PrescriptionsCaller): Promise<ReceivedPrescriptionSummary[]> {
	const { data, response } = await createPrescriptionsApiClient(caller).GET('/received-prescriptions');
	if (!data) throw unexpectedResponse('the listing of received prescriptions', response);
	return data.map(toSummary);
}

export async function findReceivedPrescription(
	caller: PrescriptionsCaller,
	submissionId: string
): Promise<ReceivedPrescription | null> {
	const { data, response } = await createPrescriptionsApiClient(caller).GET('/received-prescriptions/{submissionId}', {
		params: { path: { submissionId } }
	});
	if (data) return toPrescription(data);
	if (response.status === 404) return null;
	throw unexpectedResponse('the reading of a received prescription', response);
}

/** Le fichier en flux, tel que le C# le sert : jamais lu en entier ni copié ici. */
export async function openReceivedDocument(
	caller: PrescriptionsCaller,
	submissionId: string,
	documentId: string
): Promise<Response | null> {
	const { response } = await createPrescriptionsApiClient(caller).GET(
		'/received-prescriptions/{submissionId}/documents/{documentId}',
		{ params: { path: { submissionId, documentId } }, parseAs: 'stream' }
	);
	if (response.ok) return response;
	if (response.status === 404) return null;
	throw unexpectedResponse('the reading of a prescription file', response);
}
