import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { error, json } from '@sveltejs/kit';
import { createReceivedDocumentLink } from './api/receivedPrescriptionsApi.server';
import { requirePrescriptionsCaller } from './prescriptionsCaller.server';

type DocumentReadLinkRequest = {
	params: { submissionId: string; documentId: string };
	request: Request;
	locals: { user: AuthenticatedUser | null };
};

/**
 * Le lien pré-signé de lecture d'un fichier, valable 30 secondes, pour la page qui l'affiche : elle le lit en
 * arrière-plan et montre le fichier depuis la mémoire, sans que le lien n'apparaisse dans une barre d'adresse ni
 * dans l'historique. Le fichier va du stockage HDS au navigateur sans passer par ce serveur. Le droit est vérifié
 * ici et revérifié par le C#, qui trace la lecture.
 */
export async function GET({ params, request, locals }: DocumentReadLinkRequest): Promise<Response> {
	// Ouverte comme une page (lien copié, adresse tapée), cette route montrerait le lien : seule une lecture en arrière-plan l'obtient.
	if (request.headers.get('sec-fetch-mode') === 'navigate') error(404, 'Ce fichier s’ouvre depuis la fiche de l’ordonnance.');

	const caller = await requirePrescriptionsCaller(locals.user);
	const documentLink = await createReceivedDocumentLink(caller, params.submissionId, params.documentId);
	if (!documentLink) error(404, 'Ce fichier est introuvable.');

	return json({ url: documentLink }, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
