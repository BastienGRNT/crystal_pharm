import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { error } from '@sveltejs/kit';
import { createReceivedDocumentLink } from './api/receivedPrescriptionsApi.server';
import { requirePrescriptionsCaller } from './prescriptionsCaller.server';

type DocumentRequest = {
	params: { submissionId: string; documentId: string };
	locals: { user: AuthenticatedUser | null };
};

/**
 * Renvoie le navigateur vers un lien pré-signé du stockage de santé, valable deux minutes : le fichier ne passe
 * pas par ce serveur. Le droit est vérifié ici et revérifié par le C#, qui trace la lecture.
 */
export async function GET({ params, locals }: DocumentRequest): Promise<Response> {
	const caller = await requirePrescriptionsCaller(locals.user);
	const documentLink = await createReceivedDocumentLink(caller, params.submissionId, params.documentId);
	if (!documentLink) error(404, 'Ce fichier est introuvable.');

	return new Response(null, {
		status: 303,
		headers: { Location: documentLink, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
	});
}
