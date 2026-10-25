import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { error } from '@sveltejs/kit';
import type { ReceivedPrescriptionsPageData } from '../pages/receivedPrescriptionsPageData';
import { findReceivedPrescription, listReceivedPrescriptions } from './api/receivedPrescriptionsApi.server';
import { requirePrescriptionsCaller } from './prescriptionsCaller.server';
import { buildPrescriptionRows, buildSelectedPrescription } from './receivedPrescriptionsPresentation';

type ReceivedPrescriptionsRequest = {
	url: URL;
	locals: { user: AuthenticatedUser | null };
};

export async function load({ url, locals }: ReceivedPrescriptionsRequest): Promise<ReceivedPrescriptionsPageData> {
	const caller = await requirePrescriptionsCaller(locals.user);
	const selectedId = url.searchParams.get('ordonnance');
	const summaries = await listReceivedPrescriptions(caller);

	let selected = null;
	if (selectedId) {
		const prescription = await findReceivedPrescription(caller, selectedId).catch(() => null);
		if (!prescription) error(404, 'Cette ordonnance est introuvable.');
		selected = buildSelectedPrescription(prescription);
	}

	return { rows: buildPrescriptionRows(summaries, selectedId), selected };
}
