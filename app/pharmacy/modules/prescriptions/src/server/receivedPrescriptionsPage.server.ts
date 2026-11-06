import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail, type ActionFailure, type Actions } from '@sveltejs/kit';
import { prescriptionStatusesInQueueOrder } from '../domain/prescriptionQueue';
import type { PrescriptionStatus, ReceivedPrescription } from '../domain/receivedPrescription';
import type {
	ReceivedPrescriptionsActionResult,
	ReceivedPrescriptionsPageData
} from '../pages/receivedPrescriptionsPageData';
import {
	changePrescriptionStatus,
	deleteReceivedPrescription,
	findReceivedPrescription,
	listReceivedPrescriptions,
	PrescriptionChangeRefused,
	writePrescriptionTeamNote
} from './api/receivedPrescriptionsApi.server';
import type { PrescriptionsCaller } from './api/prescriptionsApiClient.server';
import { requirePrescriptionsCaller } from './prescriptionsCaller.server';
import { notifyPatientThatRequestIsReady } from './readyNotification.server';
import { buildQueue, buildSelectedPrescription, statusLabels } from './receivedPrescriptionsPresentation';

type ReceivedPrescriptionsRequest = {
	url: URL;
	locals: { user: AuthenticatedUser | null };
};

export async function load({ url, locals }: ReceivedPrescriptionsRequest): Promise<ReceivedPrescriptionsPageData> {
	const caller = await requirePrescriptionsCaller(locals.user);
	const now = new Date();
	const selectedId = url.searchParams.get('ordonnance');
	const summaries = await listReceivedPrescriptions(caller);

	// Supprimée entre-temps (par un collègue, ou à l'instant) : la liste s'affiche sans fiche.
	const prescription = selectedId ? await findReceivedPrescription(caller, selectedId).catch(() => null) : null;
	const selected = prescription ? buildSelectedPrescription(prescription, now) : null;

	return { ...buildQueue(summaries, selectedId, url.searchParams.get('statut'), now), selected };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoDayPattern = /^\d{4}-\d{2}-\d{2}$/;

type ActionOutcome = ReceivedPrescriptionsActionResult | ActionFailure<ReceivedPrescriptionsActionResult>;

const failWith = (status: number, errorMessage: string): ActionFailure<ReceivedPrescriptionsActionResult> =>
	fail(status, { errorMessage });

function readSubmissionId(formData: FormData): string | null {
	const submissionId = String(formData.get('submissionId') ?? '');
	return uuidPattern.test(submissionId) ? submissionId : null;
}

function readStatus(formData: FormData): PrescriptionStatus | null {
	const requestedStatus = String(formData.get('status') ?? '');
	return prescriptionStatusesInQueueOrder.find((status) => status === requestedStatus) ?? null;
}

const patientShortName = (prescription: ReceivedPrescription): string =>
	`${prescription.firstName} ${prescription.lastName.charAt(0).toLocaleUpperCase('fr-FR')}.`;

// Un refus du C# (une date passée, par exemple) s'affiche ; le reste est une panne, laissée à SvelteKit.
async function runChange<Result>(change: () => Promise<Result>): Promise<Result | ActionFailure<ReceivedPrescriptionsActionResult>> {
	try {
		return await change();
	} catch (changeError) {
		if (changeError instanceof PrescriptionChangeRefused) return failWith(400, changeError.message);
		throw changeError;
	}
}

async function describeStatusChange(
	caller: PrescriptionsCaller,
	prescription: ReceivedPrescription,
	wantsEmailNotification: boolean
): Promise<string> {
	const name = patientShortName(prescription);
	if (prescription.status !== 'ready') return `${name} : ${statusLabels[prescription.status].toLocaleLowerCase('fr-FR')}.`;
	if (!wantsEmailNotification || !prescription.email) return `${name} : prête. Pensez à l’appeler si besoin.`;
	await notifyPatientThatRequestIsReady(caller.tenantId, prescription.email);
	return `${name} : prête, et prévenue par email.`;
}

export const actions = {
	changeStatus: async ({ request, locals }): Promise<ActionOutcome> => {
		const caller = await requirePrescriptionsCaller(locals.user);
		const formData = await request.formData();
		const submissionId = readSubmissionId(formData);
		const status = readStatus(formData);
		if (!submissionId || !status) return failWith(400, 'Ce changement est incomplet : rechargez la page.');

		const expectedProductsOn = String(formData.get('expectedProductsOn') ?? '');
		if (status === 'waitingForProducts' && !isoDayPattern.test(expectedProductsOn)) {
			return failWith(400, 'Indiquez le jour où les produits doivent arriver.');
		}

		const prescription = await runChange(() =>
			changePrescriptionStatus(caller, submissionId, {
				status,
				expectedProductsOn: status === 'waitingForProducts' ? expectedProductsOn : null
			})
		);
		if (prescription === null) return failWith(404, 'Cette ordonnance n’existe plus : elle a peut-être été supprimée.');
		if (!('id' in prescription)) return prescription;
		return { notice: await describeStatusChange(caller, prescription, formData.get('notifyByEmail') === 'on') };
	},

	writeTeamNote: async ({ request, locals }): Promise<ActionOutcome> => {
		const caller = await requirePrescriptionsCaller(locals.user);
		const formData = await request.formData();
		const submissionId = readSubmissionId(formData);
		if (!submissionId) return failWith(400, 'Cette note est incomplète : rechargez la page.');

		const note = String(formData.get('teamNote') ?? '').trim();
		const prescription = await runChange(() => writePrescriptionTeamNote(caller, submissionId, note === '' ? null : note));
		if (prescription === null) return failWith(404, 'Cette ordonnance n’existe plus : elle a peut-être été supprimée.');
		if (!('id' in prescription)) return prescription;
		return { notice: 'Note enregistrée.' };
	},

	deletePrescription: async ({ request, locals }): Promise<ActionOutcome> => {
		const caller = await requirePrescriptionsCaller(locals.user);
		const submissionId = readSubmissionId(await request.formData());
		if (!submissionId) return failWith(400, 'Cette suppression est incomplète : rechargez la page.');
		await deleteReceivedPrescription(caller, submissionId);
		return { notice: 'Ordonnance supprimée, avec ses fichiers.' };
	}
} satisfies Actions;
