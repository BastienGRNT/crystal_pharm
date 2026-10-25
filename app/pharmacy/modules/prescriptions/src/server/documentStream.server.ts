import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { error } from '@sveltejs/kit';
import { openReceivedDocument } from './api/receivedPrescriptionsApi.server';
import { requirePrescriptionsCaller } from './prescriptionsCaller.server';

type DocumentRequest = {
	params: { submissionId: string; documentId: string };
	locals: { user: AuthenticatedUser | null };
};

/** Renvoie le flux du C# sans le lire : ni cache, ni copie, ni déduction du type par le navigateur. */
export async function GET({ params, locals }: DocumentRequest): Promise<Response> {
	const caller = await requirePrescriptionsCaller(locals.user);
	const upstream = await openReceivedDocument(caller, params.submissionId, params.documentId);
	if (!upstream) error(404, 'Ce fichier est introuvable.');

	return new Response(upstream.body, {
		headers: {
			'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
			'Content-Disposition': 'inline',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
