import type { components } from '@crystal-pharm/api-client';
import type {
	PrescriptionStatus,
	ReceivedPrescription,
	ReceivedPrescriptionSummary
} from '../../domain/receivedPrescription';
import { createPrescriptionsApiClient, type PrescriptionsCaller } from './prescriptionsApiClient.server';

type SummaryDto = components['schemas']['ReceivedPrescriptionSummaryDto'];
type DetailDto = components['schemas']['ReceivedPrescriptionDto'];
type ProblemDto = components['schemas']['ProblemDetails'];

// Ni l'URL ni la réponse dans le message : elles peuvent contenir des données de santé.
function unexpectedResponse(operation: string, response: Response): Error {
	return new Error(`The prescriptions API refused ${operation} with status ${response.status}.`);
}

/** Une règle du C# refuse le changement : son message, écrit pour l'équipe, s'affiche tel quel. */
export class PrescriptionChangeRefused extends Error {}

function refusalOrUnexpected(operation: string, response: Response, problem: ProblemDto | undefined): Error {
	if (response.status === 400 && problem?.detail) return new PrescriptionChangeRefused(problem.detail);
	return unexpectedResponse(operation, response);
}

const toSummary = (dto: SummaryDto): ReceivedPrescriptionSummary => ({
	id: dto.id,
	submittedAt: dto.submittedAt,
	firstName: dto.firstName,
	lastName: dto.lastName,
	phone: dto.phone,
	plannedVisitAt: dto.plannedVisitAt,
	hasAlreadyVisited: dto.hasAlreadyVisited,
	isRenewal: dto.isRenewal,
	noteFromPatient: dto.noteFromPatient,
	canBeNotifiedByEmail: dto.canBeNotifiedByEmail,
	status: dto.status,
	statusChangedAt: dto.statusChangedAt,
	expectedProductsOn: dto.expectedProductsOn,
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
	isRenewal: dto.isRenewal,
	noteFromPatient: dto.noteFromPatient,
	status: dto.status,
	statusChangedAt: dto.statusChangedAt,
	expectedProductsOn: dto.expectedProductsOn,
	birthDate: dto.birthDate,
	email: dto.email,
	socialSecurityNumber: dto.socialSecurityNumber ?? null,
	teamNote: dto.teamNote,
	documents: dto.documents.map((document) => ({ id: document.id, kind: document.kind, format: document.format }))
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

export type PrescriptionStatusChange = {
	status: PrescriptionStatus;
	/** Seulement pour `waitingForProducts` : le jour où les produits arrivent. */
	expectedProductsOn: string | null;
};

export async function changePrescriptionStatus(
	caller: PrescriptionsCaller,
	submissionId: string,
	statusChange: PrescriptionStatusChange
): Promise<ReceivedPrescription | null> {
	const { data, error, response } = await createPrescriptionsApiClient(caller).PUT(
		'/received-prescriptions/{submissionId}/status',
		{ params: { path: { submissionId } }, body: statusChange }
	);
	if (data) return toPrescription(data);
	if (response.status === 404) return null;
	throw refusalOrUnexpected('a status change', response, error);
}

export async function writePrescriptionTeamNote(
	caller: PrescriptionsCaller,
	submissionId: string,
	note: string | null
): Promise<ReceivedPrescription | null> {
	const { data, error, response } = await createPrescriptionsApiClient(caller).PUT(
		'/received-prescriptions/{submissionId}/team-note',
		{ params: { path: { submissionId } }, body: { note } }
	);
	if (data) return toPrescription(data);
	if (response.status === 404) return null;
	throw refusalOrUnexpected('a team note', response, error);
}

export async function deleteReceivedPrescription(caller: PrescriptionsCaller, submissionId: string): Promise<void> {
	const { response } = await createPrescriptionsApiClient(caller).DELETE('/received-prescriptions/{submissionId}', {
		params: { path: { submissionId } }
	});
	if (response.ok || response.status === 404) return;
	throw unexpectedResponse('the deletion of a received prescription', response);
}

/** Un lien de lecture pré-signé et très court vers le fichier, servi par le stockage de santé, jamais par ce serveur. */
export async function createReceivedDocumentLink(
	caller: PrescriptionsCaller,
	submissionId: string,
	documentId: string
): Promise<string | null> {
	const { data, response } = await createPrescriptionsApiClient(caller).GET(
		'/received-prescriptions/{submissionId}/documents/{documentId}/link',
		{ params: { path: { submissionId, documentId } } }
	);
	if (data) return data.url;
	if (response.status === 404) return null;
	throw unexpectedResponse('the link to a prescription file', response);
}
